'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StudentNav } from '@/components/layout/StudentNav';
import { Footer } from '@/components/layout/Footer';
import { PixelCharacter } from '@/components/character/PixelCharacter';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { createClient } from '@/lib/supabase/client';
import {
  CharacterConfig,
  DEFAULT_CHARACTER_CONFIG,
} from '@/lib/supabase/types';
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
} from 'lucide-react';

export default function CharacterCustomizationPage() {
  const router = useRouter();
  const [config, setConfig] = useState<CharacterConfig>(DEFAULT_CHARACTER_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hair' | 'skin' | 'outfit' | 'accessory'>('hair');

  // Load existing character_config from Supabase
  useEffect(() => {
    async function loadCharacter() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('character_config')
          .eq('id', user.id)
          .single();

        if (profile?.character_config) {
          setConfig({
            ...DEFAULT_CHARACTER_CONFIG,
            ...(profile.character_config as CharacterConfig),
          });
        }
      } catch (err) {
        console.error('Error fetching character config:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCharacter();
  }, [router]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
    setConfig(DEFAULT_CHARACTER_CONFIG);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#060913]">
        <StudentNav />
        <main className="flex-1 flex items-center justify-center">
          <LoadingIndicator label="กำลังโหลดข้อมูลตัวละคร..." size="lg" />
        </main>
        <Footer />
      </div>
    );
  }

  // Options Definitions
  const hairStyles = [
    { id: 'short-neat', label: 'ผมสั้นเรียบ (Short Neat)' },
    { id: 'side-part', label: 'แสกข้างแฟชั่น (Side Part)' },
    { id: 'bowl-cut', label: 'หน้าม้ากลม (Bowl Cut)' },
    { id: 'slick-part', label: 'แสกกลางเท่ (Slick Part)' },
    { id: 'top-bun', label: 'มวยผมสูง (Top Bun)' },
    { id: 'bob-cut', label: 'บ็อบสั้นน่ารัก (Bob Cut)' },
    { id: 'ponytail', label: 'หางม้าซน (Ponytail)' },
    { id: 'long-wavy', label: 'ผมยาวลอน (Long Wavy)' },
  ];

  const hairColors = [
    { id: 'black', label: 'ดำธรรมชาติ (Black)', color: '#2b262d' },
    { id: 'chestnut', label: 'น้ำตาลเกาลัด (Chestnut)', color: '#593231' },
    { id: 'caramel', label: 'น้ำตาลคาราเมล (Caramel)', color: '#945747' },
    { id: 'indigo', label: 'น้ำเงินคราม (Indigo)', color: '#34304d' },
    { id: 'cyber-cyan', label: 'ไซเบอร์ไซอัน (Cyber Cyan)', color: '#00c8e0' },
    { id: 'golden', label: 'บลอนด์ทอง (Golden)', color: '#c8912e' },
  ];

  const skinTones = [
    { id: 'fair', label: 'ผิวขาวอมชมพู (Fair)', color: '#fce0cb' },
    { id: 'warm', label: 'ผิวขาวเหลือง (Warm)', color: '#f4cca1' },
    { id: 'tan', label: 'ผิวสองสี (Tan)', color: '#e2a774' },
    { id: 'caramel', label: 'ผิวสีน้ำผึ้ง (Caramel)', color: '#b87d52' },
  ];

  const outfits = [
    { id: 'academy-navy', label: 'เครื่องแบบสีกรมท่า (Academy Navy)', color: '#232a3d', tie: '#2563eb' },
    { id: 'explorer-khaki', label: 'ชุดนักสำรวจกากี (Explorer Khaki)', color: '#56534f', tie: '#dc2626' },
    { id: 'cyber-purple', label: 'ไซเบอร์สูทม่วง (Cyber Purple)', color: '#352945', tie: '#a855f7' },
    { id: 'casual-charcoal', label: 'สเวตเตอร์ชาร์โคล (Casual Charcoal)', color: '#38353d', tie: '#64748b' },
    { id: 'sci-fi-cyan', label: 'ชุดล้ำยุคเทคแวร์ (Sci-Fi Cyan)', color: '#0f2838', tie: '#00f0ff' },
  ];

  const accessories = [
    { id: 'none', label: 'ไม่ใส่เครื่องประดับ (None)' },
    { id: 'cyber-headband', label: 'เฮดแบนด์นีออน (Cyber Headband)' },
    { id: 'glasses', label: 'แว่นตานักเรียน (Glasses)' },
    { id: 'cat-ears', label: 'หูแมวพิกเซล (Cat Ears)' },
    { id: 'headset', label: 'หูฟังเกมเมอร์ (Gaming Headset)' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#060913] text-slate-100 cyber-grid relative">
      <StudentNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>CHARACTER WARDROBE (8-BIT SPRITE)</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-cyber font-bold text-white tracking-wide">
              แต่งตัวละคร RPG ของคุณ
            </h1>
            <p className="text-sm font-thai text-slate-400 mt-1">
              ปรับแต่งทรงผม สีผม สีผิว ชุด และเครื่องประดับ ตัวละครจะแสดงบนหน้าโปรไฟล์ของคุณ
            </p>
          </div>

          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-cyber transition-all shrink-0 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับไปยังโปรไฟล์ (Back to Profile)</span>
          </Link>
        </div>

        {/* Feedback alerts */}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-sm font-thai flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.25)] animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>บันทึกตัวละครเรียบร้อยแล้ว! ข้อมูลจะแสดงผลบนโปรไฟล์ของคุณทันที</span>
          </div>
        )}
        <ErrorMessage message={error} onDismiss={() => setError(null)} className="mb-6" />

        {/* Workspace: 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Character Live Preview Stage (5 cols) */}
          <div className="lg:col-span-5 glass-panel rounded-2xl p-6 sm:p-8 border border-cyan-500/40 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_35px_rgba(0,240,255,0.15)]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500" />
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400/90 mb-4 px-3 py-1 rounded bg-cyan-950/60 border border-cyan-500/30">
              LIVE SPRITE PREVIEW
            </span>

            {/* Pedestal & Character */}
            <div className="relative py-8 flex items-center justify-center">
              {/* Floor Shadow / Pedestal */}
              <div className="absolute bottom-2 w-36 h-8 bg-cyan-500/20 rounded-[100%] blur-md animate-pulse" />
              <div className="relative z-10 transition-all duration-300">
                <PixelCharacter config={config} size={180} animate={true} />
              </div>
            </div>

            {/* Character summary specs */}
            <div className="w-full mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs font-thai text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">ทรงผม:</span>
                <span className="font-semibold text-white">
                  {hairStyles.find((h) => h.id === config.hairStyle)?.label.split(' ')[0]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">สีผม:</span>
                <span className="font-semibold text-white">
                  {hairColors.find((c) => c.id === config.hairColor)?.label.split(' ')[0]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ชุดตัวละคร:</span>
                <span className="font-semibold text-white">
                  {outfits.find((o) => o.id === config.outfit)?.label.split(' ')[0]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">เครื่องประดับ:</span>
                <span className="font-semibold text-white">
                  {accessories.find((a) => a.id === config.accessory)?.label.split(' ')[0]}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full mt-6 space-y-3">
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
                <SecondaryButton
                  href="/profile"
                  size="md"
                  fullWidth
                >
                  เสร็จสิ้น
                </SecondaryButton>
              </div>
            </div>
          </div>

          {/* RIGHT: Customization Categories & Control Panels (7 cols) */}
          <div className="lg:col-span-7 glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
            {/* Category Tab Selector */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('hair')}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-cyber tracking-wide transition-all cursor-pointer
                  ${
                    activeTab === 'hair'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 font-bold shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                  }
                `}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>ทรงผม & สีผม</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('skin')}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-cyber tracking-wide transition-all cursor-pointer
                  ${
                    activeTab === 'skin'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 font-bold shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                  }
                `}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>สีผิว</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('outfit')}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-cyber tracking-wide transition-all cursor-pointer
                  ${
                    activeTab === 'outfit'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 font-bold shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                  }
                `}
              >
                <Shirt className="w-3.5 h-3.5" />
                <span>ชุดตัวละคร</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('accessory')}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-cyber tracking-wide transition-all cursor-pointer
                  ${
                    activeTab === 'accessory'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 font-bold shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                  }
                `}
              >
                <Glasses className="w-3.5 h-3.5" />
                <span>เครื่องประดับ</span>
              </button>
            </div>

            {/* TAB CONTENT: HAIR */}
            {activeTab === 'hair' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-cyber font-bold text-white mb-3 flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-cyan-400" />
                    <span>เลือกทรงผม (Hairstyle)</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {hairStyles.map((h) => {
                      const isSelected = config.hairStyle === h.id;
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, hairStyle: h.id }))}
                          className={`
                            p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-2
                            ${
                              isSelected
                                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.3)] ring-2 ring-cyan-400/40'
                                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-600'
                            }
                          `}
                        >
                          <div className="p-1 rounded bg-slate-950/80">
                            <PixelCharacter
                              config={{ ...config, hairStyle: h.id }}
                              size={44}
                            />
                          </div>
                          <span className="text-[11px] font-thai font-medium leading-tight line-clamp-2">
                            {h.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-cyber font-bold text-white mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-amber-400" />
                    <span>เลือกสีผม (Hair Color)</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {hairColors.map((c) => {
                      const isSelected = config.hairColor === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, hairColor: c.id }))}
                          className={`
                            p-2.5 rounded-lg border flex items-center gap-3 transition-all cursor-pointer
                            ${
                              isSelected
                                ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                            }
                          `}
                        >
                          <span
                            className="w-5 h-5 rounded-md border border-white/20 shrink-0 shadow-inner"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="text-xs font-thai text-left">{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SKIN */}
            {activeTab === 'skin' && (
              <div className="space-y-4">
                <h3 className="text-sm font-cyber font-bold text-white mb-3 flex items-center gap-2">
                  <Smile className="w-4 h-4 text-cyan-400" />
                  <span>เลือกเฉดสีผิว (Skin Tone)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {skinTones.map((s) => {
                    const isSelected = config.skinTone === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, skinTone: s.id }))}
                        className={`
                          p-4 rounded-xl border flex items-center gap-4 transition-all cursor-pointer
                          ${
                            isSelected
                              ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.3)] ring-2 ring-cyan-400/40'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }
                        `}
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

            {/* TAB CONTENT: OUTFIT */}
            {activeTab === 'outfit' && (
              <div className="space-y-4">
                <h3 className="text-sm font-cyber font-bold text-white mb-3 flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-cyan-400" />
                  <span>เลือกชุดเครื่องแบบ & เสื้อผ้า (Outfits)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {outfits.map((o) => {
                    const isSelected = config.outfit === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, outfit: o.id }))}
                        className={`
                          p-4 rounded-xl border flex items-center gap-4 transition-all cursor-pointer
                          ${
                            isSelected
                              ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.3)] ring-2 ring-cyan-400/40'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }
                        `}
                      >
                        <div className="relative w-10 h-10 rounded-lg border border-white/20 shrink-0 overflow-hidden flex items-center justify-center" style={{ backgroundColor: o.color }}>
                          <span className="w-2 h-4 rounded-xs shadow" style={{ backgroundColor: o.tie }} />
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-xs font-cyber font-bold">{o.label}</div>
                          <div className="text-[11px] font-thai text-slate-400">
                            เสื้อคลุม & เนกไทสไตล์เรโทร
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: ACCESSORY */}
            {activeTab === 'accessory' && (
              <div className="space-y-4">
                <h3 className="text-sm font-cyber font-bold text-white mb-3 flex items-center gap-2">
                  <Glasses className="w-4 h-4 text-cyan-400" />
                  <span>เลือกเครื่องประดับศีรษะ (Accessories)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accessories.map((a) => {
                    const isSelected = config.accessory === a.id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, accessory: a.id }))}
                        className={`
                          p-4 rounded-xl border flex items-center gap-3 transition-all cursor-pointer
                          ${
                            isSelected
                              ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.3)] ring-2 ring-cyan-400/40'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }
                        `}
                      >
                        <Sparkles className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <span className="text-xs font-thai font-medium text-left">{a.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
