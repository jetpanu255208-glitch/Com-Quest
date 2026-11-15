'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CharacterConfig } from '@/lib/supabase/types';
import { SuperHtmlRunnerGame } from './SuperHtmlRunnerGame';
import { PcShootingGame } from './PcShootingGame';
import { PixelCharacter } from '@/components/character/PixelCharacter';
import {
  Gamepad2,
  BookOpen,
  ArrowRight,
  Shield,
  Zap,
  Flame,
  Lock,
  Trophy,
  Sparkles,
  LogOut,
  ChevronRight,
  Play,
  Crosshair,
  Heart,
  Crown,
} from 'lucide-react';
import { playSelectSound, stopAllSounds } from '@/lib/sound/sound-manager';

interface SpecialGamesHubProps {
  completedLessonsCount: number;
  totalLessonsCount?: number;
  isTeacher?: boolean;
  characterConfig?: CharacterConfig | null;
  playerName?: string;
}

export const SpecialGamesHub: React.FC<SpecialGamesHubProps> = ({
  completedLessonsCount,
  totalLessonsCount = 8,
  isTeacher = false,
  characterConfig,
  playerName = 'Adventurer',
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check URL param or default to 'menu'
  const initialGame = searchParams?.get('game');
  const [activeGame, setActiveGame] = useState<'menu' | 'runner' | 'shooter'>(
    initialGame === 'runner' ? 'runner' : initialGame === 'shooter' ? 'shooter' : 'menu'
  );

  const isUnlockedByProgress = completedLessonsCount >= totalLessonsCount || isTeacher;
  const [practiceUnlocked, setPracticeUnlocked] = useState(false);
  const canPlay = isUnlockedByProgress || practiceUnlocked;

  useEffect(() => {
    return () => {
      stopAllSounds();
    };
  }, []);

  const handleSelectGame = (game: 'runner' | 'shooter') => {
    playSelectSound();
    setActiveGame(game);
  };

  const handleBackToMenu = () => {
    playSelectSound();
    setActiveGame('menu');
  };

  const handleExitToSubjects = () => {
    playSelectSound();
    router.push('/subjects');
  };

  // If user selected Jump Head Quiz
  if (activeGame === 'runner') {
    return (
      <SuperHtmlRunnerGame
        completedLessonsCount={completedLessonsCount}
        totalLessonsCount={totalLessonsCount}
        isTeacher={isTeacher}
        characterConfig={characterConfig}
        playerName={playerName}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  // If user selected PC Shooting
  if (activeGame === 'shooter') {
    return (
      <PcShootingGame
        characterConfig={characterConfig}
        playerName={playerName}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  // ============================================================================
  // SPECIAL GAMES SELECTION PAGE (RETRO 8-BIT CARTRIDGES)
  // ============================================================================
  return (
    <div className="fixed inset-0 w-screen h-[100dvh] flex flex-col bg-[#050914] text-white select-none overflow-y-auto overflow-x-hidden">
      {/* 1. TOP HEADER */}
      <header className="h-14 sm:h-16 px-4 sm:px-8 bg-[#080e1e]/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,207,239,0.3)]">
            <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-cyber font-bold text-white tracking-wide flex items-center gap-2">
              <span>SPECIAL GAMES ARCADE</span>
              <span className="hidden md:inline px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                8-BIT RETRO HUB
              </span>
            </h1>
            <p className="text-[11px] font-thai text-slate-400">
              ศูนย์รวมมินิเกมพิเศษประจำบทเรียน Com Quest
            </p>
          </div>
        </div>

        {/* Player Profile & Exit */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Player Mini Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80">
            <PixelCharacter config={characterConfig} size={28} />
            <span className="text-xs font-mono font-bold text-cyan-300 max-w-[100px] truncate">
              {playerName}
            </span>
          </div>

          <button
            type="button"
            onClick={handleExitToSubjects}
            className="px-3 sm:px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-white font-thai font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">กลับหน้าวิชาเรียน</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN SELECTION CONTENT */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 md:p-8 flex flex-col justify-center items-center">
        {/* Title & Unlock Progress */}
        <div className="text-center space-y-2 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SELECT YOUR GAME CARTRIDGE • เลือกตลับเกม</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-cyber font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-amber-300 tracking-wider">
            RETRO GAME CARTRIDGES
          </h2>

          <p className="text-xs sm:text-sm font-thai text-slate-300 max-w-lg mx-auto">
            เลือกตลับเกมที่ต้องการเล่น เสียบตลับเข้าเครื่องแล้วออกลุยได้เลย!
          </p>

          {!isUnlockedByProgress && !practiceUnlocked && (
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-thai font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>สถานะ: ผ่านแล้ว {completedLessonsCount}/{totalLessonsCount} บทเรียน (โหมดทดลองเล่นเปิดใช้งานอยู่)</span>
              </span>
            </div>
          )}
        </div>

        {/* 3. DUAL CARTRIDGE DISPLAY (RESPONSIVE GRID) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-4xl">
          {/* =================================================================
              CARTRIDGE 1: JUMP HEAD QUIZ (Super HTML Tag Runner)
              ================================================================= */}
          <div
            onClick={() => handleSelectGame('runner')}
            className="group relative rounded-3xl bg-[#091024] border-2 border-cyan-400/60 hover:border-cyan-300 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_35px_rgba(0,207,239,0.35)] hover:-translate-y-1 cursor-pointer select-none"
          >
            {/* Cartridge Top Grip Ridges */}
            <div className="flex justify-center gap-1.5 mb-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="w-5 h-1.5 rounded-full bg-slate-800/90 border border-slate-700/60" />
              ))}
            </div>

            {/* Cartridge Label Sticker Container */}
            <div className="rounded-2xl bg-gradient-to-b from-[#0b1b36] to-[#040814] border border-cyan-500/30 p-4 space-y-3 relative overflow-hidden">
              {/* Sticker Header Badge */}
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <span className="font-mono text-[10px] font-bold text-cyan-400 tracking-wider">
                  ROM-01 • HTML RUNNER
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-amber-300">
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                  <span>3 HEARTS</span>
                </span>
              </div>

              {/* Pixel Art Illustration Box */}
              <div className="h-32 sm:h-36 rounded-xl bg-gradient-to-b from-[#102447] via-[#09152b] to-[#040a16] border border-cyan-500/30 flex items-center justify-center relative overflow-hidden group-hover:scale-102 transition-transform">
                {/* Background Pixel Clouds */}
                <div className="absolute top-3 left-4 w-12 h-3.5 rounded-full bg-white/20" />
                <div className="absolute top-6 right-6 w-14 h-4 rounded-full bg-white/15" />

                {/* 3 Floating Question Blocks */}
                <div className="flex items-center gap-3 z-10">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-amber-200 flex items-center justify-center font-mono font-bold text-slate-950 text-xs shadow-md">
                    [A]
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 border-2 border-yellow-100 flex items-center justify-center font-mono font-black text-slate-950 text-sm shadow-[0_0_15px_rgba(251,191,36,0.5)] -translate-y-2">
                    ?
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-amber-200 flex items-center justify-center font-mono font-bold text-slate-950 text-xs shadow-md">
                    [C]
                  </div>
                </div>

                {/* Ground */}
                <div className="absolute bottom-0 inset-x-0 h-4 bg-[#1e293b] border-t-2 border-cyan-400" />
              </div>

              {/* Game Title & Details */}
              <div>
                <h3 className="text-lg sm:text-xl font-cyber font-bold text-cyan-300 group-hover:text-cyan-200 transition-colors">
                  JUMP HEAD QUIZ
                </h3>
                <p className="text-xs font-thai font-semibold text-amber-300 mb-1">
                  โหม่งบล็อกตอบคำถาม HTML5
                </p>
                <p className="text-[11px] font-thai text-slate-400 leading-relaxed">
                  วิ่งกระโดดโหม่งกล่องคำตอบ HTML 5 ด่านย่อยสุดมันส์ มีระบบ 3 หัวใจและตัวช่วยคำใบ้แท็ก
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-thai text-cyan-300">
                  5 ด่าน Checkpoint
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-thai text-slate-300">
                  รองรับจอมือถือ & Game Boy
                </span>
              </div>
            </div>

            {/* Cartridge Bottom Gold Pins Notch */}
            <div className="pt-4 flex items-center justify-between">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="w-2.5 h-3 bg-gradient-to-b from-amber-400 to-amber-600 rounded-sm" />
                ))}
              </div>

              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 group-hover:from-cyan-300 group-hover:to-blue-400 text-slate-950 font-thai font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,207,239,0.4)] transition-all">
                <span>กดเพื่อเล่นเกม</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* =================================================================
              CARTRIDGE 2: PC SHOOTING (ปกป้องฐานคอมพิวเตอร์จากเหล่าไวรัส!)
              ================================================================= */}
          <div
            onClick={() => handleSelectGame('shooter')}
            className="group relative rounded-3xl bg-[#140b1a] border-2 border-rose-500/70 hover:border-rose-400 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_35px_rgba(244,63,94,0.35)] hover:-translate-y-1 cursor-pointer select-none"
          >
            {/* Cartridge Top Grip Ridges */}
            <div className="flex justify-center gap-1.5 mb-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="w-5 h-1.5 rounded-full bg-slate-800/90 border border-slate-700/60" />
              ))}
            </div>

            {/* Cartridge Label Sticker Container */}
            <div className="rounded-2xl bg-gradient-to-b from-[#250d24] to-[#0c0410] border border-rose-500/30 p-4 space-y-3 relative overflow-hidden">
              {/* Sticker Header Badge */}
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                <span className="font-mono text-[10px] font-bold text-rose-400 tracking-wider">
                  ROM-02 • 2D ACTION SHOOTER
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-amber-300">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>5 STAGES + BOSS</span>
                </span>
              </div>

              {/* Pixel Art Illustration Box */}
              <div className="h-32 sm:h-36 rounded-xl bg-gradient-to-b from-[#33112a] via-[#1a0818] to-[#0a020a] border border-rose-500/30 flex items-center justify-between px-6 relative overflow-hidden group-hover:scale-102 transition-transform">
                {/* Left: Pixel Computer Base Tower */}
                <div className="w-10 h-22 rounded bg-[#0f172a] border-2 border-cyan-400 flex flex-col items-center justify-around py-1 shadow-[0_0_10px_rgba(0,207,239,0.5)] z-10">
                  <div className="w-6 h-6 rounded-full border border-cyan-300 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-cyan-400/40" />
                  </div>
                  <div className="w-6 h-6 rounded-full border border-cyan-300 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-cyan-400/40" />
                  </div>
                </div>

                {/* Laser Blasts */}
                <div className="flex flex-col gap-2 z-10">
                  <div className="w-8 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#00CFEF] animate-pulse" />
                  <div className="w-12 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                </div>

                {/* Right: Virus Monsters (White, Green, Red Boss) */}
                <div className="flex items-center gap-2 z-10">
                  {/* Green speedster */}
                  <div className="w-7 h-9 rounded bg-emerald-500 border border-emerald-300 flex items-center justify-center">
                    <div className="w-2 h-2 bg-rose-500 rounded-full" />
                  </div>
                  {/* Red Tank */}
                  <div className="w-10 h-10 rounded bg-rose-600 border border-rose-400 flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.6)]">
                    <div className="w-3 h-3 bg-amber-300 rounded-sm" />
                  </div>
                </div>

                {/* Ground */}
                <div className="absolute bottom-0 inset-x-0 h-4 bg-[#1a0b1c] border-t-2 border-rose-500" />
              </div>

              {/* Game Title & Details */}
              <div>
                <h3 className="text-lg sm:text-xl font-cyber font-bold text-rose-300 group-hover:text-rose-200 transition-colors">
                  PC SHOOTING
                </h3>
                <p className="text-xs font-thai font-semibold text-amber-300 mb-1">
                  ปกป้องฐานคอมพิวเตอร์จากเหล่าไวรัส!
                </p>
                <p className="text-[11px] font-thai text-slate-400 leading-relaxed">
                  ควบคุมตัวละครเดินยิงสกัดไวรัส 4 ชนิดไม่ให้พังฐานคอมพิวเตอร์ อัพเกรดอาวุธ ปลดล็อกสกิลโล่ & กระสุนระเบิด และโค่น Golden Boss!
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-[10px] font-thai text-rose-300">
                  5 Stages • 4 ชนิดไวรัส
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-thai text-amber-300">
                  ระบบอัพเกรด & สกิล Q/F
                </span>
              </div>
            </div>

            {/* Cartridge Bottom Gold Pins Notch */}
            <div className="pt-4 flex items-center justify-between">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="w-2.5 h-3 bg-gradient-to-b from-amber-400 to-amber-600 rounded-sm" />
                ))}
              </div>

              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 group-hover:from-rose-400 group-hover:to-amber-400 text-slate-950 font-thai font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all">
                <span>กดเพื่อเล่นเกม</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
