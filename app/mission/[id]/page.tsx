import React from 'react';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StudentNav } from '@/components/layout/StudentNav';
import { Footer } from '@/components/layout/Footer';
import { OFFICIAL_HTML_LESSONS, Lesson } from '@/lib/supabase/types';
import { getLessonMission } from '@/lib/constants/missions';
import { CodingMissionPlayer } from '@/components/mission/CodingMissionPlayer';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
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
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

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
    redirect(`/quiz/${id}`);
  }

  // Unified student lesson state & all student summaries fetched concurrently
  const { getStudentLessonState, getAllStudentLessonsState } = await import('@/lib/learning/student-lesson-state');
  const [dbLessonResult, summary, allSummaries] = await Promise.all([
    supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .maybeSingle(),
    getStudentLessonState(user.id, id),
    getAllStudentLessonsState(user.id),
  ]);

  const dbLesson = dbLessonResult.data;

  const lesson: Lesson = {
    ...catalogItem,
    title: dbLesson?.title || catalogItem.title,
    description: dbLesson?.description || catalogItem.description,
    google_slides_url: dbLesson?.google_slides_url || null,
    is_published: dbLesson ? dbLesson.is_published : true,
    quiz_enabled: dbLesson ? dbLesson.quiz_enabled : true,
  };

  // 1. If lesson is fully completed (both mission and quiz passed), student moves to review mode
  if (summary.isCompleted) {
    redirect(`/learn/${id}?mode=review`);
  }

  // 2. Sequential unlock check: Lesson N requires Lesson N-1 to be completed
  const isPrevCompleted =
    lesson.lesson_number === 1 ||
    allSummaries.some((s) => s.lessonNumber === lesson.lesson_number - 1 && s.isCompleted);

  if (!isPrevCompleted) {
    return (
      <div className="min-h-screen flex flex-col justify-between relative bg-[#060913] text-slate-100">
        <StudentNav />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 text-center space-y-6 relative z-10 my-auto">
          <div className="pixel-8bit-card rounded-2xl p-8 space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-950/80 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-400 font-mono text-xs uppercase tracking-widest font-bold">
                LOCKED STAGE • ยังไม่ปลดล็อก
              </span>
              <h1 className="text-2xl font-pixel font-bold text-white tracking-wide">
                ภารกิจบทเรียนที่ {lesson.lesson_number} ยังล็อคอยู่
              </h1>
              <p className="text-sm font-thai text-slate-300 max-w-md mx-auto leading-relaxed">
                กรุณาเคลียร์ <strong className="text-cyan-300">บทที่ {lesson.lesson_number - 1}</strong> ให้เสร็จสิ้นก่อน จึงจะปลดล็อกภารกิจเขียนโค้ดของบทนี้
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <Link
                href="/subjects"
                className="pixel-pop-btn px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-cyber font-bold text-xs uppercase flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>กลับหน้ารวมบทเรียน</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between relative bg-[#060913] text-slate-100">
      {/* Twinkling Night Stars */}
      <div className="fixed inset-0 pointer-events-none -z-0 overflow-hidden">
        <div className="absolute top-10 left-12 w-2 h-2 bg-white rounded-full animate-star-twinkle" />
        <div className="absolute top-24 right-1/4 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-star-twinkle delay-300" />
        <div className="absolute top-44 left-1/3 w-2 h-2 bg-sky-200 rounded-full animate-star-twinkle delay-700" />
      </div>

      <StudentNav />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 relative z-10 space-y-4">
        {/* Navigation Breadcrumb */}
        <ScrollReveal className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/learn/${lesson.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-cyber text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับหน้าอ่านสไลด์บทเรียน ({lesson.title})</span>
          </Link>

          {/* Stepper Roadmap Indicator */}
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
              1. สไลด์ (ผ่านแล้ว)
            </span>
            <span className="text-slate-600">&rarr;</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-400/60 font-bold flex items-center gap-1 shadow-[0_0_8px_rgba(0,240,255,0.3)]">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>2. ภารกิจเขียนโค้ด (ตอนนี้)</span>
            </span>
            <span className="text-slate-600">&rarr;</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-500 border border-slate-800">
              3. แบบทดสอบ 10 ข้อ
            </span>
          </div>
        </ScrollReveal>

        {/* Coding Mission Player Component */}
        <ScrollReveal delay={75} scale={true}>
          <div className="pixel-8bit-card rounded-2xl p-3 sm:p-4">
            <CodingMissionPlayer lesson={lesson} />
          </div>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
}
