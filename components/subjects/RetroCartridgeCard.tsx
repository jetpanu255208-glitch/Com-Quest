'use client';

import React from 'react';
import Link from 'next/link';
import { Lesson } from '@/lib/supabase/types';
import { BookOpen, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

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
      className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 relative select-none ${
        isCleared
          ? 'pixel-8bit-card emerald-cartridge-glow'
          : isUnlocked
          ? 'pixel-8bit-card ready-cartridge-card'
          : 'locked-cartridge-card border-2 opacity-85'
      }`}
    >
      {/* =========================================================================
          TOP: RETRO CASSETTE CARTRIDGE VISUAL
          ========================================================================= */}
      <div className="space-y-3.5">
        <div
          className={`relative w-full aspect-[16/10] rounded-xl overflow-hidden border-2 flex items-center justify-center bg-[#050b18] ${
            isCleared
              ? 'border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              : isUnlocked
              ? 'border-cyan-400/80 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
              : 'border-slate-700/80'
          }`}
        >
          {/* Cassette Tape Image */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <img
              src="/images/retro-cassette-cartridge.png"
              alt={`ตลับบทเรียนที่ ${lesson.lesson_number}: ${lesson.title}`}
              className={`w-full h-full object-cover scale-[1.36] transition-all duration-500 pixelated ${
                isCleared
                  ? 'brightness-110 saturate-125 filter drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                  : isUnlocked
                  ? 'brightness-105 contrast-105'
                  : 'brightness-[0.35] contrast-75 grayscale-[0.4]'
              }`}
            />
          </div>

          {/* ---------------------------------------------------------------------
              STATE A: CLEARED (EMERALD GLEAM & SHIMMER)
              --------------------------------------------------------------------- */}
          {isCleared && (
            <>
              {/* Iridescent Emerald Color Tint */}
              <div className="absolute inset-0 bg-emerald-500/20 mix-blend-color pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 via-transparent to-teal-900/30 pointer-events-none" />

              {/* Shimmer Sweep Animation */}
              <div className="emerald-shimmer-sweep" />

              {/* Twinkling Corner Sparkles */}
              <Sparkles className="w-3.5 h-3.5 text-emerald-300 absolute top-2 right-2 animate-ping pointer-events-none" />
              <div className="w-1.5 h-1.5 rounded-full bg-white absolute bottom-2.5 left-3 animate-pulse pointer-events-none" />

              {/* Status Badge */}
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>เคลียร์แล้ว ★</span>
              </div>
            </>
          )}

          {/* ---------------------------------------------------------------------
              STATE B: UNLOCKED / READY (CLEAN WHITE CARTRIDGE)
              --------------------------------------------------------------------- */}
          {isUnlocked && !isCleared && (
            <>
              {/* Status Badge */}
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-cyan-950/90 border border-cyan-400 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>พร้อมเรียนรู้</span>
              </div>
            </>
          )}

          {/* ---------------------------------------------------------------------
              STATE C: LOCKED (CROSSED CHAINS + CENTER PADLOCK)
              --------------------------------------------------------------------- */}
          {!isUnlocked && (
            <>
              {/* Darkening Veil */}
              <div className="absolute inset-0 bg-[#040817]/70 pointer-events-none z-10" />

              {/* Crossed Diagonal Chains SVG */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-20"
                viewBox="0 0 200 120"
                preserveAspectRatio="none"
              >
                {/* Chain Drop Shadows */}
                <line x1="0" y1="0" x2="200" y2="120" stroke="#000000" strokeWidth="12" opacity="0.9" />
                <line x1="200" y1="0" x2="0" y2="120" stroke="#000000" strokeWidth="12" opacity="0.9" />

                {/* Diagonal 1: Top-Left to Bottom-Right Steel Outer Links */}
                <line
                  x1="0"
                  y1="0"
                  x2="200"
                  y2="120"
                  stroke="#475569"
                  strokeWidth="8"
                  strokeDasharray="12 4"
                />
                <line
                  x1="0"
                  y1="0"
                  x2="200"
                  y2="120"
                  stroke="#94a3b8"
                  strokeWidth="4"
                  strokeDasharray="12 4"
                />
                <line
                  x1="0"
                  y1="0"
                  x2="200"
                  y2="120"
                  stroke="#f1f5f9"
                  strokeWidth="1.5"
                  strokeDasharray="12 4"
                />

                {/* Diagonal 2: Top-Right to Bottom-Left Steel Outer Links */}
                <line
                  x1="200"
                  y1="0"
                  x2="0"
                  y2="120"
                  stroke="#475569"
                  strokeWidth="8"
                  strokeDasharray="12 4"
                />
                <line
                  x1="200"
                  y1="0"
                  x2="0"
                  y2="120"
                  stroke="#94a3b8"
                  strokeWidth="4"
                  strokeDasharray="12 4"
                />
                <line
                  x1="200"
                  y1="0"
                  x2="0"
                  y2="120"
                  stroke="#f1f5f9"
                  strokeWidth="1.5"
                  strokeDasharray="12 4"
                />
              </svg>

              {/* Center Retro Padlock */}
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <div className="relative flex flex-col items-center">
                  {/* Metallic Shackle */}
                  <div className="w-7 h-6 rounded-t-full border-[3.5px] border-slate-300 border-b-0 bg-transparent mb-[-3px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />

                  {/* Padlock Body */}
                  <div className="w-11 h-10 rounded-lg bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 border-2 border-yellow-300 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.6),0_6px_14px_rgba(0,0,0,0.9)]">
                    {/* Keyhole */}
                    <div className="w-2 h-2.5 rounded-full bg-slate-950 flex flex-col items-center justify-center">
                      <div className="w-0.5 h-1.5 bg-slate-950 mt-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="absolute top-2 left-2 z-30 px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-700 text-slate-400 text-[10px] font-mono font-bold flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>ล็อค</span>
              </div>
            </>
          )}
        </div>

        {/* =====================================================================
            MIDDLE: CLEAN ESSENTIAL TEXT
            "บที่ 1 เรื่อง... มีคำอธิบายว่าจะได้เรียนอะไร"
            ===================================================================== */}
        <div className="space-y-1.5 pt-1">
          <h3 className="font-thai text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
            บทที่ {lesson.lesson_number} : {lesson.title}
          </h3>

          <p className="text-xs font-thai text-slate-300 leading-relaxed line-clamp-2 min-h-[36px]">
            {lesson.description}
          </p>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM: CLEAN ACTION BUTTON
          ========================================================================= */}
      <div className="pt-3 mt-2 border-t border-cyan-500/15">
        {isCleared ? (
          <Link
            href={buttonUrl}
            className="pixel-pop-btn w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 hover:from-emerald-900 hover:to-teal-900 border-2 border-emerald-400 text-emerald-300 hover:text-white font-cyber font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>ทบทวนความรู้ (Review)</span>
          </Link>
        ) : isUnlocked ? (
          <Link
            href={buttonUrl}
            className="pixel-pop-btn w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-cyber font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-950" />
            <span>{buttonLabel}</span>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-500 font-thai text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
          >
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span>ต้องผ่านบทที่ {lesson.lesson_number - 1} ก่อน</span>
          </button>
        )}
      </div>
    </div>
  );
};
