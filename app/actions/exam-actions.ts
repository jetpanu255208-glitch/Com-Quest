'use server';

import { createClient } from '@/lib/supabase/server';
import {
  ExamSession,
  ExamQuestion,
  ExamParticipant,
  ExamStudentAnswer,
  ExamStatus,
  ParticipantStatus,
  Profile,
  ExamCombatLog,
} from '@/lib/supabase/types';
import { revalidatePath } from 'next/cache';
import { getBossConfigForExam } from '@/lib/exam/boss-config';

// Helper: Generate random 6-character room code (e.g. CQ8921)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'CQ';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Teacher: Create new exam session
 */
export async function createExamSession(input: {
  title: string;
  durationMinutes: number;
  passingScore: number;
  totalQuestions: number;
  selectedLessons?: string[];
  customQuestions?: Array<{
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: 'A' | 'B' | 'C' | 'D';
    explanation?: string;
  }>;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
    }

    // Role check: Must be admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'เฉพาะครูผู้สอนเท่านั้นที่มีสิทธิ์สร้างห้องสอบ' };
    }

    // Generate unique room code
    let roomCode = generateRoomCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const { data: existing } = await supabase
        .from('exam_sessions')
        .select('id')
        .eq('room_code', roomCode)
        .maybeSingle();

      if (!existing) {
        isUnique = true;
      } else {
        roomCode = generateRoomCode();
        attempts++;
      }
    }

    const selectedLessons = input.selectedLessons || ['html_01'];
    const totalQ = input.totalQuestions || 10;
    const bossCfg = getBossConfigForExam(totalQ, input.passingScore);

    const basePayload = {
      teacher_id: user.id,
      title: input.title.trim(),
      room_code: roomCode,
      status: 'lobby' as const,
      duration_minutes: input.durationMinutes || 15,
      total_questions: totalQ,
      passing_score: input.passingScore || bossCfg.passingScore,
      selected_lessons: selectedLessons,
    };

    // 1. Insert Exam Session (created directly in 'lobby' state ready for students to join)
    // First attempt: with boss columns (for migration 019 / extended schema)
    let { data: exam, error: examError } = await supabase
      .from('exam_sessions')
      .insert({
        ...basePayload,
        boss_name: bossCfg.name,
        boss_max_hp: bossCfg.maxHp,
        boss_current_hp: bossCfg.maxHp,
      } as any)
      .select('*')
      .single();

    // Fallback attempt: if database schema does not have boss columns (e.g. only migration 018 was run), retry with standard columns
    if (
      examError &&
      (examError.message?.includes('column') ||
        (examError as any).code === '42703' ||
        examError.message?.includes('boss_') ||
        examError.message?.includes('schema cache'))
    ) {
      console.warn('Exam session insert with boss columns failed, falling back to base columns:', examError.message);
      const retry = await supabase
        .from('exam_sessions')
        .insert(basePayload as any)
        .select('*')
        .single();
      exam = retry.data;
      examError = retry.error;
    }

    if (examError || !exam) {
      console.error('Failed to create exam session:', examError);
      const isMissingTable =
        examError?.code === '42P01' ||
        examError?.code === 'PGRST205' ||
        examError?.message?.includes('relation "public.exam_sessions" does not exist') ||
        examError?.message?.includes('Could not find the table');

      if (isMissingTable) {
        return {
          success: false,
          error:
            'ยังไม่พบตาราง exam_sessions ใน Supabase: กรุณานำคำสั่งใน supabase/migrations/018_boss_battle_exam_system.sql ไปรันใน SQL Editor',
        };
      }

      if (examError?.message?.includes('column') || examError?.code === '42703') {
        return {
          success: false,
          error: `โครงสร้างคอลัมน์ในฐานข้อมูลไม่ตรง (${examError.message}): กรุณารัน SQL Migration 018 ใหม่ใน Supabase SQL Editor เพื่อล้างตารางเดิมและสร้างคอลัมน์ที่ถูกต้อง`,
        };
      }

      return {
        success: false,
        error: `ไม่สามารถสร้างห้องสอบได้ (${examError?.code || 'ERR'}): ${examError?.message || 'Unknown error'}`,
      };
    }

    // 2. Populate Questions
    const questionsToInsert: Array<{
      exam_id: string;
      question_number: number;
      question_text: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      correct_option: 'A' | 'B' | 'C' | 'D';
      explanation: string;
      points: number;
    }> = [];

    // Pull from standard lesson quiz_questions bank if requested
    if (selectedLessons.length > 0) {
      const { data: bankQuestions, error: bankErr } = await supabase
        .from('quiz_questions')
        .select('*')
        .in('lesson_id', selectedLessons);

      if (!bankErr && bankQuestions && bankQuestions.length > 0) {
        // Shuffle and pick up to requested question count
        const shuffled = [...bankQuestions].sort(() => Math.random() - 0.5);
        const count = Math.min(shuffled.length, input.totalQuestions);

        for (let i = 0; i < count; i++) {
          const q = shuffled[i];
          questionsToInsert.push({
            exam_id: exam.id,
            question_number: i + 1,
            question_text: q.question_text,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_option: q.correct_option as 'A' | 'B' | 'C' | 'D',
            explanation: q.explanation || '',
            points: 1,
          });
        }
      } else {
        // Fallback: Pull from default questions bank if DB is empty
        const { getDefaultQuestions } = await import('@/lib/constants/default-questions');
        const fallbackList: any[] = [];
        for (const lId of selectedLessons) {
          fallbackList.push(...getDefaultQuestions(lId));
        }
        if (fallbackList.length > 0) {
          const shuffled = [...fallbackList].sort(() => Math.random() - 0.5);
          const count = Math.min(shuffled.length, input.totalQuestions || 10);
          for (let i = 0; i < count; i++) {
            const q = shuffled[i];
            questionsToInsert.push({
              exam_id: exam.id,
              question_number: i + 1,
              question_text: q.question_text,
              option_a: q.option_a,
              option_b: q.option_b,
              option_c: q.option_c,
              option_d: q.option_d,
              correct_option: q.correct_option as 'A' | 'B' | 'C' | 'D',
              explanation: q.explanation || '',
              points: 1,
            });
          }
        }
      }
    }

    // Add any custom questions supplied by the teacher
    if (input.customQuestions && input.customQuestions.length > 0) {
      let nextNumber = questionsToInsert.length + 1;
      for (const cq of input.customQuestions) {
        questionsToInsert.push({
          exam_id: exam.id,
          question_number: nextNumber++,
          question_text: cq.question_text,
          option_a: cq.option_a,
          option_b: cq.option_b,
          option_c: cq.option_c,
          option_d: cq.option_d,
          correct_option: cq.correct_option as 'A' | 'B' | 'C' | 'D',
          explanation: cq.explanation || '',
          points: 1,
        });
      }
    }

    // Insert questions
    if (questionsToInsert.length > 0) {
      const { error: qInsertErr } = await supabase
        .from('exam_questions')
        .insert(questionsToInsert);

      if (qInsertErr) {
        console.error('Failed to insert exam questions:', qInsertErr);
      }
    }

    revalidatePath('/teacher/exams');
    return { success: true, exam, roomCode, sessionId: exam.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างห้องสอบ';
    return { success: false, error: msg };
  }
}

