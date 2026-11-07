'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PixelCharacter } from '@/components/character/PixelCharacter';
import { FormInput } from '@/components/ui/FormInput';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LogoutButton } from '@/components/dashboard/LogoutButton';
import { saveStudentProfile } from '@/app/actions/student-profile';
import {
  Profile,
  CharacterConfig,
  Lesson,
  LessonProgress,
  DEFAULT_CHARACTER_CONFIG,
  QuizAttempt,
} from '@/lib/supabase/types';
import {
  Star,
  Flag,
  BookOpen,
  Award,
  Trophy,
  Lock,
  CheckCircle2,
  Edit2,
  Settings,
  Sparkles,
  Shirt,
  User,
  GraduationCap,
  ArrowRight,
  X,
  ChevronRight,
} from 'lucide-react';

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

  // Modal State for Editing Profile
  const [editingProfile, setEditingProfile] = useState(false);
  const [studentIdInput, setStudentIdInput] = useState(profile.student_id || '');
  const [firstNameInput, setFirstNameInput] = useState(profile.first_name || '');
  const [lastNameInput, setLastNameInput] = useState(profile.last_name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Active Tooltip for the 8-Lesson Coin Stepper
  const [selectedLessonNode, setSelectedLessonNode] = useState<Lesson | null>(null);

  // Calculation of Stats (strictly from existing logic)
  const completedCoinsCount = lessonProgressList.filter((p) => p.completed).length;
  const playerLevel = Math.min(completedCoinsCount * 100, 800);
  const currentLevelNumber = Math.max(1, completedCoinsCount);
  const hasMasterTrophy = completedCoinsCount >= 8;
  const trophiesCount = hasMasterTrophy ? 1 : 0;
  const maxExp = 800;
  const expProgressPercent = Math.min(100, Math.max(6, (playerLevel / maxExp) * 100));

  const characterConfig: CharacterConfig = profile.character_config || DEFAULT_CHARACTER_CONFIG;

  const displayName =
    profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.first_name || profile.username || 'นักเรียน Com Quest';

  // Handle Profile Save
  const handleSaveProfileInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    const cleanId = studentIdInput.trim();
    if (cleanId) {
      if (!/^\d+$/.test(cleanId)) {
        setProfileError('รหัสนักเรียนต้องเป็นตัวเลขเท่านั้น (ห้ามมีตัวอักษรหรือสัญลักษณ์)');
        return;
      }
      if (cleanId.length < 11) {
        setProfileError(`รหัสนักเรียนต้องเป็นตัวเลขครบ 11 หลัก (คุณกรอกเพียง ${cleanId.length} หลัก)`);
        return;
      }
      if (cleanId.length > 11) {
        setProfileError(`รหัสนักเรียนต้องเป็นตัวเลขครบ 11 หลัก (คุณกรอกเกิน: ${cleanId.length} หลัก)`);
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
        setTimeout(() => setProfileSuccess(null), 3500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      setProfileError(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto space-y-6 sm:space-y-7 animate-in fade-in duration-300">
      
      {/* Background Pixel Night City Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* City Skyline Texture Layer */}
        <div
          className="absolute inset-0 bg-cover bg-bottom opacity-25 pixelated"
          style={{ backgroundImage: "url('/images/retro-room-2.png')" }}
        />
        {/* Subtle Dark Blue Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060913]/90 via-[#071126]/85 to-[#060913]/95" />

        {/* Twinkling Stars in Night Sky */}
        <div className="absolute top-12 left-10 w-2 h-2 bg-white rounded-full animate-star-twinkle" />
        <div className="absolute top-24 right-1/4 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-star-twinkle delay-300" />
        <div className="absolute top-40 left-1/3 w-2 h-2 bg-sky-200 rounded-full animate-star-twinkle delay-700" />
        <div className="absolute top-16 right-16 w-2.5 h-2.5 bg-white rounded-full animate-star-twinkle delay-1000" />
      </div>

      {/* Success Toast Alert */}
      {profileSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-400 text-emerald-300 text-sm font-thai flex items-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.3)] animate-in fade-in">
          <Award className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{profileSuccess}</span>
        </div>
      )}

      {/* =========================================================================
          CARD 1: PLAYER PROFILE & LEVEL (Top Hero Card - Matching Concept Art)
          ========================================================================= */}
      <div className="profile-rpg-card rounded-3xl p-5 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-6 sm:gap-7">
          
          {/* LEFT: CHARACTER AVATAR BOX WITH GLOWING PEDESTAL & EDIT PENCIL */}
          <div className="relative w-[150px] sm:w-[175px] h-[200px] sm:h-[225px] rounded-2xl bg-[#060c1d] border-2 border-cyan-400/60 p-3 flex flex-col items-center justify-between shrink-0 shadow-[inset_0_0_20px_rgba(0,240,255,0.15)] group">
            
            {/* Edit Profile Pencil Button at Top Right Corner */}
            <button
              type="button"
              onClick={() => setEditingProfile(true)}
              title="แก้ไขข้อมูลส่วนตัว"
              className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full bg-cyan-950/90 hover:bg-cyan-500 border border-cyan-400 text-cyan-300 hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.4)]"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Glowing Pedestal Rings with Sparkles */}
            <div className="absolute bottom-5 inset-x-3 h-8 flex items-center justify-center pointer-events-none">
              <div className="w-28 h-6 rounded-full bg-cyan-400/25 blur-xs border border-cyan-400/60 animate-pulse" />
              <div className="w-20 h-3 rounded-full bg-cyan-300/50 blur-xs absolute" />
            </div>

            {/* Pixel Character Figure */}
            <div className="relative z-10 my-auto pt-1">
              <PixelCharacter config={characterConfig} size={135} animate={true} />
            </div>

            {/* Customize Character Shortcut Link */}
            <Link
              href="/character"
              className="relative z-10 w-full py-1 text-center rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-[10px] font-thai text-cyan-300 hover:text-white transition-all flex items-center justify-center gap-1"
            >
              <Shirt className="w-3 h-3 text-cyan-400" />
              <span>แต่งตัวละคร</span>
            </Link>
          </div>

          {/* CENTER & RIGHT: USERNAME, STUDENT ID, BADGE, AND LEVEL HUD */}
          <div className="flex-1 flex flex-col justify-between py-1 space-y-5 text-center sm:text-left">
            
            {/* Top Row: User Identity on Left + Large Level on Right */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              
              {/* Identity Info */}
              <div className="space-y-1.5">
                {/* Username as Primary Heading */}
                <h1 className="font-pixel text-2xl sm:text-3xl text-white tracking-wider text-glow-cyan drop-shadow-md">
                  {profile.username || 'adventurer'}
                </h1>

                {/* Student ID as Secondary Text directly under Username */}
                <div className="text-xs sm:text-sm font-thai text-slate-300 flex items-center justify-center sm:justify-start gap-1.5">
                  <span className="text-slate-400">รหัสนักเรียน :</span>
                  <span className="font-mono text-cyan-300 font-bold tracking-wider">
                    {profile.student_id ? profile.student_id : 'ยังไม่ระบุ'}
                  </span>
                </div>

                {/* First & Last Name if available */}
                {(profile.first_name || profile.last_name) && (
                  <div className="text-xs font-thai text-slate-400">
                    ชื่อ-นามสกุล: <span className="text-white font-medium">{displayName}</span>
                  </div>
                )}

                {/* Role Badge */}
                <div className="pt-1 flex items-center justify-center sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 text-xs font-thai font-semibold shadow-sm">
                    <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{profile.role === 'admin' ? '🛡️ คุณครูผู้สอน' : '🎓 นักเรียน'}</span>
                  </span>
                </div>
              </div>

              {/* Right Side: Large Level Badge & EXP Counter */}
              <div className="text-center sm:text-right space-y-1 shrink-0">
                <div className="font-pixel text-3xl sm:text-4xl text-white tracking-wider text-glow-cyan">
                  LV.{currentLevelNumber < 10 ? `0${currentLevelNumber}` : currentLevelNumber}
                </div>
                <div className="text-xs sm:text-sm font-mono text-cyan-300 font-bold tracking-wider">
                  {playerLevel} / {maxExp} EXP
                </div>
              </div>

            </div>

            {/* Bottom Row: Progress Bar (EXP Bar) */}
            <div className="space-y-1.5 pt-1">
              <div className="relative w-full h-3.5 sm:h-4 bg-[#0a1835] rounded-full overflow-hidden border border-cyan-500/50 p-0.5 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.7)] transition-all duration-1000 ease-out"
                  style={{ width: `${expProgressPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 px-0.5">
                <span>START (0 EXP)</span>
                <span className="text-cyan-300 font-bold">
                  {completedCoinsCount >= 8 ? '★ MAX LEVEL REACHED' : `+100 EXP ในด่านถัดไป`}
                </span>
                <span>MAX (800 EXP)</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* =========================================================================
          CARD 2: PLAYER STATISTICS (สถิติการเรียนรู้ - 3 Equal Balanced Columns)
          ========================================================================= */}
      <div className="profile-rpg-card rounded-3xl p-5 sm:p-6 space-y-4">
        
        {/* Header: Star Icon + Title */}
        <div className="flex items-center gap-2 text-white font-thai font-bold text-base sm:text-lg">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          <span>สถิติการเรียนรู้</span>
        </div>

        {/* 3 Balanced Stat Columns */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 divide-x divide-slate-800 text-center">
          
          {/* Col 1: LESSONS (บทเรียนที่ผ่านแล้ว) */}
          <div className="space-y-1.5 px-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-xl bg-cyan-950/70 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
            </div>
            <div className="font-pixel text-lg sm:text-2xl text-white tracking-wide">
              {completedCoinsCount} / 8
            </div>
            <div className="text-xs sm:text-sm font-thai text-slate-300">
              บทเรียนที่ผ่านแล้ว
            </div>
          </div>

          {/* Col 2: COINS (เหรียญที่ได้รับ) */}
          <div className="space-y-1.5 px-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-xl bg-amber-950/70 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              {/* Pixel Art Styled Coin SVG Icon */}
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-amber-400" aria-hidden="true">
                <circle cx="12" cy="12" r="9" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="6" fill="#fbbf24" />
                <text x="12" y="15" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#78350f" fontFamily="sans-serif">
                  S
                </text>
              </svg>
            </div>
            <div className="font-pixel text-lg sm:text-2xl text-amber-300 tracking-wide">
              {completedCoinsCount}
            </div>
            <div className="text-xs sm:text-sm font-thai text-slate-300">
              เหรียญที่ได้รับ
            </div>
          </div>

          {/* Col 3: TROPHIES (ถ้วยรางวัล) */}
          <div className="space-y-1.5 px-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-xl bg-yellow-950/70 border border-yellow-400/50 flex items-center justify-center text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.25)]">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-yellow-400" />
            </div>
            <div className="font-pixel text-lg sm:text-2xl text-yellow-300 tracking-wide">
              {trophiesCount}
            </div>
            <div className="text-xs sm:text-sm font-thai text-slate-300">
              ถ้วยรางวัล
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          CARD 3: LEARNING PROGRESS & 8 LESSON COINS STEPPER (ความก้าวหน้า)
          ========================================================================= */}
      <div className="profile-rpg-card rounded-3xl p-5 sm:p-7 space-y-6">
        
        {/* Header: Flag Icon + Title + Collection Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-white font-thai font-bold text-base sm:text-lg">
            <Flag className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span>ความก้าวหน้า (Lesson Coins Collection)</span>
          </div>

          <div className="text-xs font-mono text-cyan-300 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 w-fit">
            HTML Beginner • {completedCoinsCount}/8 บท
          </div>
        </div>

        {/* Horizontal Timeline / Stepper Connecting all 8 Lessons */}
        <div className="relative py-4 px-2">
          
          {/* Background Connecting Track Line */}
          <div className="absolute top-10 left-6 right-6 h-1 bg-slate-800 rounded-full z-0" />
          
          {/* Active Glowing Track Line (Filling according to completed lessons) */}
          <div
            className="absolute top-10 left-6 h-1 bg-gradient-to-r from-cyan-400 to-sky-400 rounded-full z-0 shadow-[0_0_10px_rgba(0,240,255,0.7)] transition-all duration-700"
            style={{
              width: `${Math.max(0, Math.min(100, ((completedCoinsCount - 0.5) / 7.5) * 100))}%`,
            }}
          />

          {/* 8 Circular Nodes (บทที่ 1 ถึง บทที่ 8) */}
          <div className="relative z-10 grid grid-cols-4 sm:grid-cols-8 gap-y-6 gap-x-2 text-center">
            {initialLessons.slice(0, 8).map((lesson, idx) => {
              const isCompleted = lessonProgressList.some(
                (p) => p.lesson_id === lesson.id && p.completed
              );
              const lessonNum = lesson.lesson_number || idx + 1;
              const isSelected = selectedLessonNode?.id === lesson.id;

              return (
                <div
                  key={lesson.id}
                  onClick={() => setSelectedLessonNode(isSelected ? null : lesson)}
                  className="flex flex-col items-center space-y-2 cursor-pointer group"
                >
                  {/* Circle Badge */}
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                      isCompleted
                        ? 'bg-gradient-to-b from-cyan-400 to-blue-600 border-2 border-cyan-200 text-white shadow-[0_0_15px_rgba(0,240,255,0.6)] group-hover:scale-110'
                        : 'bg-slate-900 border-2 border-slate-700 text-slate-500 group-hover:border-slate-500 group-hover:scale-105'
                    } ${isSelected ? 'ring-4 ring-cyan-400/80' : ''}`}
                  >
                    {isCompleted ? (
                      <BookOpen className="w-5 h-5 text-white" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-500" />
                    )}
                  </div>

                  {/* Label: บทที่ X */}
                  <span
                    className={`text-xs font-thai font-semibold transition-colors ${
                      isCompleted ? 'text-cyan-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    บทที่ {lessonNum}
                  </span>
                </div>
              );
            })}
          </div>

        </div>

        {/* Selected Lesson Interactive Detail Tooltip */}
        {selectedLessonNode && (
          <div className="p-4 rounded-2xl bg-cyan-950/70 border border-cyan-400/60 shadow-[0_0_20px_rgba(0,240,255,0.2)] animate-in fade-in flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-thai">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-bold text-white text-sm">
                  บทที่ {selectedLessonNode.lesson_number}: {selectedLessonNode.title}
                </span>
                {lessonProgressList.some((p) => p.lesson_id === selectedLessonNode.id && p.completed) ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-400 text-emerald-300 text-[10px] font-bold">
                    ✓ ได้รับเหรียญแล้ว
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-[10px]">
                    🔒 ยังไม่ปลดล็อก
                  </span>
                )}
              </div>
              <p className="text-slate-300">{selectedLessonNode.description}</p>
            </div>

            <Link
              href={`/learn/${selectedLessonNode.id}`}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-transform hover:scale-105 shrink-0"
            >
              <span>ไปที่บทเรียนนี้</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

      </div>

      {/* =========================================================================
          BOTTOM SECTION: ACCOUNT SETTINGS BUTTON & SLEEPING PIXEL CAT
          ========================================================================= */}
      <div className="relative pt-2 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Sleeping Pixel Cat Easter Egg (Matching Concept Art Bottom Left) */}
        <div className="flex items-center gap-3 self-center sm:self-auto">
          <div className="relative flex items-center justify-center">
            {/* Animated 'z Z' drifting upwards */}
            <div className="absolute -top-4 -right-1 text-cyan-300 font-pixel text-[10px] font-bold animate-sleep-z1 pointer-events-none">
              z
            </div>
            <div className="absolute -top-7 right-1 text-cyan-200 font-pixel text-xs font-bold animate-sleep-z2 pointer-events-none">
              Z
            </div>
            <div className="absolute -top-10 right-3 text-cyan-100 font-pixel text-sm font-bold animate-sleep-z3 pointer-events-none">
              Z
            </div>

            {/* Cute Pixel Cat SVG */}
            <svg viewBox="0 0 36 24" className="w-12 h-8" shapeRendering="crispEdges" aria-label="Sleeping Cat">
              {/* Cat Body */}
              <rect x="6" y="8" width="22" height="12" rx="4" fill="#60a5fa" />
              <rect x="8" y="10" width="18" height="8" fill="#93c5fd" />
              {/* Cat Head */}
              <circle cx="9" cy="11" r="6" fill="#3b82f6" />
              {/* Ears */}
              <polygon points="5,6 8,1 10,7" fill="#1d4ed8" />
              <polygon points="9,6 12,2 13,8" fill="#1d4ed8" />
              {/* Closed Eyes */}
              <path d="M 6 11 Q 8 13 10 11" stroke="#1e3a8a" strokeWidth="1.5" fill="none" />
              {/* Tail */}
              <path d="M 27 16 C 31 16 33 11 31 9" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[11px] font-thai text-slate-400">
            แมวผู้พิทักษ์กำลังนอนหลับ...
          </span>
        </div>

        {/* Center Account Settings Button (Matching Concept Art: "⚙️ ตั้งค่าบัญชี >") */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditingProfile(true)}
            className="px-6 py-2.5 rounded-full bg-cyan-950/80 hover:bg-cyan-900 border-2 border-cyan-400 text-cyan-200 hover:text-white font-thai font-bold text-sm shadow-[0_0_20px_rgba(0,240,255,0.35)] transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            <span>ตั้งค่าบัญชี</span>
            <ChevronRight className="w-4 h-4 text-cyan-400" />
          </button>
        </div>

      </div>

      {/* =========================================================================
          EDIT PROFILE MODAL (Connected to existing saveStudentProfile action)
          ========================================================================= */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="profile-rpg-card w-full max-w-md rounded-3xl p-6 sm:p-7 border-2 border-cyan-400 shadow-[0_0_50px_rgba(0,240,255,0.4)] relative">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-cyan-500/30">
              <div className="flex items-center gap-2 text-white font-thai font-bold text-base">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                <span>แก้ไขข้อมูลส่วนตัว</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ErrorMessage message={profileError} onDismiss={() => setProfileError(null)} className="mb-4" />

            {/* Form */}
            <form onSubmit={handleSaveProfileInfo} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
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

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProfile(false)}
                  disabled={savingProfile}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-thai font-bold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-thai font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
                >
                  {savingProfile ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
