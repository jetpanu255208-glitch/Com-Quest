'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StudentNav } from '@/components/layout/StudentNav';
import { Footer } from '@/components/layout/Footer';
import { PixelCharacter } from '@/components/character/PixelCharacter';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { createClient } from '@/lib/supabase/client';
import {
  CharacterConfig,
  DEFAULT_CHARACTER_CONFIG,
  OFFICIAL_HTML_LESSONS,
} from '@/lib/supabase/types';
import {
  playSelectSound,
  playClearSound,
  playHurtSound,
} from '@/lib/sound/sound-manager';
import {
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Save,
  CheckCircle2,
  Palette,
  Shirt,
  Scissors,
  Smile,
  Glasses,
  Lock,
  Trophy,
  BookOpen,
  ArrowRight,
  Star,
} from 'lucide-react';

// ============================================================================
// LEVEL-LOCKED WARDROBE CATALOG (LV.0 TO LV.8 QUEST PROGRESSION)
// ============================================================================
interface WardrobeHairStyle {
  id: string;
  label: string;
  requiredLevel: number;
  rarity: string;
}

interface WardrobeHairColor {
  id: string;
  label: string;
  color: string;
  requiredLevel: number;
  rarity: string;
}

interface WardrobeSkinTone {
  id: string;
  label: string;
  color: string;
  requiredLevel: number;
}

interface WardrobeOutfit {
  id: string;
  label: string;
  color: string;
  tie: string;
  desc: string;
  requiredLevel: number;
  rarity: string;
}

interface WardrobeAccessory {
  id: string;
  label: string;
  desc: string;
  requiredLevel: number;
  rarity: string;
}

const HAIR_STYLES: WardrobeHairStyle[] = [
  { id: 'short-neat', label: 'ผมสั้นเรียบ (Short Neat)', requiredLevel: 0, rarity: 'STARTER' },
  { id: 'bob-cut', label: 'บ็อบสั้นน่ารัก (Bob Cut)', requiredLevel: 0, rarity: 'STARTER' },
  { id: 'side-part', label: 'แสกข้างแฟชั่น (Side Part)', requiredLevel: 1, rarity: 'QUEST LV.1' },
  { id: 'ponytail', label: 'หางม้าซน (Ponytail)', requiredLevel: 2, rarity: 'QUEST LV.2' },
  { id: 'bowl-cut', label: 'หน้าม้ากลม (Bowl Cut)', requiredLevel: 3, rarity: 'QUEST LV.3' },
  { id: 'top-bun', label: 'มวยผมสูง (Top Bun)', requiredLevel: 4, rarity: 'QUEST LV.4' },
  { id: 'slick-part', label: 'แสกกลางเท่ (Slick Part)', requiredLevel: 6, rarity: 'EPIC LV.6' },
  { id: 'long-wavy', label: 'ผมยาวลอน (Long Wavy)', requiredLevel: 7, rarity: 'EPIC LV.7' },
];

const HAIR_COLORS: WardrobeHairColor[] = [
  { id: 'black', label: 'ดำธรรมชาติ (Black)', color: '#2b262d', requiredLevel: 0, rarity: 'STARTER' },
  { id: 'chestnut', label: 'น้ำตาลเกาลัด (Chestnut)', color: '#593231', requiredLevel: 0, rarity: 'STARTER' },
  { id: 'caramel', label: 'น้ำตาลคาราเมล (Caramel)', color: '#945747', requiredLevel: 2, rarity: 'QUEST LV.2' },
  { id: 'indigo', label: 'น้ำเงินคราม (Indigo)', color: '#34304d', requiredLevel: 4, rarity: 'QUEST LV.4' },
  { id: 'cyber-cyan', label: 'ไซเบอร์ไซอัน (Cyber Cyan)', color: '#00c8e0', requiredLevel: 6, rarity: 'EPIC LV.6' },
  { id: 'golden', label: 'บลอนด์ทอง (Golden)', color: '#c8912e', requiredLevel: 8, rarity: 'MASTER LV.8' },
];

