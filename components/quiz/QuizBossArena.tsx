'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { PixelCharacter } from '@/components/character/PixelCharacter';
import { CharacterConfig } from '@/lib/supabase/types';
import { Flame, Shield, Sparkles, Swords, Trophy } from 'lucide-react';

interface QuizBossArenaProps {
  bossName?: string;
  bossImage?: string;
  bossHp: number;
  maxHp?: number;
  characterConfig?: CharacterConfig | null;
  playerName?: string;
  playerAction?: 'idle' | 'attack' | 'hurt';
  bossAction?: 'idle' | 'attack' | 'hurt' | 'defeated';
  floatingText?: { text: string; type: 'damage' | 'miss' | 'critical' } | null;
  className?: string;
}

export const QuizBossArena: React.FC<QuizBossArenaProps> = ({
  bossName = 'ปีศาจหีบโค้ด',
  bossImage = '/images/boss/mimic-chest-boss.png',
  bossHp,
  maxHp = 100,
  characterConfig,
  playerName = 'นักเรียน',
  playerAction = 'idle',
  bossAction = 'idle',
  floatingText,
  className = '',
}) => {
  const [internalFloatText, setInternalFloatText] = useState<{
    id: number;
    text: string;
    type: 'damage' | 'miss' | 'critical';
  } | null>(null);

  useEffect(() => {
    if (floatingText) {
      setInternalFloatText({
        id: Date.now(),
        text: floatingText.text,
        type: floatingText.type,
      });
      const timer = setTimeout(() => {
        setInternalFloatText(null);
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [floatingText]);

  const hpPercent = Math.max(0, Math.min(100, Math.round((bossHp / maxHp) * 100)));

  const hpBarColor =
    hpPercent > 50
      ? 'from-emerald-500 via-teal-400 to-cyan-400'
      : hpPercent > 20
      ? 'from-amber-500 via-orange-400 to-yellow-400'
      : 'from-rose-600 via-red-500 to-pink-500';

  const bossAnimClass =
    bossAction === 'defeated'
      ? 'boss-anim-defeated'
      : bossAction === 'hurt'
      ? 'boss-anim-hurt'
      : 'boss-anim-idle';

  const playerAnimClass =
    playerAction === 'attack'
      ? 'player-anim-attack'
      : playerAction === 'hurt'
      ? 'player-anim-hurt'
      : '';

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border-2 border-cyan-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.6)] select-none bg-slate-950 ${className}`}
    >
      {/* 1. Arena Background Image (Pixel Forest) */}
      <div className="relative w-full h-[200px] sm:h-[250px] md:h-[280px] overflow-hidden">
        <Image
          src="/images/boss/pixel-forest-arena.jpg"
          alt="Pixel Forest Boss Battle Arena"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1000px"
          className="object-cover object-bottom"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Ambient Vignette & Fog Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-slate-950/70" />
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40" />

        {/* 2. Top Boss Health Bar HUD */}
        <div className="absolute top-2.5 inset-x-3 sm:inset-x-6 z-20 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
              <span className="font-cyber uppercase tracking-wider text-rose-300 text-xs sm:text-sm font-black">
                {bossName}
              </span>
              <span className="hidden sm:inline-block text-[10px] text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded border border-rose-500/30 font-mono">
                BOSS LV.10
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs sm:text-sm">
              <span className={bossHp <= 50 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                {bossHp} / {maxHp} HP
              </span>
              <span className="text-[11px] text-slate-400 font-normal">({hpPercent}%)</span>
            </div>
          </div>

          {/* HP Bar Container with 50% Threshold Mark */}
          <div className="relative w-full h-4 sm:h-5 bg-slate-950/90 rounded-full overflow-hidden border border-slate-700/80 p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${hpBarColor} transition-all duration-500 ease-out shadow-[0_0_12px_rgba(239,68,68,0.5)]`}
              style={{ width: `${hpPercent}%` }}
            />

            {/* 50% Passing Threshold Notch Indicator */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-300/80 z-10 shadow-[0_0_6px_#fde047]"
              style={{ left: '50%' }}
              title="เกณฑ์ผ่าน (50 HP)"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-300/90 font-mono px-0.5">
            <span className="flex items-center gap-1 text-slate-400">
              <Swords className="w-3 h-3 text-cyan-400" />
              <span>ตีเข้าครั้งละ 10 HP</span>
            </span>
            <span className="flex items-center gap-1 text-amber-300 font-bold">
              <span>เกณฑ์ผ่าน 5 ข้อ (เหลือ 50 HP)</span>
              <span className="text-amber-400 font-mono">⚡</span>
            </span>
          </div>
        </div>

        {/* 3. Battlefield Stage: Player (Left) vs Boss (Right) */}
        <div className="absolute inset-x-4 sm:inset-x-12 bottom-3 flex items-end justify-between z-10">
          {/* Player Side (Left) */}
          <div className="flex flex-col items-center relative">
            {/* Player Character Sprite */}
            <div className={`transition-transform duration-300 ${playerAnimClass}`}>
              <PixelCharacter
                config={characterConfig}
                size={84}
                className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
              />
            </div>

            {/* Player Info Badge */}
            <div className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-cyan-500/40 text-[10px] sm:text-xs font-cyber font-bold text-cyan-300 flex items-center gap-1.5 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="max-w-[100px] truncate">{playerName}</span>
            </div>
          </div>

          {/* Boss Side (Right) */}
          <div className="flex flex-col items-center relative">
            {/* Floating Combat Text Popover */}
            {internalFloatText && (
              <div
                key={internalFloatText.id}
                className="absolute -top-12 z-30 pointer-events-none damage-pop-text text-center font-black font-mono tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] whitespace-nowrap"
              >
                {internalFloatText.type === 'miss' ? (
                  <span className="text-rose-400 text-sm sm:text-base bg-slate-950/90 px-2 py-0.5 rounded border border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.6)]">
                    MISS / ตอบผิด! (0 DMG)
                  </span>
                ) : (
                  <span className="text-amber-300 text-base sm:text-xl bg-slate-950/90 px-2.5 py-0.5 rounded border border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.8)] text-glow-amber">
                    {internalFloatText.text}
                  </span>
                )}
              </div>
            )}

            {/* Boss Sprite */}
            <div
              className={`relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 transition-transform duration-300 ${bossAnimClass}`}
              style={{ imageRendering: 'pixelated' }}
            >
              <Image
                src={bossImage}
                alt={bossName}
                fill
                priority
                className="object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.9)]"
              />
            </div>

            {/* Boss Base Shadow Ground Ellipse */}
            <div className="w-24 sm:w-32 h-3 bg-black/60 rounded-full blur-sm -mt-2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
