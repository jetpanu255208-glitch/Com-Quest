'use client';

import React, { useState } from 'react';
import { Code2, Award } from 'lucide-react';

interface GameCartridgeProps {
  compact?: boolean;
}

export const GameCartridge: React.FC<GameCartridgeProps> = React.memo(({ compact = true }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative w-full flex items-center justify-center select-none perspective-[1200px] ${
        compact ? 'max-w-[300px] h-[330px] sm:h-[350px]' : 'max-w-[420px] h-[480px] sm:h-[520px]'
      }`}
    >
      {/* Background Ambient Cyber Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-56 h-56 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
        <div className="w-48 h-48 rounded-full bg-amber-500/15 blur-3xl -translate-y-4" />
      </div>

      {/* Decorative Grid Pedestal */}
      <div className="absolute bottom-2 inset-x-6 h-8 bg-gradient-to-t from-cyan-500/10 to-transparent border-b border-cyan-500/30 blur-sm pointer-events-none" />

      {/* SINGLE GAME CARTRIDGE: HTML เบื้องต้น */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          transform: isHovered
            ? 'translateY(-8px) scale(1.03) rotateX(3deg)'
            : 'translateY(0px) scale(1) rotateX(0deg)',
          boxShadow: isHovered
            ? '0 20px 40px -10px rgba(0, 240, 255, 0.4), 0 0 25px 2px rgba(245, 158, 11, 0.3)'
            : '0 15px 30px -10px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 240, 255, 0.2)',
        }}
        className={`relative cursor-pointer rounded-2xl transition-all duration-300 ease-out bg-[#0b1329] border-2 border-cyan-400/70 flex flex-col justify-between overflow-hidden focus:outline-none ${
          compact
            ? 'w-[230px] sm:w-[250px] h-[290px] sm:h-[310px]'
            : 'w-[310px] sm:w-[350px] h-[400px] sm:h-[440px]'
        }`}
      >
        {/* Cartridge Top Grip / Vent Grooves */}
        <div className="w-full bg-[#070b16] px-3.5 pt-2 pb-1.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="w-3.5 sm:w-4 h-1.5 bg-slate-900 border border-slate-700/80 rounded-xs shadow-inner"
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-cyan-400 font-bold tracking-widest uppercase">
              ROM v1.0
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>
        </div>

        {/* Cartridge Main Body & Retro Sticker */}
        <div className="flex-1 p-3 sm:p-3.5 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle circuit line watermark */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none" />

          {/* Sticker Label Container */}
          <div className="relative rounded-xl border border-cyan-400/60 p-3 bg-gradient-to-br from-cyan-950/80 via-slate-950/90 to-blue-950/90 shadow-[inset_0_0_15px_rgba(0,240,255,0.15)] flex flex-col justify-between h-full">
            {/* Top Sticker Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                  OFFICIAL COURSE
                </span>
              </div>
              <span className="text-[9px] font-mono text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40">
                8 QUESTS
              </span>
            </div>

            {/* Central Title: HTML เบื้องต้น */}
            <div className="my-auto py-1.5 text-center space-y-1.5">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-950/90 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)] mx-auto group-hover:scale-110 transition-transform">
                <Code2 className="w-5 h-5 text-cyan-400" />
              </div>

              <div>
                <h3 className="font-pixel text-base sm:text-lg text-white tracking-wider text-glow-cyan">
                  HTML เบื้องต้น
                </h3>
                <p className="text-[11px] font-thai text-cyan-300 font-medium">
                  การเขียนภาษา HTML
                </p>
                <p className="text-[9px] font-mono text-slate-400 tracking-wider">
                  SEMANTIC WEB
                </p>
              </div>
            </div>

            {/* Bottom Sticker Footer: 8 Coins to 1 Trophy */}
            <div className="pt-1.5 border-t border-cyan-500/30 flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-1 text-amber-400">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold text-[10px]">8 เหรียญ &rarr; 1 ถ้วย</span>
              </div>
              <div className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-400 text-cyan-300 font-bold text-[9px]">
                800 EXP MAX
              </div>
            </div>
          </div>
        </div>

        {/* Cartridge Bottom Connector / Gold Contacts */}
        <div className="w-full bg-[#080d1a] border-t border-slate-800 px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-slate-400">QUEST CARTRIDGE</span>
          </div>

          {/* Golden PCB connector pins */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((pin) => (
              <div
                key={pin}
                className="w-1.5 h-2.5 bg-gradient-to-b from-amber-300 to-amber-600 rounded-b-xs opacity-90 shadow-sm"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

GameCartridge.displayName = 'GameCartridge';
