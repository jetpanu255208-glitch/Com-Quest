'use client';

import React, { useState } from 'react';
import { Code2, Award } from 'lucide-react';

export const GameCartridge: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative w-full max-w-[420px] h-[480px] sm:h-[520px] mx-auto flex items-center justify-center select-none perspective-[1200px]">
      {/* Background Ambient Cyber Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
        <div className="w-64 h-64 rounded-full bg-amber-500/15 blur-3xl -translate-y-8" />
      </div>

      {/* Decorative Grid Pedestal */}
      <div className="absolute bottom-4 inset-x-8 h-12 bg-gradient-to-t from-cyan-500/10 to-transparent border-b border-cyan-500/30 blur-sm pointer-events-none" />

      {/* SINGLE GAME CARTRIDGE: HTML เบื้องต้น */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          transform: isHovered
            ? 'translateY(-14px) scale(1.04) rotateX(4deg)'
            : 'translateY(0px) scale(1) rotateX(0deg)',
          boxShadow: isHovered
            ? '0 25px 50px -10px rgba(0, 240, 255, 0.4), 0 0 35px 2px rgba(245, 158, 11, 0.3)'
            : '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 240, 255, 0.2)',
        }}
        className="relative w-[310px] sm:w-[350px] h-[400px] sm:h-[440px] cursor-pointer rounded-2xl transition-all duration-300 ease-out bg-[#0b1329] border-2 border-cyan-400/70 flex flex-col justify-between overflow-hidden focus:outline-none focus:ring-4 focus:ring-cyan-400/50"
      >
        {/* Cartridge Top Grip / Vent Grooves */}
        <div className="w-full bg-[#070b16] px-4 pt-3 pb-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="w-4 sm:w-5 h-2 bg-slate-900 border border-slate-700/80 rounded-sm shadow-inner"
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-widest uppercase">
              ROM v1.0
            </span>
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
        </div>

        {/* Cartridge Main Body & Retro Sticker */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle circuit line watermark */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Sticker Label Container */}
          <div className="relative rounded-xl border border-cyan-400/60 p-4 sm:p-5 bg-gradient-to-br from-cyan-950/80 via-slate-950/90 to-blue-950/90 shadow-[inset_0_0_20px_rgba(0,240,255,0.15)] flex flex-col justify-between h-full">
            {/* Top Sticker Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                  OFFICIAL COURSE
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40">
                8 LESSONS QUEST
              </span>
            </div>

            {/* Central Title: HTML เบื้องต้น */}
            <div className="my-auto py-3 text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-950/90 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_25px_rgba(0,240,255,0.4)] mx-auto group-hover:scale-110 transition-transform">
                <Code2 className="w-8 h-8 text-cyan-400" />
              </div>

              <div>
                <h3 className="font-pixel text-xl sm:text-2xl text-white tracking-wider text-glow-cyan">
                  HTML เบื้องต้น
                </h3>
                <p className="text-xs font-thai text-cyan-300 font-semibold mt-1">
                  การเขียนภาษา HTML เบื้องต้น
                </p>
                <p className="text-[11px] font-mono text-slate-400 tracking-wider mt-0.5">
                  SEMANTIC WEB ADVENTURE
                </p>
              </div>
            </div>

            {/* Bottom Sticker Footer: 8 Coins to 1 Trophy */}
            <div className="pt-2.5 border-t border-cyan-500/30 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="font-bold">8 เหรียญ &rarr; 1 ถ้วยรางวัล</span>
              </div>
              <div className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-400 text-cyan-300 font-bold">
                +800 LVL MAX
              </div>
            </div>
          </div>
        </div>

        {/* Cartridge Bottom Connector / Gold Contacts */}
        <div className="w-full bg-[#080d1a] border-t border-slate-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-slate-400">QUEST CARTRIDGE</span>
          </div>

          {/* Golden PCB connector pins */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((pin) => (
              <div
                key={pin}
                className="w-1.5 h-3 bg-gradient-to-b from-amber-300 to-amber-600 rounded-b-xs opacity-90 shadow-sm"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
