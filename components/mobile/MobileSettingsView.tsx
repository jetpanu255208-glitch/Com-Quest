'use client';

import React from 'react';
import Link from 'next/link';
import { LogoutButton } from '@/components/dashboard/LogoutButton';
import {
  Palette,
  Sun,
  Moon,
  Check,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  ShieldCheck,
  User,
  Shirt,
  ChevronRight,
} from 'lucide-react';

interface MobileSettingsViewProps {
  theme: 'dark' | 'light';
  accent: 'cyan' | 'pink';
  onSelectTheme: (t: 'dark' | 'light') => void;
  onSelectAccent: (a: 'cyan' | 'pink') => void;
  sfxVolume: number;
  sfxMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onTestSound: (t: 'clear' | 'over') => void;
  playingType: 'clear' | 'over' | null;
  savedNotice: boolean;
}

export const MobileSettingsView: React.FC<MobileSettingsViewProps> = ({
  theme,
  accent,
  onSelectTheme,
  onSelectAccent,
  sfxVolume,
  sfxMuted,
  onVolumeChange,
  onToggleMute,
  onTestSound,
  playingType,
  savedNotice,
}) => {
  // 4 Theme combinations
  const themeOptions: Array<{
    id: string;
    t: 'dark' | 'light';
    a: 'cyan' | 'pink';
    title: string;
    desc: string;
    bgPreview: string;
    accentPreview: string;
  }> = [
    {
      id: 'dark-cyan',
      t: 'dark',
      a: 'cyan',
      title: 'ฟ้าดำ (Dark Cyan)',
      desc: 'ธีมมืดเริ่มต้น คมชัด สไตล์ Cyberpunk',
      bgPreview: '#080D1A',
      accentPreview: '#00CFEF',
    },
    {
      id: 'light-cyan',
      t: 'light',
      a: 'cyan',
      title: 'ฟ้าขาว (Light Cyan)',
      desc: 'ธีมสว่าง สะอาดตา สบายตาสำหรับการอ่าน',
      bgPreview: '#F0F7FF',
      accentPreview: '#0284C7',
    },
    {
      id: 'dark-pink',
      t: 'dark',
      a: 'pink',
      title: 'ชมพูดำ (Dark Pink)',
      desc: 'ธีมมืด นีออนชมพู สไตล์ Synthwave',
      bgPreview: '#12050F',
      accentPreview: '#FF2D95',
    },
    {
      id: 'light-pink',
      t: 'light',
      a: 'pink',
      title: 'ชมพูขาว (Light Pink)',
      desc: 'ธีมสว่าง ชมพูพาสเทล น่ารัก สดใส',
      bgPreview: '#FFF1F5',
      accentPreview: '#E11D48',
    },
  ];

  const handleApplyCombo = (targetTheme: 'dark' | 'light', targetAccent: 'cyan' | 'pink') => {
    onSelectTheme(targetTheme);
    onSelectAccent(targetAccent);
  };

  return (
    <div className="md:hidden relative z-10 space-y-4 pb-24 px-3 sm:px-4 pt-3 select-none">
      {/* Toast Notice */}
      {savedNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-xs font-thai flex items-center gap-2 shadow-[0_0_15px_rgba(52,211,153,0.3)] animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>บันทึกการตั้งค่าแล้ว</span>
        </div>
      )}

      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-pixel text-base text-slate-100 tracking-wide">
          ตั้งค่าระบบ (Settings)
        </h1>
        <p className="text-xs font-thai text-slate-400">
          ปรับแต่งธีม สี และระบบเสียงบนโทรศัพท์ของคุณ
        </p>
      </div>

      {/* =========================================================================
          SECTION 1: THEME & COLOR PALETTE (List format)
          ========================================================================= */}
      <div className="rounded-2xl bg-[#101827] border border-[#263449] p-3.5 space-y-2.5 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-thai font-semibold text-slate-200">
          <Palette className="w-4 h-4 text-[#00CFEF]" />
          <span>ธีมและคู่สี (4 Themes)</span>
        </div>

        <div className="space-y-1.5 pt-1">
          {themeOptions.map((opt) => {
            const isSelected = theme === opt.t && accent === opt.a;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleApplyCombo(opt.t, opt.a)}
                className={`
                  w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all active:scale-[0.98]
                  ${
                    isSelected
                      ? 'bg-[#151F30] border-[#00CFEF] shadow-[0_0_12px_rgba(0,207,239,0.25)]'
                      : 'bg-[#0d1424] border-[#1e2a3c] hover:border-slate-600'
                  }
                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Swatch Circle */}
                  <div className="w-7 h-7 rounded-full border border-slate-700 overflow-hidden flex shrink-0">
                    <div className="w-1/2 h-full" style={{ backgroundColor: opt.bgPreview }} />
                    <div className="w-1/2 h-full" style={{ backgroundColor: opt.accentPreview }} />
                  </div>

                  <div className="min-w-0">
                    <div className="font-thai text-xs font-semibold text-slate-100 truncate">
                      {opt.title}
                    </div>
                    <div className="text-[10px] font-thai text-slate-400 truncate">
                      {opt.desc}
                    </div>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-[#00CFEF] text-[#080D1A] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: AUDIO & SFX
          ========================================================================= */}
      <div className="rounded-2xl bg-[#101827] border border-[#263449] p-3.5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-thai font-semibold text-slate-200">
            {sfxMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#00CFEF]" />
            )}
            <span>ระบบเสียงเอฟเฟกต์ (Sound FX)</span>
          </div>

          <button
            type="button"
            onClick={onToggleMute}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-thai font-semibold transition-colors ${
              sfxMuted
                ? 'bg-rose-950/70 border border-rose-500/50 text-rose-300'
                : 'bg-[#151F30] border border-[#263449] text-slate-300'
            }`}
          >
            {sfxMuted ? 'ปิดเสียงอยู่' : 'เปิดเสียง'}
          </button>
        </div>

        {/* Volume Slider */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>VOLUME</span>
            <span className="text-[#00CFEF] font-bold">
              {sfxMuted ? '0%' : `${Math.round(sfxVolume * 100)}%`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={sfxMuted ? 0 : sfxVolume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-[#151F30] rounded-lg appearance-none cursor-pointer accent-[#00CFEF]"
          />
        </div>

        {/* Test Sound Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onTestSound('clear')}
            className="p-2 rounded-xl bg-[#151F30] hover:bg-[#1e2a40] border border-[#263449] text-slate-200 text-[10px] font-thai font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            {playingType === 'clear' ? (
              <Square className="w-3 h-3 text-emerald-400 fill-current" />
            ) : (
              <Play className="w-3 h-3 text-emerald-400 fill-current" />
            )}
            <span>ทดสอบเสียงชนะเควสต์</span>
          </button>

          <button
            type="button"
            onClick={() => onTestSound('over')}
            className="p-2 rounded-xl bg-[#151F30] hover:bg-[#1e2a40] border border-[#263449] text-slate-200 text-[10px] font-thai font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            {playingType === 'over' ? (
              <Square className="w-3 h-3 text-rose-400 fill-current" />
            ) : (
              <Play className="w-3 h-3 text-rose-400 fill-current" />
            )}
            <span>ทดสอบเสียงจบด่าน</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: ACCOUNT & NAVIGATION
          ========================================================================= */}
      <div className="rounded-2xl bg-[#101827] border border-[#263449] p-3.5 space-y-2 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-thai font-semibold text-slate-200">
          <User className="w-4 h-4 text-[#00CFEF]" />
          <span>บัญชีและการจัดการ (Account)</span>
        </div>

        <div className="space-y-1.5 pt-1">
          <Link
            href="/character"
            className="w-full p-2.5 rounded-xl bg-[#151F30] hover:bg-[#1e2a40] border border-[#263449] flex items-center justify-between text-xs font-thai text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shirt className="w-4 h-4 text-cyan-400" />
              <span>ห้องแต่งตัวละคร 8-Bit</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </Link>

          <Link
            href="/profile"
            className="w-full p-2.5 rounded-xl bg-[#151F30] hover:bg-[#1e2a40] border border-[#263449] flex items-center justify-between text-xs font-thai text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#00CFEF]" />
              <span>ข้อมูลโปรไฟล์และเหรียญรางวัล</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </Link>
        </div>

        {/* Single Red Logout Button */}
        <div className="pt-2">
          <LogoutButton variant="red" className="w-full justify-center py-2.5" />
        </div>
      </div>

      {/* Storage Note */}
      <div className="p-3 rounded-xl bg-[#0b101c] border border-slate-800 text-[10px] font-thai text-slate-500 flex items-start gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>
          การตั้งค่าธีมและระดับเสียงจะถูกบันทึกลงในอุปกรณ์นี้โดยอัตโนมัติ
        </span>
      </div>
    </div>
  );
};

