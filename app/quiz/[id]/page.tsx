import React from 'react';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StudentNav } from '@/components/layout/StudentNav';
import { Footer } from '@/components/layout/Footer';
import { OFFICIAL_HTML_LESSONS, Lesson, StudentQuizQuestion } from '@/lib/supabase/types';
import { QuizPlayer } from '@/components/quiz/QuizPlayer';
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
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/quiz/' + id);
  }

  // Find official catalog item
  const catalogItem = OFFICIAL_HTML_LESSONS.find((l) => l.id === id);
  if (!catalogItem) {
    notFound();
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

  // Use unified student lesson state helper
  const { getStudentLessonState } = await import('@/lib/learning/student-lesson-state');
  const summary = await getStudentLessonState(user.id, id);

  if (summary.isCompleted || summary.quizPassed) {
    const bestScore = summary.bestScore ?? 10;
    return (
      <div className="flex flex-col min-h-screen cyber-grid relative">
        <StudentNav />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-950/80 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-[0_0_25px_#fbbf24]">
            <Trophy className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-950 border border-amber-500 text-amber-300 font-pixel text-xs tracking-widest uppercase">
              COMPLETED &bull; ปลดล็อกแล้ว
            </span>
            <h1 className="text-2xl font-cyber font-bold text-white text-glow-cyan">
              คุณทำแบบทดสอบบทเรียนที่ {lesson.lesson_number} ผ่านแล้ว
            </h1>
            <div className="text-3xl font-pixel text-amber-400 py-1">
              คะแนนที่ทำได้: {bestScore} / 10
            </div>
            <p className="text-xs sm:text-sm font-thai text-slate-300 max-w-md mx-auto leading-relaxed">
              แบบทดสอบท้ายบทเรียนอนุญาตให้ทำได้เพียง 1 ครั้งเมื่อผ่านเกณฑ์ คุณได้รับเหรียญรางวัลและเลเวลประจำบทเรียนนี้แล้ว สามารถเข้าสู่โหมดทบทวนเนื้อหาสไลด์ได้ตลอดเวลา
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href={`/learn/${lesson.id}?mode=review`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 border border-amber-500/60 hover:bg-amber-950/40 text-amber-300 font-cyber font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>ทบทวนสไลด์บทเรียน</span>
            </Link>

            <Link
              href="/subjects"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-cyber font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับหน้ารวมวิชาเรียน</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Check if mission prerequisite is met
  if (summary.hasMission && !summary.missionPassed) {
    return (
      <div className="flex flex-col min-h-screen cyber-grid relative">
        <StudentNav />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-cyber font-bold text-white">
            กรุณาทำภารกิจบทที่ {lesson.lesson_number} ให้ผ่านก่อน
          </h1>
          <p className="text-sm font-thai text-slate-400 leading-relaxed max-w-md mx-auto">
            บทเรียนนี้กำหนดให้นักเรียนต้องฝึกเขียนโค้ดและรันภารกิจให้ผ่านเกณฑ์ก่อน จึงจะปลดล็อกแบบทดสอบท้ายบทเรียน
          </p>
          <Link
            href={`/mission/${lesson.id}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-cyber font-bold text-xs uppercase"
          >
            <span>ไปทำภารกิจเขียนโค้ด</span>
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Lessons 1 to 8 are playable; for unpublished lessons check permissions
  if (lesson.lesson_number > 8 && !lesson.is_published) {
    return (
      <div className="flex flex-col min-h-screen cyber-grid relative">
        <StudentNav />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-cyber font-bold text-white">
            แบบทดสอบบทเรียนที่ {lesson.lesson_number} ยังไม่เปิดให้บริการ
          </h1>
          <p className="text-sm font-thai text-slate-400">
            ระบบเปิดให้ทำแบบทดสอบครบทั้ง 8 บทเรียนแล้ว
          </p>
          <Link
            href="/subjects"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-cyber font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าหลักสูตร</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Check permissions: Lesson must be published and quiz must be enabled
  if (!lesson.is_published || !lesson.quiz_enabled) {
    return (
      <div className="flex flex-col min-h-screen cyber-grid relative">
        <StudentNav />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-cyber font-bold text-white">
            แบบทดสอบนี้ยังไม่เปิดให้นักเรียนทำ
          </h1>
          <p className="text-sm font-thai text-slate-400">
            ครูผู้สอนได้ปิดสิทธิ์การทำแบบทดสอบสำหรับบทเรียนนี้ไว้ชั่วคราว
          </p>
          <Link
            href={`/learn/${lesson.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-cyber font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับไปอ่านสไลด์บทเรียน</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Fetch 10 questions without revealing correct_option and explanation
  const { data: rawQuestions, error } = await supabase
    .from('quiz_questions')
    .select('id, lesson_id, question_number, question_text, option_a, option_b, option_c, option_d')
    .eq('lesson_id', id)
    .order('question_number', { ascending: true });

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
    // Robust fallback: Always guarantee 10 questions for HTML Basic Lessons 1 to 8
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
      <div className="flex flex-col min-h-screen cyber-grid relative">
        <StudentNav />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-cyber font-bold text-white">
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
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen cyber-grid relative transition-colors duration-200">
      <StudentNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={`/learn/${lesson.id}`}
            className="inline-flex items-center gap-2 text-xs font-cyber text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าอ่านสไลด์บทเรียน</span>
          </Link>

          <span className="text-xs font-mono text-amber-400 font-bold">
            ⚔️ SPEED QUIZ BATTLE (30 SECONDS / Q)
          </span>
        </div>

        {/* Quiz Player Component */}
        <QuizPlayer lesson={lesson} questions={safeQuestions} />
      </main>

      <Footer />
    </div>
  );
}
