'use client';

import React from 'react';
import Link from 'next/link';
import { Lesson } from '@/lib/supabase/types';
import {
  BookOpen,
  Award,
  Trophy,
  CheckCircle2,
  Lock,
  ArrowRight,
  Code2,
  Sparkles,
} from 'lucide-react';

interface LessonSummaryInfo {
  lessonId: string;
  isCompleted: boolean;
  status?: string;
  actionButtonLabel?: string;
  actionButtonUrl?: string;
  missionPassed?: boolean;
  hasMission?: boolean;
}

interface MobileSubjectsViewProps {
  lessons: Lesson[];
  completedCount: number;
  completedLessonNumbers: number[];
  summariesMap: Record<string, LessonSummaryInfo>;
}

export const MobileSubjectsView: React.FC<MobileSubjectsViewProps> = ({
  lessons,
  completedCount,
  completedLessonNumbers,
  summariesMap,
}) => {
  const completedSet = new Set(completedLessonNumbers);

  // Find next active lesson for quick continue
  const nextActiveLesson = lessons.find((l) => {
    const isUnlocked = l.lesson_number === 1 || completedSet.has(l.lesson_number - 1);
    const sum = summariesMap[l.id];
    return isUnlocked && !sum?.isCompleted;
  });

  return (
    <div className="md:hidden space-y-4 pb-24 px-3 sm:px-4 pt-2 select-none">
      {/* =========================================================================
          1. COURSE OVERVIEW CARD (Clean Surface)
          ========================================================================= */}
      <div className="rounded-2xl bg-[#101827] border border-[#263449] p-4 shadow-lg space-y-3">
        {/* Course Header Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-[#151F30] text-[#00CFEF] border border-[#263449] font-semibold">
            HTML5 BEGINNER
          </span>
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-[#151F30] text-emerald-400 border border-[#263449]">
            {completedCount} / 8 บทเรียนเคลียร์แล้ว
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h1 className="font-pixel text-base text-slate-100 tracking-wide leading-snug">
            วิชาการเขียนภาษา HTML เบื้องต้น
          </h1>
          <p className="text-xs font-thai text-slate-400 leading-relaxed">
            หลักสูตรพื้นฐาน 8 เควสต์ (+100 EXP ต่อบท สะสมครบ 8 เหรียญหลอมรวมเป็น 1 ถ้วยสำเร็จรายวิชา)
          </p>
        </div>

        {/* Course Progress Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>PROGRESS</span>
            <span className="text-[#00CFEF] font-semibold">
              {Math.round((completedCount / 8) * 100)}%
            </span>
          </div>
          <div className="w-full bg-[#151F30] rounded-full h-2 p-0.5 border border-[#263449] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-[#00CFEF] rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / 8) * 100}%` }}
            />
          </div>
        </div>

        {/* Quick Continue CTA */}
        {nextActiveLesson && (
          <div className="pt-1">
            <Link
              href={summariesMap[nextActiveLesson.id]?.actionButtonUrl || `/learn/${nextActiveLesson.id}`}
              className="w-full py-2.5 px-3.5 rounded-xl bg-[#00CFEF] hover:bg-[#00b8d4] text-[#080D1A] font-thai font-bold text-xs flex items-center justify-between shadow-[0_0_15px_rgba(0,207,239,0.3)] active:scale-95 transition-all"
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 shrink-0" />
                <span>ลุยต่อ: บทที่ {nextActiveLesson.lesson_number}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* =========================================================================
          2. LESSONS VERTICAL LIST (8 Clean Lesson Cards)
          ========================================================================= */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-thai text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#00CFEF]" />
            <span>โครงสร้างเนื้อหา 8 บทเรียน (8 Lessons)</span>
          </h2>
          <span className="text-[10px] font-mono text-slate-400">
            {completedCount}/8
          </span>
        </div>

        {lessons.map((lesson) => {
          const summary = summariesMap[lesson.id];
          const isCompleted = summary?.isCompleted ?? false;
          const isUnlocked =
            lesson.lesson_number === 1 || completedSet.has(lesson.lesson_number - 1);

          const buttonUrl = isCompleted
            ? `/learn/${lesson.id}?mode=review`
            : summary?.actionButtonUrl || `/learn/${lesson.id}`;

          return (
            <div
              key={lesson.id}
              className={`rounded-2xl p-3 border transition-colors bg-[#101827] ${
                isCompleted
                  ? 'border-[#263449] hover:border-emerald-500/50'
                  : isUnlocked
                  ? 'border-[#263449] hover:border-[#00CFEF]/50'
                  : 'border-slate-800/80 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Cassette / Stage Thumbnail */}
                <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden border border-[#263449] bg-[#151F30] flex items-center justify-center">
                  <img
                    src="/images/retro-cassette-cartridge.png"
                    alt={`บทที่ ${lesson.lesson_number}`}
                    className={`w-full h-full object-cover scale-[1.3] pixelated ${
                      isCompleted
                        ? 'brightness-105'
                        : isUnlocked
                        ? 'brightness-100'
                        : 'brightness-40 grayscale'
                    }`}
                  />
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-[#080D1A]/85 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  )}
                  {isCompleted && (
                    <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono text-[#00CFEF] font-semibold">
                      STAGE 0{lesson.lesson_number}
                    </span>
                    {isCompleted ? (
                      <span className="text-emerald-400 text-[10px] font-mono font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>ผ่านแล้ว</span>
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-slate-400 text-[10px] font-mono">
                        +100 EXP
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px] font-mono">
                        ล็อค
                      </span>
                    )}
                  </div>

                  <h3 className="font-thai text-xs font-semibold text-slate-100 truncate leading-snug">
                    บทที่ {lesson.lesson_number}: {lesson.title}
                  </h3>

                  <p className="text-[10px] font-thai text-slate-400 truncate leading-tight">
                    {lesson.description}
                  </p>

                  {/* Action Button */}
                  <div className="pt-1">
                    {isCompleted ? (
                      <Link
                        href={buttonUrl}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#151F30] hover:bg-[#1d2a40] border border-[#263449] text-slate-200 text-[10px] font-thai font-medium active:scale-95 transition-all"
                      >
                        <BookOpen className="w-3 h-3 text-emerald-400" />
                        <span>ทบทวนความรู้</span>
                      </Link>
                    ) : isUnlocked ? (
                      <Link
                        href={buttonUrl}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00CFEF] hover:bg-[#00b8d4] text-[#080D1A] text-[10px] font-thai font-bold active:scale-95 transition-all shadow-[0_0_10px_rgba(0,207,239,0.3)]"
                      >
                        <span>เริ่มเรียนรู้</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-thai text-slate-500">
                        <Lock className="w-2.5 h-2.5" />
                        <span>ปลดล็อคเมื่อจบบทก่อนหน้า</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

