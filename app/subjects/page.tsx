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
import { OFFICIAL_HTML_LESSONS, Lesson } from '@/lib/supabase/types';
import { getAllStudentLessonsState } from '@/lib/learning/student-lesson-state';
import {
  Code2,
  Award,
  ArrowRight,
  BookOpen,
  Trophy,
  Gamepad2,
  Heart,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SubjectsPage() {
  const supabase = await createClient();

  // Get current authenticated session fast without blocking on extra remote Auth roundtrip
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

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
    <div className="min-h-screen flex flex-col justify-between relative bg-[var(--bg-dark)] text-[var(--text-primary)] transition-colors duration-200 overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--border-glow),transparent_70%)] pointer-events-none -z-10 opacity-30" />

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
      <main className="hidden md:block flex-1 w-full px-4 sm:px-6 lg:px-10 pt-4 sm:pt-5 pb-12 sm:pb-6 relative z-10 space-y-4 sm:space-y-5">
        {/* Course Header (Clean & Minimal) */}
        <ScrollReveal className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-pixel font-bold tracking-wide text-slate-100">
              วิชาการเขียนภาษา HTML เบื้องต้น
            </h1>
            <p className="text-xs sm:text-sm font-thai text-slate-400 max-w-2xl leading-relaxed">
              หลักสูตรสร้างรากฐานการพัฒนาเว็บ 8 บทเรียน (+100 EXP ต่อบท สะสมครบ 8 เหรียญรวมเป็น 1 ถ้วยสำเร็จรายวิชา)
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1 rounded-xl bg-[#101827] border border-[#263449] text-amber-400 font-bold">
              EXP สะสม: {currentLevel} / 800
            </span>
          </div>
        </ScrollReveal>

        {/* Featured Course Summary Card (Clean Surface Card) */}
        <ScrollReveal delay={40}>
          <div className="bg-[#101827]/95 border border-[#263449] rounded-2xl p-4 sm:p-5 relative shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-center">
              {/* Left: Cartridge Artwork */}
              <div className="lg:col-span-4 flex justify-center">
                <div className="scale-75 sm:scale-90 origin-center -my-4 sm:-my-2">
                  <GameCartridge compact={true} />
                </div>
              </div>

              {/* Right: Course Information (Clean & Balanced) */}
              <div className="lg:col-span-8 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-[#151F30] text-[#00CFEF] border border-[#263449] font-medium">
                      HTML5 Beginner Course
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-[#151F30] text-emerald-400 border border-[#263449]">
                      เคลียร์แล้ว {completedCount}/8 บทเรียน ({Math.round((completedCount / 8) * 100)}%)
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-cyber font-bold text-slate-100 tracking-wide">
                    HTML เบื้องต้น (Introduction to HTML5)
                  </h2>

                  <p className="text-xs sm:text-sm font-thai text-slate-400 leading-relaxed max-w-2xl">
                    เรียนรู้โครงสร้างพื้นฐานภาษา HTML ที่เป็นกระดูกสันหลังของทุกเว็บไซต์บนโลกอินเทอร์เน็ต ผ่านสไลด์เนื้อหา มินิเกมต่อบล็อกโค้ด และศึกปราบบอสท้ายบทเรียน
                  </p>
                </div>

                {/* Course Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-thai text-slate-400">
                    <span>ความคืบหน้ารายวิชาทั้งหมด</span>
                    <span className="font-mono font-bold text-[#00CFEF]">
                      {completedCount} / 8 บทเรียน ({Math.round((completedCount / 8) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#080D1A] border border-[#263449] overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#00CFEF] via-sky-400 to-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.round((completedCount / 8) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Reward Rules + Primary CTA Buttons on one row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-thai text-slate-300">
                    <span className="flex items-center gap-1 text-amber-300">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>จบ 1 บท = 1 เหรียญ (+100 EXP)</span>
                    </span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-emerald-300">ครบ 8 บท = 1 ถ้วยรางวัลใหญ่</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const activeLesson = lessons.find((l) => {
                        const sum = summariesMap.get(l.id);
                        const isUnlocked = l.lesson_number === 1 || completedLessonNumbers.has(l.lesson_number - 1);
                        return isUnlocked && !sum?.isCompleted;
                      });

                      if (activeLesson) {
                        return (
                          <Link
                            href={`/learn/${activeLesson.id}`}
                            className="px-4 py-2 rounded-xl bg-[#00CFEF] hover:bg-[#00b8d4] text-[#080D1A] font-thai font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-[0_0_18px_rgba(0,207,239,0.35)] cursor-pointer"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>ลุยต่อบทที่ {activeLesson.lesson_number}</span>
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
                      href="/profile"
                      className="px-3.5 py-2 rounded-xl bg-[#151F30] border border-[#263449] text-slate-300 font-thai font-medium text-xs sm:text-sm hover:border-slate-500 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>ดูโปรไฟล์</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* =====================================================================
            8 LESSONS SYLLABUS GRID (RETRO CASSETTE CARTRIDGES)
            ===================================================================== */}
        <div className="space-y-3 sm:space-y-4">
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

              const buttonLabel = isCompleted ? 'ทบทวนความรู้' : 'เริ่มเรียนรู้';
              const buttonUrl = isCompleted
                ? `/learn/${lesson.id}?mode=review`
                : `/learn/${lesson.id}`;

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

        {/* =====================================================================
            SPECIAL BONUS STAGE GAME BANNER (APPEARS ONLY WHEN ALL 8 LESSONS ARE COMPLETED)
            ===================================================================== */}
        {completedCount >= 8 && (
          <ScrollReveal delay={120}>
            <div className="rounded-2xl border-2 border-amber-400/70 bg-gradient-to-r from-[#121A2F] via-[#1b1f3a] to-[#231836] p-4 sm:p-5 shadow-[0_0_35px_rgba(245,158,11,0.25)] relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-44 h-44 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.35)]">
                    <Gamepad2 className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-mono font-extrabold tracking-wider uppercase flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        UNLOCKED BONUS GAME (8/8 CLEARED)
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 border border-rose-400/50 text-rose-300 text-[10px] font-mono font-bold flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                        3 HEARTS (♥♥♥)
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-cyber font-bold text-white tracking-wide">
                      ปลดล็อกเมนูเกมพิเศษแล้ว: SUPER HTML TAG RUNNER (โหมดเกมเต็มหน้าจอแนวนอน)
                    </h3>
                    <p className="text-xs font-thai text-slate-300 leading-relaxed">
                      ยินดีด้วยที่เรียนครบทั้ง 8 บทเรียน! กดเข้าสู่โหมดเกมเต็มหน้าจอแนวนอนเพื่อตะลุยด่านมาริโอ้กระโดดโหม่งบล็อก <code className="text-amber-300 font-mono">[ ? ]</code> แท็ก HTML ทั้ง 5 ด่านได้ทันที
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <Link
                    href="/quest"
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-thai font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.45)] transition-all active:scale-95"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    <span>เข้าเล่นเกมพิเศษ (เต็มหน้าจอแนวนอน)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}
      </main>

      <Footer />
    </div>
  );
}
