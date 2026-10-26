import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StudentNav } from '@/components/layout/StudentNav';
import { Footer } from '@/components/layout/Footer';
import { GameCartridge } from '@/components/landing/GameCartridge';
import { OFFICIAL_HTML_LESSONS, Lesson } from '@/lib/supabase/types';
import { getAllStudentLessonsState, StudentLessonProgressSummary } from '@/lib/learning/student-lesson-state';
import {
  Code2,
  Award,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Trophy,
  Lock,
  Swords,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SubjectsPage() {
  const supabase = await createClient();

  // Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch lesson configurations from Supabase
  const { data: dbLessons } = await supabase
    .from('lessons')
    .select('*')
    .order('lesson_number', { ascending: true });

  // Fetch unified progression summaries for all lessons if user is logged in
  const lessonSummaries: StudentLessonProgressSummary[] = user
    ? await getAllStudentLessonsState(user.id)
    : [];
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

  return (
    <div className="flex flex-col min-h-screen cyber-grid relative transition-colors duration-200">
      <StudentNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-2">
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>OFFICIAL SINGLE COURSE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-cyber font-bold tracking-wide">
            การเขียนภาษา HTML เบื้องต้น
          </h1>
          <p className="text-sm font-thai text-slate-400 mt-1 max-w-2xl">
            หลักสูตรเดียวสำหรับสร้างรากฐานการพัฒนาเว็บที่แข็งแกร่ง ประกอบด้วย 8 บทเรียน (+100 เลเวลต่อบทเรียน สะสมครบ 8 เหรียญหลอมรวมเป็น 1 ถ้วยสำเร็จรายวิชา สูงสุด 800 เลเวล)
          </p>
        </div>

        {/* Featured Cartridge Hero Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border mb-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left: Cartridge Showcase */}
            <div className="lg:col-span-5 flex justify-center">
              <GameCartridge />
            </div>

            {/* Right: Course Information */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-bold">
                    1 วิชาหลักสูตรเดียว
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-950/80 text-amber-300 border border-amber-500/40 font-bold">
                    8 บทเรียนเควสต์ (8 เหรียญ)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-purple-950/80 text-purple-300 border border-purple-500/40 font-bold">
                    LEVEL 800 MAX
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-cyber font-bold text-white text-glow-cyan">
                  HTML เบื้องต้น (Introduction to HTML5)
                </h2>

                <p className="text-sm font-thai text-slate-300 leading-relaxed">
                  เรียนรู้โครงสร้างพื้นฐานภาษา HTML ที่เป็นกระดูกสันหลังของทุกเว็บไซต์บนโลกอินเทอร์เน็ต ผ่านการปฏิบัติจริง ตั้งแต่การเขียนแท็กแรก จนถึงการประกอบโครงสร้างหน้าเว็บสมบูรณ์แบบ
                </p>
              </div>

              {/* Reward Rules Callout */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/40 space-y-2 text-xs font-thai">
                <div className="flex items-center gap-2 text-amber-400 font-bold font-cyber text-sm">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>กติกาการเก็บเลเวลและถ้วยรางวัล:</span>
                </div>
                <ul className="space-y-1 text-slate-300 pl-5 list-disc">
                  <li>จบ 1 บทเรียน &rarr; ได้รับ <strong className="text-amber-300">1 เหรียญรางวัล</strong> และ <strong className="text-cyan-300">+100 เลเวล</strong></li>
                  <li>จบครบ 8 บทเรียน (8 เหรียญ) &rarr; รวมกลายเป็น <strong className="text-amber-400">1 ถ้วยสำเร็จรายวิชา</strong> และได้ <strong className="text-amber-300">800 เลเวลเต็ม (MAX)</strong></li>
                  <li>สามารถกดติดตามความคืบหน้าและเหรียญของตนเองได้ที่หน้าโปรไฟล์</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                {(() => {
                  const activeLesson = lessons.find((l) => {
                    const isAvail = l.lesson_number <= 2 || l.is_published;
                    const sum = summariesMap.get(l.id);
                    return isAvail && !sum?.isCompleted;
                  });

                  if (activeLesson) {
                    const activeSummary = summariesMap.get(activeLesson.id);
                    const label =
                      activeSummary?.status === 'mission_passed_quiz_failed' ||
                      (activeSummary?.missionPassed && activeSummary?.hasMission)
                        ? `ทำแบบทดสอบบทที่ ${activeLesson.lesson_number} ต่อ`
                        : `เริ่มเรียนรู้บทที่ ${activeLesson.lesson_number} ทันที`;
                    const url = activeSummary?.actionButtonUrl || `/learn/${activeLesson.id}`;
                    return (
                      <Link
                        href={url}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-cyber font-bold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer"
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
                      className="px-6 py-3 rounded-xl bg-slate-900 border border-amber-500/60 hover:bg-amber-950/40 text-amber-300 font-cyber font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>ทบทวนเนื้อหาบทเรียน</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  );
                })()}

                <Link
                  href="/profile"
                  className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-cyber font-bold text-xs tracking-wider uppercase hover:border-cyan-400 hover:text-white transition-all flex items-center gap-2"
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>ดูเหรียญและเลเวลในโปรไฟล์</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 8 LESSONS SYLLABUS GRID */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xl font-cyber font-bold tracking-wide text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span>โครงสร้างเนื้อหา 8 บทเรียน (8 Lessons Syllabus)</span>
              </h3>
              <p className="text-xs font-thai text-slate-400 mt-0.5">
                บทเรียนแต่ละบทถูกออกแบบมาเป็นเควสต์ย่อย นักเรียนจะได้ลงมือศึกษาผ่านสไลด์และทำแบบทดสอบจริง
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 px-3 py-1 rounded bg-cyan-950/80 border border-cyan-500/40">
              8 LESSONS TOTAL
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {lessons.map((lesson) => {
              const isAvailable = lesson.lesson_number <= 8 || lesson.is_published;
              const summary = summariesMap.get(lesson.id);
              const isCompleted = summary ? summary.isCompleted : completedLessonIds.includes(lesson.id);
              const isMissionPassed = summary ? summary.missionPassed : false;
              const isQuizFailed = summary?.status === 'mission_passed_quiz_failed';
              const buttonLabel = summary?.actionButtonLabel || 'เริ่มเรียนรู้';
              const buttonUrl = summary?.actionButtonUrl || `/learn/${lesson.id}`;

              return (
                <div
                  key={lesson.id}
                  className={`glass-panel rounded-xl p-5 border flex flex-col justify-between transition-all duration-200 group ${
                    isAvailable
                      ? 'border-cyan-500/60 shadow-[0_0_20px_rgba(0,240,255,0.15)] bg-slate-950/80'
                      : 'border-slate-800/80 bg-slate-950/40 opacity-75'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isAvailable
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-900 text-slate-500 border border-slate-800'
                        }`}
                      >
                        บทที่ {lesson.lesson_number}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        +100 LVL (1 เหรียญ)
                      </span>
                    </div>

                    <h4 className="text-sm font-cyber font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {lesson.title}
                    </h4>

                    <p className="text-xs font-thai text-slate-400 leading-relaxed">
                      {lesson.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      {isCompleted ? (
                        <span className="flex items-center gap-1 text-amber-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ปลดล็อกเหรียญแล้ว</span>
                        </span>
                      ) : isQuizFailed ? (
                        <span className="flex items-center gap-1 text-rose-400 font-bold">
                          <Swords className="w-3.5 h-3.5" />
                          <span>ภารกิจผ่านแล้ว (รอสอบ)</span>
                        </span>
                      ) : isMissionPassed && summary?.hasMission ? (
                        <span className="flex items-center gap-1 text-cyan-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ภารกิจผ่านแล้ว</span>
                        </span>
                      ) : isAvailable ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>เปิดให้เรียนรู้แล้ว</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Lock className="w-3.5 h-3.5" />
                          <span>เควสต์ล็อค</span>
                        </span>
                      )}
                      <span className="text-cyan-400">HTML5</span>
                    </div>

                    {/* Action Button: 'ทบทวนเนื้อหา' if completed, 'ทำแบบทดสอบต่อ' if mission passed, else 'เริ่มเรียนรู้' */}
                    {isCompleted ? (
                      <Link
                        href={buttonUrl}
                        className="w-full py-2.5 rounded-lg bg-slate-900 border border-amber-500/60 hover:bg-amber-950/40 text-amber-300 font-cyber font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>ทบทวนเนื้อหา</span>
                      </Link>
                    ) : isAvailable && (isQuizFailed || (isMissionPassed && summary?.hasMission)) ? (
                      <Link
                        href={buttonUrl}
                        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/70 hover:border-amber-400 text-amber-300 font-cyber font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all cursor-pointer"
                      >
                        <Swords className="w-3.5 h-3.5 text-amber-400" />
                        <span>{buttonLabel}</span>
                      </Link>
                    ) : isAvailable ? (
                      <Link
                        href={buttonUrl}
                        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-cyber font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{buttonLabel}</span>
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-600 font-cyber text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>ยังไม่เปิดให้เรียน</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