/**
 * Teacher: Open exam lobby for students to join
 */
export async function openExamLobby(examId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' };

    const { data: exam, error } = await supabase
      .from('exam_sessions')
      .update({ status: 'lobby', updated_at: new Date().toISOString() })
      .eq('id', examId)
      .eq('teacher_id', user.id)
      .select('*')
      .single();

    if (error || !exam) {
      return { success: false, error: 'ไม่สามารถเปิดห้องสอบได้: ' + (error?.message || '') };
    }

    revalidatePath(`/teacher/exams/${examId}/lobby`);
    revalidatePath('/teacher/exams');
    return { success: true, exam };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' };
  }
}

/**
 * Teacher: Start exam (In Progress)
 */
export async function startExam(examId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' };

    // Fetch exam to know duration
    const { data: exam } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', examId)
      .maybeSingle();

    if (!exam) return { success: false, error: 'ไม่พบข้อมูลห้องสอบ' };

    // Verify teacher authorization
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (exam.teacher_id !== user.id && profile?.role !== 'admin') {
      return { success: false, error: 'เฉพาะครูผู้สร้างห้องสอบหรือแอดมินเท่านั้นที่มีสิทธิ์เริ่มสอบ' };
    }

    const now = new Date();
    const durationMs = (exam.duration_minutes || 15) * 60 * 1000;
    const endedAt = new Date(now.getTime() + durationMs).toISOString();

    // Count participants to scale Boss HP
    const { count: participantCount } = await supabase
      .from('exam_participants')
      .select('id', { count: 'exact', head: true })
      .eq('exam_id', examId)
      .in('status', ['waiting', 'approved']);

    const questionsCount = exam.total_questions || 10;
    const bossCfg = getBossConfigForExam(questionsCount, exam.passing_score, exam.boss_name);
    const targetMaxHp = bossCfg.maxHp;

    // 1. Update session to in_progress with standard Boss HP
    let { error: sessionErr } = await supabase
      .from('exam_sessions')
      .update({
        status: 'in_progress',
        started_at: now.toISOString(),
        ended_at: endedAt,
        boss_name: bossCfg.name,
        boss_max_hp: targetMaxHp,
        boss_current_hp: targetMaxHp,
        updated_at: now.toISOString(),
      } as any)
      .eq('id', examId);

    // Fallback if boss columns not yet present in DB
    if (sessionErr && (sessionErr.message?.includes('column') || (sessionErr as any).code === '42703')) {
      const retry = await supabase
        .from('exam_sessions')
        .update({
          status: 'in_progress',
          started_at: now.toISOString(),
          ended_at: endedAt,
          updated_at: now.toISOString(),
        })
        .eq('id', examId);
      sessionErr = retry.error;
    }

    if (sessionErr) {
      return { success: false, error: 'ไม่สามารถเริ่มสอบได้: ' + sessionErr.message };
    }

    // 2. Set all waiting and approved participants to 'in_progress'
    await supabase
      .from('exam_participants')
      .update({
        status: 'in_progress',
        started_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('exam_id', examId)
      .in('status', ['waiting', 'approved']);

    revalidatePath(`/teacher/exams/${examId}/lobby`);
    revalidatePath(`/teacher/exams/${examId}`);
    revalidatePath(`/exam/lobby/${exam.room_code}`);
    revalidatePath(`/exam/battle/${examId}`);
    revalidatePath('/teacher/exams');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' };
  }
}

/**
 * Student: Record real-time attack on Shared Raid Boss
 * Atomically deducts damage, adds critical bonus for quick answers, and logs combat event.
 */
export async function recordRaidAttack(payload: {
  examId: string;
  participantId: string;
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D';
  secondsSpent?: number;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' };

    // 1. Fetch question to evaluate correctness securely on server
    const { data: question, error: qErr } = await supabase
      .from('exam_questions')
      .select('question_number, correct_option, points')
      .eq('id', payload.questionId)
      .single();

    if (qErr || !question) {
      return { success: false, error: 'ไม่พบข้อสอบ' };
    }

    const isCorrect = payload.selectedOption === question.correct_option;

    // 2. Fetch student display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, first_name, last_name')
      .eq('id', user.id)
      .single();

    const studentName =
      (profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : null) ||
      profile?.username ||
      user.email?.split('@')[0] ||
      'นักเรียน';

    // 3. If correct, deal damage to Shared Raid Boss
    let damage = 0;
    let isCritical = false;
    let newBossHp: number | undefined;

    if (isCorrect) {
      // Determine damage based on exam question count preset (20 Qs -> 1,000; <= 15 Qs -> 100)
      const { data: sessionData } = await supabase
        .from('exam_sessions')
        .select('total_questions')
        .eq('id', payload.examId)
        .maybeSingle();

      const totalQ = sessionData?.total_questions || 10;
      damage = totalQ > 15 ? 1000 : 100;
      isCritical = payload.secondsSpent !== undefined && payload.secondsSpent <= 5;

      // Call atomic RPC deal_raid_boss_damage
      try {
        const { data: rpcRes, error: rpcErr } = await (supabase as any).rpc('deal_raid_boss_damage', {
          p_exam_id: payload.examId,
          p_student_id: user.id,
          p_student_name: studentName,
          p_question_number: question.question_number,
          p_damage: damage,
          p_is_critical: isCritical,
        });

        if (!rpcErr && rpcRes) {
          const resObj = typeof rpcRes === 'string' ? JSON.parse(rpcRes) : rpcRes;
          newBossHp = resObj.new_hp;
        } else {
          // Direct fallback if RPC is not yet registered
          const { data: currentSession } = await supabase
            .from('exam_sessions')
            .select('boss_current_hp, boss_max_hp')
            .eq('id', payload.examId)
            .single();

          if (currentSession) {
            const currentHp = currentSession.boss_current_hp ?? 10000;
            newBossHp = Math.max(0, currentHp - damage);
            await supabase
              .from('exam_sessions')
              .update({ boss_current_hp: newBossHp } as any)
              .eq('id', payload.examId);

            await supabase.from('exam_combat_logs' as any).insert({
              exam_id: payload.examId,
              student_id: user.id,
              student_name: studentName,
              question_number: question.question_number,
              damage,
              is_critical: isCritical,
            });
          }
        }
      } catch (e) {
        console.warn('deal_raid_boss_damage fallback used:', e);
      }
    }

    return {
      success: true,
      isCorrect,
      damage,
      isCritical,
      newBossHp,
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' };
  }
}

/**
 * Realtime & Polling feed: Get recent combat hits & shared boss stats
 */
export async function getExamCombatFeed(examId: string) {
  try {
    const supabase = await createClient();
    const { data: logs } = await supabase
      .from('exam_combat_logs' as any)
      .select('*')
      .eq('exam_id', examId)
      .order('created_at', { ascending: false })
      .limit(30);

    let session: any = null;
    const { data: fullSession, error: sessionErr } = await supabase
      .from('exam_sessions')
      .select('id, title, boss_name, boss_max_hp, boss_current_hp, status, duration_minutes, started_at, ended_at')
      .eq('id', examId)
      .maybeSingle();

    if (sessionErr || !fullSession) {
      const { data: baseSession } = await supabase
        .from('exam_sessions')
        .select('id, title, status, duration_minutes, started_at, ended_at')
        .eq('id', examId)
        .maybeSingle();

      if (baseSession) {
        session = {
          ...baseSession,
          boss_name: 'MECHA DRAGON (Lv.99)',
          boss_max_hp: 10000,
          boss_current_hp: 10000,
        };
      }
    } else {
      session = fullSession;
    }

    return {
      success: true,
      logs: (logs || []) as unknown as ExamCombatLog[],
      session,
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' };
  }
}

/**
 * Teacher: Close/End exam (Completed)
 */
export async function closeExam(examId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' };

    const now = new Date().toISOString();

    // 1. Set exam status to completed
    const { error: sessionErr } = await supabase
      .from('exam_sessions')
      .update({
        status: 'completed',
        ended_at: now,
        updated_at: now,
      })
      .eq('id', examId)
      .eq('teacher_id', user.id);

    if (sessionErr) {
      return { success: false, error: 'ไม่สามารถปิดการสอบได้: ' + sessionErr.message };
    }

    // 2. Auto-submit any participant who is still in_progress
    const { data: activeParticipants } = await supabase
      .from('exam_participants')
      .select('id')
      .eq('exam_id', examId)
      .eq('status', 'in_progress');

    if (activeParticipants && activeParticipants.length > 0) {
      for (const p of activeParticipants) {
        await submitStudentExam(p.id, examId);
      }
    }

    revalidatePath(`/teacher/exams/${examId}/lobby`);
    revalidatePath(`/teacher/exams/${examId}/results`);
    revalidatePath('/teacher/exams');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' };
  }
}

/**
 * Teacher: Approve a late join request
 */
export async function approveLateParticipant(participantId: string, examId?: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' };

    let targetExamId = examId;
    if (!targetExamId) {
      const { data: p } = await supabase
        .from('exam_participants')
        .select('exam_id')
        .eq('id', participantId)
        .single();
      targetExamId = p?.exam_id;
    }

    const now = new Date().toISOString();
    let query = supabase
      .from('exam_participants')
      .update({
        status: 'in_progress',
        approved_at: now,
        started_at: now,
        updated_at: now,
      })
      .eq('id', participantId);

    if (targetExamId) {
      query = query.eq('exam_id', targetExamId);
    }

    const { error } = await query;
    if (error) {
      return { success: false, error: 'ไม่สามารถอนุมัติได้: ' + error.message };
    }

    if (targetExamId) {
      revalidatePath(`/teacher/exams/${targetExamId}/lobby`);
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' };
  }
}

/**
 * Teacher: Reject a late join request
 */
export async function rejectLateParticipant(participantId: string, examId?: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' };

    let targetExamId = examId;
    if (!targetExamId) {
      const { data: p } = await supabase
        .from('exam_participants')
        .select('exam_id')
        .eq('id', participantId)
        .single();
      targetExamId = p?.exam_id;
    }

    let query = supabase
      .from('exam_participants')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', participantId);

    if (targetExamId) {
      query = query.eq('exam_id', targetExamId);
    }

    const { error } = await query;
    if (error) {
      return { success: false, error: 'ไม่สามารถปฏิเสธได้: ' + error.message };
    }

    if (targetExamId) {
      revalidatePath(`/teacher/exams/${targetExamId}/lobby`);
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' };
  }
}

/**
 * Student: Join an exam lobby by Room Code
 */
export async function joinExamLobby(roomCode: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนเข้าร่วมสอบ' };
    }

    const cleanCode = roomCode.trim().toUpperCase();

    // 1. Fetch exam session by room code
    const { data: exam, error: examErr } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('room_code', cleanCode)
      .maybeSingle();

    if (examErr || !exam) {
      console.warn('joinExamLobby: room not found or query error', cleanCode, examErr);
      return { success: false, error: 'ไม่พบห้องสอบรหัสนี้ กรุณาตรวจสอบรหัสห้องอีกครั้ง' };
    }

    // Auto-promote draft to lobby if teacher just created it
    if (exam.status === 'draft') {
      await supabase
        .from('exam_sessions')
        .update({ status: 'lobby', updated_at: new Date().toISOString() })
        .eq('id', exam.id);
      exam.status = 'lobby';
    }

    if (exam.status === 'cancelled') {
      return { success: false, error: 'ห้องสอบนี้ถูกยกเลิกไปแล้ว' };
    }

    if (exam.status === 'completed') {
      return { success: false, error: 'การสอบนี้สิ้นสุดลงแล้ว' };
    }

    // Determine initial status based on whether exam has already started
    let initialStatus: ParticipantStatus = 'waiting';
    if (exam.status === 'in_progress') {
      initialStatus = 'late_request';
    }

    // Check if participant row already exists
    const { data: existingParticipant } = await supabase
      .from('exam_participants')
      .select('*')
      .eq('exam_id', exam.id)
      .eq('student_id', user.id)
      .maybeSingle();

    let participant = existingParticipant;

    if (!existingParticipant) {
      // Insert new participant row
      const { data: newP, error: pErr } = await supabase
        .from('exam_participants')
        .insert({
          exam_id: exam.id,
          student_id: user.id,
          status: initialStatus,
          boss_remaining_hp: 1000,
          joined_at: new Date().toISOString(),
          score: 0,
          total_questions: exam.total_questions,
          passed: false,
        })
        .select('*')
        .single();

      if (pErr || !newP) {
        return { success: false, error: 'ไม่สามารถเข้าร่วมห้องสอบได้: ' + (pErr?.message || '') };
      }
      participant = newP;
    } else {
      // If student previously left and is rejoining, restore their status
      if (existingParticipant.status === 'left') {
        const { data: rejoined } = await supabase
          .from('exam_participants')
          .update({
            status: initialStatus,
            joined_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingParticipant.id)
          .select('*')
          .single();
        participant = rejoined || existingParticipant;
      } else if (exam.status === 'in_progress' && (existingParticipant.status === 'waiting' || existingParticipant.status === 'approved')) {
        // If student is returning to an active exam, put them in progress
        const { data: updated } = await supabase
          .from('exam_participants')
          .update({
            status: 'in_progress',
            started_at: existingParticipant.started_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingParticipant.id)
          .select('*')
          .single();
        participant = updated || existingParticipant;
      }
    }

    return {
      success: true,
      exam,
      participant,
      isLate: exam.status === 'in_progress' && participant?.status === 'late_request',
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเข้าร่วมห้อง' };
  }
}

/**
 * Student: Request Late Join if exam already started
 */
export async function requestLateJoin(examId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' };

    const { data: p, error } = await supabase
      .from('exam_participants')
      .update({
        status: 'late_request',
        updated_at: new Date().toISOString(),
      })
      .eq('exam_id', examId)
      .eq('student_id', user.id)
      .select('*')
      .single();

    if (error || !p) {
      return { success: false, error: 'ไม่สามารถส่งคำขอเข้าร่วมได้: ' + (error?.message || '') };
    }

    return { success: true, participant: p };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' };
  }
}

/**
 * Student: Leave an exam lobby
 */
export async function leaveExamLobby(examId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' };

    // Try updating status to 'left'
    const { error: updateErr } = await supabase
      .from('exam_participants')
      .update({
        status: 'left' as ParticipantStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('exam_id', examId)
      .eq('student_id', user.id);

    if (updateErr) {
      console.warn('leaveExamLobby: update to left failed, falling back to delete row', updateErr.message);
      // Fallback: Delete participant row if DB constraint rejects 'left'
      await supabase
        .from('exam_participants')
        .delete()
        .eq('exam_id', examId)
        .eq('student_id', user.id);
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการออกจากห้อง' };
  }
}

/**
 * Get exam lobby data (Realtime / Initial load)
 */
export async function getExamLobbyData(roomCode: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const cleanCode = roomCode.trim().toUpperCase();

    // 1. Fetch exam session safely without foreign key alias dependency
    const { data: exam, error: examErr } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('room_code', cleanCode)
      .maybeSingle();

    if (examErr || !exam) {
      console.warn('getExamLobbyData: exam not found', cleanCode, examErr);
      return { success: false, error: 'ไม่พบข้อมูลห้องสอบ' };
    }

    // Fetch teacher profile safely
    let teacherProfile = null;
    if (exam.teacher_id) {
      const { data: tp } = await supabase
        .from('profiles')
        .select('username, first_name, last_name')
        .eq('id', exam.teacher_id)
        .maybeSingle();
      teacherProfile = tp;
    }

    // 2. Fetch all participants safely (Try RPC with SECURITY DEFINER first)
    let participantsWithProfiles: any[] = [];
    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_exam_lobby_participants', {
      p_exam_id: exam.id,
    });

    if (!rpcErr && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
      participantsWithProfiles = rpcData.map((row: any) => ({
        id: row.id,
        exam_id: row.exam_id,
        student_id: row.student_id,
        status: row.status,
        joined_at: row.joined_at,
        score: row.score || 0,
        profile: {
          id: row.student_id,
          username: row.username,
          first_name: row.first_name,
          last_name: row.last_name,
          student_id: row.student_code,
          character_config: row.character_config,
        },
        profiles: {
          id: row.student_id,
          username: row.username,
          first_name: row.first_name,
          last_name: row.last_name,
          student_id: row.student_code,
          character_config: row.character_config,
        },
      }));
    } else {
      // Fallback: Direct table queries
      const { data: rawParticipants } = await supabase
        .from('exam_participants')
        .select('*')
        .eq('exam_id', exam.id)
        .order('joined_at', { ascending: true });

      if (rawParticipants && rawParticipants.length > 0) {
        const studentIds = rawParticipants.map((p) => p.student_id);
        const { data: studentProfiles } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, student_id, character_config')
          .in('id', studentIds);

        const pMap = new Map((studentProfiles || []).map((sp) => [sp.id, sp]));
        participantsWithProfiles = rawParticipants.map((p) => {
          const pr = pMap.get(p.student_id);
          return {
            ...p,
            profile: pr || null,
            profiles: pr || null,
          };
        });
      }
    }

    // 3. Current user participant row
    const currentParticipant = user
      ? participantsWithProfiles.find((p) => p.student_id === user.id) || null
      : null;

    const examWithTeacher = {
      ...exam,
      teacher: teacherProfile,
    };

    return {
      success: true,
      exam: examWithTeacher,
      session: examWithTeacher,
      participants: participantsWithProfiles,
      participant: currentParticipant,
      currentParticipant,
      isTeacher: user?.id === exam.teacher_id,
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' };
  }
}

/**
 * Fast endpoint to poll / refresh participants in the lobby
 */
export async function getLobbyParticipants(examId: string) {
  try {
    const supabase = await createClient();

    // 1. Try RPC with SECURITY DEFINER first for 100% reliable names
    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_exam_lobby_participants', {
      p_exam_id: examId,
    });

    if (!rpcErr && rpcData && Array.isArray(rpcData)) {
      const participantsWithProfiles = rpcData.map((row: any) => ({
        id: row.id,
        exam_id: row.exam_id,
        student_id: row.student_id,
        status: row.status,
        joined_at: row.joined_at,
        score: row.score || 0,
        profile: {
          id: row.student_id,
          username: row.username,
          first_name: row.first_name,
          last_name: row.last_name,
          student_id: row.student_code,
          character_config: row.character_config,
        },
        profiles: {
          id: row.student_id,
          username: row.username,
          first_name: row.first_name,
          last_name: row.last_name,
          student_id: row.student_code,
          character_config: row.character_config,
        },
      }));
      return { success: true, participants: participantsWithProfiles };
    }

    // 2. Fallback: Direct table queries
    const { data: rawParticipants, error: pErr } = await supabase
      .from('exam_participants')
      .select('*')
      .eq('exam_id', examId)
      .order('joined_at', { ascending: true });

    if (pErr) {
      return { success: false, error: pErr.message, participants: [] };
    }

    if (!rawParticipants || rawParticipants.length === 0) {
      return { success: true, participants: [] };
    }

    const studentIds = rawParticipants.map((p) => p.student_id);
    const { data: studentProfiles } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, student_id, character_config')
      .in('id', studentIds);

    const pMap = new Map((studentProfiles || []).map((sp) => [sp.id, sp]));
    const participantsWithProfiles = rawParticipants.map((p) => {
      const pr = pMap.get(p.student_id);
      return {
        ...p,
        profile: pr || null,
        profiles: pr || null,
      };
    });

    return { success: true, participants: participantsWithProfiles };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error', participants: [] };
  }
}

