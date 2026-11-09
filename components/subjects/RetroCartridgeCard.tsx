'use client';

import React from 'react';
import Link from 'next/link';
import { Lesson } from '@/lib/supabase/types';
import { BookOpen, Lock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface RetroCartridgeCardProps {
  lesson: Lesson;
  isCleared: boolean;
  isUnlocked: boolean;
  buttonLabel?: string;
  buttonUrl: string;
}

export const RetroCartridgeCard: React.FC<RetroCartridgeCardProps> = ({
  lesson,
  isCleared,
  isUnlocked,
  buttonLabel = 'เริ่มเรียนรู้',
  buttonUrl,
}) => {
  return (
    <div
      className={`rounded-xl p-3 sm:p-4 flex flex-col sm:justify-between transition-colors relative select-none bg-[#101827] border ${
        isCleared
          ? 'border-[#263449] hover:border-emerald-500/60'
          : isUnlocked
          ? 'border-[#263449] hover:border-[#00CFEF]/60'
          : 'border-[#1e293b] opacity-65'
      }`}
    >
      {/* =========================================================================
          MOBILE LAYOUT (< sm): HORIZONTAL COMPACT QUEST ROW
          ========================================================================= */}
      <div className="flex sm:hidden items-center gap-3">
        {/* Left: Compact Cassette Thumbnail */}
        <div
          className={`relative w-16 h-14 shrink-0 rounded-lg overflow-hidden border border-[#263449] flex items-center justify-center bg-[#151F30]`}
        >
          <img
            src="/images/retro-cassette-cartridge.png"
            alt={`ตลับบทที่ ${lesson.lesson_number}`}
            className={`w-full h-full object-cover scale-[1.25] pixelated ${
              isCleared
                ? 'brightness-105'
                : isUnlocked
                ? 'brightness-100'
                : 'brightness-40 grayscale'
            }`}
          />

          {!isUnlocked && (
            <div className="absolute inset-0 bg-[#080D1A]/80 flex items-center justify-center z-10">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            </div>
          )}
        </div>

        {/* Right: Info & Action */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-semibold text-[#00CFEF]">
              STAGE 0{lesson.lesson_number}
            </span>
            {isCleared ? (
              <span className="text-emerald-400 text-[10px] font-mono font-medium flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>ผ่านแล้ว</span>
              </span>
            ) : isUnlocked ? (
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                +100 EXP
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-500 shrink-0">ล็อค</span>
            )}
          </div>

          <h3 className="font-thai text-xs font-semibold text-slate-100 truncate leading-tight">
            บทที่ {lesson.lesson_number}: {lesson.title}
          </h3>

          <p className="text-[10px] font-thai text-slate-400 truncate leading-tight">
            {lesson.description}
          </p>

          <div className="pt-0.5">
            {isCleared ? (
              <Link
                href={buttonUrl}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#151F30] hover:bg-[#1e2c44] border border-[#263449] text-slate-200 text-[10px] font-thai font-medium transition-colors"
              >
                <BookOpen className="w-3 h-3 text-emerald-400" />
                <span>ทบทวนความรู้</span>
              </Link>
            ) : isUnlocked ? (
              <Link
                href={buttonUrl}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-[#00CFEF] hover:bg-[#00b8d4] text-[#080D1A] text-[10px] font-thai font-semibold transition-colors"
              >
                <span>{buttonLabel}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-thai text-slate-500">
                <Lock className="w-2.5 h-2.5" />
                <span>ปลดล็อกเมื่อจบบทก่อนหน้า</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP & TABLET LAYOUT (>= sm): ELEGANT MINIMAL CARTRIDGE CARD
          ========================================================================= */}
      <div className="hidden sm:flex flex-col justify-between h-full space-y-3">
        {/* Top: Cassette Artwork */}
        <div
          className={`relative w-full aspect-[16/9.5] rounded-lg overflow-hidden border border-[#263449] flex items-center justify-center bg-[#151F30]`}
        >
          <img
            src="/images/retro-cassette-cartridge.png"
            alt={`ตลับบทเรียนที่ ${lesson.lesson_number}: ${lesson.title}`}
            className={`w-full h-full object-cover scale-[1.25] pixelated ${
              isCleared
                ? 'brightness-105'
                : isUnlocked
                ? 'brightness-100'
                : 'brightness-40 grayscale-[0.5]'
            }`}
          />

          {isCleared && (
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-[#101827]/90 border border-[#263449] text-emerald-400 text-[10px] font-mono font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>ผ่านแล้ว</span>
            </div>
          )}

          {!isUnlocked && (
            <div className="absolute inset-0 bg-[#080D1A]/80 flex items-center justify-center z-20">
              <div className="w-8 h-8 rounded-lg bg-[#101827] border border-[#263449] flex items-center justify-center text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        {/* Text Details */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#00CFEF]">
            <span>STAGE 0{lesson.lesson_number}</span>
            <span className="text-slate-400">+100 EXP</span>
          </div>

          <h3 className="font-thai text-sm font-semibold text-slate-100 group-hover:text-[#00CFEF] transition-colors line-clamp-1">
            บทที่ {lesson.lesson_number}: {lesson.title}
          </h3>

          <p className="text-xs font-thai text-slate-400 leading-relaxed line-clamp-2 min-h-[32px]">
            {lesson.description}
          </p>
        </div>

        {/* Button */}
        <div className="pt-2 border-t border-[#263449]">
          {isCleared ? (
            <Link
              href={buttonUrl}
              className="w-full py-2 px-3 rounded-lg bg-[#151F30] hover:bg-[#1e2c44] border border-[#263449] text-slate-200 font-thai font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>ทบทวนความรู้</span>
            </Link>
          ) : isUnlocked ? (
            <Link
              href={buttonUrl}
              className="w-full py-2 px-3 rounded-lg bg-[#00CFEF] hover:bg-[#00b8d4] text-[#080D1A] font-thai font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{buttonLabel}</span>
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="w-full py-2 px-3 rounded-lg bg-[#151F30]/50 border border-[#1e293b] text-slate-500 font-thai text-xs flex items-center justify-center gap-1 cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>ยังไม่ปลดล็อก</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
