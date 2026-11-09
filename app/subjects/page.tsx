import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StudentNav } from '@/components/layout/StudentNav';
import { Footer } from '@/components/layout/Footer';
import { GameCartridge } from '@/components/landing/GameCartridge';
import { RetroCartridgeCard } from '@/components/subjects/RetroCartridgeCard';
import { MobileSubjectsView } from '@/components/mobile/MobileSubjectsView';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { DigitalSpaceCanvas } from '@/components/landing/DigitalSpaceCanvas';
import { OFFICIAL_HTML_LESSONS, Lesson } from '@/lib/supabase/types';
import { getAllStudentLessonsState } from '@/lib/learning/student-lesson-state';
import {
  Code2,
  Award,
  ArrowRight,
  BookOpen,
  Trophy,
  Swords,
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

  // Prepare serializable summaries for mobile view
  const plainSummaries: Record<string, {
    lessonId: string;
    isCompleted: boolean;
    status?: string;
    actionButtonLabel?: string;
    actionButtonUrl?: string;
    missionPassed?: boolean;
    hasMission?: boolean;
  }> = {};
  lessonSummaries.forEach((s) => {
    plainSummaries[s.lessonId] = {
      lessonId: s.lessonId,
      isCompleted: s.isCompleted,
      status: s.status,
      actionButtonLabel: s.actionButtonLabel,
      actionButtonUrl: s.actionButtonUrl,
      missionPassed: s.missionPassed,
      hasMission: s.hasMission,
    };
  });

  return (
    <div className="min-h-screen flex flex-col justify-between relative bg-[#060913] text-slate-100 overflow-x-hidden">
      {/* Background Digital Space with 3D Grid & Rising Particles (Matching Login UI) */}
      <DigitalSpaceCanvas particleCount={36} showFloorGrid={true} className="opacity-75" />
      <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none -z-10" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none -z-10" />

      <StudentNav level={currentLevel} />

      {/* =====================================================================
          MOBILE SUBJECTS VIEW (< md: Dedicated Mobile Experience)
          ===================================================================== */}
      <MobileSubjectsView
        lessons={lessons}
        completedCount={completedCount}
        completedLessonNumbers={Array.from(completedLessonNumbers)}
        summariesMap={plainSummaries}
      />

      {/* =====================================================================
          DESKTOP SUBJECTS VIEW (>= md: Full Retro Cartridge Experience)
          ===================================================================== */}
      <main className="hidden md:block flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 sm:pb-8 relative z-10 space-y-5 sm:space-y-6">
        {/* Course Header (Clean & Minimal) */}
        <ScrollReveal className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-pixel font-bold tracking-wide text-slate-100">
            วิชาการเขียนภาษา HTML เบื้องต้น
          </h1>
          <p className="text-xs sm:text-sm font-thai text-slate-400 max-w-2xl leading-relaxed">
            หลักสูตรสร้างรากฐานการพัฒนาเว็บ 8 บทเรียน (+100 EXP ต่อบท สะสมครบ 8 เหรียญรวมเป็น 1 ถ้วยสำเร็จรายวิชา)
          </p>
        </ScrollReveal>

        {/* Featured Course Summary Card (Clean Surface Card) */}
        <ScrollReveal delay={50}>
          <div className="bg-[#101827] border border-[#263449] rounded-2xl p-4 sm:p-6 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
              {/* Left: Cartridge Artwork */}
              <div className="lg:col-span-4 flex justify-center">
                <div className="scale-75 sm:scale-95 origin-center -my-3 sm:my-0">
                  <GameCartridge compact={true} />
                </div>
              </div>

              {/* Right: Course Information (Clean & Spacious) */}
              <div className="lg:col-span-8 space-y-3.5">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-[#151F30] text-[#00CFEF] border border-[#263449] font-medium">
                      HTML5 Beginner
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-[#151F30] text-emerald-400 border border-[#263449]">
                      เคลียร์แล้ว {completedCount}/8 บทเรียน
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-cyber font-bold text-slate-100 tracking-wide">
                    HTML เบื้องต้น (Introduction to HTML5)
                  </h2>

                  <p className="text-xs sm:text-sm font-thai text-slate-400 leading-relaxed max-w-xl">
                    เรียนรู้โครงสร้างพื้นฐานภาษา HTML ที่เป็นกระดูกสันหลังของทุกเว็บไซต์บนโลกอินเทอร์เน็ต ผ่านการปฏิบัติจริง ตั้งแต่การเขียนแท็กแรก จนถึงการประกอบโครงสร้างหน้าเว็บสมบูรณ์แบบ
                  </p>
                </div>

                {/* Reward Rules Callout (Subtle & Clean) */}
                <div className="p-3 rounded-xl bg-[#151F30] border border-[#263449] space-y-1 text-xs font-thai">
                  <div className="flex items-center gap-1.5 text-amber-400 font-medium text-xs">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>กติกาการเก็บเลเวลและถ้วยรางวัล:</span>
                  </div>
                  <ul className="space-y-0.5 text-slate-400 pl-4 list-disc text-[11px] leading-relaxed">
                    <li>จบ 1 บทเรียน &rarr; ได้รับ <span className="text-amber-300 font-medium">1 เหรียญรางวัล</span> และ <span className="text-[#00CFEF] font-medium">+100 EXP</span></li>
                    <li>จบครบ 8 บทเรียน &rarr; รวมเป็น <span className="text-amber-400 font-medium">1 ถ้วยสำเร็จรายวิชา</span> (800 EXP เต็ม)</li>
                    <li>ปลดล็อกทีละบทเรียนตามลำดับความรู้</li>
                  </ul>
                </div>

                {/* Primary CTA Buttons */}
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
                          className="px-4 py-2 rounded-xl bg-[#00CFEF] hover:bg-[#00b8d4] text-[#080D1A] font-thai font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>{label}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      );
                    }
                    return (
                      <Link
                        href="/learn/html_01?mode=review"
                        className="px-4 py-2 rounded-xl bg-[#151F30] hover:bg-[#1e2c44] border border-[#263449] text-slate-200 font-thai font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                        <span>ทบทวนเนื้อหาบทเรียน</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    );
                  })()}

                  <Link
                    href="/exam"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-cyan-500/20 border border-rose-500/40 text-rose-300 font-thai font-semibold text-xs sm:text-sm hover:border-rose-400 hover:text-white transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                  >
                    <Swords className="w-4 h-4 text-rose-400" />
                    <span>เข้าห้องสอบบอส (Boss Battle)</span>
                  </Link>

                  <Link
                    href="/profile"
                    className="px-4 py-2 rounded-xl bg-[#101827] border border-[#263449] text-slate-300 font-thai font-medium text-xs sm:text-sm hover:border-slate-600 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Award className="w-4 h-4 text-amber-400" />
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
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base sm:text-lg font-thai font-semibold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#00CFEF]" />
              <span>โครงสร้างเนื้อหา 8 บทเรียน (8 Lessons Syllabus)</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400 bg-[#151F30] px-2.5 py-0.5 rounded-md border border-[#263449]">
              {completedCount} / 8 ผ่านแล้ว
            </span>
          </div>
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
