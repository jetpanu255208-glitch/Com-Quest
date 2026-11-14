'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PixelCharacter } from '@/components/character/PixelCharacter';
import { FormInput } from '@/components/ui/FormInput';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { saveStudentProfile } from '@/app/actions/student-profile';
import { LogoutButton } from '@/components/dashboard/LogoutButton';
import { MobileProfileView } from '@/components/mobile/MobileProfileView';
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
  Edit2,
  Settings,
  Shirt,
  GraduationCap,
  ArrowRight,
  X,
  ChevronRight,
  Sparkles,
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

  // Active Tooltip for the 8-Lesson Stepper
  const [selectedLessonNode, setSelectedLessonNode] = useState<Lesson | null>(null);

  // Stats calculation (new accounts start cleanly at LV.00 and 0 EXP)
  const completedCoinsCount = lessonProgressList.filter((p) => p.completed).length;
  const playerLevel = Math.min(completedCoinsCount * 100, 800);
  const currentLevelNumber = completedCoinsCount;
  const hasMasterTrophy = completedCoinsCount >= 8;
  const trophiesCount = hasMasterTrophy ? 1 : 0;
  const maxExp = 800;
  const expProgressPercent = Math.min(100, (playerLevel / maxExp) * 100);

  const characterConfig: CharacterConfig = profile.character_config || DEFAULT_CHARACTER_CONFIG;

  const displayName =
    profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.first_name || profile.username || 'นักเรียน Com Quest';

  // Save profile info
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
    <div className="relative w-full max-w-6xl mx-auto space-y-3.5 sm:space-y-4 animate-in fade-in duration-300 select-none">
      
      {/* Background Cyber Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#060913]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#060913]/90 via-[#071126]/85 to-[#060913]/95" />

        {/* Twinkling Stars */}
        <div className="absolute top-10 left-12 w-2 h-2 bg-white rounded-full animate-star-twinkle" />
        <div className="absolute top-20 right-1/4 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-star-twinkle delay-300" />
        <div className="absolute top-36 left-1/3 w-2 h-2 bg-sky-200 rounded-full animate-star-twinkle delay-700" />
        <div className="absolute top-14 right-14 w-2.5 h-2.5 bg-white rounded-full animate-star-twinkle delay-1000" />
      </div>

      {/* Success Toast */}
      {profileSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/85 border border-emerald-400 text-emerald-300 text-xs font-thai flex items-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.3)] animate-in fade-in">
          <Award className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{profileSuccess}</span>
        </div>
      )}

      {/* =========================================================================
          MOBILE PROFILE VIEW (< md: Dedicated Mobile Experience)
          ========================================================================= */}
      <MobileProfileView
        profile={profile}
        characterConfig={characterConfig}
        displayName={displayName}
        currentLevelNumber={currentLevelNumber}
        playerLevel={playerLevel}
        maxExp={maxExp}
        expProgressPercent={expProgressPercent}
        completedCoinsCount={completedCoinsCount}
        trophiesCount={trophiesCount}
        hasMasterTrophy={hasMasterTrophy}
        initialLessons={initialLessons}
        lessonProgressList={lessonProgressList}
        onOpenEditModal={() => setEditingProfile(true)}
      />

      {/* =========================================================================
          DESKTOP PROFILE VIEW (>= md: Full 8-bit Cyberpunk Dashboard)
          ========================================================================= */}
      <div className="hidden md:block">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        
        {/* -----------------------------------------------------------------------
            LEFT COLUMN: PLAYER IDENTITY & AVATAR CARD (lg:col-span-5)
            ----------------------------------------------------------------------- */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-[#101827] border border-[#263449] rounded-2xl p-4 sm:p-5 space-y-4">
          
          {/* Avatar Box */}
          <div className="relative w-full max-w-[220px] h-[190px] sm:h-[210px] mx-auto rounded-xl bg-[#151F30] border border-[#263449] p-3 flex flex-col items-center justify-between group">
            
            {/* Edit Pencil Button */}
            <button
              type="button"
              onClick={() => setEditingProfile(true)}
              title="แก้ไขข้อมูลส่วนตัว"
              className="absolute top-2 right-2 z-20 w-7 h-7 rounded-lg bg-[#101827] hover:bg-[#1a263c] border border-[#263449] text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Pixel Character Figure */}
            <div className="relative z-10 my-auto">
              <PixelCharacter config={characterConfig} size={130} animate={true} />
            </div>

            {/* Customize Character Button */}
            <Link
              href="/character"
              className="relative z-10 w-full py-1.5 text-center rounded-lg bg-[#101827] hover:bg-[#1f2d47] border border-[#263449] text-xs font-thai font-medium text-slate-200 hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <Shirt className="w-3.5 h-3.5 text-[#00CFEF]" />
              <span>แต่งตัวละคร</span>
            </Link>
          </div>

          {/* User Details & Identity */}
          <div className="text-center space-y-1">
            <h1 className="font-pixel text-xl sm:text-2xl text-slate-100 tracking-wider">
              {profile.username || 'adventurer'}
            </h1>

            <div className="text-xs sm:text-sm font-thai text-slate-400 flex items-center justify-center gap-1.5">
              <span>รหัสนักเรียน:</span>
              <span className="font-mono text-[#00CFEF] font-medium">
                {profile.student_id ? profile.student_id : 'ยังไม่ระบุ'}
              </span>
            </div>

            {(profile.first_name || profile.last_name) && (
              <div className="text-xs font-thai text-slate-400">
                ชื่อ-นามสกุล: <span className="text-slate-200 font-medium">{displayName}</span>
              </div>
            )}

            <div className="pt-0.5 flex items-center justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#151F30] border border-[#263449] text-[#00CFEF] text-xs font-thai font-medium">
                <GraduationCap className="w-3.5 h-3.5 text-[#00CFEF]" />
                <span>{profile.role === 'admin' ? 'คุณครูผู้สอน' : 'นักเรียน'}</span>
              </span>
            </div>
          </div>

          {/* Account Settings Action */}
          <div className="pt-1 space-y-2">
            <button
              type="button"
              onClick={() => setEditingProfile(true)}
              className="w-full py-2.5 rounded-xl bg-[#151F30] hover:bg-[#1a263c] border border-[#263449] text-slate-200 font-thai font-medium text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>ตั้งค่าข้อมูลบัญชี</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Mobile Logout Button (Prominent in Profile View) */}
            <div className="md:hidden">
              <LogoutButton variant="red" className="w-full justify-center py-2.5" />
            </div>
          </div>

        </div>

        {/* -----------------------------------------------------------------------
            RIGHT COLUMN: LEVEL, STATS & 8-LESSON STEPPER (lg:col-span-7)
            ----------------------------------------------------------------------- */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          
          {/* UPPER RIGHT CARD: LEVEL, EXP & 3 STATISTICS */}
          <div className="bg-[#101827] border border-[#263449] rounded-2xl p-4 sm:p-5 space-y-4">
            
            {/* Level & EXP Progress Row */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-xl sm:text-2xl text-slate-100 tracking-wider">
                    LV.{currentLevelNumber < 10 ? `0${currentLevelNumber}` : currentLevelNumber}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-[#151F30] border border-[#263449] uppercase">
                    RANK
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[#00CFEF] font-medium text-xs sm:text-sm">
                    {playerLevel} / {maxExp} EXP
                  </div>
                </div>
              </div>

              {/* Simple Clean Progress Bar */}
              <div className="w-full h-2.5 bg-[#151F30] rounded-full overflow-hidden border border-[#263449]">
                <div
                  className="h-full rounded-full bg-[#00CFEF] transition-all duration-700 ease-out"
                  style={{ width: `${expProgressPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>START (0 EXP)</span>
                <span className="text-[#00CFEF]">
                  {completedCoinsCount >= 8 ? '★ MAX LEVEL REACHED' : '+100 EXP ต่อบทเรียน'}
                </span>
                <span>MAX (800 EXP)</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#263449] pt-3">
              <div className="flex items-center gap-1.5 text-slate-200 font-thai font-semibold text-xs sm:text-sm mb-3">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>สถิติการเรียนรู้ (Player Statistics)</span>
              </div>

              {/* 3 Equal Stat Columns */}
              <div className="grid grid-cols-3 gap-2 divide-x divide-[#263449] text-center">
                
                {/* 1. LESSONS */}
                <div className="space-y-1 px-1">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-[#151F30] border border-[#263449] flex items-center justify-center text-[#00CFEF]">
                    <BookOpen className="w-4 h-4 text-[#00CFEF]" />
                  </div>
                  <div className="font-pixel text-base sm:text-lg text-slate-100">
                    {completedCoinsCount} / 8
                  </div>
                  <div className="text-[11px] font-thai text-slate-400">
                    บทเรียนที่ผ่าน
                  </div>
                </div>

                {/* 2. COINS */}
                <div className="space-y-1 px-1">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-[#151F30] border border-[#263449] flex items-center justify-center text-amber-400">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-amber-400" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="6" fill="#fbbf24" />
                      <text x="12" y="15" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#78350f" fontFamily="sans-serif">
                        S
                      </text>
                    </svg>
                  </div>
                  <div className="font-pixel text-base sm:text-lg text-amber-300">
                    {completedCoinsCount}
                  </div>
                  <div className="text-[11px] font-thai text-slate-400">
                    เหรียญที่ได้รับ
                  </div>
                </div>

                {/* 3. TROPHIES */}
                <div className="space-y-1 px-1">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-[#151F30] border border-[#263449] flex items-center justify-center text-yellow-300">
                    <Trophy className="w-4 h-4 text-yellow-300 fill-yellow-400" />
                  </div>
                  <div className="font-pixel text-base sm:text-lg text-yellow-300">
                    {trophiesCount}
                  </div>
                  <div className="text-[11px] font-thai text-slate-400">
                    ถ้วยรางวัล
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* LOWER RIGHT CARD: LEARNING PROGRESS & 8-LESSON COINS STEPPER */}
          <div className="bg-[#101827] border border-[#263449] rounded-2xl p-4 sm:p-5 space-y-3">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 text-slate-200 font-thai font-semibold text-xs sm:text-sm">
                <Flag className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>ความก้าวหน้าบทเรียน (Lesson Progress)</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded-md bg-[#151F30] border border-[#263449] w-fit">
                HTML5 • {completedCoinsCount}/8 บท
              </div>
            </div>

            {/* Stepper with White Book (Unstudied) & Gold Book (Studied) */}
            <div className="relative py-2 px-1">
              {/* Background Connecting Track Line */}
              <div className="hidden sm:block absolute top-6 left-3 right-3 h-0.5 bg-[#263449] rounded-full z-0" />
              <div className="sm:hidden absolute top-5 left-3 right-3 h-0.5 bg-[#263449] rounded-full z-0" />
              <div className="sm:hidden absolute top-[70px] left-3 right-3 h-0.5 bg-[#263449] rounded-full z-0" />

              {/* 8 Nodes Grid */}
              <div className="relative z-10 grid grid-cols-4 sm:grid-cols-8 gap-y-3 gap-x-2 text-center">
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
                      className="flex flex-col items-center space-y-1 cursor-pointer group"
                    >
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-amber-500/20 border border-amber-400 text-amber-300'
                            : 'bg-[#151F30] border border-[#263449] text-slate-400 group-hover:border-slate-500'
                        } ${isSelected ? 'ring-2 ring-[#00CFEF]' : ''}`}
                      >
                        {isCompleted ? (
                          <BookOpen className="w-4 h-4 text-amber-300 fill-amber-300/40" />
                        ) : (
                          <BookOpen className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      {/* Label: บทที่ X */}
                      <span
                        className={`text-[10px] font-thai ${
                          isCompleted ? 'text-amber-300 font-medium' : 'text-slate-400'
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
              <div className="p-3 rounded-xl bg-[#151F30] border border-[#263449] animate-in fade-in flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-thai">
                <div className="space-y-0.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <span className="font-semibold text-slate-100 text-xs sm:text-sm">
                      บทที่ {selectedLessonNode.lesson_number}: {selectedLessonNode.title}
                    </span>
                    {lessonProgressList.some((p) => p.lesson_id === selectedLessonNode.id && p.completed) ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px]">
                        ★ ผ่านแล้ว
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-[#101827] border border-[#263449] text-slate-400 text-[10px]">
                        ยังไม่เริ่มเรียน
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px]">{selectedLessonNode.description}</p>
                </div>

                <Link
                  href={`/learn/${selectedLessonNode.id}`}
                  className="px-3 py-1.5 rounded-lg bg-[#00CFEF] hover:bg-[#00b8d4] text-[#080D1A] font-medium text-xs flex items-center gap-1 shrink-0 transition-colors"
                >
                  <span>เข้าสู่บทเรียน</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* =========================================================================
          BOTTOM FOOTER BAR: SLEEPING CAT (ONLY ONE LOGOUT AT TOP NAV AS REQUESTED!)
          ========================================================================= */}
      <div className="pt-1 flex items-center justify-between">
        
        {/* Sleeping Pixel Cat */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="absolute -top-3 -right-1 text-cyan-300 font-pixel text-[9px] font-bold animate-sleep-z1 pointer-events-none">
              z
            </div>
            <div className="absolute -top-6 right-1 text-cyan-200 font-pixel text-[11px] font-bold animate-sleep-z2 pointer-events-none">
              Z
            </div>
            <div className="absolute -top-9 right-3 text-cyan-100 font-pixel text-xs font-bold animate-sleep-z3 pointer-events-none">
              Z
            </div>

            <svg viewBox="0 0 36 24" className="w-10 h-6" shapeRendering="crispEdges" aria-label="Sleeping Cat">
              <rect x="6" y="8" width="22" height="12" rx="4" fill="#60a5fa" />
              <rect x="8" y="10" width="18" height="8" fill="#93c5fd" />
              <circle cx="9" cy="11" r="6" fill="#3b82f6" />
              <polygon points="5,6 8,1 10,7" fill="#1d4ed8" />
              <polygon points="9,6 12,2 13,8" fill="#1d4ed8" />
              <path d="M 6 11 Q 8 13 10 11" stroke="#1e3a8a" strokeWidth="1.5" fill="none" />
              <path d="M 27 16 C 31 16 33 11 31 9" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[11px] font-thai text-slate-400">
            ระบบจัดเก็บสถิติเรียลไทม์ พร้อมลุยเควสต์ต่อไป
          </span>
        </div>

      </div>
      </div>

      {/* =========================================================================
          EDIT PROFILE MODAL
          ========================================================================= */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="pixel-8bit-card w-full max-w-md rounded-2xl p-5 sm:p-7 border-2 border-cyan-400 shadow-[0_0_50px_rgba(0,240,255,0.4)] relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-cyan-500/30">
              <div className="flex items-center gap-2 text-white font-thai font-bold text-base">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                <span>แก้ไขข้อมูลส่วนตัว</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ErrorMessage message={profileError} onDismiss={() => setProfileError(null)} className="mb-4" />

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
                  className="pixel-pop-btn px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-thai font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
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
