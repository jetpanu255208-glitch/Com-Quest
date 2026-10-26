import React from 'react';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { OFFICIAL_HTML_LESSONS, Lesson, QuizQuestion } from '@/lib/supabase/types';
import { LessonEditor } from '@/components/teacher/LessonEditor';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TeacherLessonDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/teacher/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/profile?error=unauthorized');
  }

  // Find lesson from catalog
  const catalogItem = OFFICIAL_HTML_LESSONS.find((l) => l.id === id);
  if (!catalogItem) {
    notFound();
  }

  // Fetch from database
  const { data: dbLesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const lesson: Lesson = {
    ...catalogItem,
    title: dbLesson?.title || catalogItem.title,
    description: dbLesson?.description || catalogItem.description,
    google_slides_url: dbLesson?.google_slides_url || null,
    is_published: dbLesson ? dbLesson.is_published : true,
    quiz_enabled: dbLesson ? dbLesson.quiz_enabled : true,
  };

  // Fetch quiz questions
  let { data: questions, error: qError } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('lesson_id', id)
    .order('question_number', { ascending: true });

  console.log('DEBUG TEACHER PAGE:', { id, questionsCount: questions?.length, qError });

  // If questions are missing for lesson 1 to 8, auto-seed them for the teacher
  if (
    (!questions || questions.length === 0) &&
    (id === 'html_01' || id === 'html_02' || id === 'html_03' || id === 'html_04' || id === 'html_05' || id === 'html_06' || id === 'html_07' || id === 'html_08')
  ) {
    const { getDefaultQuestions } = await import('@/lib/constants/default-questions');
    const defaultQs = getDefaultQuestions(id);
    const { data: seeded, error: seedError } = await supabase
      .from('quiz_questions')
      .upsert(defaultQs, { onConflict: 'lesson_id,question_number' })
      .select('*')
      .order('question_number', { ascending: true });
    console.log('AUTO-SEED ATTEMPT:', { id, seededCount: seeded?.length, seedError });
    if (seeded && seeded.length > 0) {
      questions = seeded;
    } else {
      questions = defaultQs.map((q, idx) => ({
        id: `${id}_auto_${idx + 1}`,
        lesson_id: id,
        question_number: q.question_number,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        explanation: q.explanation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    }
  }

  return (
    <div className="flex flex-col min-h-screen cyber-grid relative transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/teacher/lessons"
            className="inline-flex items-center gap-2 text-xs font-cyber text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้ารายการบทเรียน (Lesson Management)</span>
          </Link>

          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-amber-950 border border-amber-500/50 text-amber-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            ADMIN CONTROL
          </span>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50">
              บทเรียนที่ {lesson.lesson_number}
            </span>
            <span className="text-xs font-mono text-slate-400">
              วิชาการเขียนภาษา HTML เบื้องต้น
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-cyber font-bold text-white text-glow-cyan">
            ตั้งค่าและจัดการ: {lesson.title}
          </h1>
          <p className="text-xs sm:text-sm font-thai text-slate-400 mt-1">
            ปรับปรุงลิงก์สไลด์นำเสนอ Google Slides, ควบคุมสิทธิ์การเข้าเรียนและทำแบบทดสอบของนักเรียน และตรวจสอบเฉลยข้อสอบทั้ง 10 ข้อ
          </p>
        </div>

        {/* Client Editor Component */}
        <LessonEditor
          initialLesson={lesson}
          initialQuestions={(questions || []) as QuizQuestion[]}
        />
      </main>

      <Footer />
    </div>
  );
}