/**
 * Fast endpoint to poll session status for lobby & battle synchronization
 */
export async function getExamSessionStatus(examId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('exam_sessions')
      .select('status, started_at, ended_at')
      .eq('id', examId)
      .maybeSingle();

    if (error || !data) return { success: false, status: null };
    return { success: true, status: data.status, started_at: data.started_at, ended_at: data.ended_at };
  } catch {
    return { success: false, status: null };
  }
}

/**
 * Student: Fetch exam questions during Boss Battle (Security: hides correct_option and explanation!)
 */
export async function getStudentExamBattleData(examId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' };

    // 1. Fetch Exam Session
    const { data: exam } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', examId)
      .single();

    if (!exam) return { success: false, error: 'ไม่พบข้อมูลห้องสอบ' };

    // 2. Fetch Student Participant Record
    const { data: participant } = await supabase
      .from('exam_participants')
      .select('*')
      .eq('exam_id', examId)
      .eq('student_id', user.id)
      .maybeSingle();

    if (!participant) {
      return { success: false, error: 'คุณยังไม่ได้เข้าร่วมห้องสอบนี้' };
    }

    if (participant.status === 'rejected') {
      return { success: false, error: 'คำขอเข้าร่วมสอบของคุณถูกปฏิเสธโดยอาจารย์' };
    }

    if (participant.status === 'late_request') {
      return { success: false, error: 'กำลังรอการอนุมัติจากอาจารย์ผู้คุมสอบ', isWaitingApproval: true };
    }

    // Auto-promote participant to in_progress if exam is in_progress
    let currentParticipant = participant;
    if (
      exam.status === 'in_progress' &&
      (currentParticipant.status === 'waiting' || currentParticipant.status === 'approved')
    ) {
      const { data: updatedP } = await supabase
        .from('exam_participants')
        .update({
          status: 'in_progress',
          started_at: currentParticipant.started_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentParticipant.id)
        .select('*')
        .single();

      if (updatedP) {
        currentParticipant = updatedP;
      }
    }

    // 3. Fetch questions (SECURITY: Sanitized so client CANNOT cheat via Inspect/DevTools)
    let { data: rawQuestions, error: qErr } = await supabase
      .from('exam_questions')
      .select('id, exam_id, question_number, question_text, option_a, option_b, option_c, option_d, points')
      .eq('exam_id', examId)
      .order('question_number', { ascending: true });

    // Fallback: If exam_questions has 0 questions, self-heal from quiz_questions bank
    if (!rawQuestions || rawQuestions.length === 0) {
      console.warn('getStudentExamBattleData: exam_questions is empty, attempting fallback generation');
      const lessons = (exam.selected_lessons && exam.selected_lessons.length > 0) ? exam.selected_lessons : ['html_01'];
      const { data: bankQuestions } = await supabase
        .from('quiz_questions')
        .select('*')
        .in('lesson_id', lessons);

      if (bankQuestions && bankQuestions.length > 0) {
        const toInsert = bankQuestions.slice(0, exam.total_questions || 10).map((q, idx) => ({
          exam_id: exam.id,
          question_number: idx + 1,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option as 'A' | 'B' | 'C' | 'D',
          explanation: q.explanation || '',
          points: 1,
        }));

        await supabase.from('exam_questions').insert(toInsert);

        const { data: refetched } = await supabase
          .from('exam_questions')
          .select('id, exam_id, question_number, question_text, option_a, option_b, option_c, option_d, points')
          .eq('exam_id', examId)
          .order('question_number', { ascending: true });

        if (refetched && refetched.length > 0) {
          rawQuestions = refetched;
        }
      }
    }

    if (!rawQuestions || rawQuestions.length === 0) {
      return { success: false, error: 'ไม่พบชุดข้อสอบในห้องนี้' };
    }

    // 4. Fetch any existing answers already recorded by student
    const { data: answers } = await supabase
      .from('exam_student_answers')
      .select('*')
      .eq('participant_id', currentParticipant.id);

    const draftAnswers: Record<string, string> = {};
    for (const a of answers || []) {
      if (a.selected_option) {
        draftAnswers[a.question_id] = a.selected_option;
      }
    }

    return {
      success: true,
      exam,
      session: exam,
      participant: currentParticipant,
      questions: rawQuestions,
      savedAnswers: answers || [],
      draftAnswers,
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' };
  }
}

/**
 * Student: Auto-save a draft answer while taking exam
 */
export async function saveStudentDraftAnswer(
  participantId: string,
  questionId: string,
  selectedOption: 'A' | 'B' | 'C' | 'D'
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' };

    // Verify participant ownership
    const { data: participant } = await supabase
      .from('exam_participants')
      .select('id, student_id, status')
      .eq('id', participantId)
      .eq('student_id', user.id)
      .single();

    if (!participant || participant.status === 'submitted') {
      return { success: false, error: 'ไม่สามารถบันทึกคำตอบได้' };
    }

    // Upsert answer
    const { error } = await supabase
      .from('exam_student_answers')
      .upsert(
        {
          participant_id: participantId,
          question_id: questionId,
          selected_option: selectedOption,
          answered_at: new Date().toISOString(),
        },
        { onConflict: 'participant_id,question_id' }
      );

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' };
  }
}

