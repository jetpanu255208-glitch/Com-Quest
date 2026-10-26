import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { OFFICIAL_HTML_LESSONS, Lesson } from '@/lib/supabase/types';
import {
  BookOpen,
  ArrowLeft,
  Settings2,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  HelpCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TeacherLessonsListPage() {
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

  // Fetch current lesson configurations from database
  const { data: dbLessons } = await supabase
    .from('lessons')
    .select('*')
    .order('lesson_number', { ascending: true });

  // Merge official catalog with database records
  const lessons: Lesson[] = OFFICIAL_HTML_LESSONS.map((catalogLesson) => {
    const dbItem = dbLessons?.find((l) => l.id === catalogLesson.id);
    return {
      ...catalogLesson,
      title: dbItem?.title || catalogLesson.title,
      google_slides_url: dbItem?.google_slides_url || null,
      is_published: !!dbItem?.is_published,
      quiz_enabled: !!dbItem?.quiz_enabled,
    };
  });

  return (
    <div className="flex flex-col min-h-screen cyber-grid relative transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/teacher"
            className="inline-flex items-center gap-2 text-xs font-cyber text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าแดชบอร์ดครูผู้สอน</span>
          </Link>

          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-amber-950 border border-amber-500/50 text-amber-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            TEACHER LESSON MANAGEMENT
          </span>
        </div>

        {/* Header */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-cyan-500/30 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-bold">
                วิชา: การเขียนภาษา HTML เบื้องต้น
              </span>
              <span className="text-xs font-mono text-slate-400">8 เควสต์บทเรียน</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-cyber font-bold text-white text-glow-cyan">
              ระบบจัดการบทเรียนและสิทธิ์การเรียนรู้ (Lesson Management)
            </h1>
            <p className="text-sm font-thai text-slate-300 max-w-3xl">
              จัดการลิงก์สไลด์ Google Slides & Canva, ควบคุมการเปิด/ปิดให้นักเรียนเข้าเรียน, และเปิด/ปิดแบบทดสอบประจำบท
              เปิดให้ตั้งค่าและใช้งานจริงครบทั้ง <strong className="text-cyan-400">บทเรียนที่ 1 ถึง 8</strong> ในระบบ Com Quest
            </p>
          </div>
        </div>

        {/* 8 Lessons Management List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-lg font-cyber font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>รายการบทเรียนทั้งหมด (8 บทเรียน)</span>
            </h2>
            <span className="text-xs font-mono text-cyan-400">
              บทเรียนที่ 1 ถึง 8: เปิดใช้งานจริงครบทุกบทเรียน
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {lessons.map((lesson) => {
              const isManageable = lesson.lesson_number <= 8 || lesson.is_published;
              const hasSlide = !!lesson.google_slides_url;

              return (
                <div
                  key={lesson.id}
                  className={`glass-panel rounded-xl p-5 border transition-all ${
                    isManageable
                      ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(0,240,255,0.15)] bg-slate-950/80'
                      : 'border-slate-800/80 bg-slate-950/40 opacity-75'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Lesson Number & Details */}
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                            isManageable
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          บทเรียนที่ {lesson.lesson_number}
                        </span>

                        {isManageable ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>เปิดใช้งานระบบเต็มรูปแบบ</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-500 border border-slate-800">
                            ยังไม่ได้ตั้งค่า / ยังไม่เปิดใช้งาน
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-cyber font-bold text-white">
                        {lesson.title}
                      </h3>

                      <p className="text-xs font-thai text-slate-400 leading-relaxed">
                        {lesson.description}
                      </p>
                    </div>

                    {/* Middle: Status Indicators */}
                    <div className="flex flex-wrap lg:flex-col gap-2 min-w-[220px]">
                      {/* Slide status */}
                      <div className="flex items-center justify-between gap-3 text-xs font-thai px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        <span className="text-slate-400">สถานะสไลด์:</span>
                        {isManageable ? (
                          hasSlide ? (
                            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>บันทึกสไลด์แล้ว</span>
                            </span>
                          ) : (
                            <span className="text-amber-400 flex items-center gap-1">
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>สไลด์เริ่มต้นระบบ</span>
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </div>

                      {/* Learning open status */}
                      <div className="flex items-center justify-between gap-3 text-xs font-thai px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        <span className="text-slate-400">เปิดให้นักเรียนเรียน:</span>
                        {isManageable ? (
                          lesson.is_published ? (
                            <span className="text-cyan-400 flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>เปิดแล้ว</span>
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>ปิดอยู่</span>
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500">ยังไม่เปิด</span>
                        )}
                      </div>

                      {/* Quiz open status */}
                      <div className="flex items-center justify-between gap-3 text-xs font-thai px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        <span className="text-slate-400">เปิดแบบทดสอบ (10 ข้อ):</span>
                        {isManageable ? (
                          lesson.quiz_enabled ? (
                            <span className="text-purple-400 flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>เปิดแล้ว</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>ปิดอยู่</span>
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500">ยังไม่เปิด</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Action Button */}
                    <div className="flex items-center gap-2 pt-2 lg:pt-0">
                      {isManageable ? (
                        <Link
                          href={`/teacher/lessons/${lesson.id}`}
                          className="w-full lg:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-cyber font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] flex items-center justify-center gap-2"
                        >
                          <Settings2 className="w-4 h-4" />
                          <span>จัดการบทเรียน</span>
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="w-full lg:w-auto px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-600 text-xs font-cyber cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <span>ยังไม่เปิดใช้งาน</span>
                        </button>
                      )}
                    </div>
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
