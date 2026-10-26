'use client';

import React, { useState } from 'react';
import { PixelCharacter } from '@/components/character/PixelCharacter';
import { LessonCoinCard, MasterCourseTrophy } from '@/components/character/SubjectTrophy';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { FormInput } from '@/components/ui/FormInput';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { createClient } from '@/lib/supabase/client';
import {
  Profile,
  CharacterConfig,
  Lesson,
  LessonProgress,
  DEFAULT_CHARACTER_CONFIG,
} from '@/lib/supabase/types';
import {
  Zap,
  IdCard,
  User,
  Crown,
  Edit3,
  Shirt,
  Award,
  BookOpen,
  Mail,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { saveStudentProfile } from '@/app/actions/student-profile';
import { QuizAttempt } from '@/lib/supabase/types';

interface ProfileViewProps {
  initialProfile: Profile;
  initialLessons: Lesson[];
  initialLessonProgress: LessonProgress[];
  initialQuizAttempts?: QuizAttempt[];
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  initialProfile,
  initialLessons,
  initialLessonProgress,
  initialQuizAttempts = [],
}) => {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [lessonProgressList, setLessonProgressList] = useState<LessonProgress[]>(initialLessonProgress);

  React.useEffect(() => {
    setProfile(initialProfile);
    setLessonProgressList(initialLessonProgress);
  }, [initialProfile, initialLessonProgress]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [studentIdInput, setStudentIdInput] = useState(profile.student_id || '');
  const [firstNameInput, setFirstNameInput] = useState(profile.first_name || '');
  const [lastNameInput, setLastNameInput] = useState(profile.last_name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Derived progression calculations:
  // playerLevel = min(completedLessons * 100, 800)
  const completedCoinsCount = lessonProgressList.filter((p) => p.completed).length;
  const playerLevel = Math.min(completedCoinsCount * 100, 800);
  const hasMasterTrophy = completedCoinsCount >= 8;
  const trophiesCount = hasMasterTrophy ? 1 : 0;
  const isMaxLevel = playerLevel >= 800;

  const characterConfig: CharacterConfig = profile.character_config || DEFAULT_CHARACTER_CONFIG;

  const displayName =
    profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.first_name || profile.username || 'นักเรียนผู้กล้า';

  // Complete profile modal save
  const handleSaveProfileInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    // Validate student ID if provided (11 digits)
    const cleanId = studentIdInput.trim();
    if (cleanId) {
      if (!/^\d+$/.test(cleanId)) {
        setProfileError('รหัสนักเรียนต้องเป็นตัวเลขเท่านั้น (ห้ามมีตัวอักษรหรือสัญลักษณ์)');
        return;
      }
      if (cleanId.length < 11) {
        setProfileError(`รหัสนักเรียนต้องเป็นตัวเลขครบ 11 หลัก (คุณกรอกไม่ครบ: มีเพียง ${cleanId.length} หลัก)`);
        return;
      }
      if (cleanId.length > 11) {
        setProfileError(`รหัสนักเรียนต้องเป็นตัวเลขครบ 11 หลัก (คุณกรอกเกิน: มี ${cleanId.length} หลัก)`);
        return;
      }
    }

    try {
      setSavingProfile(true);

      const res = await saveStudentProfile({
        firstName: firstNameInput,
        lastName: lastNameInput,
        studentId: studentIdInput,
      });

      if (!res.success) {
        setProfileError(res.error || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      } else if (res.profile) {
        setProfile(res.profile);
        setEditingProfile(false);
        setProfileSuccess('อัปเดตข้อมูลนักเรียนเรียบร้อยแล้ว');
        router.refresh();
        setTimeout(() => setProfileSuccess(null), 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      setProfileError(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Alert on Success */}
      {profileSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-sm font-thai flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <Award className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{profileSuccess}</span>
        </div>
      )}

      {/* 1. PLAYER PROFILE CARD */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle Neon Accents */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Column: 8-Bit Pixel Character Preview & Customize Button */}
          <div className="lg:col-span-4 flex flex-col items-center text-center space-y-4">
            <div className="relative p-6 rounded-2xl bg-slate-950/80 border-2 border-cyan-400/50 shadow-[0_0_25px_rgba(0,240,255,0.25)] flex flex-col items-center">
              {/* Pixel Art Character */}
              <div className="relative z-10 py-2">
                <PixelCharacter config={characterConfig} size={144} animate={true} />
              </div>

              {/* Character Base Stand */}
              <div className="w-32 h-3.5 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent rounded-full blur-[2px] -mt-1" />

              {/* Max level crown */}
              {isMaxLevel && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-pixel font-bold flex items-center gap-1 shadow-[0_0_15px_#fbbf24] animate-bounce">
                  <Crown className="w-3.5 h-3.5" />
                  <span>MAX LVL 800</span>
                </div>
              )}
            </div>

            {/* Customization Link Button */}
            <a
              href="/character"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-400/60 text-cyan-300 font-cyber text-xs tracking-wider uppercase hover:border-cyan-300 hover:text-white hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all cursor-pointer font-bold"
            >
              <Shirt className="w-4 h-4 text-cyan-400" />
              <span>แต่งตัวละคร (Customize)</span>
            </a>
          </div>

          {/* Right Column: Player Info & Level Progress HUD */}
          <div className="lg:col-span-8 space-y-6">
            {/* Player Name and Badges */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-cyan-950/80 border border-cyan-500/50 text-cyan-300">
                    PLAYER PROFILE
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    COURSE: HTML เบื้องต้น
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingProfile(true)}
                  className="text-xs font-thai text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขข้อมูลส่วนตัว</span>
                </button>
              </div>

              {/* Primary Profile Heading: Username */}
              <h1 className="text-2xl sm:text-4xl font-cyber font-bold tracking-wide text-glow-cyan text-white">
                @{profile.username || 'adventurer'}
              </h1>

              {/* Student ID displayed as small text directly under Username */}
              <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5 pt-0.5">
                <IdCard className="w-3.5 h-3.5 text-cyan-400 inline shrink-0" />
                <span>รหัสประจำตัว:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {profile.student_id ? (
                    profile.student_id
                  ) : (
                    <span className="text-amber-400 font-thai font-normal">ยังไม่ระบุ (คลิกแก้ไขเพื่อกรอก)</span>
                  )}
                </span>
              </p>
            </div>

            {/* Profile Info Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-thai">
              {/* Full Name */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
                <User className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-slate-400 text-[11px]">ชื่อ - นามสกุล (Full Name)</div>
                  <div className="font-thai text-white font-semibold">
                    {profile.first_name || profile.last_name ? (
                      `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                    ) : (
                      <span className="text-amber-400 font-thai font-normal">ยังไม่ระบุ (คลิกแก้ไขเพื่อกรอก)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-slate-400 text-[11px]">อีเมล (Email)</div>
                  <div className="font-mono text-white truncate max-w-[190px]">
                    {profile.email}
                  </div>
                </div>
              </div>
            </div>

            {/* LEVEL & PROGRESSION HUD (0 to 800) */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-cyber font-bold text-slate-200">
                    LEVEL PROGRESSION (+100 LVL ต่อบทเรียน)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-slate-400">
                    LEVEL:{' '}
                    <strong className="text-cyan-300 text-sm font-pixel">
                      {playerLevel} / 800
                    </strong>
                  </span>
                  {isMaxLevel && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/60 text-amber-300 text-[10px] font-bold">
                      MAX LEVEL REACHED
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar from 0 to 800 */}
              <div className="relative w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/80 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isMaxLevel
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                      : 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                  }`}
                  style={{ width: `${Math.max((playerLevel / 800) * 100, 3)}%` }}
                />
              </div>

              {/* 3 Metrics counters */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900 text-center text-xs">
                <div>
                  <div className="font-pixel text-cyan-300 text-sm sm:text-base">
                    {playerLevel} / 800
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">
                    PLAYER LEVEL
                  </div>
                </div>
                <div>
                  <div className="font-pixel text-emerald-300 text-sm sm:text-base">
                    {completedCoinsCount} / 8
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">
                    LESSONS (COINS)
                  </div>
                </div>
                <div>
                  <div className="font-pixel text-amber-300 text-sm sm:text-base">
                    {trophiesCount} / 1
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">
                    COURSE TROPHY
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {editingProfile && (
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-cyan-500/40 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <h3 className="text-base font-cyber font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-cyan-400" />
              <span>ปรับปรุงข้อมูลนักเรียน (Complete Profile)</span>
            </h3>
            <button
              type="button"
              onClick={() => setEditingProfile(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ ยกเลิก
            </button>
          </div>

          <ErrorMessage message={profileError} onDismiss={() => setProfileError(null)} className="mb-4" />

          <form onSubmit={handleSaveProfileInfo} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="ชื่อจริง"
                id="editFirstName"
                name="firstName"
                placeholder="สมชาย"
                value={firstNameInput}
                onChange={(e) => setFirstNameInput(e.target.value)}
                disabled={savingProfile}
              />
              <FormInput
                label="นามสกุล"
                id="editLastName"
                name="lastName"
                placeholder="ใจดี"
                value={lastNameInput}
                onChange={(e) => setLastNameInput(e.target.value)}
                disabled={savingProfile}
              />
            </div>

            <FormInput
              label="รหัสนักเรียน (11 หลัก)"
              id="editStudentId"
              name="studentId"
              inputMode="numeric"
              maxLength={15}
              placeholder="68219100010"
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
              helperText="กรอกตัวเลข 11 หลักตามบัตรประจำตัวนักเรียน"
              disabled={savingProfile}
            />

            <div className="flex justify-end gap-3 pt-2">
              <SecondaryButton
                onClick={() => setEditingProfile(false)}
                disabled={savingProfile}
                size="sm"
              >
                ยกเลิก
              </SecondaryButton>
              <PrimaryButton
                type="submit"
                loading={savingProfile}
                disabled={savingProfile}
                size="sm"
              >
                บันทึกข้อมูล
              </PrimaryButton>
            </div>
          </form>
        </div>
      )}

      {/* 2. MASTER COURSE TROPHY (1 ถ้วยสำเร็จรายวิชา HTML เบื้องต้น) */}
      <div className="space-y-4">
        <MasterCourseTrophy completedCoinsCount={completedCoinsCount} />
      </div>

      {/* 3. 8 LESSON COINS SHOWCASE (8 เหรียญประจำบทเรียน) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl sm:text-2xl font-cyber font-bold tracking-wide text-white">
                เหรียญประจำบทเรียน (8 LESSON COINS)
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-thai text-slate-400">
              เรียนจบแต่ละบทเรียนจะได้รับ +100 เลเวล และ 1 เหรียญรางวัล เมื่อครบ 8 เหรียญจะรวมเป็น 1 ถ้วยสำเร็จรายวิชา
            </p>
          </div>

          {/* Coin Count Badge */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-sm font-mono w-fit">
            <span className="text-slate-400">COINS PROGRESS:</span>
            <span className="text-amber-400 font-pixel font-bold text-base">
              {completedCoinsCount} / 8 เหรียญ
            </span>
          </div>
        </div>

        {/* 8 Lesson Coins Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {initialLessons.map((lesson) => {
            const isCompleted = lessonProgressList.some(
              (p) => p.lesson_id === lesson.id && p.completed
            );

            // Find latest quiz attempt for this lesson
            const attempt = initialQuizAttempts.find((a) => a.lesson_id === lesson.id);
            const quizStatus = attempt
              ? { score: attempt.score, passed: attempt.passed }
              : null;

            return (
              <LessonCoinCard
                key={lesson.id}
                lessonId={lesson.id}
                lessonNumber={lesson.lesson_number}
                title={lesson.title}
                description={lesson.description}
                isCompleted={isCompleted}
                quizStatus={quizStatus}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