/**
 * Student / Server: Submit final exam and evaluate score
 */
export async function submitStudentExam(participantId: string, examId?: string) {
  try {
    const supabase = await createClient();

    let targetExamId = examId;
    if (!targetExamId) {
      const { data: p } = await supabase
        .from('exam_participants')
        .select('exam_id')
        .eq('id', participantId)
        .single();
      targetExamId = p?.exam_id;
    }

    if (!targetExamId) {
      return { success: false, error: 'ไม่พบรหัสการสอบ' };
    }

    // 1. Fetch exam and questions with correct_option
    const [examResult, questionsResult, participantResult, studentAnswersResult] = await Promise.all([
      supabase.from('exam_sessions').select('*').eq('id', targetExamId).single(),
      supabase.from('exam_questions').select('*').eq('exam_id', targetExamId),
      supabase.from('exam_participants').select('*').eq('id', participantId).single(),
      supabase.from('exam_student_answers').select('*').eq('participant_id', participantId),
    ]);

    const exam = examResult.data;
    const questions = questionsResult.data || [];
    const participant = participantResult.data;
    const answers = studentAnswersResult.data || [];

    if (!exam || !participant) {
      return { success: false, error: 'ไม่พบข้อมูลการสอบ' };
    }

    if (participant.status === 'submitted') {
      return {
        success: true,
        score: participant.score,
        total: participant.total_questions,
        passed: participant.passed,
        alreadySubmitted: true,
      };
    }

    // Map questions by ID
    const questionsMap = new Map(questions.map((q) => [q.id, q]));
    let score = 0;
    const total = questions.length || 1;

    // Grade each recorded answer
    const updatesToAnswers: Array<{
      id: string;
      is_correct: boolean;
    }> = [];

    for (const ans of answers) {
      const q = questionsMap.get(ans.question_id);
      if (q) {
        const isCorrect = ans.selected_option === q.correct_option;
        if (isCorrect) {
          score += q.points || 1;
        }
        updatesToAnswers.push({
          id: ans.id,
          is_correct: isCorrect,
        });
      }
    }

    // Update is_correct on student answers
    for (const ua of updatesToAnswers) {
      await supabase
        .from('exam_student_answers')
        .update({ is_correct: ua.is_correct })
        .eq('id', ua.id);
    }

    const passed = score >= (exam.passing_score || 5);
    // Boss HP: Drops to 0% if passed (Boss Defeated!), or remains at health proportional to wrong answers
    const bossRemainingHp = passed ? 0 : Math.max(15, Math.round(((total - score) / total) * 100));

    // Update participant record to 'submitted'
    const { data: updatedP, error: updateErr } = await supabase
      .from('exam_participants')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        score,
        total_questions: total,
        passed,
        boss_remaining_hp: bossRemainingHp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', participantId)
      .select('*')
      .single();

    if (updateErr) {
      console.error('Failed to submit exam:', updateErr);
      return { success: false, error: 'เกิดข้อผิดพลาดในการส่งข้อสอบ' };
    }

    revalidatePath(`/exam/result/${targetExamId}`);

    return {
      success: true,
      score,
      total,
      passed,
      percentage: Math.round((score / total) * 100),
      bossDefeated: passed,
      participant: updatedP,
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' };
  }
}

/**
 * Fetch exam result with complete answer review
 */
export async function getExamResultData(examId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' };

    // Fetch exam, participant, questions, and answers
    const [examResult, participantResult, questionsResult] = await Promise.all([
      supabase.from('exam_sessions').select('*').eq('id', examId).single(),
      supabase
        .from('exam_participants')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', user.id)
        .single(),
      supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('question_number', { ascending: true }),
    ]);

    const exam = examResult.data;
    const participant = participantResult.data;
    const questions = questionsResult.data || [];

    if (!exam || !participant) {
      return { success: false, error: 'ไม่พบผลการสอบของคุณ' };
    }

    // Fetch student answers
    const { data: answers } = await supabase
      .from('exam_student_answers')
      .select('*')
      .eq('participant_id', participant.id);

    return {
      success: true,
      exam,
      session: exam,
      participant,
      questions,
      answers: answers || [],
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' };
  }
}

/**
 * Teacher: Fetch complete exam analytics and student roster
 */
export async function getTeacherExamAnalytics(examId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' };

    // Parallel fetch exam, participants, and questions
    const [examRes, rawParticipantsRes, questionsRes] = await Promise.all([
      supabase.from('exam_sessions').select('*').eq('id', examId).single(),
      supabase.from('exam_participants').select('*').eq('exam_id', examId).order('score', { ascending: false }),
      supabase.from('exam_questions').select('*').eq('exam_id', examId).order('question_number', { ascending: true }),
    ]);

    const exam = examRes.data;
    if (examRes.error || !exam) {
      return { success: false, error: 'ไม่พบข้อมูลห้องสอบ' };
    }

    const rawParticipants = rawParticipantsRes.data || [];
    const questions = questionsRes.data || [];

    let participants: any[] = rawParticipants;
    if (rawParticipants.length > 0) {
      const studentIds = rawParticipants.map((p) => p.student_id);
      const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, student_id, email')
        .in('id', studentIds);

      const pMap = new Map((studentProfiles || []).map((sp) => [sp.id, sp]));
      participants = rawParticipants.map((p) => {
        const pr = pMap.get(p.student_id);
        return {
          ...p,
          profile: pr || null,
          profiles: pr || null,
        };
      });
    }

    // Calculate analytics metrics
    const totalParticipants = participants?.length || 0;
    const submittedList = participants?.filter((p) => p.status === 'submitted') || [];
    const submittedCount = submittedList.length;
    const waitingCount = participants?.filter((p) => p.status === 'waiting' || p.status === 'approved').length || 0;
    const inProgressCount = participants?.filter((p) => p.status === 'in_progress').length || 0;
    const lateRequestCount = participants?.filter((p) => p.status === 'late_request').length || 0;

    const scores = submittedList.map((p) => p.score || 0);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const passedCount = submittedList.filter((p) => p.passed).length;
    const passRate = submittedCount > 0 ? Math.round((passedCount / submittedCount) * 100) : 0;

    return {
      success: true,
      exam,
      session: exam,
      participants: participants || [],
      questions: questions || [],
      stats: {
        totalParticipants,
        submittedCount,
        waitingCount,
        inProgressCount,
        lateRequestCount,
        avgScore,
        maxScore,
        minScore,
        passedCount,
        passRate,
      },
      analytics: {
        totalStudents: totalParticipants,
        submittedCount,
        passCount: passedCount,
        passRate,
        avgScore: Number(avgScore),
        maxScore,
        minScore,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' };
  }
}

/**
 * Teacher: Delete exam session
 */
export async function deleteExamSession(examId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' };

    const { error } = await supabase
      .from('exam_sessions')
      .delete()
      .eq('id', examId)
      .eq('teacher_id', user.id);

    if (error) {
      return { success: false, error: 'ไม่สามารถลบห้องสอบได้: ' + error.message };
    }

    revalidatePath('/teacher/exams');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' };
  }
}

