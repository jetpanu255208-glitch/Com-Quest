import React from 'react';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StudentNav } from '@/components/layout/StudentNav';
import { Footer } from '@/components/layout/Footer';
import { OFFICIAL_HTML_LESSONS, Lesson } from '@/lib/supabase/types';
import { getLessonMission } from '@/lib/constants/missions';
import { CodingMissionPlayer } from '@/components/mission/CodingMissionPlayer';
import { ArrowLeft, Lock, Sparkles, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CodingMissionPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/mission/' + id);
  }

  // Find official catalog item
  const catalogItem = OFFICIAL_HTML_LESSONS.find((l) => l.id === id);
  if (!catalogItem) {
    notFound();
  }

  // Check if mission is defined for this lesson
  const mission = getLessonMission(id);
  if (!mission) {
    // If no mission for this lesson, forward to quiz
    redirect(`/quiz/${id}`);
  }

  // Fetch lesson data from database
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

  // Strict Flow Control using unified student lesson state
  const { getStudentLessonState } = await import('@/lib/learning/student-lesson-state');
  const summary = await getStudentLessonState(user.id, id);

  // 1. If lesson is completed, student cannot redo mission -> forward to review mode
  if (summary.isCompleted) {
    redirect(`/learn/${id}?mode=review`);
  }

  // 2. If mission already passed (e.g. returning after failed quiz), skip mission -> forward to quiz directly
  if (summary.missionPassed) {
    redirect(`/quiz/${id}`);
  }

  // Check if lesson is published
  if (!lesson.is_published && lesson.lesson_number > 2) {
    return (
      <div className="flex flex-col min-h-screen cyber-grid relative">
        <StudentNav />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-cyber font-bold text-white">
            บทเรียนที่ {lesson.lesson_number} ยังไม่เปิดให้เรียน
          </h1>
          <p className="text-sm font-thai text-slate-400">
            กรุณารอครูผู้สอนเปิดใช้งานบทเรียนนี้
          </p>
          <Link
            href="/subjects"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-cyber font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าวิชาเรียน</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen cyber-grid relative transition-colors duration-200">
      <StudentNav />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/learn/${lesson.id}`}
            className="inline-flex items-center gap-2 text-xs font-cyber text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าอ่านสไลด์บทเรียน ({lesson.title})</span>
          </Link>

          {/* Stepper Roadmap Indicator */}
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
              1. ดูสไลด์ (ผ่านแล้ว)
            </span>
            <span className="text-slate-600">&rarr;</span>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>2. ภารกิจเขียนโค้ด (ตอนนี้)</span>
            </span>
            <span className="text-slate-600">&rarr;</span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-500 border border-slate-800">
              3. แบบทดสอบ 10 ข้อ
            </span>
          </div>
        </div>

        {/* Coding Mission Player Component */}
        <CodingMissionPlayer lesson={lesson} />
      </main>

      <Footer />
    </div>
  );
}
