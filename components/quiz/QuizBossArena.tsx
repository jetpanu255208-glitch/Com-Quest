'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { PixelCharacter } from '@/components/character/PixelCharacter';
import { CharacterConfig } from '@/lib/supabase/types';
import { Swords } from 'lucide-react';

export type PlayerCombatAction =
  | 'idle'
  | 'clash-charge'
  | 'clash-strike'
  | 'knockback'
  | 'attack'
  | 'hurt';

export type BossCombatAction =
  | 'idle'
  | 'clash-charge'
  | 'clash-strike'
  | 'hurt'
  | 'defeated';

interface QuizBossArenaProps {
  bossName?: string;
  bossTitle?: string;
  bossImage?: string;
  arenaImage?: string;
  bossHp: number;
  maxHp?: number;
  damagePerHit?: number;
  passingScore?: number;
  auraFilter?: string;
  characterConfig?: CharacterConfig | null;
  playerName?: string;
  playerAction?: PlayerCombatAction;
  bossAction?: BossCombatAction;
  floatingText?: { text: string; type: 'damage' | 'miss' | 'critical' } | null;
  className?: string;
}

export const QuizBossArena: React.FC<QuizBossArenaProps> = ({
  bossName = 'ปีศาจหีบโค้ด',
  bossTitle = 'BOSS LV.10',
  bossImage = '/images/boss/mimic-chest-boss.png',
  arenaImage = '/images/boss/pixel-forest-arena.jpg',
  bossHp,
  maxHp = 100,
  damagePerHit = 10,
  passingScore = 5,
  auraFilter = 'drop-shadow(0 0 16px rgba(239, 68, 68, 0.75))',
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
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [floatingText]);

  const hpPercent = Math.max(0, Math.min(100, Math.round((bossHp / maxHp) * 100)));

  // Passing criteria HP threshold calculation
  const passingRemainingHp = Math.max(0, maxHp - passingScore * damagePerHit);
  const passingPercent = Math.round((passingRemainingHp / maxHp) * 100);
  const isPassed = bossHp <= passingRemainingHp;

  const hpBarColor =
    hpPercent > 50
      ? 'from-emerald-500 via-teal-400 to-cyan-400'
      : hpPercent > 20
      ? 'from-amber-500 via-orange-400 to-yellow-400'
      : 'from-rose-600 via-red-500 to-pink-500';

  const bossAnimClass =
    bossAction === 'defeated'
      ? 'boss-anim-defeated'
      : bossAction === 'clash-charge'
      ? 'boss-anim-clash-charge'
      : bossAction === 'clash-strike'
      ? 'boss-anim-clash-strike'
      : bossAction === 'hurt'
      ? 'boss-anim-hurt'
      : 'boss-anim-idle';

  const playerAnimClass =
    playerAction === 'clash-charge'
      ? 'player-anim-clash-charge'
      : playerAction === 'clash-strike' || playerAction === 'attack'
      ? 'player-anim-clash-strike'
      : playerAction === 'knockback'
      ? 'player-anim-knockback'
      : playerAction === 'hurt'
      ? 'player-anim-hurt'
      : '';

  const isClashing =
    playerAction === 'clash-charge' ||
    playerAction === 'clash-strike' ||
    bossAction === 'clash-charge' ||
    bossAction === 'clash-strike';

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border-2 border-cyan-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.6)] select-none bg-slate-950 ${className}`}
    >
      {/* 1. Arena Background Image */}
      <div className="relative w-full h-[240px] sm:h-[280px] md:h-[320px] lg:h-[350px] overflow-hidden">
        <Image
          src={arenaImage}
          alt={bossName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1000px"
          className="object-cover object-bottom"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Ambient Vignette & Dark Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-slate-950/60 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40" />

        {/* 2. Top-Right Boss Name Tag Badge (Per wireframe) */}
        <div className="absolute top-3 right-3 sm:top-3.5 sm:right-4 z-20">
          <div className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-rose-500/40 shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
            <div className="flex flex-col items-end">
              <span className="font-cyber uppercase tracking-wider text-rose-300 text-xs sm:text-sm font-black drop-shadow">
                {bossName}
              </span>
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                {bossTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Top-Left Stage Tag */}
        <div className="absolute top-3 left-3 sm:top-3.5 sm:left-4 z-20">
          <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cyan-500/30 text-[10px] sm:text-xs text-cyan-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>ลานประลองบอส</span>
          </div>
        </div>

        {/* 3. Center Clash FX / Slash burst */}
        {playerAction === 'clash-strike' && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-cyan-400/80 blur-lg animate-ping" />
            <div className="absolute text-5xl font-black text-amber-300 animate-bounce drop-shadow-[0_0_25px_#fde047]">
              ⚡
            </div>
          </div>
        )}

        {/* Center Clash Miss/Counter FX */}
        {playerAction === 'knockback' && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-rose-600/80 blur-md animate-ping" />
            <div className="absolute text-4xl text-rose-400 font-black animate-pulse">
              💥
            </div>
          </div>
        )}

        {/* Boss Defeated Explosion Overlay */}
        {bossAction === 'defeated' && (
          <div className="absolute right-4 sm:right-12 bottom-12 z-30 pointer-events-none flex items-center justify-center w-36 h-36">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-yellow-300 opacity-90 blur-xl animate-ping" />
            <div className="absolute -inset-6 rounded-full border-4 border-yellow-300 explosion-burst-ring" />
            <div className="absolute inset-2 rounded-full bg-white opacity-95 blur-md animate-pulse" />
            <div className="absolute text-6xl animate-bounce">💥</div>
          </div>
        )}

        {/* 4. Battlefield Stage: Player (Left) vs Boss (Right) */}
        <div className="absolute inset-x-4 sm:inset-x-10 bottom-16 sm:bottom-16 flex items-end justify-between z-10">
          {/* Player Side (Left) */}
          <div className="flex flex-col items-center relative">
            <div className={`transition-transform duration-300 ${playerAnimClass}`}>
              <PixelCharacter
                config={characterConfig}
                size={84}
                className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
              />
            </div>

            {/* Player Info Badge */}
            <div className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-950/85 border border-cyan-500/40 text-[10px] sm:text-xs font-cyber font-bold text-cyan-300 flex items-center gap-1.5 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="max-w-[100px] truncate">{playerName}</span>
            </div>
          </div>

          {/* Floating Combat Text Popover in Center/Boss Area */}
          {internalFloatText && (
            <div
              key={internalFloatText.id}
              className="absolute left-1/2 -translate-x-1/2 top-4 sm:top-8 z-30 pointer-events-none damage-pop-text text-center font-black font-mono tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] whitespace-nowrap"
            >
              {internalFloatText.type === 'miss' ? (
                <span className="text-rose-300 text-sm sm:text-base bg-slate-950/95 px-3 py-1 rounded-xl border-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.7)] font-black">
                  MISS! (ตอบผิด / โดนบอสตี!)
                </span>
              ) : (
                <span className="text-amber-300 text-base sm:text-xl bg-slate-950/95 px-3 py-1 rounded-xl border-2 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.9)] text-glow-amber font-black">
                  {internalFloatText.text}
                </span>
              )}
            </div>
          )}

          {/* Boss Side (Right) */}
          <div className="flex flex-col items-center relative">
            {/* Boss Sprite with Aura */}
            <div
              className={`relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 transition-transform duration-300 ${bossAnimClass}`}
              style={{
                imageRendering: 'pixelated',
                filter: bossAction === 'defeated' ? undefined : auraFilter,
              }}
            >
              <Image
                src={bossImage}
                alt={bossName}
                fill
                priority
                className="object-contain"
              />
            </div>

            {/* Boss Base Shadow Ground Ellipse */}
            <div className="w-24 sm:w-32 h-3 bg-black/60 rounded-full blur-sm -mt-2 pointer-events-none" />
          </div>
        </div>

        {/* 5. Bottom Boss Health Bar HUD (Per wireframe: หลอดเลือดบอส) */}
        <div className="absolute bottom-0 inset-x-0 z-20 bg-slate-950/90 backdrop-blur-md border-t border-cyan-500/30 px-3 sm:px-5 py-2 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <div className="flex items-center gap-1.5 text-slate-300 text-[11px] sm:text-xs">
              <Swords className="w-3.5 h-3.5 text-cyan-400" />
              <span>ตีเข้าครั้งละ <strong className="text-cyan-300">-{damagePerHit.toLocaleString()} HP</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <span className={isPassed ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                {bossHp.toLocaleString()} / {maxHp.toLocaleString()} HP
              </span>
              <span className="text-[11px] text-slate-400 font-normal">({hpPercent}%)</span>
            </div>
          </div>

          {/* HP Bar Container with Passing Threshold Notch */}
          <div className="relative w-full h-3.5 sm:h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700/80 p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${hpBarColor} transition-all duration-500 ease-out shadow-[0_0_12px_rgba(239,68,68,0.5)]`}
              style={{ width: `${hpPercent}%` }}
            />
            {passingPercent > 0 && passingPercent < 100 && (
              <div
                className="absolute top-0 bottom-0 w-1 bg-amber-300 z-10 shadow-[0_0_8px_#fde047]"
                style={{ left: `${passingPercent}%` }}
                title={`เกณฑ์ผ่าน (${passingScore} ข้อ / เหลือ ${passingRemainingHp.toLocaleString()} HP)`}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>เต็ม ({maxHp.toLocaleString()} HP)</span>
            <span className="text-amber-300 font-bold flex items-center gap-1">
              <span>เกณฑ์ผ่าน {passingScore} ข้อ (เหลือ ≤ {passingRemainingHp.toLocaleString()} HP)</span>
              <span className="text-amber-400">⚡</span>
            </span>
            <span>0 HP</span>
          </div>
        </div>
      </div>
    </div>
  );
};
