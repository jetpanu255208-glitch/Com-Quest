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
import { createClient } from '@/lib/supabase/client';
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
  CheckCircle2,
  Sparkles,
  User,
  Gamepad2,
  Heart,
  IdCard,
} from 'lucide-react';

interface ProfileViewProps {
  initialProfile: Profile;
  initialLessons: Lesson[];
  initialLessonProgress: LessonProgress[];
  initialQuizAttempts?: QuizAttempt[];
  avatarUrl?: string | null;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  initialProfile,
  initialLessons,
  initialLessonProgress,
  avatarUrl,
}) => {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [lessonProgressList, setLessonProgressList] =
    useState<LessonProgress[]>(initialLessonProgress);

  // Character Config with instantaneous local-storage retrieval (0ms latency)
  const [characterConfig, setCharacterConfig] = useState<CharacterConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('com_quest_character_config');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            return { ...DEFAULT_CHARACTER_CONFIG, ...parsed };
          }
        }
      } catch {}
    }
    return initialProfile.character_config || DEFAULT_CHARACTER_CONFIG;
  });

  React.useEffect(() => {
    setProfile(initialProfile);
    setLessonProgressList(initialLessonProgress);
    if (initialProfile.character_config) {
      setCharacterConfig((prev) => ({
        ...DEFAULT_CHARACTER_CONFIG,
        ...(initialProfile.character_config as CharacterConfig),
      }));
    }
  }, [initialProfile, initialLessonProgress]);

  // Real-time synchronization of character wardrobe changes across tabs, routes, and events
  React.useEffect(() => {
    const syncFromStorage = (newConfig?: CharacterConfig) => {
      if (newConfig) {
        setCharacterConfig((prev) => ({
          ...DEFAULT_CHARACTER_CONFIG,
          ...newConfig,
        }));
        return;
      }
      try {
        const cached = localStorage.getItem('com_quest_character_config');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            setCharacterConfig((prev) => ({
              ...DEFAULT_CHARACTER_CONFIG,
              ...parsed,
            }));
          }
        }
      } catch {}
    };

    // Immediate sync on mount
    syncFromStorage();

    const handleCustomEvent = (e: Event) => {
      const customEvt = e as CustomEvent<CharacterConfig>;
      if (customEvt.detail) {
        syncFromStorage(customEvt.detail);
      } else {
        syncFromStorage();
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'com_quest_character_config' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') {
            setCharacterConfig((prev) => ({
              ...DEFAULT_CHARACTER_CONFIG,
              ...parsed,
            }));
          }
        } catch {}
      }
    };

    const handleFocus = () => {
      syncFromStorage();
    };

    window.addEventListener('comquest_character_updated', handleCustomEvent);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);

    // Also fetch latest profile from Supabase in background to guarantee cross-device consistency
    let isMounted = true;
    async function fetchLatestConfigFromSupabase() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: latestProfile } = await supabase
          .from('profiles')
          .select('character_config')
          .eq('id', session.user.id)
          .maybeSingle();

        if (isMounted && latestProfile?.character_config) {
          const fetchedConfig = latestProfile.character_config as CharacterConfig;
          setCharacterConfig((prev) => ({
            ...DEFAULT_CHARACTER_CONFIG,
            ...fetchedConfig,
          }));
          try {
            localStorage.setItem('com_quest_character_config', JSON.stringify(fetchedConfig));
          } catch {}
        }
      } catch {}
    }

    fetchLatestConfigFromSupabase();

    return () => {
      isMounted = false;
      window.removeEventListener('comquest_character_updated', handleCustomEvent);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Modal State for Editing Profile
  const [editingProfile, setEditingProfile] = useState(false);
  const [usernameInput, setUsernameInput] = useState(profile.username || '');
  const [studentIdInput, setStudentIdInput] = useState(profile.student_id || '');
  const [firstNameInput, setFirstNameInput] = useState(profile.first_name || '');
  const [lastNameInput, setLastNameInput] = useState(profile.last_name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    setUsernameInput(profile.username || '');
    setStudentIdInput(profile.student_id || '');
    setFirstNameInput(profile.first_name || '');
    setLastNameInput(profile.last_name || '');
  }, [profile.username, profile.student_id, profile.first_name, profile.last_name]);

  // Default selected lesson node to the next uncompleted lesson (or Lesson 1) so the detail card is always rich
  const defaultActiveLesson = React.useMemo(() => {
    const eightLessons = initialLessons.slice(0, 8);
    const nextUncompleted = eightLessons.find(
      (l) => !initialLessonProgress.some((p) => p.lesson_id === l.id && p.completed)
    );
    return nextUncompleted || eightLessons[eightLessons.length - 1] || eightLessons[0] || null;
  }, [initialLessons, initialLessonProgress]);

  const [selectedLessonNode, setSelectedLessonNode] = useState<Lesson | null>(defaultActiveLesson);

  // Stats calculation (new accounts start cleanly at LV.00 and 0 EXP)
  const completedCoinsCount = lessonProgressList.filter((p) => p.completed).length;
  const playerLevel = Math.min(completedCoinsCount * 100, 800);
  const currentLevelNumber = completedCoinsCount;
  const hasMasterTrophy = completedCoinsCount >= 8;
  const trophiesCount = hasMasterTrophy ? 1 : 0;
  const maxExp = 800;
  const expProgressPercent = Math.min(100, (playerLevel / maxExp) * 100);


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
        setProfileError(
          `รหัสนักเรียนต้องเป็นตัวเลขครบ 11 หลัก (คุณกรอกเพียง ${cleanId.length} หลัก)`
        );
        return;
      }
      if (cleanId.length > 11) {
        setProfileError(
          `รหัสนักเรียนต้องเป็นตัวเลขครบ 11 หลัก (คุณกรอกเกิน: ${cleanId.length} หลัก)`
        );
        return;
      }
    }

    try {
      setSavingProfile(true);
      const res = await saveStudentProfile({
        username: usernameInput,
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

  const activeLesson = selectedLessonNode || defaultActiveLesson;
  const isActiveLessonCompleted = activeLesson
    ? lessonProgressList.some((p) => p.lesson_id === activeLesson.id && p.completed)
    : false;

  return (
    <div className="relative w-full space-y-4 animate-in fade-in duration-300 select-none">
      {/* Subtle Ambient Radial Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--border-glow),transparent_70%)] pointer-events-none -z-10 opacity-40" />

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
          DESKTOP PROFILE VIEW (>= md: Redesigned Gamified Cyberpunk RPG HUD)
          ========================================================================= */}
      <div className="hidden md:block space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* -----------------------------------------------------------------------
              LEFT COLUMN: PLAYER IDENTITY & HOLOGRAPHIC AVATAR STAGE (lg:col-span-4)
              ----------------------------------------------------------------------- */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-[#101827]/95 border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_10px_35px_-5px_rgba(0,0,0,0.45),0_0_25px_rgba(0,207,239,0.08)] relative">
            {/* Decorative Top Neon Accent Line */}
            <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600" />

            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-5">
              {/* Top Card Header Badge + Role */}
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#151F30] border border-cyan-500/30 text-[#00CFEF] text-xs font-thai font-semibold shadow-sm">
                  <GraduationCap className="w-3.5 h-3.5 text-[#00CFEF]" />
                  <span>{profile.role === 'admin' ? 'คุณครูผู้สอน' : 'นักเรียน'}</span>
                </span>

                <button
                  type="button"
                  onClick={() => setEditingProfile(true)}
                  title="แก้ไขข้อมูลส่วนตัว"
                  className="px-2.5 py-1 rounded-lg bg-[#151F30] hover:bg-cyan-950/60 border border-[#263449] hover:border-cyan-400/50 text-slate-300 hover:text-cyan-300 text-xs font-thai flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>แก้ไข</span>
                </button>
              </div>

              {/* Holographic Character Showcase Stage */}
              <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#151F30] via-[#0f172a] to-[#090d16] border border-cyan-500/30 p-5 flex flex-col items-center justify-between overflow-hidden group shadow-inner">
                {/* Cyber Grid & Spotlight inside Stage */}
                <div className="absolute inset-0 cyber-grid-dense opacity-40 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-400/25 transition-all duration-500" />

                {/* Corner HUD Brackets */}
                <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t-2 border-l-2 border-cyan-400/60 pointer-events-none" />
                <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t-2 border-r-2 border-cyan-400/60 pointer-events-none" />
                <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b-2 border-l-2 border-cyan-400/60 pointer-events-none" />
                <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b-2 border-r-2 border-cyan-400/60 pointer-events-none" />

                {/* Character Sprite + Glowing Pedestal Ring */}
                <div className="relative z-10 py-2 flex flex-col items-center">
                  <PixelCharacter config={characterConfig} size={148} animate={true} />
                  {/* Hologram Pedestal Ring */}
                  <div className="w-28 h-3.5 -mt-2 rounded-full bg-cyan-400/25 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,207,239,0.5)]" />
                </div>

                {/* Customize Character Action Pill */}
                <Link
                  href="/character"
                  className="relative z-10 mt-3 w-full py-2 px-4 text-center rounded-xl bg-gradient-to-r from-[#101827] via-[#162238] to-[#101827] hover:from-cyan-500 hover:to-sky-500 border border-cyan-500/40 text-xs font-thai font-bold text-cyan-300 hover:text-slate-950 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,207,239,0.15)]"
                >
                  <Shirt className="w-4 h-4" />
                  <span>แต่งตัวละคร</span>
                </Link>
              </div>

              {/* Player Identity & Structured Info Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2.5">
                  {avatarUrl && (
                    <img
                      src={avatarUrl}
                      alt={profile.username || 'Google Avatar'}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border-2 border-[#00CFEF] shadow-[0_0_10px_rgba(0,207,239,0.35)] shrink-0"
                    />
                  )}
                  <h1 className="font-pixel text-2xl sm:text-3xl text-slate-100 tracking-wider drop-shadow-[0_2px_10px_rgba(0,207,239,0.2)]">
                    {profile.username || 'adventurer'}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(true)}
                    title="เปลี่ยนชื่อเล่น"
                    className="p-1.5 rounded-lg bg-[#151F30] hover:bg-cyan-950/70 border border-[#263449] hover:border-cyan-400/60 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Structured Identity Badges */}
                <div className="space-y-2 bg-[#151F30]/80 border border-[#263449] rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-thai">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <IdCard className="w-4 h-4 text-cyan-400" />
                      <span>รหัสนักเรียน:</span>
                    </span>
                    <span className="font-mono text-[#00CFEF] font-bold px-2.5 py-0.5 rounded-md bg-[#101827] border border-cyan-500/30">
                      {profile.student_id ? profile.student_id : 'ยังไม่ระบุ'}
                    </span>
                  </div>

                  {(profile.first_name || profile.last_name) && (
                    <div className="flex items-center justify-between text-xs sm:text-sm font-thai pt-2 border-t border-[#263449]/80">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-cyan-400" />
                        <span>ชื่อ-นามสกุล:</span>
                      </span>
                      <span className="text-slate-100 font-semibold truncate max-w-[180px]">
                        {displayName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Settings Button */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setEditingProfile(true)}
                  className="w-full py-3 px-4 rounded-xl bg-[#151F30] hover:bg-[#1c2a42] border border-[#263449] hover:border-cyan-500/50 text-slate-200 font-thai font-semibold text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
                    <span>ตั้งค่าข้อมูลบัญชี</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="md:hidden">
                  <LogoutButton variant="red" className="w-full justify-center py-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------------
              RIGHT COLUMN: LEVEL, STATS & 8-LESSON ROADMAP (lg:col-span-8)
              ----------------------------------------------------------------------- */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-5">
            {/* UPPER RIGHT CARD: LEVEL, EXP & 3 STATISTICS */}
            <div className="bg-[#101827]/95 border border-cyan-500/30 rounded-2xl p-5 sm:p-6 space-y-5 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.4)] relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Level & EXP Progress Box */}
              <div className="p-4 rounded-xl bg-[#151F30]/90 border border-[#263449] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,207,239,0.2)]">
                      <span className="font-pixel text-2xl sm:text-3xl text-slate-100 tracking-wider">
                        LV.{currentLevelNumber < 10 ? `0${currentLevelNumber}` : currentLevelNumber}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="inline-block text-[10px] font-mono font-bold text-[#00CFEF] px-2 py-0.5 rounded bg-[#101827] border border-cyan-500/30 uppercase tracking-widest">
                        RANK
                      </span>
                      <div className="text-xs font-thai text-slate-300 font-medium">
                        {completedCoinsCount >= 8
                          ? 'ปรมาจารย์ HTML5 (Master)'
                          : completedCoinsCount >= 4
                          ? 'นักพัฒนาเว็บระดับกลาง'
                          : 'นักผจญภัยฝึกหัด'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-[#00CFEF] font-extrabold text-base sm:text-lg">
                      {playerLevel} / {maxExp} EXP
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      ความสำเร็จ {Math.round(expProgressPercent)}%
                    </div>
                  </div>
                </div>

                {/* Segmented RPG EXP Bar */}
                <div className="relative w-full h-3.5 bg-[#0b111e] rounded-full overflow-hidden border border-[#263449] p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 shadow-[0_0_12px_rgba(0,207,239,0.6)] transition-all duration-700 ease-out"
                    style={{ width: `${expProgressPercent}%` }}
                  />
                  {/* 8 Segment Dividers */}
                  <div className="absolute inset-0 grid grid-cols-8 pointer-events-none">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="border-r border-[#101827]/70 last:border-r-0 h-full"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span>START (0 EXP)</span>
                  <span className="text-[#00CFEF] font-semibold">
                    {completedCoinsCount >= 8 ? '★ MAX LEVEL REACHED' : '+100 EXP ต่อบทเรียน'}
                  </span>
                  <span>MAX (800 EXP)</span>
                </div>
              </div>

              {/* Player Statistics Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-100 font-thai font-bold text-sm">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>สถิติการเรียนรู้ (Player Statistics)</span>
                </div>

                {/* 3 Styled RPG Stat Cards */}
                <div className="grid grid-cols-3 gap-3.5">
                  {/* 1. LESSONS */}
                  <div className="p-4 rounded-xl bg-gradient-to-b from-[#151F30] to-[#101827] border border-cyan-500/30 hover:border-cyan-400/60 transition-all flex items-center gap-3.5 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-[#00CFEF] shrink-0 shadow-[0_0_15px_rgba(0,207,239,0.2)]">
                      <BookOpen className="w-6 h-6 text-[#00CFEF]" />
                    </div>
                    <div>
                      <div className="font-pixel text-xl sm:text-2xl text-slate-100">
                        {completedCoinsCount} / 8
                      </div>
                      <div className="text-xs font-thai text-slate-400 font-medium">
                        บทเรียนที่ผ่าน
                      </div>
                    </div>
                  </div>

                  {/* 2. COINS */}
                  <div className="p-4 rounded-xl bg-gradient-to-b from-[#151F30] to-[#101827] border border-amber-500/30 hover:border-amber-400/60 transition-all flex items-center gap-3.5 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-amber-400" aria-hidden="true">
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          fill="#f59e0b"
                          stroke="#fef08a"
                          strokeWidth="1.5"
                        />
                        <circle cx="12" cy="12" r="6" fill="#fbbf24" />
                        <text
                          x="12"
                          y="15"
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill="#78350f"
                          fontFamily="sans-serif"
                        >
                          S
                        </text>
                      </svg>
                    </div>
                    <div>
                      <div className="font-pixel text-xl sm:text-2xl text-amber-300">
                        {completedCoinsCount}
                      </div>
                      <div className="text-xs font-thai text-slate-400 font-medium">
                        เหรียญที่ได้รับ
                      </div>
                    </div>
                  </div>

                  {/* 3. TROPHIES */}
                  <div className="p-4 rounded-xl bg-gradient-to-b from-[#151F30] to-[#101827] border border-yellow-500/30 hover:border-yellow-400/60 transition-all flex items-center gap-3.5 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-yellow-950/50 border border-yellow-500/40 flex items-center justify-center text-yellow-300 shrink-0 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                      <Trophy className="w-6 h-6 text-yellow-300 fill-yellow-400" />
                    </div>
                    <div>
                      <div className="font-pixel text-xl sm:text-2xl text-yellow-300">
                        {trophiesCount}
                      </div>
                      <div className="text-xs font-thai text-slate-400 font-medium">
                        ถ้วยรางวัล
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LOWER RIGHT CARD: LEARNING PROGRESS & 8-LESSON QUEST ROADMAP */}
            <div className="flex-1 bg-[#101827]/95 border border-cyan-500/30 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.4)]">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-100 font-thai font-bold text-sm">
                  <Flag className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>ความก้าวหน้าบทเรียน (Lesson Progress)</span>
                </div>
                <div className="text-xs font-mono font-bold text-[#00CFEF] px-3 py-1 rounded-lg bg-[#151F30] border border-cyan-500/30 w-fit">
                  HTML5 • {completedCoinsCount}/8 บท
                </div>
              </div>

              {/* 8-Stage Interactive Quest Roadmap */}
              <div className="relative py-3 px-1">
                {/* 8 Nodes Grid with Non-Overlapping Gap Connectors */}
                <div className="relative z-10 grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4 text-center">
                  {initialLessons.slice(0, 8).map((lesson, idx, arr) => {
                    const isCompleted = lessonProgressList.some(
                      (p) => p.lesson_id === lesson.id && p.completed
                    );
                    const nextLesson = arr[idx + 1];
                    const isNextCompleted = nextLesson
                      ? lessonProgressList.some(
                          (p) => p.lesson_id === nextLesson.id && p.completed
                        )
                      : false;
                    const isNextSelected = nextLesson
                      ? activeLesson?.id === nextLesson.id
                      : false;
                    const lessonNum = lesson.lesson_number || idx + 1;
                    const isSelected = activeLesson?.id === lesson.id;

                    return (
                      <div key={lesson.id} className="relative flex items-center">
                        <button
                          type="button"
                          onClick={() => setSelectedLessonNode(lesson)}
                          className={`w-full flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer group ${
                            isSelected
                              ? 'bg-[#151F30] border-[#00CFEF] shadow-[0_0_15px_rgba(0,207,239,0.25)] -translate-y-0.5'
                              : isCompleted
                              ? 'bg-[#1a1917] border-amber-500/45 hover:border-amber-400'
                              : 'bg-[#131c2e] border-[#263449] hover:border-slate-500'
                          }`}
                        >
                          <div
                            className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-gradient-to-b from-amber-500/25 to-amber-600/20 border-2 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                                : isSelected
                                ? 'bg-cyan-950 border-2 border-[#00CFEF] text-[#00CFEF]'
                                : 'bg-[#101827] border border-[#263449] text-slate-400 group-hover:border-slate-400'
                            }`}
                          >
                            <BookOpen
                              className={`w-5 h-5 ${
                                isCompleted
                                  ? 'text-amber-300 fill-amber-300/30'
                                  : isSelected
                                  ? 'text-[#00CFEF]'
                                  : 'text-slate-400'
                              }`}
                            />
                            {isCompleted && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                                <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                              </span>
                            )}
                          </div>

                          {/* Label: บทที่ X */}
                          <span
                            className={`mt-1.5 text-xs font-thai font-semibold ${
                              isCompleted
                                ? 'text-amber-300'
                                : isSelected
                                ? 'text-[#00CFEF]'
                                : 'text-slate-400'
                            }`}
                          >
                            บทที่ {lessonNum}
                          </span>
                        </button>

                        {/* Connector segment strictly inside the gap between cards (no overlap) */}
                        {idx < arr.length - 1 && (
                          <div
                            aria-hidden="true"
                            className={`${
                              idx === 3 ? 'hidden sm:flex' : 'flex'
                            } items-center justify-center absolute left-full top-[30px] -translate-y-1/2 w-3 sm:w-4 px-0.5 sm:px-1 pointer-events-none z-0`}
                          >
                            <div
                              className={`w-full h-1 rounded-full transition-all duration-500 ${
                                isCompleted && isNextCompleted
                                  ? 'bg-gradient-to-r from-amber-400 to-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.55)]'
                                  : isCompleted && (isNextSelected || !isNextCompleted)
                                  ? 'bg-gradient-to-r from-amber-400 to-[#00CFEF] shadow-[0_0_8px_rgba(0,207,239,0.5)]'
                                  : 'bg-[#263449]'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Lesson Interactive Action Banner (Always visible for a complete, rich card) */}
              {activeLesson && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#151F30] via-[#131d31] to-[#151F30] border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-thai">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="font-bold text-slate-100 text-sm">
                        บทที่ {activeLesson.lesson_number}: {activeLesson.title}
                      </span>
                      {isActiveLessonCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[11px] font-semibold">
                          ★ ผ่านแล้ว (+100 EXP)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#101827] border border-cyan-500/40 text-cyan-300 text-[11px]">
                          พร้อมเข้าเรียน
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs line-clamp-1">
                      {activeLesson.description}
                    </p>
                  </div>

                  <Link
                    href={`/learn/${activeLesson.id}`}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00CFEF] to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-[#080D1A] font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-[0_0_15px_rgba(0,207,239,0.35)] transition-all"
                  >
                    <span>{isActiveLessonCompleted ? 'ทบทวนบทเรียน' : 'เข้าสู่บทเรียน'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Special Bonus Mario Game Unlock Banner (Appears when all 8 lessons are completed or admin) */}
              {(completedCoinsCount >= 8 || profile.role === 'admin') && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/45 via-[#171d32] to-indigo-950/45 border-2 border-amber-400/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-thai shadow-[0_0_25px_rgba(245,158,11,0.2)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                      <Gamepad2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-amber-200 text-xs sm:text-sm">
                          ปลดล็อกเมนูเกมพิเศษแล้ว: SUPER HTML TAG RUNNER
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[10px] font-mono font-bold inline-flex items-center gap-1">
                          <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                          3 ดวง
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-0.5">
                        ผ่านครบทั้ง 8 บทแล้ว! กดเข้าสู่โหมดเกมเต็มหน้าจอแนวนอนเพื่อตะลุยด่านมาริโอ้ HTML ทั้ง 5 ด่านได้เลย
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/quest"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    <span>เข้าเล่นเกมพิเศษ (เต็มจอแนวนอน)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            BOTTOM FOOTER BAR: SLEEPING CAT STATUS BAR
            ========================================================================= */}
        <div className="px-4 py-2.5 rounded-xl bg-[#101827]/80 border border-[#263449] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center mt-1">
              <div className="absolute -top-3 -right-1 text-cyan-300 font-pixel text-[9px] font-bold animate-sleep-z1 pointer-events-none">
                z
              </div>
              <div className="absolute -top-6 right-1 text-cyan-200 font-pixel text-[11px] font-bold animate-sleep-z2 pointer-events-none">
                Z
              </div>
              <div className="absolute -top-9 right-3 text-cyan-100 font-pixel text-xs font-bold animate-sleep-z3 pointer-events-none">
                Z
              </div>

              <svg
                viewBox="0 0 36 24"
                className="w-10 h-6"
                shapeRendering="crispEdges"
                aria-label="Sleeping Cat"
              >
                <rect x="6" y="8" width="22" height="12" rx="4" fill="#60a5fa" />
                <rect x="8" y="10" width="18" height="8" fill="#93c5fd" />
                <circle cx="9" cy="11" r="6" fill="#3b82f6" />
                <polygon points="5,6 8,1 10,7" fill="#1d4ed8" />
                <polygon points="9,6 12,2 13,8" fill="#1d4ed8" />
                <path
                  d="M 6 11 Q 8 13 10 11"
                  stroke="#1e3a8a"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M 27 16 C 31 16 33 11 31 9"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-xs font-thai text-slate-400">
              ระบบจัดเก็บสถิติเรียลไทม์ พร้อมลุยเควสต์ต่อไป
            </span>
          </div>

          <Link
            href="/subjects"
            className="text-xs font-thai font-semibold text-[#00CFEF] hover:underline flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ไปหน้าวิชาเรียนทั้งหมด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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

            <ErrorMessage
              message={profileError}
              onDismiss={() => setProfileError(null)}
              className="mb-4"
            />

            <form onSubmit={handleSaveProfileInfo} className="space-y-4">
              <FormInput
                label="ชื่อเล่น / ชื่อตัวละคร (Nickname)"
                id="editUsername"
                name="username"
                placeholder="เช่น Achi, Ball, น้องบอล"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                helperText="ชื่อเล่นที่จะแสดงใต้ตัวละครของคุณ (ตั้งเป็นภาษาไทยหรืออังกฤษก็ได้)"
                disabled={savingProfile}
              />

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