const SKIN_TONES: WardrobeSkinTone[] = [
  { id: 'fair', label: 'ผิวขาวอมชมพู (Fair)', color: '#fce0cb', requiredLevel: 0 },
  { id: 'warm', label: 'ผิวขาวเหลือง (Warm)', color: '#f4cca1', requiredLevel: 0 },
  { id: 'tan', label: 'ผิวสองสี (Tan)', color: '#e2a774', requiredLevel: 0 },
  { id: 'caramel', label: 'ผิวสีน้ำผึ้ง (Caramel)', color: '#b87d52', requiredLevel: 0 },
];

const OUTFITS: WardrobeOutfit[] = [
  {
    id: 'academy-navy',
    label: 'เครื่องแบบสีกรมท่า (Academy Navy)',
    color: '#232a3d',
    tie: '#2563eb',
    desc: 'ชุดเครื่องแบบนักเรียนเริ่มต้น',
    requiredLevel: 0,
    rarity: 'STARTER',
  },
  {
    id: 'casual-charcoal',
    label: 'สเวตเตอร์ชาร์โคล (Casual Charcoal)',
    color: '#38353d',
    tie: '#64748b',
    desc: 'ปลดล็อกเมื่อผ่านบทที่ 2 (LV.2)',
    requiredLevel: 2,
    rarity: 'QUEST LV.2',
  },
  {
    id: 'explorer-khaki',
    label: 'ชุดนักสำรวจกากี (Explorer Khaki)',
    color: '#56534f',
    tie: '#dc2626',
    desc: 'ปลดล็อกเมื่อผ่านบทที่ 4 (LV.4)',
    requiredLevel: 4,
    rarity: 'QUEST LV.4',
  },
  {
    id: 'cyber-purple',
    label: 'ไซเบอร์สูทม่วง (Cyber Purple)',
    color: '#352945',
    tie: '#a855f7',
    desc: 'ปลดล็อกเมื่อผ่านบทที่ 6 (LV.6)',
    requiredLevel: 6,
    rarity: 'EPIC LV.6',
  },
  {
    id: 'sci-fi-cyan',
    label: 'ชุดล้ำยุคเทคแวร์ (Sci-Fi Cyan)',
    color: '#0f2838',
    tie: '#00f0ff',
    desc: 'ชุดระดับตำนาน ปลดล็อกเมื่อจบครบ 8 บท (LV.8)',
    requiredLevel: 8,
    rarity: 'MASTER LV.8',
  },
];

const ACCESSORIES: WardrobeAccessory[] = [
  {
    id: 'none',
    label: 'ไม่ใส่เครื่องประดับ (None)',
    desc: 'ค่าเริ่มต้น',
    requiredLevel: 0,
    rarity: 'STARTER',
  },
  {
    id: 'glasses',
    label: 'แว่นตานักเรียน (Glasses)',
    desc: 'ปลดล็อกเมื่อผ่านบทที่ 1 (LV.1)',
    requiredLevel: 1,
    rarity: 'QUEST LV.1',
  },
  {
    id: 'cyber-headband',
    label: 'เฮดแบนด์นีออน (Cyber Headband)',
    desc: 'ปลดล็อกเมื่อผ่านบทที่ 3 (LV.3)',
    requiredLevel: 3,
    rarity: 'QUEST LV.3',
  },
  {
    id: 'cat-ears',
    label: 'หูแมวพิกเซล (Cat Ears)',
    desc: 'ปลดล็อกเมื่อผ่านบทที่ 5 (LV.5)',
    requiredLevel: 5,
    rarity: 'EPIC LV.5',
  },
  {
    id: 'headset',
    label: 'หูฟังเกมเมอร์ (Gaming Headset)',
    desc: 'ไอเทมระดับตำนาน ปลดล็อกเมื่อจบครบ 8 บท (LV.8)',
    requiredLevel: 8,
    rarity: 'MASTER LV.8',
  },
];

