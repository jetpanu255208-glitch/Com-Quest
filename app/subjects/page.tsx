import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StudentNav } from '@/components/layout/StudentNav';
import { Footer } from '@/components/layout/Footer';
import { GameCartridge } from '@/components/landing/GameCartridge';
import { RetroCartridgeCard } from '@/components/subjects/RetroCartridgeCard';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { OFFICIAL_HTML_LESSONS, Lesson } from '@/lib/supabase/types';
import { getAllStudentLessonsState } from '@/lib/learning/student-lesson-state';
import {
  Code2,
  Award,
  ArrowRight,
  BookOpen,
  Trophy,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SubjectsPage() {
  const supabase = await createClient();

  // Get current authenticated user securely via getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectedFrom=/subjects');
  }

  // Fetch lesson configurations from Supabase and summaries concurrently
  const [dbLessonsResult, lessonSummaries] = await Promise.all([
    supabase
      .from('lessons')
      .select('*')
      .order('lesson_number', { ascending: true }),
    user ? getAllStudentLessonsState(user.id) : Promise.resolve([]),
  ]);

  const dbLessons = dbLessonsResult.data;
  const summariesMap = new Map(lessonSummaries.map((s) => [s.lessonId, s]));

  // Completed lesson IDs
  const completedLessonIds = lessonSummaries.filter((s) => s.isCompleted).map((s) => s.lessonId);

  // Merge catalog with DB data
  const lessons: Lesson[] = OFFICIAL_HTML_LESSONS.map((catalogLesson) => {
    const dbItem = dbLessons?.find((l) => l.id === catalogLesson.id);
    return {
      ...catalogLesson,
      title: dbItem?.title || catalogLesson.title,
      description: dbItem?.description || catalogLesson.description,
      google_slides_url: dbItem?.google_slides_url || null,
      is_published: dbItem ? dbItem.is_published : catalogLesson.lesson_number <= 8,
      quiz_enabled: dbItem ? dbItem.quiz_enabled : catalogLesson.lesson_number <= 8,
    };
  });

  // Calculate completed lesson numbers for sequential progression unlocking
  const completedLessonNumbers = new Set<number>();
  lessons.forEach((l) => {
    const sum = summariesMap.get(l.id);
    if (sum?.isCompleted || completedLessonIds.includes(l.id)) {
      completedLessonNumbers.add(l.lesson_number);
    }
  });

  const completedCount = completedLessonNumbers.size;
  const currentLevel = Math.min(completedCount * 100, 800);

  return (
    <div
      className="min-h-screen flex flex-col justify-between relative bg-cover bg-center bg-fixed pixelated"
      style={{ backgroundImage: "url('/images/profile-night-city.jpg')" }}
    >
      {/* Subtle Darkening Overlay matching Profile Page */}
      <div className="fixed inset-0 bg-[#060913]/75 pointer-events-none -z-0" />

      {/* Twinkling Night Stars */}
      <div className="fixed inset-0 pointer-events-none -z-0 overflow-hidden">
        <div className="absolute top-10 left-12 w-2 h-2 bg-white rounded-full animate-star-twinkle" />
        <div className="absolute top-24 right-1/4 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-star-twinkle delay-300" />
        <div className="absolute top-44 left-1/3 w-2 h-2 bg-sky-200 rounded-full animate-star-twinkle delay-700" />
        <div className="absolute top-16 right-16 w-2.5 h-2.5 bg-white rounded-full animate-star-twinkle delay-1000" />
      </div>

      <StudentNav level={currentLevel} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 sm:pb-8 relative z-10 space-y-5 sm:space-y-6">
        {/* Course Header (Clean & Compact) */}
        <ScrollReveal className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 text-[11px] font-mono shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            <Code2 className="w-3 h-3 text-cyan-400" />
            <span>OFFICIAL COURSE • HTML ADVENTURE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-pixel font-bold tracking-wide text-white text-glow-cyan">
            วิชาการเขียนภาษา HTML เบื้องต้น
          </h1>
          <p className="text-xs sm:text-sm font-thai text-slate-300 max-w-2xl leading-relaxed">
            หลักสูตรสร้างรากฐานการพัฒนาเว็บ 8 บทเรียน (+100 EXP ต่อบท สะสมครบ 8 เหรียญรวมเป็น 1 ถ้วยสำเร็จรายวิชา สูงสุด 800 EXP)
          </p>
        </ScrollReveal>

        {/* Featured Cartridge Hero Card (Compact & Balanced Layout) */}
        <ScrollReveal delay={50}>
          <div className="pixel-8bit-card rounded-2xl p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center relative z-10">
              {/* Left: Compact Cartridge Showcase */}
              <div className="lg:col-span-4 flex justify-center">
                <div className="scale-80 sm:scale-100 origin-center -my-4 sm:my-0">
                  <GameCartridge compact={true} />
                </div>
              </div>

              {/* Right: Course Information (Clean Typography, No Overlapping) */}
              <div className="lg:col-span-8 space-y-3.5">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-cyan-950/90 text-cyan-300 border border-cyan-400/60 font-bold">
                      1 วิชาหลักสูตรเดียว
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-950/90 text-amber-300 border border-amber-400/60 font-bold">
                      8 บทเรียนเควสต์ ({completedCount}/8 เคลียร์แล้ว)
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-950/90 text-purple-300 border border-purple-400/60 font-bold">
                      LEVEL 800 MAX
                    </span>
                  </div>

                  {/* Clean title layout: Thai title with English subtitle beside it */}
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h2 className="text-xl sm:text-2xl font-cyber font-bold text-white text-glow-cyan tracking-wide">
                      HTML เบื้องต้น
                    </h2>
                    <span className="text-xs sm:text-sm font-cyber text-cyan-300 font-semibold tracking-wider">
                      (Introduction to HTML5)
                    </span>
                  </div>

                  <p className="text-xs font-thai text-slate-300 leading-relaxed max-w-xl">
                    เรียนรู้โครงสร้างพื้นฐานภาษา HTML ที่เป็นกระดูกสันหลังของทุกเว็บไซต์บนโลกอินเทอร์เน็ต ผ่านการปฏิบัติจริง ตั้งแต่การเขียนแท็กแรก จนถึงการประกอบโครงสร้างหน้าเว็บสมบูรณ์แบบ
                  </p>
                </div>

                {/* Reward Rules Callout (Sleek & Compact) */}
                <div className="p-3 rounded-xl bg-[#050b18]/90 border border-amber-400/40 space-y-1.5 text-xs font-thai shadow-inner">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>กติกาการเก็บเลเวลและถ้วยรางวัล:</span>
                  </div>
                  <ul className="space-y-0.5 text-slate-300 pl-4 list-disc text-[11px] leading-relaxed">
                    <li>จบ 1 บทเรียน &rarr; ได้รับ <strong className="text-amber-300">1 เหรียญรางวัล</strong> และ <strong className="text-cyan-300">+100 EXP</strong></li>
                    <li>จบครบ 8 บทเรียน &rarr; รวมกลายเป็น <strong className="text-amber-400">1 ถ้วยสำเร็จรายวิชา</strong> (800 EXP เต็ม MAX)</li>
                    <li>แต่ละบทเรียนจะปลดล็อกตามลำดับ (ต้องผ่านบทก่อนหน้าเพื่อปลดล็อกบทถัดไป)</li>
                  </ul>
                </div>

                {/* Primary CTA Buttons (Comfortable, Compact Sizing) */}
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {(() => {
                    const activeLesson = lessons.find((l) => {
                      const sum = summariesMap.get(l.id);
                      const isUnlocked = l.lesson_number === 1 || completedLessonNumbers.has(l.lesson_number - 1);
                      return isUnlocked && !sum?.isCompleted;
                    });

                    if (activeLesson) {
                      const activeSummary = summariesMap.get(activeLesson.id);
                      const label =
                        activeSummary?.status === 'mission_passed_quiz_failed' ||
                        (activeSummary?.missionPassed && activeSummary?.hasMission)
                          ? `ทำแบบทดสอบบทที่ ${activeLesson.lesson_number} ต่อ`
                          : `เริ่มเรียนรู้บทที่ ${activeLesson.lesson_number}`;
                      const url = activeSummary?.actionButtonUrl || `/learn/${activeLesson.id}`;
                      return (
                        <Link
                          href={url}
                          className="pixel-pop-btn px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 text-slate-950 font-cyber font-bold text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-1.5 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{label}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      );
                    }
                    return (
                      <Link
                        href="/learn/html_01?mode=review"
                        className="pixel-pop-btn px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 hover:from-emerald-900 border border-emerald-400 text-emerald-300 font-cyber font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ทบทวนเนื้อหาบทเรียน</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    );
                  })()}

                  <Link
                    href="/profile"
                    className="pixel-pop-btn px-4 sm:px-5 py-2.5 rounded-xl bg-[#050b18] border border-cyan-400/60 text-cyan-200 font-cyber font-bold text-xs tracking-wider uppercase hover:border-cyan-400 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>ดูเหรียญและเลเวลในโปรไฟล์</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* =====================================================================
            8 LESSONS SYLLABUS GRID (RETRO CASSETTE CARTRIDGES)
            ===================================================================== */}
        <div className="space-y-4">
          <ScrollReveal className="flex items-center justify-between pb-2.5 border-b border-cyan-500/20">
            <div>
              <h3 className="text-lg sm:text-xl font-pixel font-bold tracking-wide text-white flex items-center gap-2 text-glow-cyan">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>โครงสร้างเนื้อหา 8 บทเรียน (8 Lessons Syllabus)</span>
              </h3>
              <p className="text-[11px] sm:text-xs font-thai text-slate-300 mt-0.5">
                ตลับบทเรียนแต่ละบทจะปลดล็อกตามลำดับเควสต์ เมื่อผ่านแล้วตลับจะแวววาวเป็นสีเขียว
              </p>
            </div>
            <span className="text-[11px] font-mono text-cyan-300 px-2.5 py-0.5 rounded-md bg-cyan-950/90 border border-cyan-400/60 font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]">
              {completedCount} / 8 CLEARED
            </span>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5">
            {lessons.map((lesson, idx) => {
              const summary = summariesMap.get(lesson.id);
              const isCompleted = summary ? summary.isCompleted : completedLessonIds.includes(lesson.id);

              // Sequential unlock rule:
              // Lesson 1 is always unlocked.
              // Lesson N requires Lesson N-1 to be completed.
              const isUnlocked = lesson.lesson_number === 1 || completedLessonNumbers.has(lesson.lesson_number - 1);

              const buttonLabel = summary?.actionButtonLabel || 'เริ่มเรียนรู้';
              const buttonUrl = isCompleted
                ? `/learn/${lesson.id}?mode=review`
                : summary?.actionButtonUrl || `/learn/${lesson.id}`;

              return (
                <ScrollReveal key={lesson.id} delay={(idx % 4) * 45} className="h-full">
                  <RetroCartridgeCard
                    lesson={lesson}
                    isCleared={isCompleted}
                    isUnlocked={isUnlocked}
                    buttonLabel={buttonLabel}
                    buttonUrl={buttonUrl}
                  />
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
