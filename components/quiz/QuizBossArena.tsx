'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { PixelCharacter } from '@/components/character/PixelCharacter';
import { CharacterConfig } from '@/lib/supabase/types';
import { Swords, Flame, Shield, Zap, Sparkles, Skull } from 'lucide-react';

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
  comboStreak?: number;
  playerHearts?: number;
  maxPlayerHearts?: number;
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
  comboStreak = 0,
  playerHearts = 5,
  maxPlayerHearts = 5,
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
      }, 1350);
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

  const isPlayerStriking = playerAction === 'clash-strike' || playerAction === 'attack';
  const isBossCountering = playerAction === 'knockback' || bossAction === 'clash-strike';
  const isCharging = playerAction === 'clash-charge' || bossAction === 'clash-charge';

  return (
    <div
      className={`arcade-dark-canvas relative w-full flex-1 flex flex-col rounded-2xl overflow-hidden border-2 transition-all duration-200 select-none bg-slate-950 ${
        isPlayerStriking
          ? 'border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.65)] scale-[1.005]'
          : isBossCountering
          ? 'border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.65)] animate-shake'
          : bossAction === 'defeated'
          ? 'border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.6)]'
          : 'border-cyan-500/40 shadow-[0_8px_32px_rgba(0,0,0,0.65)]'
      } ${className}`}
    >
      {/* 1. Arena Stage Viewport (Expands to fill available column height) */}
      <div className="relative w-full flex-1 min-h-[260px] sm:min-h-[320px] md:min-h-[380px] lg:min-h-[420px] xl:min-h-[480px] 2xl:min-h-[540px] overflow-hidden">
        <Image
          src={arenaImage}
          alt={bossName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 900px"
          className={`object-cover object-bottom transition-transform duration-300 ${
            isPlayerStriking ? 'scale-105 brightness-110' : isBossCountering ? 'scale-105 saturate-150' : ''
          }`}
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Ambient Vignette & Dynamic Combat Flash Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/65 pointer-events-none" />

        {/* Hit Screen Flash (Cyan/Gold when player strikes) */}
        {isPlayerStriking && (
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-amber-300/30 to-rose-500/25 pointer-events-none animate-pulse z-10" />
        )}

        {/* Hurt Screen Vignette (Crimson when boss counters) */}
        {isBossCountering && (
          <div className="absolute inset-0 bg-rose-600/30 border-4 border-rose-500/80 pointer-events-none animate-pulse z-10" />
        )}

        {/* 2. Top-Left Player HUD + Combo Badge */}
        <div className="absolute top-2.5 left-3 sm:top-3 sm:left-4 z-20 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-cyan-500/40 shadow-md">
            <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px] font-cyber font-bold text-cyan-200 truncate max-w-[110px]">
              {playerName}
            </span>
            {/* Player Shield Hearts */}
            <div className="flex items-center gap-0.5 ml-1" title="เกราะป้องกันของนักเรียน">
              {Array.from({ length: maxPlayerHearts }).map((_, idx) => (
                <span
                  key={idx}
                  className={`text-[10px] transition-all duration-300 ${
                    idx < playerHearts
                      ? 'text-rose-400 drop-shadow-[0_0_4px_#f43f5e] scale-100'
                      : 'text-slate-700 scale-75 opacity-50'
                  }`}
                >
                  ♥
                </span>
              ))}
            </div>
          </div>

          {/* Combo Streak Badge */}
          {comboStreak >= 2 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-slate-950 font-cyber font-black text-[11px] shadow-[0_0_18px_rgba(245,158,11,0.8)] animate-bounce">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>COMBO x{comboStreak}!</span>
            </div>
          )}
        </div>

        {/* 3. Top-Right Boss Name Tag Badge */}
        <div className="absolute top-2.5 right-3 sm:top-3 sm:right-4 z-20">
          <div className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-xl border border-rose-500/50 shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
            <span
              className={`w-2 h-2 rounded-full ${
                bossAction === 'defeated' ? 'bg-emerald-400' : 'bg-rose-500 animate-ping'
              } inline-block`}
            />
            <div className="flex flex-col items-end">
              <span className="font-cyber uppercase tracking-wider text-rose-300 text-xs sm:text-sm font-black drop-shadow leading-tight">
                {bossName}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                {bossTitle}
              </span>
            </div>
          </div>
        </div>

        {/* ====================================================================
            4. SPECTACULAR COMBAT VISUAL FX OVERLAYS
            ==================================================================== */}

        {/* Charge Aura Effect */}
        {isCharging && (
          <div className="absolute inset-0 z-25 pointer-events-none flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-2 border-cyan-400/70 animate-ping" />
            <div className="px-3 py-1 rounded-full bg-slate-950/90 border border-cyan-400 text-cyan-300 font-cyber font-bold text-xs tracking-widest uppercase shadow-[0_0_20px_#00f0ff]">
              ⚡ CHARGING ATTACK...
            </div>
          </div>
        )}

        {/* PLAYER LASER / LIGHTNING SLASH BEAM ON CORRECT HIT */}
        {isPlayerStriking && (
          <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
            {/* Horizontal Energy Beam from Player to Boss */}
            <div
              className="absolute left-[18%] right-[14%] top-[44%] h-3 sm:h-4 rounded-full bg-gradient-to-r from-cyan-300 via-white to-amber-300 shadow-[0_0_28px_#00f0ff,0_0_50px_#fde047] animate-pulse"
              style={{ transform: 'rotate(-4deg)' }}
            />
            <div
              className="absolute left-[22%] right-[12%] top-[41%] h-1.5 rounded-full bg-white shadow-[0_0_20px_#ffffff]"
              style={{ transform: 'rotate(6deg)' }}
            />

            {/* Impact Burst on Boss (Right Side) */}
            <div className="absolute right-[8%] sm:right-[12%] top-[20%] w-36 h-36 sm:w-48 sm:h-48 lg:w-60 lg:h-60 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-300/80 blur-xl animate-ping" />
              <div className="absolute -inset-3 rounded-full border-4 border-cyan-300/90 animate-ping" />
              {/* Diagonal Sword/Laser Cross Slashes */}
              <div className="absolute w-36 h-1.5 bg-white rounded-full rotate-45 shadow-[0_0_20px_#fde047]" />
              <div className="absolute w-36 h-1.5 bg-cyan-200 rounded-full -rotate-45 shadow-[0_0_20px_#00f0ff]" />
              <Zap className="w-14 h-14 text-amber-200 fill-amber-300 drop-shadow-[0_0_25px_#fde047] animate-bounce" />
            </div>
          </div>
        )}

        {/* BOSS DARK COUNTER-SHOCKWAVE ON WRONG / TIMEOUT */}
        {isBossCountering && (
          <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
            {/* Crimson Dark Energy Wave from Boss to Player */}
            <div
              className="absolute left-[15%] right-[18%] top-[46%] h-3 sm:h-4 rounded-full bg-gradient-to-l from-rose-500 via-red-400 to-amber-500 shadow-[0_0_30px_#f43f5e] animate-pulse"
              style={{ transform: 'rotate(4deg)' }}
            />
            {/* Impact Burst on Player (Left Side) */}
            <div className="absolute left-[10%] sm:left-[14%] top-[28%] w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-rose-600/80 blur-xl animate-ping" />
              <div className="absolute -inset-2 rounded-full border-4 border-rose-400/90 animate-ping" />
              <div className="text-4xl sm:text-5xl animate-bounce drop-shadow-[0_0_20px_#f43f5e]">
                💥
              </div>
            </div>
          </div>
        )}

        {/* BOSS DEFEATED SPECTACULAR EXPLOSION OVERLAY */}
        {bossAction === 'defeated' && (
          <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
            {/* Boss side explosion rings */}
            <div className="absolute right-4 sm:right-6 md:right-8 lg:right-10 bottom-12 sm:bottom-14 lg:bottom-16 xl:bottom-18 flex items-center justify-center w-40 h-40 sm:w-56 sm:h-56 lg:w-72 lg:h-72 xl:w-88 xl:h-88 2xl:w-96 2xl:h-96">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-yellow-300 opacity-90 blur-xl animate-ping" />
              <div className="absolute -inset-6 rounded-full border-4 border-yellow-300 explosion-burst-ring" />
              <div className="absolute inset-2 rounded-full bg-white opacity-95 blur-md animate-pulse" />
              <div className="absolute text-5xl sm:text-6xl lg:text-7xl animate-bounce">💥</div>
            </div>

            {/* Center Victory Banner */}
            <div className="px-4 py-2 rounded-2xl bg-slate-950/95 border-2 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.8)] flex items-center gap-2 animate-bounce">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="font-pixel text-xs sm:text-sm text-amber-300 tracking-wider uppercase">
                BOSS DEFEATED! ปราบบอสสำเร็จ!
              </span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        )}

        {/* 5. Battlefield Stage: Player (Left) vs Boss (Right) */}
        <div className="absolute inset-x-5 sm:inset-x-8 md:inset-x-10 lg:inset-x-14 bottom-12 sm:bottom-14 lg:bottom-16 xl:bottom-18 flex items-end justify-between z-20 pointer-events-none">
          {/* Player Side (Left) */}
          <div className="flex flex-col items-center relative pointer-events-auto">
            {/* Aura ring under player when combo >= 2 */}
            {comboStreak >= 2 && (
              <div className="absolute -inset-3 sm:-inset-4 rounded-full bg-cyan-400/25 blur-md animate-pulse pointer-events-none" />
            )}
            <div className={`transition-transform duration-300 ${playerAnimClass}`}>
              <PixelCharacter
                config={characterConfig}
                className="w-16 sm:w-20 md:w-24 lg:w-28 xl:w-32 2xl:w-36 drop-shadow-[0_8px_18px_rgba(0,0,0,0.9)] transition-all duration-300"
              />
            </div>

            {/* Player Ground Shadow & Label */}
            <div className="w-14 sm:w-18 md:w-22 lg:w-26 xl:w-30 2xl:w-34 h-2 sm:h-2.5 lg:h-3 bg-cyan-400/35 rounded-full blur-xs -mt-1 pointer-events-none transition-all duration-300" />
          </div>

          {/* Floating Combat Text Popover in Center/Boss Area */}
          {internalFloatText && (
            <div
              key={internalFloatText.id}
              className="absolute left-1/2 -translate-x-1/2 top-2 sm:top-4 z-40 pointer-events-none damage-pop-text text-center font-black font-mono tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] whitespace-nowrap"
            >
              {internalFloatText.type === 'miss' ? (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-rose-200 text-xs sm:text-sm bg-rose-950/95 px-3.5 py-1 rounded-xl border-2 border-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.85)] font-black flex items-center gap-1.5">
                    <Skull className="w-4 h-4 text-rose-400" />
                    <span>{internalFloatText.text}</span>
                  </span>
                </div>
              ) : internalFloatText.type === 'critical' ? (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] font-pixel text-cyan-300 uppercase tracking-widest drop-shadow">
                    ⚡ CRITICAL COMBO x{comboStreak}! ⚡
                  </span>
                  <span className="text-amber-200 text-base sm:text-xl bg-gradient-to-r from-amber-950/95 via-orange-950/95 to-amber-950/95 px-4 py-1 rounded-xl border-2 border-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.95)] text-glow-amber font-black">
                    {internalFloatText.text}
                  </span>
                </div>
              ) : (
                <span className="text-amber-300 text-sm sm:text-lg bg-slate-950/95 px-3.5 py-1 rounded-xl border-2 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.9)] text-glow-amber font-black">
                  {internalFloatText.text}
                </span>
              )}
            </div>
          )}

          {/* Boss Side (Right) - Giant Imposing Boss */}
          <div className="flex flex-col items-center relative pointer-events-auto">
            {/* Boss Sprite with Aura & Hit Flash */}
            <div
              className={`relative w-32 h-32 sm:w-44 sm:h-44 md:w-56 md:h-56 lg:w-68 lg:h-68 xl:w-80 xl:h-80 2xl:w-92 2xl:h-92 transition-all duration-300 ${bossAnimClass} ${
                bossAction === 'hurt' ? 'brightness-200 contrast-150 scale-95' : ''
              }`}
              style={{
                imageRendering: 'pixelated',
                filter: bossAction === 'defeated' ? 'grayscale(1) opacity(0.35)' : auraFilter,
              }}
            >
              <Image
                src={bossImage}
                alt={bossName}
                fill
                priority
                sizes="(max-width: 640px) 140px, (max-width: 768px) 180px, (max-width: 1024px) 230px, (max-width: 1280px) 280px, (max-width: 1536px) 330px, 380px"
                className="object-contain"
              />
            </div>

            {/* Boss Base Shadow Ground Ellipse */}
            <div className="w-28 sm:w-40 md:w-52 lg:w-64 xl:w-76 2xl:w-88 h-3.5 sm:h-4 lg:h-5 bg-black/75 rounded-full blur-sm -mt-2 pointer-events-none transition-all duration-300" />
          </div>
        </div>

        {/* 6. Bottom Boss Health Bar HUD (หลอดเลือดบอส) */}
        <div className="absolute bottom-0 inset-x-0 z-20 bg-slate-950/92 backdrop-blur-md border-t border-cyan-500/30 px-3 sm:px-4 py-1.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Swords className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                โจมตีครั้งละ{' '}
                <strong className="text-cyan-300">-{damagePerHit.toLocaleString()} HP</strong>
              </span>
              {isPassed && (
                <span className="ml-1 px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-[10px]">
                  ✓ เลือดต่ำกว่าเกณฑ์ผ่านแล้ว!
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className={isPassed ? 'text-emerald-400 font-bold' : 'text-rose-300 font-bold'}>
                {bossHp.toLocaleString()} / {maxHp.toLocaleString()} HP
              </span>
              <span className="text-[10px] text-slate-400 font-normal">({hpPercent}%)</span>
            </div>
          </div>

          {/* HP Bar Container with Passing Threshold Notch */}
          <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700/80 p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${hpBarColor} transition-all duration-500 ease-out shadow-[0_0_12px_rgba(239,68,68,0.5)]`}
              style={{ width: `${hpPercent}%` }}
            />
            {passingPercent > 0 && passingPercent < 100 && (
              <div
                className="absolute top-0 bottom-0 w-1 bg-amber-300 z-10 shadow-[0_0_8px_#fde047]"
                style={{ left: `${passingPercent}%` }}
                title={`เกณฑ์ผ่าน (${passingScore} ข้อ / เหลือ ≤ ${passingRemainingHp.toLocaleString()} HP)`}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400 font-mono leading-none">
            <span>BOSS HP</span>
            <span className="text-amber-300 font-bold flex items-center gap-1">
              <span>⚡ เกณฑ์ชนะบอส: ตอบถูก {passingScore}/10 ข้อ (เหลือ ≤ {passingRemainingHp.toLocaleString()} HP)</span>
            </span>
            <span>0 HP</span>
          </div>
        </div>
      </div>
    </div>
  );
};
