import React from 'react';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StudentNav } from '@/components/layout/StudentNav';
import { Footer } from '@/components/layout/Footer';
import { OFFICIAL_HTML_LESSONS, Lesson } from '@/lib/supabase/types';
import { parseGoogleSlidesUrl } from '@/lib/slides';
import { getLessonMission } from '@/lib/constants/missions';
import { SlideViewer } from '@/components/learn/SlideViewer';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import {
  BookOpen,
  ArrowLeft,
  Swords,
  Lock,
  CheckCircle2,
  Sparkles,
  Trophy,
  Code2,
  ArrowRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    mode?: string;
    retry?: string;
    from?: string;
  }>;
}

export default async function StudentLearnLessonPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect('/login?next=/learn/' + id);
  }

  // Find official catalog entry
  const catalogItem = OFFICIAL_HTML_LESSONS.find((l) => l.id === id);
  if (!catalogItem) {
    notFound();
  }

  // Unified student lesson state & lesson configuration fetched concurrently
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
    is_published: dbLesson ? dbLesson.is_published : catalogItem.lesson_number <= 8,
    quiz_enabled: dbLesson ? dbLesson.quiz_enabled : catalogItem.lesson_number <= 8,
  };

  const isCompleted = summary.isCompleted;
  const isReviewMode = isCompleted || resolvedSearchParams.mode === 'review';
  const hasMission = summary.hasMission;
  const hasPassedMission = summary.missionPassed;
  const mission = getLessonMission(id);

  // Sequential progression check: If Lesson N > 1, Lesson N-1 must be completed (unless current is completed)
  const isPrevCompleted =
    lesson.lesson_number === 1 ||
    allSummaries.some((s) => s.lessonNumber === lesson.lesson_number - 1 && s.isCompleted);

  if (!isPrevCompleted && !isCompleted) {
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
                บทเรียนที่ {lesson.lesson_number} ยังล็อคอยู่
              </h1>
              <p className="text-sm font-thai text-slate-300 max-w-md mx-auto leading-relaxed">
                คุณจำเป็นต้องเรียนและผ่านเควสต์ <strong className="text-cyan-300">บทที่ {lesson.lesson_number - 1}</strong> ให้เสร็จสิ้นก่อน จึงจะสามารถปลดล็อกบทเรียนนี้ได้
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
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

  // All 8 official lessons are open; if unpublished, check permission
  if (lesson.lesson_number > 8 && !lesson.is_published) {
    return (
      <div
        className="min-h-screen flex flex-col justify-between relative bg-cover bg-center bg-fixed pixelated"
        style={{ backgroundImage: "url('/images/profile-night-city.jpg')" }}
      >
        <div className="fixed inset-0 bg-[#060913]/75 pointer-events-none -z-0" />
        <StudentNav />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 text-center space-y-6 relative z-10">
          <div className="pixel-8bit-card rounded-2xl p-8 max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-pixel font-bold text-white">
              บทเรียนที่ {lesson.lesson_number} ยังไม่เปิดให้เรียน
            </h1>
            <p className="text-sm font-thai text-slate-400">
              หลักสูตรเปิดให้เรียนรู้บทเรียนที่ 1 ถึง 8 ครบถ้วนแล้ว
            </p>
            <Link
              href="/subjects"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-cyber font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับหน้าวิชาเรียน</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Return to wherever the user entered review mode from (profile or subjects)
  const exitReviewUrl = resolvedSearchParams.from === 'profile' ? '/profile' : '/subjects';

  // Parse Google Slides URL
  const parsedSlides = parseGoogleSlidesUrl(lesson.google_slides_url);

  return (
    <div
      className="min-h-screen flex flex-col justify-between relative bg-cover bg-center bg-fixed pixelated"
      style={{ backgroundImage: "url('/images/profile-night-city.jpg')" }}
    >
      {/* Darkening Overlay matching Profile Page */}
      <div className="fixed inset-0 bg-[#060913]/75 pointer-events-none -z-0" />

      {/* Twinkling Night Stars */}
      <div className="fixed inset-0 pointer-events-none -z-0 overflow-hidden">
        <div className="absolute top-10 left-12 w-2 h-2 bg-white rounded-full animate-star-twinkle" />
        <div className="absolute top-24 right-1/4 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-star-twinkle delay-300" />
        <div className="absolute top-44 left-1/3 w-2 h-2 bg-sky-200 rounded-full animate-star-twinkle delay-700" />
      </div>

      <StudentNav />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10 space-y-6">
        {/* Breadcrumb Navigation & Mode Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {isReviewMode ? (
            <Link
              href={exitReviewUrl}
              className="pixel-pop-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-amber-400/60 hover:border-amber-300 text-amber-300 font-cyber font-bold text-xs transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ออกจากการทบทวน (Exit Review)</span>
            </Link>
          ) : (
            <Link
              href="/subjects"
              className="inline-flex items-center gap-2 text-xs font-cyber text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับหน้ารวมบทเรียน (Syllabus)</span>
            </Link>
          )}

          {isReviewMode ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-emerald-950/90 border border-emerald-400/70 text-emerald-300 font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>โหมดทบทวนเนื้อหา (Review Mode)</span>
              </span>
            </div>
          ) : hasMission ? (
            /* Stepper Roadmap Indicator */
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-400/60 font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                <BookOpen className="w-3 h-3 text-cyan-400" />
                <span>1. ดูสไลด์ (กำลังเรียน)</span>
              </span>
              <span className="text-slate-600">&rarr;</span>
              <span
                className={`px-2.5 py-0.5 rounded-full border ${
                  hasPassedMission
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                2. ภารกิจเขียนโค้ด {hasPassedMission ? '(ผ่านแล้ว ✓)' : ''}
              </span>
              <span className="text-slate-600">&rarr;</span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-500 border border-slate-800">
                3. แบบทดสอบ 10 ข้อ
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-cyan-950 border border-cyan-400/50 text-cyan-300 font-bold">
                บทเรียนที่ {lesson.lesson_number} / 8
              </span>
            </div>
          )}
        </div>

        {/* Lesson Header Card (Compact & Refined) */}
        <ScrollReveal>
          <div className="pixel-8bit-card rounded-2xl p-4 sm:p-5 relative overflow-hidden space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-400/50">
                HTML5 FOUNDATION
              </span>
              {isReviewMode ? (
                <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ปลดล็อกเหรียญแล้ว (ทบทวนเนื้อหา)</span>
                </span>
              ) : (
                <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>รางวัล: 1 เหรียญความสำเร็จ (+100 EXP)</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-cyber font-bold text-white text-glow-cyan tracking-wide">
              บทเรียนที่ {lesson.lesson_number}: {lesson.title}
            </h1>

            <p className="text-xs sm:text-sm font-thai text-slate-300 max-w-3xl leading-relaxed">
              {lesson.description}
            </p>
          </div>
        </ScrollReveal>

        {/* Presentation Area (Compact Frame) */}
        <ScrollReveal delay={70}>
          <div className="pixel-8bit-card rounded-2xl p-2.5 sm:p-4 overflow-hidden">
            <SlideViewer
              lessonId={lesson.id}
              lessonTitle={lesson.title}
              parsedSlides={parsedSlides}
              totalLocalSlides={lesson.id === 'html_03' || lesson.id === 'html_04' ? 6 : 10}
            />
          </div>
        </ScrollReveal>

        {/* Bottom Call-to-Action Bar (Compact Sizing) */}
        <ScrollReveal delay={120}>
          {isReviewMode ? (
            <div className="pixel-8bit-card rounded-2xl p-4 sm:p-5 border-2 border-emerald-400/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-base sm:text-lg font-cyber font-bold text-white tracking-wide">
                    โหมดทบทวนเนื้อหา (Review Mode)
                  </h3>
                </div>
                <p className="text-xs font-thai text-slate-300 max-w-2xl leading-relaxed">
                  คุณได้สำเร็จบทเรียนที่ {lesson.lesson_number} และได้รับเหรียญรางวัลเรียบร้อยแล้ว ในโหมดนี้สามารถอ่านทบทวนสไลด์ความรู้ได้ตลอดเวลา เมื่อพร้อมแล้วสามารถกดปุ่มเพื่อออกจากการทบทวน
                </p>
              </div>

              <Link
                href={exitReviewUrl}
                className="pixel-pop-btn px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 hover:from-emerald-900 border border-emerald-400 text-emerald-300 font-cyber font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ออกจากการทบทวน</span>
              </Link>
            </div>
          ) : (
            <div className="pixel-8bit-card rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  {hasPassedMission ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-base sm:text-lg font-cyber font-bold text-white tracking-wide">
                        ภารกิจผ่านแล้ว • พร้อมสำหรับแบบทดสอบบทเรียนที่ {lesson.lesson_number}
                      </h3>
                    </>
                  ) : hasMission ? (
                    <>
                      <Code2 className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-base sm:text-lg font-cyber font-bold text-white tracking-wide">
                        ภารกิจเขียนโค้ดบทที่ {lesson.lesson_number}: {mission?.title || 'Coding Mission'}
                      </h3>
                    </>
                  ) : (
                    <>
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <h3 className="text-base sm:text-lg font-cyber font-bold text-white tracking-wide">
                        แบบทดสอบวัดความรู้บทที่ {lesson.lesson_number} (10 ข้อ 30 วินาที/ข้อ)
                      </h3>
                    </>
                  )}
                </div>

                <p className="text-xs font-thai text-slate-300">
                  {hasPassedMission
                    ? 'คุณผ่านภารกิจเขียนโค้ดของบทนี้แล้ว เมื่ออ่านสไลด์เข้าใจแล้วสามารถกดถัดไปเพื่อทำแบบทดสอบ 10 ข้อได้ทันทีโดยไม่ต้องทำภารกิจใหม่'
                    : hasMission
                    ? 'เมื่ออ่านสไลด์เข้าใจแล้ว กดเข้าสู่ภารกิจเขียนโค้ดเพื่อฝึกปฏิบัติและดูผลลัพธ์แบบเรียลไทม์ ก่อนเข้าสู่แบบทดสอบ 10 ข้อ'
                    : 'เมื่ออ่านสไลด์เข้าใจแล้ว กดเริ่มทำแบบทดสอบ เกณฑ์ผ่าน 5/10 คะแนนขึ้นไปเพื่อปลดล็อกเหรียญทองและ +100 EXP'}
                </p>
              </div>

              <div className="flex-shrink-0">
                {hasPassedMission ? (
                  <Link
                    href={`/quiz/${lesson.id}`}
                    className="pixel-pop-btn px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 text-slate-950 font-cyber font-bold text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Swords className="w-4 h-4" />
                    <span>ไปทำแบบทดสอบ</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : hasMission ? (
                  <Link
                    href={`/mission/${lesson.id}`}
                    className="pixel-pop-btn px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 text-slate-950 font-cyber font-bold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Code2 className="w-4 h-4" />
                    <span>ไปทำภารกิจเขียนโค้ด</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : lesson.quiz_enabled ? (
                  <Link
                    href={`/quiz/${lesson.id}`}
                    className="pixel-pop-btn px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 text-slate-950 font-cyber font-bold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Swords className="w-4 h-4" />
                    <span>เริ่มทำแบบทดสอบ</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-500 font-cyber font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 cursor-not-allowed"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>แบบทดสอบยังไม่เปิดใช้งาน (รอครูเปิดสิทธิ์)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
}
