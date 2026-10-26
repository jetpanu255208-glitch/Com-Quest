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

    // Check if user has completed this lesson
    let isCompleted = false;
    if (user) {
      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      isCompleted = !!progress?.completed;
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
      .select('id, lesson_id, question_number, question_text, option_a, option_b, option_c, option_d')
      .eq('lesson_id', lessonId)
      .order('question_number', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    let questionsList: StudentQuizQuestion[] = [];
    if (!error && rawQuestions && rawQuestions.length === 10) {
      questionsList = rawQuestions as StudentQuizQuestion[];
    } else if (
      lessonId === 'html_01' ||
      lessonId === 'html_02' ||
      lessonId === 'html_03' ||
      lessonId === 'html_04' ||
      lessonId === 'html_05' ||
      lessonId === 'html_06' ||
      lessonId === 'html_07' ||
      lessonId === 'html_08'
    ) {
      const { getDefaultQuestions } = await import('@/lib/constants/default-questions');
      const defaults = getDefaultQuestions(lessonId);
      questionsList = defaults.map((q) => ({
        id: `${lessonId}_q_${q.question_number}`,
        lesson_id: q.lesson_id,
        question_number: q.question_number,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
      }));
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
    }

    const { data: q, error } = await supabase
      .from('quiz_questions')
      .select('correct_option, explanation')
      .eq('lesson_id', payload.lessonId)
      .eq('question_number', payload.questionNumber)
      .maybeSingle();

    let correctOption = q?.correct_option;
    let explanation = q?.explanation;

    // Fallback to default questions for Lesson 1 to 6 if DB row is not found or RLS blocked
    if (
      !correctOption &&
      (payload.lessonId === 'html_01' ||
        payload.lessonId === 'html_02' ||
        payload.lessonId === 'html_03' ||
        payload.lessonId === 'html_04' ||
        payload.lessonId === 'html_05' ||
        payload.lessonId === 'html_06' ||
        payload.lessonId === 'html_07' ||
        payload.lessonId === 'html_08')
    ) {
      const { getDefaultQuestions } = await import('@/lib/constants/default-questions');
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
 * and if score >= 5, awards lesson coin (+100 LVL) into public.lesson_progress!
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
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนบันทึกผลสอบ' };
    }

    // Ensure user profile exists in public.profiles to satisfy foreign keys
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

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

    // Check if student already passed this quiz or completed this lesson (Only 1 passed attempt permitted)
    const { data: alreadyPassedAttempt } = await supabase
      .from('quiz_attempts')
      .select('id, score')
      .eq('user_id', user.id)
      .eq('lesson_id', payload.lessonId)
      .eq('passed', true)
      .maybeSingle();

    const { data: alreadyCompletedProgress } = await supabase
      .from('lesson_progress')
      .select('id, completed')
      .eq('user_id', user.id)
      .eq('lesson_id', payload.lessonId)
      .eq('completed', true)
      .maybeSingle();

    if (alreadyPassedAttempt || alreadyCompletedProgress) {
      return {
        success: false,
        error: 'คุณทำแบบทดสอบบทเรียนนี้ผ่านไปแล้ว สามารถทำได้เพียง 1 ครั้งเท่านั้น',
        alreadyPassed: true,
      };
    }

    // Verify all 10 questions from database or official defaults
    const { data: questions, error: qError } = await supabase
      .from('quiz_questions')
      .select('question_number, correct_option')
      .eq('lesson_id', payload.lessonId);

    let questionsList: Array<{ question_number: number; correct_option: string }> = [];

    if (!qError && questions && questions.length === 10) {
      questionsList = questions;
    } else if (
      payload.lessonId === 'html_01' ||
      payload.lessonId === 'html_02' ||
      payload.lessonId === 'html_03' ||
      payload.lessonId === 'html_04' ||
      payload.lessonId === 'html_05' ||
      payload.lessonId === 'html_06' ||
      payload.lessonId === 'html_07' ||
      payload.lessonId === 'html_08'
    ) {
      const { getDefaultQuestions } = await import('@/lib/constants/default-questions');
      const defaults = getDefaultQuestions(payload.lessonId);
      questionsList = defaults.map((item) => ({
        question_number: item.question_number,
        correct_option: item.correct_option,
      }));
    } else {
      return { success: false, error: 'ไม่สามารถตรวจผลสอบได้ ข้อสอบไม่สมบูรณ์' };
    }

    let score = 0;
    const summary = questionsList.map((q) => {
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

    const passed = score >= 5;

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
        if (!existingLP.completed) {
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
      } else {
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
    revalidatePath('/profile');
    revalidatePath('/teacher');
    revalidatePath('/subjects');
    revalidatePath('/learn/' + payload.lessonId);
    revalidatePath('/quiz/' + payload.lessonId);

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
