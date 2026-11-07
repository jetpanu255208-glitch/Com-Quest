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
      className={`rounded-xl p-3 sm:p-3.5 flex flex-col sm:justify-between transition-all duration-200 relative select-none ${
        isCleared
          ? 'bg-[#06141c]/90 border border-emerald-500/50 shadow-[0_4px_20px_rgba(16,185,129,0.15)]'
          : isUnlocked
          ? 'bg-[#081226]/90 border border-cyan-500/40 shadow-[0_4px_20px_rgba(0,240,255,0.12)]'
          : 'bg-[#060a14]/85 border border-slate-800/80 opacity-75'
      }`}
    >
      {/* =========================================================================
          MOBILE LAYOUT (< sm): HORIZONTAL COMPACT QUEST CARD
          ========================================================================= */}
      <div className="flex sm:hidden items-center gap-3">
        {/* Left: Compact Cassette Thumbnail (w-20 h-16) */}
        <div
          className={`relative w-20 h-16 shrink-0 rounded-lg overflow-hidden border flex items-center justify-center bg-[#050b18] ${
            isCleared
              ? 'border-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              : isUnlocked
              ? 'border-cyan-400/60 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
              : 'border-slate-800'
          }`}
        >
          <img
            src="/images/retro-cassette-cartridge.png"
            alt={`ตลับบทที่ ${lesson.lesson_number}`}
            className={`w-full h-full object-cover scale-[1.3] pixelated ${
              isCleared
                ? 'brightness-110 saturate-125'
                : isUnlocked
                ? 'brightness-105'
                : 'brightness-40 grayscale'
            }`}
          />

          {isCleared && (
            <div className="absolute inset-0 bg-emerald-500/15 mix-blend-color pointer-events-none" />
          )}

          {!isUnlocked && (
            <div className="absolute inset-0 bg-[#040817]/80 flex items-center justify-center z-10">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
          )}
        </div>

        {/* Right: Info & Action in Compact Column */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
              STAGE 0{lesson.lesson_number}
            </span>
            {isCleared ? (
              <span className="px-1.5 py-0.2 rounded bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-[9px] font-mono font-bold flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                <span>ผ่านแล้ว</span>
              </span>
            ) : isUnlocked ? (
              <span className="text-[9px] font-mono text-cyan-300 px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/40 shrink-0">
                +100 EXP
              </span>
            ) : (
              <span className="text-[9px] font-mono text-slate-500 shrink-0">ล็อค</span>
            )}
          </div>

          <h3 className="font-thai text-xs font-bold text-white truncate leading-tight">
            บทที่ {lesson.lesson_number}: {lesson.title}
          </h3>

          <p className="text-[10px] font-thai text-slate-400 truncate leading-tight">
            {lesson.description}
          </p>

          <div className="pt-1">
            {isCleared ? (
              <Link
                href={buttonUrl}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[10px] font-thai font-semibold hover:bg-emerald-900 transition-colors"
              >
                <BookOpen className="w-3 h-3 text-emerald-400" />
                <span>ทบทวนความรู้</span>
              </Link>
            ) : isUnlocked ? (
              <Link
                href={buttonUrl}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-[10px] font-thai font-bold transition-all shadow-sm"
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
          DESKTOP & TABLET LAYOUT (>= sm): ELEGANT BALANCED CARTRIDGE CARD
          ========================================================================= */}
      <div className="hidden sm:flex flex-col justify-between h-full space-y-2.5">
        {/* Top: Cassette Artwork */}
        <div
          className={`relative w-full aspect-[16/9.5] rounded-lg overflow-hidden border flex items-center justify-center bg-[#050b18] ${
            isCleared
              ? 'border-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              : isUnlocked
              ? 'border-cyan-400/60 shadow-[0_0_10px_rgba(0,240,255,0.15)]'
              : 'border-slate-800'
          }`}
        >
          <img
            src="/images/retro-cassette-cartridge.png"
            alt={`ตลับบทเรียนที่ ${lesson.lesson_number}: ${lesson.title}`}
            className={`w-full h-full object-cover scale-[1.3] pixelated ${
              isCleared
                ? 'brightness-110 saturate-125'
                : isUnlocked
                ? 'brightness-105'
                : 'brightness-35 grayscale-[0.5]'
            }`}
          />

          {isCleared && (
            <>
              <div className="absolute inset-0 bg-emerald-500/15 mix-blend-color pointer-events-none" />
              <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-[9px] font-mono font-bold flex items-center gap-1 shadow-sm">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                <span>เคลียร์แล้ว ★</span>
              </div>
            </>
          )}

          {isUnlocked && !isCleared && (
            <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-cyan-300 text-[9px] font-mono font-bold flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
              <span>พร้อมเรียนรู้</span>
            </div>
          )}

          {!isUnlocked && (
            <div className="absolute inset-0 bg-[#040817]/75 flex items-center justify-center z-20">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 shadow-md">
                <Lock className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        {/* Text Details */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400">
            <span>STAGE 0{lesson.lesson_number}</span>
            <span className="text-slate-400">+100 EXP</span>
          </div>

          <h3 className="font-thai text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 leading-snug">
            บทที่ {lesson.lesson_number} : {lesson.title}
          </h3>

          <p className="text-[11px] font-thai text-slate-300 leading-relaxed line-clamp-2 min-h-[32px]">
            {lesson.description}
          </p>
        </div>

        {/* Button */}
        <div className="pt-2 border-t border-slate-800/80">
          {isCleared ? (
            <Link
              href={buttonUrl}
              className="w-full py-2 px-2.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-400 text-emerald-300 hover:text-white font-cyber font-bold text-[11px] uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3 h-3 text-emerald-400" />
              <span>ทบทวนความรู้</span>
            </Link>
          ) : isUnlocked ? (
            <Link
              href={buttonUrl}
              className="w-full py-2 px-2.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 text-slate-950 font-cyber font-bold text-[11px] uppercase flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)] cursor-pointer"
            >
              <BookOpen className="w-3 h-3 text-slate-950" />
              <span>{buttonLabel}</span>
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="w-full py-2 px-2.5 rounded-lg bg-slate-900/50 border border-slate-800 text-slate-500 font-thai text-[11px] font-medium flex items-center justify-center gap-1 cursor-not-allowed"
            >
              <Lock className="w-3 h-3 text-slate-600" />
              <span>ยังไม่ปลดล็อก</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
