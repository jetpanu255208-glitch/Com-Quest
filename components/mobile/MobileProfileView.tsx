'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PixelCharacter } from '@/components/character/PixelCharacter';
import { LogoutButton } from '@/components/dashboard/LogoutButton';
import {
  Profile,
  CharacterConfig,
  Lesson,
  LessonProgress,
} from '@/lib/supabase/types';
import {
  BookOpen,
  Award,
  Trophy,
  Shirt,
  Settings,
  Star,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface MobileProfileViewProps {
  profile: Profile;
  characterConfig: CharacterConfig;
  displayName: string;
  currentLevelNumber: number;
  playerLevel: number;
  maxExp: number;
  expProgressPercent: number;
  completedCoinsCount: number;
  trophiesCount: number;
  hasMasterTrophy: boolean;
  initialLessons: Lesson[];
  lessonProgressList: LessonProgress[];
  onOpenEditModal: () => void;
}

export const MobileProfileView: React.FC<MobileProfileViewProps> = ({
  profile,
  characterConfig,
  displayName,
  currentLevelNumber,
  playerLevel,
  maxExp,
  expProgressPercent,
  completedCoinsCount,
  trophiesCount,
  hasMasterTrophy,
  initialLessons,
  lessonProgressList,
  onOpenEditModal,
}) => {
  const router = useRouter();

  return (
    <div className="md:hidden space-y-3.5 pb-24 px-3 sm:px-4 pt-3 select-none">
      {/* =========================================================================
          1. STUDENT PROFILE CARD (Avatar + Name + Student ID + Level)
          ========================================================================= */}
      <div className="rounded-2xl bg-[#101827] border border-[#263449] p-3.5 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar Thumbnail */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-xl bg-[#151F30] border border-[#263449] flex items-center justify-center overflow-hidden shadow-inner">
              <PixelCharacter config={characterConfig} size={54} />
            </div>
            <Link
              href="/character"
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#00CFEF] text-[#080D1A] flex items-center justify-center shadow-md active:scale-95 transition-all"
              title="แต่งตัวละคร"
            >
              <Shirt className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* User Details */}
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-pixel text-sm text-slate-100 truncate">
                {profile.username || 'นักเรียน'}
              </h2>
              <span className="px-1.5 py-0.2 rounded bg-[#151F30] border border-[#263449] text-[10px] font-mono text-[#00CFEF] font-bold">
                LV.{currentLevelNumber < 10 ? `0${currentLevelNumber}` : currentLevelNumber}
              </span>
            </div>

            <p className="font-thai text-xs text-slate-300 truncate">
              {displayName}
            </p>

            {profile.student_id ? (
              <p className="text-[10px] font-mono text-slate-400 truncate">
                รหัส: {profile.student_id}
              </p>
            ) : (
              <p className="text-[10px] font-thai text-amber-400/90 truncate">
                ยังไม่ได้ระบุรหัสนักเรียน
              </p>
            )}
          </div>
        </div>

        {/* Edit Profile Button */}
        <button
          type="button"
          onClick={onOpenEditModal}
          className="p-2 rounded-xl bg-[#151F30] hover:bg-[#1e2a40] border border-[#263449] text-slate-300 hover:text-white transition-colors shrink-0 active:scale-95"
          title="แก้ไขข้อมูลส่วนตัว"
          aria-label="แก้ไขข้อมูลส่วนตัว"
        >
          <Settings className="w-4 h-4 text-[#00CFEF]" />
        </button>
      </div>

      {/* =========================================================================
          2. EXP PROGRESS BAR (Full width card)
          ========================================================================= */}
      <div className="rounded-2xl bg-[#101827] border border-[#263449] p-3.5 space-y-2 shadow-lg">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-thai text-slate-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#00CFEF]" />
            <span>ความคืบหน้า EXP</span>
          </div>
          <div className="font-mono text-xs text-[#00CFEF] font-semibold">
            {playerLevel} / {maxExp} EXP
            {hasMasterTrophy && (
              <span className="ml-1 text-amber-400 font-bold">★ MAX</span>
            )}
          </div>
        </div>

        {/* Progress Track */}
        <div className="w-full bg-[#151F30] rounded-full h-2.5 p-0.5 border border-[#263449] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-[#00CFEF] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,207,239,0.5)]"
            style={{ width: `${expProgressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>START (0 EXP)</span>
          <span>{hasMasterTrophy ? '★ COMPLETED' : `${8 - completedCoinsCount} เควสต์ที่เหลือ`}</span>
          <span>MAX (800 EXP)</span>
        </div>
      </div>

      {/* =========================================================================
          3. LEARNING STATISTICS (3 Compact Cards)
          ========================================================================= */}
      <div className="grid grid-cols-3 gap-2">
        {/* Completed Lessons */}
        <div className="p-3 rounded-xl bg-[#101827] border border-[#263449] text-center space-y-1 shadow-sm">
          <div className="w-7 h-7 mx-auto rounded-lg bg-[#151F30] border border-[#263449] flex items-center justify-center text-[#00CFEF]">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div className="font-pixel text-base text-slate-100">
            {completedCoinsCount} <span className="text-slate-400 text-xs">/ 8</span>
          </div>
          <div className="text-[10px] font-thai text-slate-400 truncate">
            บทเรียนที่ผ่าน
          </div>
        </div>

        {/* Coins Received */}
        <div className="p-3 rounded-xl bg-[#101827] border border-[#263449] text-center space-y-1 shadow-sm">
          <div className="w-7 h-7 mx-auto rounded-lg bg-[#151F30] border border-[#263449] flex items-center justify-center text-amber-400">
            <Award className="w-3.5 h-3.5" />
          </div>
          <div className="font-pixel text-base text-amber-400">
            {completedCoinsCount}
          </div>
          <div className="text-[10px] font-thai text-slate-400 truncate">
            เหรียญที่ได้รับ
          </div>
        </div>

        {/* Trophies */}
        <div className="p-3 rounded-xl bg-[#101827] border border-[#263449] text-center space-y-1 shadow-sm">
          <div className="w-7 h-7 mx-auto rounded-lg bg-[#151F30] border border-[#263449] flex items-center justify-center text-amber-300">
            <Trophy className="w-3.5 h-3.5" />
          </div>
          <div className="font-pixel text-base text-amber-300">
            {trophiesCount}
          </div>
          <div className="text-[10px] font-thai text-slate-400 truncate">
            ถ้วยรางวัล
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. LESSON COINS COLLECTION (8 Interactive Nodes in Clean Grid)
          ========================================================================= */}
      <div className="rounded-2xl bg-[#101827] border border-[#263449] p-3.5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-thai text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>เหรียญการเรียนรู้ (Lesson Coins)</span>
          </h3>
          <span className="text-[10px] font-mono text-[#00CFEF] bg-[#151F30] border border-[#263449] px-2 py-0.5 rounded-md">
            HTML &bull; {completedCoinsCount}/8
          </span>
        </div>

        {/* 8 Coins Row/Grid */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {initialLessons.slice(0, 8).map((lesson, idx) => {
            const prog = lessonProgressList.find((p) => p.lesson_id === lesson.id);
            const isCompleted = prog?.completed ?? false;
            const isUnlocked =
              idx === 0 ||
              (lessonProgressList.find((p) => p.lesson_id === initialLessons[idx - 1]?.id)
                ?.completed ?? false);

            return (
              <Link
                key={lesson.id}
                href={
                  isCompleted
                    ? `/learn/${lesson.id}?mode=review`
                    : isUnlocked
                    ? `/learn/${lesson.id}`
                    : '#'
                }
                className={`
                  flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center
                  ${
                    isCompleted
                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                      : isUnlocked
                      ? 'bg-[#151F30] border-[#00CFEF]/40 hover:border-[#00CFEF]'
                      : 'bg-[#0b101c] border-slate-800/80 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                {/* Coin Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-transform ${
                    isCompleted
                      ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : isUnlocked
                      ? 'bg-[#101827] border-2 border-[#00CFEF] text-[#00CFEF]'
                      : 'bg-[#101827] border border-slate-700 text-slate-600'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  ) : isUnlocked ? (
                    <span>0{idx + 1}</span>
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                </div>

                <span className="font-thai text-[10px] text-slate-300 mt-1 truncate max-w-full">
                  บท {idx + 1}
                </span>
                <span className="text-[8px] font-mono text-slate-400">
                  {isCompleted ? 'CLEARED' : isUnlocked ? 'READY' : 'LOCKED'}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          5. ACTION BUTTONS & ACCOUNT MANAGEMENT
          ========================================================================= */}
      <div className="space-y-2 pt-1">
        <Link
          href="/subjects"
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00CFEF] to-cyan-400 text-[#080D1A] font-thai font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,207,239,0.3)] active:scale-95 transition-all"
        >
          <BookOpen className="w-4 h-4" />
          <span>ไปที่หน้ารวมบทเรียน 8 ด่าน</span>
          <ChevronRight className="w-4 h-4" />
        </Link>

        <button
          type="button"
          onClick={onOpenEditModal}
          className="w-full py-3 px-4 rounded-xl bg-[#101827] hover:bg-[#151F30] border border-[#263449] text-slate-200 font-thai font-semibold text-xs flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer"
        >
          <Settings className="w-4 h-4 text-[#00CFEF]" />
          <span>ตั้งค่าข้อมูลบัญชีนักเรียน</span>
        </button>

        {/* Single Red Logout Button on Mobile Profile */}
        <div className="pt-1">
          <LogoutButton variant="red" className="w-full justify-center py-2.5" />
        </div>
      </div>
    </div>
  );
};

