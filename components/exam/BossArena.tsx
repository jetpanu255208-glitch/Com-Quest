'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { PixelCharacter } from '@/components/character/PixelCharacter';
import { CharacterConfig } from '@/lib/supabase/types';

interface BossArenaProps {
  bossName?: string;
  bossHp: number;
  maxHp: number;
  playerConfig?: CharacterConfig | null;
  playerName?: string;
  playerAction?: 'idle' | 'attack' | 'hurt';
  bossAction?: 'idle' | 'attack' | 'hurt' | 'defeated';
  floatingText?: { text: string; type: 'damage' | 'miss' | 'critical' } | null;
  className?: string;
}

export const BossArena: React.FC<BossArenaProps> = ({
  bossName = 'MECHA DRAGON (Lv.99)',
  bossHp,
  maxHp,
  playerConfig,
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
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [floatingText]);

  // HP Percentage calculation
  const hpPercent = Math.max(0, Math.min(100, Math.round((bossHp / maxHp) * 100)));

  // Color bar depending on remaining HP
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
      : bossAction === 'attack'
      ? 'boss-anim-attack'
      : 'boss-anim-idle';

  const playerAnimClass =
    playerAction === 'attack'
      ? 'player-anim-attack'
      : playerAction === 'hurt'
      ? 'player-anim-hurt'
      : '';

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border-2 border-cyan-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)] select-none bg-slate-950 ${className}`}
    >
      {/* 1. Arena Background Image */}
      <div className="relative w-full h-[220px] sm:h-[280px] md:h-[340px] overflow-hidden">
        <Image
          src="/images/boss/pixel-forest-arena.jpg"
          alt="Boss Battle Pixel Forest Arena"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1200px"
          className="object-cover object-bottom filter contrast-105"
        />

        {/* Ambient Dark Overlay for Cyber/RPG contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/50 pointer-events-none" />

        {/* 2. Top HUD: Boss Health & Boss Title */}
        <div className="absolute top-2.5 sm:top-4 left-3 right-3 sm:left-6 sm:right-6 z-20 flex flex-col gap-1 max-w-xl mx-auto">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold tracking-wider text-slate-100">
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-rose-500/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              <span className="text-red-400 font-pixel uppercase tracking-widest text-[11px] sm:text-xs">
                BOSS
              </span>
              <span className="text-slate-200 truncate font-semibold">{bossName}</span>
            </div>
            <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 font-mono text-[11px] sm:text-xs text-cyan-300">
              {bossHp} / {maxHp} HP ({hpPercent}%)
            </div>
          </div>

          {/* Boss HP Bar */}
          <div className="relative w-full h-3 sm:h-4 bg-slate-900/90 rounded-full border border-slate-700/80 overflow-hidden shadow-inner p-0.5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${hpBarColor} transition-all duration-500 ease-out shadow-[0_0_12px_rgba(239,68,68,0.5)]`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* 3. Battle Stage: Player (Left) vs Boss (Right) */}
        <div className="absolute inset-x-0 bottom-3 sm:bottom-5 px-4 sm:px-10 flex items-end justify-between z-10">
          {/* Player Unit */}
          <div className="flex flex-col items-center">
            {/* Player Name Badge */}
            <div className="mb-1 px-2 py-0.5 bg-slate-950/80 backdrop-blur-sm rounded border border-cyan-400/40 text-[10px] sm:text-xs text-cyan-300 font-medium tracking-wide shadow-md">
              {playerName}
            </div>
            {/* Player Character */}
            <div
              className={`transition-transform duration-200 ${playerAnimClass}`}
            >
              <div className="block sm:hidden">
                <PixelCharacter config={playerConfig} size={80} animate={true} />
              </div>
              <div className="hidden sm:block md:hidden">
                <PixelCharacter config={playerConfig} size={100} animate={true} />
              </div>
              <div className="hidden md:block">
                <PixelCharacter config={playerConfig} size={120} animate={true} />
              </div>
            </div>
          </div>

          {/* Floating Damage / Combat Feedback Text */}
          {internalFloatText && (
            <div
              key={internalFloatText.id}
              className={`absolute right-12 sm:right-28 top-16 sm:top-24 z-30 font-black tracking-wider pointer-events-none damage-pop-text text-sm sm:text-2xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] ${
                internalFloatText.type === 'critical'
                  ? 'text-yellow-300 scale-125'
                  : internalFloatText.type === 'miss'
                  ? 'text-slate-400'
                  : 'text-rose-400'
              }`}
            >
              {internalFloatText.text}
            </div>
          )}

          {/* Boss Unit (Three-headed Mecha Dragon) */}
          <div className="relative flex flex-col items-center">
            {/* Slash Hit Animation Overlay */}
            {bossAction === 'hurt' && (
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-1 sm:w-28 sm:h-2 bg-gradient-to-r from-transparent via-cyan-300 to-transparent slash-effect shadow-[0_0_20px_#00cfef]" />
              </div>
            )}

            <div
              className={`relative transition-all duration-300 ${bossAnimClass}`}
              style={{ imageRendering: 'pixelated' }}
            >
              {/* Responsive Boss Sprite */}
              <div className="relative w-28 h-28 sm:w-44 sm:h-44 md:w-56 md:h-56 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                <Image
                  src="/images/boss/mecha-dragon-boss.png"
                  alt="Three Headed Mecha Dragon Boss"
                  fill
                  priority
                  sizes="(max-width: 640px) 112px, (max-width: 768px) 176px, 224px"
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

