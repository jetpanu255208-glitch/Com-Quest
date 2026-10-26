'use server';

import { createClient } from '@/lib/supabase/server';
import { parseGoogleSlidesUrl } from '@/lib/slides';
import { QuizQuestion, Lesson } from '@/lib/supabase/types';
import { revalidatePath } from 'next/cache';

/**
 * Ensure current caller is an authenticated teacher (admin)
 */
async function verifyTeacher() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('กรุณาเข้าสู่ระบบก่อนทำรายการ');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new Error('ไม่อนุญาต: เฉพาะครูผู้สอน (Admin) เท่านั้นที่สามารถจัดการบทเรียนได้');
  }

  return { supabase, user };
}

/**
 * Update lesson settings (Title, Google Slides URL, is_published, quiz_enabled)
 */
export async function updateLessonSettings(payload: {
  lessonId: string;
  title?: string;
  googleSlidesUrl?: string | null;
  isPublished: boolean;
  quizEnabled: boolean;
}) {
  try {
    const { supabase } = await verifyTeacher();

    // Validate Google Slides URL if provided
    let cleanSlideUrl: string | null = null;
    if (payload.googleSlidesUrl && payload.googleSlidesUrl.trim()) {
      const parsed = parseGoogleSlidesUrl(payload.googleSlidesUrl);
      if (!parsed.isValid) {
        return { success: false, error: parsed.errorMessage || 'ลิงก์ Google Slides ไม่ถูกต้อง' };
      }
      cleanSlideUrl = payload.googleSlidesUrl.trim();
    }

    const updateData: Partial<Lesson> = {
      is_published: payload.isPublished,
      quiz_enabled: payload.quizEnabled,
      google_slides_url: cleanSlideUrl,
    };

    if (payload.title && payload.title.trim()) {
      updateData.title = payload.title.trim();
    }

    const { data: updated, error } = await supabase
      .from('lessons')
      .update(updateData)
      .eq('id', payload.lessonId)
      .select('*')
      .single();

    if (error) {
      return { success: false, error: `ไม่สามารถบันทึกข้อมูลได้: ${error.message}` };
    }

    revalidatePath('/teacher');
    revalidatePath('/teacher/lessons');
    revalidatePath('/teacher/lessons/' + payload.lessonId);
    revalidatePath('/subjects');

    return { success: true, lesson: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการบันทึกบทเรียน' };
  }
}

/**
 * Get all 10 quiz questions for a lesson with answers and explanations (Teachers only)
 */
export async function getTeacherQuizQuestions(lessonId: string) {
  try {
    const { supabase } = await verifyTeacher();

    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('question_number', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, questions: (questions || []) as QuizQuestion[] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Update a specific quiz question (Teachers only)
 */
export async function updateQuizQuestion(payload: {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}) {
  try {
    const { supabase } = await verifyTeacher();

    if (!payload.questionText.trim()) return { success: false, error: 'กรุณากรอกคำถาม' };
    if (!payload.optionA.trim() || !payload.optionB.trim() || !payload.optionC.trim() || !payload.optionD.trim()) {
      return { success: false, error: 'กรุณากรอกตัวเลือกทั้ง 4 ข้อให้ครบถ้วน' };
    }
    if (!['A', 'B', 'C', 'D'].includes(payload.correctOption)) {
      return { success: false, error: 'ตัวเลือกที่ถูกต้องต้องเป็น A, B, C หรือ D เท่านั้น' };
    }

    const { error } = await supabase
      .from('quiz_questions')
      .update({
        question_text: payload.questionText.trim(),
        option_a: payload.optionA.trim(),
        option_b: payload.optionB.trim(),
        option_c: payload.optionC.trim(),
        option_d: payload.optionD.trim(),
        correct_option: payload.correctOption,
        explanation: payload.explanation.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Seed or reset 10 standard quiz questions for Lessons (Teachers only)
 */
export async function seedDefaultQuizQuestions(lessonId: string) {
  try {
    const { supabase } = await verifyTeacher();

    if (lessonId !== 'html_01' && lessonId !== 'html_02') {
      return { success: false, error: 'ขณะนี้ระบบรองรับชุดข้อสอบเริ่มต้นเฉพาะบทเรียนที่ 1 และ 2' };
    }

    const { getDefaultQuestions } = await import('@/lib/constants/default-questions');
    const defaultQuestions = getDefaultQuestions(lessonId);

    const { data, error } = await supabase
      .from('quiz_questions')
      .upsert(defaultQuestions, {
        onConflict: 'lesson_id,question_number',
      })
      .select('*')
      .order('question_number', { ascending: true });

    console.log('MANUAL SEED ATTEMPT:', { lessonId, count: data?.length, error });

    if (error) {
      return { success: false, error: `ไม่สามารถสร้างชุดข้อสอบได้: ${error.message}` };
    }

    revalidatePath('/teacher/lessons/' + lessonId);
    revalidatePath('/quiz/' + lessonId);

    return { success: true, questions: (data || []) as QuizQuestion[] };
  } catch (err: any) {
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการสร้างข้อสอบ' };
  }
}
