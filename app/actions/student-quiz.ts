'use server';

import { createClient } from '@/lib/supabase/server';
import { StudentQuizQuestion, Lesson } from '@/lib/supabase/types';
import { revalidatePath } from 'next/cache';

/**
 * Get student lesson data with permission validation
 */
export async function getStudentLessonData(lessonId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch lesson info
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (error || !lesson) {
      return { success: false, error: 'ไม่พบบทเรียนที่ระบุ' };
    }

    // Permission check: Must be published
    if (!lesson.is_published) {
      return {
        success: false,
        error: 'บทเรียนนี้ยังไม่เปิดให้เรียน กรุณารอครูผู้สอนเปิดใช้งาน',
        isLocked: true,
      };
    }

    // Check if user has completed this lesson (verified by passed quiz attempt)
    let isCompleted = false;
    if (user) {
      const { data: attempt } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .eq('passed', true)
        .maybeSingle();

      isCompleted = !!attempt;
    }

    return {
      success: true,
      lesson: lesson as Lesson,
      isCompleted,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Get quiz questions for student WITHOUT revealing correct_option or explanation
 */
export async function getStudentQuizQuestions(lessonId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนเริ่มทำแบบทดสอบ' };
    }

    // Check lesson status
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('quiz_enabled, is_published')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return { success: false, error: 'ไม่พบบทเรียน' };
    }

    if (!lesson.is_published) {
      return { success: false, error: 'บทเรียนนี้ยังไม่เปิดให้เรียน' };
    }

    if (!lesson.quiz_enabled) {
      return { success: false, error: 'ครูผู้สอนยังไม่เปิดให้ทำแบบทดสอบสำหรับบทเรียนนี้' };
    }

    // Fetch questions: only safe fields
    const { data: rawQuestions, error } = await supabase
      .from('quiz_questions')
      .select(
        'id, lesson_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation'
      )
      .eq('lesson_id', lessonId)
      .order('question_number', { ascending: true });

    const { buildSafeLessonQuestions, isOfficialHtmlLessonId } = await import(
      '@/lib/constants/default-questions'
    );

    let questionsList: StudentQuizQuestion[] = [];
    if (isOfficialHtmlLessonId(lessonId)) {
      questionsList = buildSafeLessonQuestions(lessonId, rawQuestions);
    } else if (!error && rawQuestions && rawQuestions.length === 10) {
      questionsList = rawQuestions as StudentQuizQuestion[];
    } else {
      return {
        success: false,
        error: `ข้อสอบยังไม่พร้อม (มี ${rawQuestions?.length || 0}/10 ข้อ) กรุณาแจ้งครูผู้สอน`,
      };
    }

    return {
      success: true,
      questions: questionsList,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Check answer for a single question when answered or timed out.
 * Returns correct option and explanation ONLY for that question.
 */
export async function checkSingleQuestionAnswer(payload: {
  lessonId: string;
  questionNumber: number;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isTimeout: boolean;
}) {
  try {
    const { getDefaultQuestions, isOfficialHtmlLessonId } = await import(
      '@/lib/constants/default-questions'
    );

    let correctOption: string | undefined;
    let explanation: string | undefined;

    try {
      const supabase = await createClient();
      const { data: rows } = await supabase
        .from('quiz_questions')
        .select('correct_option, explanation')
        .eq('lesson_id', payload.lessonId)
        .eq('question_number', payload.questionNumber)
        .limit(1);

      const q = rows?.[0];
      if (q?.correct_option && ['A', 'B', 'C', 'D'].includes(q.correct_option.toUpperCase())) {
        correctOption = q.correct_option.toUpperCase();
        explanation = q.explanation;
      }
    } catch {
      // Ignore DB lookup errors and fall back to verified default questions
    }

    // Fallback to default questions for Lesson 1 to 8 if DB row is not found or RLS blocked
    if (!correctOption && isOfficialHtmlLessonId(payload.lessonId)) {
      const defaults = getDefaultQuestions(payload.lessonId);
      const found = defaults.find(
        (item) => item.question_number === payload.questionNumber
      );
      if (found) {
        correctOption = found.correct_option;
        explanation = found.explanation;
      }
    }

    if (!correctOption) {
      return { success: false, error: 'ไม่พบข้อสอบข้อที่ระบุ' };
    }

    const isCorrect = !payload.isTimeout && payload.selectedOption === correctOption;

    return {
      success: true,
      isCorrect,
      correctOption,
      explanation: explanation || '',
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Submit final quiz attempt:
 * Calculates score securely on the server, logs attempt into public.quiz_attempts,
 * and if score >= passingScore, awards lesson coin (+100 LVL) into public.lesson_progress!
 */
export async function submitQuizAttempt(payload: {
  lessonId: string;
  answers: Array<{
    questionNumber: number;
    selectedOption: 'A' | 'B' | 'C' | 'D' | null;
    isTimeout: boolean;
  }>;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    let user = session?.user;
    if (!user) {
      const { data: userRes } = await supabase.auth.getUser();
      user = userRes?.user ?? undefined;
    }

    if (!user) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนบันทึกผลสอบ' };
    }

    // Fetch profile, existing passed attempt, lesson progress, and quiz questions in parallel
    const [
      { data: existingProfile },
      { data: alreadyPassedAttemptRows },
      { data: alreadyCompletedProgress },
      { data: questions, error: qError },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('quiz_attempts')
        .select('id, score')
        .eq('user_id', user.id)
        .eq('lesson_id', payload.lessonId)
        .eq('passed', true)
        .limit(1),
      supabase
        .from('lesson_progress')
        .select('id, completed, quiz_passed')
        .eq('user_id', user.id)
        .eq('lesson_id', payload.lessonId)
        .maybeSingle(),
      supabase
        .from('quiz_questions')
        .select(
          'id, lesson_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation'
        )
        .eq('lesson_id', payload.lessonId)
        .order('question_number', { ascending: true }),
    ]);

    const alreadyPassedAttempt = alreadyPassedAttemptRows?.[0] || null;
    const hadPreviouslyPassed = Boolean(
      alreadyPassedAttempt ||
        alreadyCompletedProgress?.completed ||
        alreadyCompletedProgress?.quiz_passed
    );

    if (!existingProfile) {
      await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email || '',
          username: user.email?.split('@')[0] || `student_${user.id.slice(0, 6)}`,
          role: 'user',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    }

    const { buildSafeLessonQuestions, isOfficialHtmlLessonId } = await import(
      '@/lib/constants/default-questions'
    );

    let questionsList: Array<{ question_number: number; correct_option: string }> = [];

    if (isOfficialHtmlLessonId(payload.lessonId)) {
      questionsList = buildSafeLessonQuestions(payload.lessonId, questions).map((q) => ({
        question_number: q.question_number,
        correct_option: q.correct_option,
      }));
    } else if (!qError && questions && questions.length === 10) {
      questionsList = questions;
    } else {
      return { success: false, error: 'ไม่สามารถตรวจผลสอบได้ ข้อสอบไม่สมบูรณ์' };
    }

    // Deduplicate questions by question_number (strictly 1 to 10) to prevent duplicate scoring
    const uniqueQuestionsMap = new Map<number, { question_number: number; correct_option: string }>();
    questionsList.forEach((q) => {
      if (!uniqueQuestionsMap.has(q.question_number)) {
        uniqueQuestionsMap.set(q.question_number, q);
      }
    });
    const uniqueQuestions = Array.from(uniqueQuestionsMap.values())
      .sort((a, b) => a.question_number - b.question_number)
      .slice(0, 10);

    // Get boss passing score criteria dynamically
    const { getQuizBossConfig } = await import('@/lib/quiz/quiz-boss-config');
    const lessonNum = parseInt(payload.lessonId.replace('html_0', ''), 10) || 1;
    const bossConfig = getQuizBossConfig(lessonNum);
    const requiredPassingScore = bossConfig.passingScore || 5;

    let score = 0;
    const summary = uniqueQuestions.map((q) => {
      const userAns = payload.answers.find((a) => a.questionNumber === q.question_number);
      const selectedOption = userAns?.selectedOption || null;
      const isTimeout = userAns ? userAns.isTimeout : true;
      const isCorrect = !isTimeout && selectedOption === q.correct_option;
      if (isCorrect) score += 1;
      return {
        questionNumber: q.question_number,
        selectedOption,
        isTimeout,
        correctOption: q.correct_option,
        isCorrect,
      };
    });

    // Strictly clamp score to never exceed total questions or 10
    score = Math.max(0, Math.min(10, Math.min(uniqueQuestions.length, score)));
    const passed = score >= requiredPassingScore;

    // 1. Record quiz attempt history in public.quiz_attempts
    try {
      const { error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          lesson_id: payload.lessonId,
          score,
          total_questions: 10,
          passed,
          answers_summary: summary,
        });

      if (attemptError) {
        console.error('Quiz attempt insert error:', attemptError);
      } else {
        console.log(`Quiz attempt recorded: user=${user.id}, lesson=${payload.lessonId}, score=${score}/10, passed=${passed}`);
      }
    } catch (qaErr) {
      console.error('Quiz attempt catch exception:', qaErr);
    }

    // 2. Update lesson_progress state:
    let coinAwarded = false;
    let newLevel = 100;
    const now = new Date().toISOString();

    if (passed) {
      // Check if lesson_progress row already exists
      const { data: existingLP, error: lpSelectErr } = await supabase
        .from('lesson_progress')
        .select('id, completed')
        .eq('user_id', user.id)
        .eq('lesson_id', payload.lessonId)
        .maybeSingle();

      if (existingLP) {
        const { error: lpUpdateErr } = await supabase
          .from('lesson_progress')
          .update({
            completed: true,
            completed_at: now,
            quiz_passed: true,
            quiz_passed_at: now,
            mission_completed: true,
            status: 'completed',
            updated_at: now,
          } as any)
          .eq('id', existingLP.id);

        if (lpUpdateErr) {
          console.error('lesson_progress update error:', lpUpdateErr);
          // Fallback update
          await supabase.from('lesson_progress').update({ completed: true, completed_at: now }).eq('id', existingLP.id);
        }
        coinAwarded = true;
      } else {
        const { error: lpInsertErr } = await supabase
          .from('lesson_progress')
          .insert({
            user_id: user.id,
            lesson_id: payload.lessonId,
            completed: true,
            completed_at: now,
            quiz_passed: true,
            quiz_passed_at: now,
            mission_completed: true,
            status: 'completed',
            updated_at: now,
          } as any);

        if (lpInsertErr) {
          console.error('lesson_progress insert error:', lpInsertErr);
          await supabase.from('lesson_progress').insert({
            user_id: user.id,
            lesson_id: payload.lessonId,
            completed: true,
            completed_at: now,
          });
        }
        coinAwarded = true;
      }

      // Also call RPC complete_lesson_for_user for XP and Subject progression
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          'complete_lesson_for_user',
          { p_lesson_id: payload.lessonId }
        );
        if (!rpcError && rpcResult) {
          coinAwarded = true;
        } else if (rpcError) {
          console.warn('RPC complete_lesson_for_user notice:', rpcError);
        }
      } catch (rpcErr) {
        console.warn('RPC complete_lesson_for_user exception:', rpcErr);
      }

      // Calculate verified level from all completed lessons
      const { data: allUserProgress } = await supabase
        .from('lesson_progress')
        .select('completed')
        .eq('user_id', user.id)
        .eq('completed', true);

      const completedCount = allUserProgress?.length || (coinAwarded ? 1 : 0);
      newLevel = Math.min(completedCount * 100, 800);
    } else {
      // When quiz failed (<5/10): Update status to 'mission_passed_quiz_failed'
      const { data: existingLP } = await supabase
        .from('lesson_progress')
        .select('id, completed, mission_completed')
        .eq('user_id', user.id)
        .eq('lesson_id', payload.lessonId)
        .maybeSingle();

      if (existingLP) {
        if (!existingLP.completed && !hadPreviouslyPassed) {
          await supabase
            .from('lesson_progress')
            .update({
              status: 'mission_passed_quiz_failed',
              mission_completed: true,
              quiz_passed: false,
              updated_at: now,
            } as any)
            .eq('id', existingLP.id);
        }
      } else if (!hadPreviouslyPassed) {
        await supabase
          .from('lesson_progress')
          .insert({
            user_id: user.id,
            lesson_id: payload.lessonId,
            completed: false,
            mission_completed: true,
            quiz_passed: false,
            status: 'mission_passed_quiz_failed',
            updated_at: now,
          } as any);
      }
    }

    // Revalidate paths so teacher and student profiles update immediately
    // (Do NOT revalidate /quiz/[id] here because it is already force-dynamic and revalidating it
    // while the student is viewing the Victory/Defeat modal causes an unwanted RSC re-render.)
    revalidatePath('/profile');
    revalidatePath('/teacher');
    revalidatePath('/subjects');
    revalidatePath('/learn/' + payload.lessonId);

    return {
      success: true,
      score,
      totalQuestions: 10,
      passed,
      coinAwarded,
      newLevel,
    };
  } catch (err: any) {
    console.error('submitQuizAttempt catch error:', err);
    return { success: false, error: err.message };
  }
}
