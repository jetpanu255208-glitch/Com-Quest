import React from 'react';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StudentNav } from '@/components/layout/StudentNav';
import { Footer } from '@/components/layout/Footer';
import { OFFICIAL_HTML_LESSONS, Lesson, StudentQuizQuestion } from '@/lib/supabase/types';
import { QuizPlayer } from '@/components/quiz/QuizPlayer';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { ArrowLeft, Lock, AlertTriangle, Trophy, BookOpen, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StudentQuizPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect('/login?next=/quiz/' + id);
  }

  // Find official catalog item
  const catalogItem = OFFICIAL_HTML_LESSONS.find((l) => l.id === id);
  if (!catalogItem) {
    notFound();
  }

  // Use unified student lesson state helper
  const { getStudentLessonState, getAllStudentLessonsState } = await import('@/lib/learning/student-lesson-state');

  // Fetch lesson data, student progression state, all summaries and quiz questions concurrently
  const [dbLessonResult, summary, allSummaries, questionsResult] = await Promise.all([
    supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .maybeSingle(),
    getStudentLessonState(user.id, id),
    getAllStudentLessonsState(user.id),
    supabase
      .from('quiz_questions')
      .select('id, lesson_id, question_number, question_text, option_a, option_b, option_c, option_d')
      .eq('lesson_id', id)
      .order('question_number', { ascending: true }),
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

  // 1. If already completed or quiz passed
  if (summary.isCompleted || summary.quizPassed) {
    const bestScore = summary.bestScore ?? 10;
    return (
      <div
        className="min-h-screen flex flex-col justify-between relative bg-cover bg-center bg-fixed pixelated"
        style={{ backgroundImage: "url('/images/profile-night-city.jpg')" }}
      >
        <div className="fixed inset-0 bg-[#060913]/75 pointer-events-none -z-0" />
        <StudentNav />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 text-center space-y-6 relative z-10 my-auto">
          <div className="pixel-8bit-card rounded-2xl p-8 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-950/80 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-[0_0_25px_#fbbf24]">
              <Trophy className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-400 text-emerald-300 font-pixel text-xs tracking-widest uppercase">
                COMPLETED • ปลดล็อกแล้ว
              </span>
              <h1 className="text-2xl font-pixel font-bold text-white text-glow-cyan tracking-wide">
                คุณทำแบบทดสอบบทเรียนที่ {lesson.lesson_number} ผ่านแล้ว
              </h1>
              <div className="text-3xl font-pixel text-amber-400 py-1">
                คะแนนที่ทำได้: {bestScore} / 10
              </div>
              <p className="text-xs sm:text-sm font-thai text-slate-300 max-w-md mx-auto leading-relaxed">
                แบบทดสอบท้ายบทเรียนอนุญาตให้ทำได้เพียง 1 ครั้งเมื่อผ่านเกณฑ์ คุณได้รับเหรียญรางวัลและ EXP ประจำบทเรียนนี้แล้ว สามารถเข้าสู่โหมดทบทวนเนื้อหาสไลด์ได้ตลอดเวลา
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href={`/learn/${lesson.id}?mode=review`}
                className="pixel-pop-btn w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 hover:from-emerald-900 border-2 border-emerald-400 text-emerald-300 font-cyber font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>ทบทวนสไลด์บทเรียน</span>
              </Link>

              <Link
                href="/subjects"
                className="pixel-pop-btn w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 text-slate-950 font-cyber font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>กลับหน้ารวมวิชาเรียน</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 2. Sequential unlock check: Lesson N requires Lesson N-1 to be completed
  const isPrevCompleted =
    lesson.lesson_number === 1 ||
    allSummaries.some((s) => s.lessonNumber === lesson.lesson_number - 1 && s.isCompleted);

  if (!isPrevCompleted) {
    return (
      <div
        className="min-h-screen flex flex-col justify-between relative bg-cover bg-center bg-fixed pixelated"
        style={{ backgroundImage: "url('/images/profile-night-city.jpg')" }}
      >
        <div className="fixed inset-0 bg-[#060913]/75 pointer-events-none -z-0" />
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
                แบบทดสอบบทเรียนที่ {lesson.lesson_number} ยังล็อคอยู่
              </h1>
              <p className="text-sm font-thai text-slate-300 max-w-md mx-auto leading-relaxed">
                กรุณาเคลียร์ <strong className="text-cyan-300">บทที่ {lesson.lesson_number - 1}</strong> ให้ผ่านก่อน จึงจะสามารถทำแบบทดสอบบทเรียนนี้ได้
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

  // 3. Check if mission prerequisite is met
  if (summary.hasMission && !summary.missionPassed) {
    return (
      <div
        className="min-h-screen flex flex-col justify-between relative bg-cover bg-center bg-fixed pixelated"
        style={{ backgroundImage: "url('/images/profile-night-city.jpg')" }}
      >
        <div className="fixed inset-0 bg-[#060913]/75 pointer-events-none -z-0" />
        <StudentNav />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 text-center space-y-6 relative z-10 my-auto">
          <div className="pixel-8bit-card rounded-2xl p-8 space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#050b18] border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-pixel font-bold text-white tracking-wide">
              กรุณาทำภารกิจบทที่ {lesson.lesson_number} ให้ผ่านก่อน
            </h1>
            <p className="text-sm font-thai text-slate-300 leading-relaxed max-w-md mx-auto">
              บทเรียนนี้กำหนดให้นักเรียนต้องฝึกเขียนโค้ดและรันภารกิจให้ผ่านเกณฑ์ก่อน จึงจะปลดล็อกแบบทดสอบท้ายบทเรียน
            </p>
            <div className="pt-2">
              <Link
                href={`/mission/${lesson.id}`}
                className="pixel-pop-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-cyber font-bold text-xs uppercase shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              >
                <span>ไปทำภารกิจเขียนโค้ด</span>
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 4. Questions preparation
  const { data: rawQuestions, error } = questionsResult;

  let safeQuestions: StudentQuizQuestion[] = [];

  if (rawQuestions && rawQuestions.length === 10) {
    safeQuestions = rawQuestions as StudentQuizQuestion[];
  } else if (
    id === 'html_01' ||
    id === 'html_02' ||
    id === 'html_03' ||
    id === 'html_04' ||
    id === 'html_05' ||
    id === 'html_06' ||
    id === 'html_07' ||
    id === 'html_08'
  ) {
    const { getDefaultQuestions } = await import('@/lib/constants/default-questions');
    const defaults = getDefaultQuestions(id);
    safeQuestions = defaults.map((q) => ({
      id: `${id}_q_${q.question_number}`,
      lesson_id: q.lesson_id,
      question_number: q.question_number,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
    }));
  }

  if (safeQuestions.length === 0) {
    if (error) {
      console.error('Quiz fetch error in /quiz/[id]:', error);
    }
    return (
      <div
        className="min-h-screen flex flex-col justify-between relative bg-cover bg-center bg-fixed pixelated"
        style={{ backgroundImage: "url('/images/profile-night-city.jpg')" }}
      >
        <div className="fixed inset-0 bg-[#060913]/75 pointer-events-none -z-0" />
        <StudentNav />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 text-center space-y-6 relative z-10 my-auto">
          <div className="pixel-8bit-card rounded-2xl p-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-950/60 border border-rose-500/60 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-pixel font-bold text-white">
              ยังไม่มีแบบทดสอบสำหรับบทเรียนนี้
            </h1>
            <p className="text-sm font-thai text-slate-400">
              ยังไม่พบชุดข้อสอบในระบบ กรุณาแจ้งครูผู้สอนเพื่อตรวจสอบข้อสอบ
            </p>
            <Link
              href={`/learn/${lesson.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-cyber font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับไปหน้าเรียนรู้</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-between relative bg-cover bg-center bg-fixed pixelated"
      style={{ backgroundImage: "url('/images/profile-night-city.jpg')" }}
    >
      <div className="fixed inset-0 bg-[#060913]/75 pointer-events-none -z-0" />

      {/* Twinkling Night Stars */}
      <div className="fixed inset-0 pointer-events-none -z-0 overflow-hidden">
        <div className="absolute top-10 left-12 w-2 h-2 bg-white rounded-full animate-star-twinkle" />
        <div className="absolute top-24 right-1/4 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-star-twinkle delay-300" />
        <div className="absolute top-44 left-1/3 w-2 h-2 bg-sky-200 rounded-full animate-star-twinkle delay-700" />
      </div>

      <StudentNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10 space-y-6">
        {/* Navigation Breadcrumb */}
        <ScrollReveal className="flex items-center justify-between">
          <Link
            href={`/learn/${lesson.id}`}
            className="inline-flex items-center gap-2 text-xs font-cyber text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าอ่านสไลด์บทเรียน ({lesson.title})</span>
          </Link>

          <span className="text-xs font-mono text-amber-400 font-bold px-3 py-1 rounded bg-amber-950/80 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            ⚔️ SPEED QUIZ BATTLE (30 SECONDS / Q)
          </span>
        </ScrollReveal>

        {/* Quiz Player Component inside Pixel RPG frame */}
        <ScrollReveal delay={75} scale={true}>
          <div className="pixel-8bit-card rounded-2xl p-4 sm:p-6">
            <QuizPlayer lesson={lesson} questions={safeQuestions} />
          </div>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
}