export default function CharacterCustomizationPage() {
  const router = useRouter();
  const [config, setConfig] = useState<CharacterConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('com_quest_character_config');
        if (cached) {
          return { ...DEFAULT_CHARACTER_CONFIG, ...JSON.parse(cached) };
        }
      } catch {}
    }
    return DEFAULT_CHARACTER_CONFIG;
  });

  // Player Level (0 to 8 based on completed lessons)
  const [playerLevel, setPlayerLevel] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedLv = localStorage.getItem('com_quest_player_level');
        if (cachedLv !== null) {
          const parsed = Number(cachedLv);
          if (!Number.isNaN(parsed)) return Math.max(0, Math.min(8, parsed));
        }
      } catch {}
    }
    return 0;
  });

  const [username, setUsername] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedNotice, setLockedNotice] = useState<{
    itemName: string;
    requiredLevel: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'hair' | 'skin' | 'outfit' | 'accessory'>('hair');

  // Load existing character_config and student level from Supabase
  useEffect(() => {
    async function loadCharacterAndLevel() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;

        if (!user) {
          router.push('/login');
          return;
        }

        const [profileRes, progressRes, quizRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('username, role, character_config')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('lesson_progress')
            .select('lesson_id, completed')
            .eq('user_id', user.id)
            .eq('completed', true),
          supabase
            .from('quiz_attempts')
            .select('lesson_id, passed')
            .eq('user_id', user.id)
            .eq('passed', true),
        ]);

        const profile = profileRes.data;
        if (profile?.username) {
          setUsername(profile.username);
        }

        // Calculate completed lessons count (0 - 8)
        const completedIds = new Set<string>();
        progressRes.data?.forEach((p) => {
          if (p.completed) completedIds.add(p.lesson_id);
        });
        quizRes.data?.forEach((q) => {
          if (q.passed) completedIds.add(q.lesson_id);
        });

        let completedCount = 0;
        OFFICIAL_HTML_LESSONS.forEach((l) => {
          if (completedIds.has(l.id)) completedCount += 1;
        });

        const computedLevel = profile?.role === 'admin' ? 8 : Math.min(8, completedCount);
        setPlayerLevel(computedLevel);
        try {
          localStorage.setItem('com_quest_player_level', String(computedLevel));
        } catch {}

        if (profile?.character_config) {
          const rawConfig = {
            ...DEFAULT_CHARACTER_CONFIG,
            ...(profile.character_config as CharacterConfig),
          };

          // Ensure equipped items respect current unlocked level (fallback to starter if locked)
          const hairObj = HAIR_STYLES.find((h) => h.id === rawConfig.hairStyle);
          const colorObj = HAIR_COLORS.find((c) => c.id === rawConfig.hairColor);
          const outfitObj = OUTFITS.find((o) => o.id === rawConfig.outfit);
          const accObj = ACCESSORIES.find((a) => a.id === rawConfig.accessory);

          const sanitizedConfig: CharacterConfig = {
            ...rawConfig,
            hairStyle:
              hairObj && hairObj.requiredLevel <= computedLevel
                ? rawConfig.hairStyle
                : DEFAULT_CHARACTER_CONFIG.hairStyle,
            hairColor:
              colorObj && colorObj.requiredLevel <= computedLevel
                ? rawConfig.hairColor
                : DEFAULT_CHARACTER_CONFIG.hairColor,
            outfit:
              outfitObj && outfitObj.requiredLevel <= computedLevel
                ? rawConfig.outfit
                : DEFAULT_CHARACTER_CONFIG.outfit,
            accessory:
              accObj && accObj.requiredLevel <= computedLevel
                ? rawConfig.accessory
                : DEFAULT_CHARACTER_CONFIG.accessory,
          };

          setConfig(sanitizedConfig);
          try {
            localStorage.setItem('com_quest_character_config', JSON.stringify(sanitizedConfig));
          } catch {}
        }
      } catch (err) {
        console.error('Error fetching character config:', err);
      }
    }

    loadCharacterAndLevel();
  }, [router]);

  const handleLockedClick = (itemName: string, requiredLevel: number) => {
    playHurtSound();
    setLockedNotice({ itemName, requiredLevel });
  };

  const handleSelectItem = (
    category: keyof CharacterConfig,
    value: string,
    itemName: string,
    requiredLevel: number
  ) => {
    if (playerLevel < requiredLevel) {
      handleLockedClick(itemName, requiredLevel);
      return;
    }
    playSelectSound();
    setLockedNotice(null);
    setConfig((prev) => ({ ...prev, [category]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        setError('กรุณาเข้าสู่ระบบก่อนบันทึกตัวละคร');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          character_config: config,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      try {
        localStorage.setItem('com_quest_character_config', JSON.stringify(config));
      } catch {}

      playClearSound();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกตัวละคร';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    playSelectSound();
    setLockedNotice(null);
    setConfig(DEFAULT_CHARACTER_CONFIG);
  };

  // Calculate total unlocked items & next level rewards
  const wardrobeStats = useMemo(() => {
    const allItems = [
      ...HAIR_STYLES.map((i) => ({ name: i.label, req: i.requiredLevel })),
      ...HAIR_COLORS.map((i) => ({ name: i.label, req: i.requiredLevel })),
      ...SKIN_TONES.map((i) => ({ name: i.label, req: i.requiredLevel })),
      ...OUTFITS.map((i) => ({ name: i.label, req: i.requiredLevel })),
      ...ACCESSORIES.map((i) => ({ name: i.label, req: i.requiredLevel })),
    ];
    const unlockedCount = allItems.filter((i) => i.req <= playerLevel).length;
    const nextLevel = playerLevel < 8 ? playerLevel + 1 : null;
    const nextLevelItems = nextLevel
      ? allItems.filter((i) => i.req === nextLevel).map((i) => i.name.split(' ')[0])
      : [];

    return {
      totalCount: allItems.length,
      unlockedCount,
      nextLevel,
      nextLevelItems,
    };
  }, [playerLevel]);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-dark)] text-[var(--text-primary)] transition-colors duration-200 relative">
      <StudentNav username={username} level={playerLevel * 100} />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 relative z-10 space-y-5">
        {/* Top Header */}
        <ScrollReveal className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>CHARACTER WARDROBE • LEVEL UNLOCK SYSTEM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-cyber font-bold text-white tracking-wide">
              แต่งตัวละคร RPG ของคุณ
            </h1>
            <p className="text-xs sm:text-sm font-thai text-slate-400 mt-0.5">
              ทำเควสต์บทเรียนและปราบบอสเพื่ออัปเลเวล (LV.1 – LV.8) และปลดล็อกทรงผม ชุดเกราะ และเครื่องประดับสุดแรร์ตามลำดับเลเวล!
            </p>
          </div>

          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-cyber transition-all shrink-0 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับไปยังโปรไฟล์ (Back to Profile)</span>
          </Link>
        </ScrollReveal>

        {/* =====================================================================
            QUEST LEVEL & WARDROBE UNLOCK PROGRESS BAR BANNER
            ===================================================================== */}
        <ScrollReveal delay={40}>
          <div className="rounded-2xl bg-[#101827]/95 border border-cyan-500/35 p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Current Level Badge & EXP */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-blue-600/20 border-2 border-cyan-400 flex flex-col items-center justify-center shrink-0 shadow-[0_0_20px_rgba(0,207,239,0.25)]">
                <span className="text-[9px] font-mono text-cyan-300 uppercase">LEVEL</span>
                <span className="font-pixel text-base sm:text-lg text-white font-bold">
                  0{playerLevel}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm sm:text-base font-cyber font-bold text-white">
                    เลเวลปัจจุบันของคุณ: LV.0{playerLevel} ({playerLevel * 100} / 800 EXP)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      ปลดล็อกไอเทมแล้ว {wardrobeStats.unlockedCount}/{wardrobeStats.totalCount} ชิ้น
                    </span>
                  </span>
                </div>

                {wardrobeStats.nextLevel ? (
                  <p className="text-xs font-thai text-slate-300">
                    🎯 <strong className="text-cyan-300">เควสต์ปลดล็อกถัดไป (LV.0{wardrobeStats.nextLevel}):</strong>{' '}
                    ผ่านบทเรียนที่ {wardrobeStats.nextLevel} เพื่อปลดล็อก{' '}
                    <span className="text-amber-300 font-semibold">
                      {wardrobeStats.nextLevelItems.join(', ')}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs font-thai text-emerald-300 font-semibold">
                    ★ ยินดีด้วย! คุณเลเวลสูงสุด (LV.08 MASTER) และปลดล็อกไอเทมแต่งตัวครบทุกชิ้นแล้ว!
                  </p>
                )}
              </div>
            </div>

            {/* Right: 8-Level Milestone Mini Track + Link to Quests */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-1 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((lv) => {
                  const isCleared = playerLevel >= lv;
                  return (
                    <div
                      key={lv}
                      title={`LV.0${lv} (บทที่ ${lv})`}
                      className={`w-6 h-6 rounded-lg font-mono text-[10px] font-bold flex items-center justify-center border transition-all ${
                        isCleared
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                          : 'bg-slate-900 border-slate-800 text-slate-600'
                      }`}
                    >
                      {isCleared ? `L${lv}` : <Lock className="w-2.5 h-2.5" />}
                    </div>
                  );
                })}
              </div>

              {playerLevel < 8 && (
                <Link
                  href="/subjects"
                  className="px-3.5 py-2 rounded-xl bg-[#00CFEF] hover:bg-cyan-300 text-slate-950 font-thai font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,207,239,0.3)] transition-all"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>ไปทำเควสต์อัปเลเวล</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* Feedback alerts */}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-sm font-thai flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.25)] animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>บันทึกตัวละครเรียบร้อยแล้ว! ข้อมูลจะแสดงผลบนโปรไฟล์และในฉากเกมของคุณทันที</span>
          </div>
        )}

        {/* Locked Item Quest Notice Toast */}
        {lockedNotice && (
          <div className="p-3.5 rounded-xl bg-amber-950/85 border-2 border-amber-400/70 text-amber-200 text-xs sm:text-sm font-thai flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_25px_rgba(245,158,11,0.3)] animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white">{lockedNotice.itemName}</strong> ยังล็อคอยู่! ต้องมีระดับเลเวล{' '}
                <strong className="text-amber-300 font-mono">
                  LV.0{lockedNotice.requiredLevel} ({lockedNotice.requiredLevel * 100} EXP)
                </strong>{' '}
                ขึ้นไป (เคลียร์บทเรียนที่ {lockedNotice.requiredLevel} เพื่อปลดล็อก)
              </div>
            </div>
            <Link
              href="/subjects"
              className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-thai font-bold text-xs flex items-center gap-1.5 shrink-0 w-fit"
            >
              <span>ไปลุยบทที่ {lockedNotice.requiredLevel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        <ErrorMessage message={error} onDismiss={() => setError(null)} />

        {/* Workspace: 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT: Character Live Preview Stage (5 cols) */}
          <ScrollReveal delay={75} scale={true} className="lg:col-span-5">
            <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-cyan-500/40 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_35px_rgba(0,240,255,0.15)]">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500" />
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400/90 px-3 py-1 rounded bg-cyan-950/60 border border-cyan-500/30">
                  LIVE SPRITE PREVIEW
                </span>
                <span className="text-[11px] font-mono font-bold text-amber-300 px-2.5 py-1 rounded bg-amber-950/60 border border-amber-500/40">
                  LV.0{playerLevel}
                </span>
              </div>

              {/* Pedestal & Character */}
              <div className="relative py-6 flex items-center justify-center">
                <div className="absolute bottom-2 w-36 h-8 bg-cyan-500/20 rounded-[100%] blur-md animate-pulse" />
                <div className="relative z-10 transition-all duration-300">
                  <PixelCharacter config={config} size={172} animate={true} />
                </div>
              </div>

              {/* Character summary specs */}
              <div className="w-full mt-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs font-thai text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">ทรงผม:</span>
                  <span className="font-semibold text-white">
                    {HAIR_STYLES.find((h) => h.id === config.hairStyle)?.label.split(' ')[0]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">สีผม:</span>
                  <span className="font-semibold text-white">
                    {HAIR_COLORS.find((c) => c.id === config.hairColor)?.label.split(' ')[0]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ชุดตัวละคร:</span>
                  <span className="font-semibold text-white">
                    {OUTFITS.find((o) => o.id === config.outfit)?.label.split(' ')[0]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">เครื่องประดับ:</span>
                  <span className="font-semibold text-white">
                    {ACCESSORIES.find((a) => a.id === config.accessory)?.label.split(' ')[0]}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full mt-5 space-y-3">
                <PrimaryButton
                  onClick={handleSave}
                  loading={saving}
                  disabled={saving}
                  fullWidth
                  size="lg"
                  icon={<Save className="w-4 h-4" />}
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง (Save Changes)'}
                </PrimaryButton>

                <div className="grid grid-cols-2 gap-3">
                  <SecondaryButton
                    onClick={handleReset}
                    size="md"
                    fullWidth
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    คืนค่าเริ่มต้น
                  </SecondaryButton>
                  <SecondaryButton href="/profile" size="md" fullWidth>
                    เสร็จสิ้น
                  </SecondaryButton>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* RIGHT: Customization Categories & Control Panels (7 cols) */}
          <ScrollReveal delay={150} className="lg:col-span-7">
            <div className="glass-panel rounded-2xl p-5 sm:p-7 border border-slate-800 space-y-6">
              {/* Category Tab Selector */}
              <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    playSelectSound();
                    setActiveTab('hair');
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-cyber tracking-wide transition-all cursor-pointer ${
                    activeTab === 'hair'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 font-bold shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>ทรงผม & สีผม</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playSelectSound();
                    setActiveTab('skin');
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-cyber tracking-wide transition-all cursor-pointer ${
                    activeTab === 'skin'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 font-bold shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <Smile className="w-3.5 h-3.5" />
                  <span>สีผิว</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playSelectSound();
                    setActiveTab('outfit');
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-cyber tracking-wide transition-all cursor-pointer ${
                    activeTab === 'outfit'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 font-bold shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <Shirt className="w-3.5 h-3.5" />
                  <span>ชุดตัวละคร</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playSelectSound();
                    setActiveTab('accessory');
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-cyber tracking-wide transition-all cursor-pointer ${
                    activeTab === 'accessory'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 font-bold shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <Glasses className="w-3.5 h-3.5" />
                  <span>เครื่องประดับ</span>
                </button>
              </div>

              {/* ===============================================================
                  TAB CONTENT 1: HAIRSTYLE & HAIR COLOR (LEVEL LOCKED)
                  =============================================================== */}
              {activeTab === 'hair' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-cyber font-bold text-white flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-cyan-400" />
                        <span>เลือกทรงผม (Hairstyle)</span>
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400">
                        ปลดล็อกแล้ว {HAIR_STYLES.filter((h) => h.requiredLevel <= playerLevel).length}/{HAIR_STYLES.length} ทรง
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {HAIR_STYLES.map((h) => {
                        const isSelected = config.hairStyle === h.id;
                        const isLocked = playerLevel < h.requiredLevel;

                        return (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() =>
                              handleSelectItem('hairStyle', h.id, h.label, h.requiredLevel)
                            }
                            className={`relative p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-2 overflow-hidden ${
                              isSelected
                                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.3)] ring-2 ring-cyan-400/40'
                                : isLocked
                                ? 'bg-slate-950/80 border-slate-800/80 text-slate-500 hover:border-amber-500/40'
                                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {/* Top Level / Unlock Badge */}
                            <div className="w-full flex items-center justify-between text-[9px] font-mono">
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold ${
                                  isLocked
                                    ? 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
                                    : h.requiredLevel === 0
                                    ? 'bg-slate-800 text-slate-300'
                                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {h.requiredLevel === 0 ? 'STARTER' : `LV.${h.requiredLevel}`}
                              </span>
                              {isLocked ? (
                                <Lock className="w-3 h-3 text-amber-400" />
                              ) : isSelected ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                              ) : null}
                            </div>

                            {/* Character Sprite Preview */}
                            <div
                              className={`p-1.5 rounded-lg bg-slate-950/90 relative ${
                                isLocked ? 'grayscale opacity-50' : ''
                              }`}
                            >
                              <PixelCharacter
                                config={{ ...config, hairStyle: h.id }}
                                size={44}
                              />
                              {isLocked && (
                                <div className="absolute inset-0 bg-slate-950/60 rounded-lg flex items-center justify-center">
                                  <Lock className="w-5 h-5 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                                </div>
                              )}
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[11px] font-thai font-medium leading-tight line-clamp-2 block">
                                {h.label}
                              </span>
                              {isLocked && (
                                <span className="text-[9px] font-thai text-amber-400/90 block">
                                  ปลดล็อกที่ LV.{h.requiredLevel}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hair Color Section */}
                  <div className="pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-cyber font-bold text-white flex items-center gap-2">
                        <Palette className="w-4 h-4 text-amber-400" />
                        <span>เลือกสีผม (Hair Color)</span>
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400">
                        ปลดล็อกแล้ว {HAIR_COLORS.filter((c) => c.requiredLevel <= playerLevel).length}/{HAIR_COLORS.length} สี
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {HAIR_COLORS.map((c) => {
                        const isSelected = config.hairColor === c.id;
                        const isLocked = playerLevel < c.requiredLevel;

                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              handleSelectItem('hairColor', c.id, c.label, c.requiredLevel)
                            }
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                                : isLocked
                                ? 'bg-slate-950/80 border-slate-800/80 text-slate-500 hover:border-amber-500/40'
                                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`w-6 h-6 rounded-md border border-white/20 shrink-0 shadow-inner flex items-center justify-center ${
                                  isLocked ? 'opacity-50' : ''
                                }`}
                                style={{ backgroundColor: c.color }}
                              >
                                {isLocked && <Lock className="w-3 h-3 text-white drop-shadow" />}
                              </span>
                              <div className="text-left min-w-0">
                                <div className="text-xs font-thai truncate">{c.label}</div>
                                <div
                                  className={`text-[9px] font-mono ${
                                    isLocked ? 'text-amber-400' : 'text-slate-400'
                                  }`}
                                >
                                  {c.requiredLevel === 0
                                    ? 'STARTER'
                                    : isLocked
                                    ? `🔒 ปลดล็อก LV.${c.requiredLevel}`
                                    : `✓ LV.${c.requiredLevel}`}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ===============================================================
                  TAB CONTENT 2: SKIN TONE (ALL UNLOCKED AT START)
                  =============================================================== */}
              {activeTab === 'skin' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-cyber font-bold text-white flex items-center gap-2">
                      <Smile className="w-4 h-4 text-cyan-400" />
                      <span>เลือกเฉดสีผิว (Skin Tone)</span>
                    </h3>
                    <span className="text-[11px] font-mono text-emerald-400">
                      ปลดล็อกครบทุกเฉดสีตั้งแต่เริ่มต้น
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SKIN_TONES.map((s) => {
                      const isSelected = config.skinTone === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() =>
                            handleSelectItem('skinTone', s.id, s.label, s.requiredLevel)
                          }
                          className={`p-4 rounded-xl border flex items-center gap-4 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.3)] ring-2 ring-cyan-400/40'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span
                            className="w-8 h-8 rounded-lg border border-white/30 shrink-0 shadow-inner"
                            style={{ backgroundColor: s.color }}
                          />
                          <div className="text-left">
                            <div className="text-xs font-cyber font-bold">{s.label}</div>
                            <div className="text-[11px] font-mono text-slate-400">{s.color}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ===============================================================
                  TAB CONTENT 3: OUTFITS (LEVEL LOCKED)
                  =============================================================== */}
              {activeTab === 'outfit' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-cyber font-bold text-white flex items-center gap-2">
                      <Shirt className="w-4 h-4 text-cyan-400" />
                      <span>เลือกชุดเครื่องแบบ & เสื้อผ้า (Outfits)</span>
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      ปลดล็อกแล้ว {OUTFITS.filter((o) => o.requiredLevel <= playerLevel).length}/{OUTFITS.length} ชุด
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {OUTFITS.map((o) => {
                      const isSelected = config.outfit === o.id;
                      const isLocked = playerLevel < o.requiredLevel;

                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() =>
                            handleSelectItem('outfit', o.id, o.label, o.requiredLevel)
                          }
                          className={`p-4 rounded-xl border flex items-center gap-4 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.3)] ring-2 ring-cyan-400/40'
                              : isLocked
                              ? 'bg-slate-950/80 border-slate-800/80 text-slate-500 hover:border-amber-500/40'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className={`relative w-11 h-11 rounded-xl border border-white/20 shrink-0 overflow-hidden flex items-center justify-center ${
                              isLocked ? 'opacity-50 grayscale' : ''
                            }`}
                            style={{ backgroundColor: o.color }}
                          >
                            <span
                              className="w-2.5 h-5 rounded-xs shadow"
                              style={{ backgroundColor: o.tie }}
                            />
                            {isLocked && (
                              <div className="absolute inset-0 bg-slate-950/65 flex items-center justify-center">
                                <Lock className="w-4 h-4 text-amber-400" />
                              </div>
                            )}
                          </div>

                          <div className="text-left flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-cyber font-bold truncate">
                                {o.label}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                                  isLocked
                                    ? 'bg-amber-950/90 text-amber-400 border border-amber-500/40'
                                    : o.requiredLevel === 8
                                    ? 'bg-amber-400 text-slate-950'
                                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {o.requiredLevel === 0 ? 'STARTER' : `LV.${o.requiredLevel}`}
                              </span>
                            </div>
                            <div
                              className={`text-[11px] font-thai mt-0.5 ${
                                isLocked ? 'text-amber-400/90' : 'text-slate-400'
                              }`}
                            >
                              {isLocked
                                ? `🔒 ต้องถึง LV.${o.requiredLevel} (ผ่านบทที่ ${o.requiredLevel})`
                                : o.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ===============================================================
                  TAB CONTENT 4: ACCESSORIES (LEVEL LOCKED)
                  =============================================================== */}
              {activeTab === 'accessory' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-cyber font-bold text-white flex items-center gap-2">
                      <Glasses className="w-4 h-4 text-cyan-400" />
                      <span>เลือกเครื่องประดับศีรษะ (Accessories)</span>
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      ปลดล็อกแล้ว {ACCESSORIES.filter((a) => a.requiredLevel <= playerLevel).length}/{ACCESSORIES.length} ชิ้น
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ACCESSORIES.map((a) => {
                      const isSelected = config.accessory === a.id;
                      const isLocked = playerLevel < a.requiredLevel;

                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() =>
                            handleSelectItem('accessory', a.id, a.label, a.requiredLevel)
                          }
                          className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.3)] ring-2 ring-cyan-400/40'
                              : isLocked
                              ? 'bg-slate-950/80 border-slate-800/80 text-slate-500 hover:border-amber-500/40'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                                isLocked
                                  ? 'bg-slate-900 border-amber-500/30 text-amber-400'
                                  : isSelected
                                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                                  : 'bg-slate-900 border-slate-700 text-slate-400'
                              }`}
                            >
                              {isLocked ? (
                                <Lock className="w-4 h-4" />
                              ) : (
                                <Star className="w-4 h-4" />
                              )}
                            </div>

                            <div className="text-left min-w-0">
                              <div className="text-xs font-thai font-bold truncate">
                                {a.label}
                              </div>
                              <div
                                className={`text-[11px] font-thai mt-0.5 ${
                                  isLocked ? 'text-amber-400/90' : 'text-slate-400'
                                }`}
                              >
                                {isLocked
                                  ? `🔒 ปลดล็อกที่ LV.${a.requiredLevel} (ผ่านบทที่ ${a.requiredLevel})`
                                  : a.desc}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                              isLocked
                                ? 'bg-amber-950/90 text-amber-400 border border-amber-500/40'
                                : a.requiredLevel === 8
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {a.requiredLevel === 0 ? 'STARTER' : `LV.${a.requiredLevel}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}
