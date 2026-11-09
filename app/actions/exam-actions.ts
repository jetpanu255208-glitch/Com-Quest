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
} from '@/lib/supabase/types';
import { revalidatePath } from 'next/cache';

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

    // 1. Insert Exam Session
    const { data: exam, error: examError } = await supabase
      .from('exam_sessions')
      .insert({
        teacher_id: user.id,
        title: input.title.trim(),
        room_code: roomCode,
        status: 'draft',
        duration_minutes: input.durationMinutes || 15,
        total_questions: input.totalQuestions || 10,
        passing_score: input.passingScore || 5,
        selected_lessons: selectedLessons,
      })
      .select('*')
      .single();

    if (examError || !exam) {
      console.error('Failed to create exam session:', examError);
      if (
        examError?.message?.includes('schema cache') ||
        examError?.message?.includes('exam_sessions') ||
        examError?.message?.includes('relation "public.exam_sessions" does not exist')
      ) {
        return {
          success: false,
          error:
            'ยังไม่ได้รัน SQL Migration ในฐานข้อมูล Supabase: กรุณานำคำสั่งในไฟล์ supabase/migrations/018_boss_battle_exam_system.sql ไปรันใน Supabase Dashboard > SQL Editor เพื่อสร้างตารางห้องสอบ',
        };
      }
      return { success: false, error: 'ไม่สามารถสร้างห้องสอบได้: ' + (examError?.message || '') };
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
      .eq('teacher_id', user.id)
      .single();

    if (!exam) return { success: false, error: 'ไม่พบข้อมูลห้องสอบ' };

    const now = new Date();
    const durationMs = (exam.duration_minutes || 15) * 60 * 1000;
    const endedAt = new Date(now.getTime() + durationMs).toISOString();

    // 1. Update session to in_progress
    const { error: sessionErr } = await supabase
      .from('exam_sessions')
      .update({
        status: 'in_progress',
        started_at: now.toISOString(),
        ended_at: endedAt,
        updated_at: now.toISOString(),
      })
      .eq('id', examId);

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
    revalidatePath(`/exam/lobby/${exam.room_code}`);
    revalidatePath('/teacher/exams');
    return { success: true };
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
      return { success: false, error: 'ไม่พบห้องสอบรหัสนี้ กรุณาตรวจสอบรหัสห้องอีกครั้ง' };
    }

    if (exam.status === 'draft') {
      return { success: false, error: 'ห้องสอบนี้ยังไม่เปิดให้เข้าร่วม (อาจารย์กำลังตั้งค่า)' };
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
      // If student is returning to the exam and was already approved/in_progress/waiting, keep their state
      if (exam.status === 'in_progress' && (existingParticipant.status === 'waiting' || existingParticipant.status === 'approved')) {
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
 * Get exam lobby data (Realtime / Initial load)
 */
export async function getExamLobbyData(roomCode: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Fetch exam
    const { data: exam, error: examErr } = await supabase
      .from('exam_sessions')
      .select('*, teacher:profiles!exam_sessions_teacher_id_fkey(username, first_name, last_name)')
      .eq('room_code', roomCode.toUpperCase())
      .single();

    if (examErr || !exam) {
      return { success: false, error: 'ไม่พบข้อมูลห้องสอบ' };
    }

    // 2. Fetch all participants with their profile data
    const { data: participants, error: pErr } = await supabase
      .from('exam_participants')
      .select('*, profile:profiles!exam_participants_student_id_fkey(username, first_name, last_name, student_id, character_config)')
      .eq('exam_id', exam.id)
      .order('joined_at', { ascending: true });

    // 3. Current user participant row
    const currentParticipant = user
      ? participants?.find((p) => p.student_id === user.id) || null
      : null;

    return {
      success: true,
      exam,
      session: exam,
      participants: participants || [],
      participant: currentParticipant,
      currentParticipant,
      isTeacher: user?.id === exam.teacher_id,
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' };
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
      .single();

    if (!participant) {
      return { success: false, error: 'คุณยังไม่ได้เข้าร่วมห้องสอบนี้' };
    }

    if (participant.status === 'rejected') {
      return { success: false, error: 'คำขอเข้าร่วมสอบของคุณถูกปฏิเสธโดยอาจารย์' };
    }

    if (participant.status === 'late_request') {
      return { success: false, error: 'กำลังรอการอนุมัติจากอาจารย์ผู้คุมสอบ', isWaitingApproval: true };
    }

    // 3. Fetch questions (SECURITY: Sanitized so client CANNOT cheat via Inspect/DevTools)
    const { data: rawQuestions, error: qErr } = await supabase
      .from('exam_questions')
      .select('id, exam_id, question_number, question_text, option_a, option_b, option_c, option_d, points')
      .eq('exam_id', examId)
      .order('question_number', { ascending: true });

    if (qErr || !rawQuestions) {
      return { success: false, error: 'ไม่สามารถโหลดข้อสอบได้' };
    }

    // 4. Fetch any existing answers already recorded by student
    const { data: answers } = await supabase
      .from('exam_student_answers')
      .select('*')
      .eq('participant_id', participant.id);

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
      participant,
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

    revalidatePath(`/exam/battle/${targetExamId}`);
    revalidatePath(`/exam/result/${targetExamId}`);
    revalidatePath(`/teacher/exams/${targetExamId}/results`);
    revalidatePath(`/teacher/exams/${targetExamId}/lobby`);

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

    // 1. Fetch exam
    const { data: exam, error: examErr } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', examId)
      .single();

    if (examErr || !exam) {
      return { success: false, error: 'ไม่พบข้อมูลห้องสอบ' };
    }

    // 2. Fetch all participants with profiles
    const { data: participants } = await supabase
      .from('exam_participants')
      .select('*, profile:profiles!exam_participants_student_id_fkey(username, first_name, last_name, student_id, email)')
      .eq('exam_id', examId)
      .order('score', { ascending: false });

    // 3. Fetch questions
    const { data: questions } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', examId)
      .order('question_number', { ascending: true });

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

