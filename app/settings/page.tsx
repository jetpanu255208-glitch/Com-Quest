'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { StudentNav } from '@/components/layout/StudentNav';
import { Footer } from '@/components/layout/Footer';
import {
  Sun,
  Moon,
  Check,
  Sparkles,
  Palette,
  ShieldCheck,
  Heart,
  Volume2,
  Volume1,
  VolumeX,
  Play,
  Square,
  Music,
} from 'lucide-react';
import {
  getSoundVolume,
  setSoundVolume,
  isSoundMuted,
  setSoundMuted,
  playClearSound,
  playOverSound,
  stopAllSounds,
} from '@/lib/sound/sound-manager';

function subscribe(callback: () => void) {
  window.addEventListener('com_quest_theme_change', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('com_quest_theme_change', callback);
    window.removeEventListener('storage', callback);
  };
}

function getThemeSnapshot(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('com_quest_theme');
  if (saved === 'light' || (!saved && document.documentElement.classList.contains('light'))) {
    return 'light';
  }
  return 'dark';
}

function getAccentSnapshot(): 'cyan' | 'pink' {
  if (typeof window === 'undefined') return 'cyan';
  const saved = localStorage.getItem('com_quest_accent');
  if (saved === 'pink' || (!saved && document.documentElement.classList.contains('theme-pink'))) {
    return 'pink';
  }
  return 'cyan';
}

function getServerSnapshot(): 'dark' | 'light' {
  return 'dark';
}

function getServerAccentSnapshot(): 'cyan' | 'pink' {
  return 'cyan';
}

export default function SettingsPage() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerSnapshot);
  const accent = useSyncExternalStore(subscribe, getAccentSnapshot, getServerAccentSnapshot);
  const [savedNotice, setSavedNotice] = useState(false);
  const [sfxVolume, setSfxVolumeState] = useState<number>(0.7);
  const [sfxMuted, setSfxMutedState] = useState<boolean>(false);
  const [playingType, setPlayingType] = useState<'clear' | 'over' | null>(null);

  useEffect(() => {
    setSfxVolumeState(getSoundVolume());
    setSfxMutedState(isSoundMuted());

    const handleSfxChange = () => {
      setSfxVolumeState(getSoundVolume());
      setSfxMutedState(isSoundMuted());
    };

    window.addEventListener('com_quest_sfx_change', handleSfxChange);
    window.addEventListener('storage', handleSfxChange);
    return () => {
      window.removeEventListener('com_quest_sfx_change', handleSfxChange);
      window.removeEventListener('storage', handleSfxChange);
      stopAllSounds();
    };
  }, []);

  const handleVolumeChange = (newVol: number) => {
    setSoundVolume(newVol);
    setSfxVolumeState(newVol);
    if (sfxMuted && newVol > 0) {
      setSoundMuted(false);
      setSfxMutedState(false);
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleToggleMute = () => {
    const nextMuted = !sfxMuted;
    setSoundMuted(nextMuted);
    setSfxMutedState(nextMuted);
    if (nextMuted) {
      stopAllSounds();
      setPlayingType(null);
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleTestSound = (type: 'clear' | 'over') => {
    if (sfxMuted) {
      setSoundMuted(false);
      setSfxMutedState(false);
    }
    setPlayingType(type);
    const audio = type === 'clear' ? playClearSound() : playOverSound();
    if (audio) {
      audio.onended = () => {
        setPlayingType(null);
      };
    } else {
      setPlayingType(null);
    }
  };

  const handleStopSound = () => {
    stopAllSounds();
    setPlayingType(null);
  };

  const handleSelectTheme = (newTheme: 'dark' | 'light') => {
    localStorage.setItem('com_quest_theme', newTheme);

    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }

    window.dispatchEvent(new Event('com_quest_theme_change'));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleSelectAccent = (newAccent: 'cyan' | 'pink') => {
    localStorage.setItem('com_quest_accent', newAccent);

    if (newAccent === 'pink') {
      document.documentElement.classList.remove('theme-cyan');
      document.documentElement.classList.add('theme-pink');
    } else {
      document.documentElement.classList.add('theme-cyan');
      document.documentElement.classList.remove('theme-pink');
    }

    window.dispatchEvent(new Event('com_quest_theme_change'));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  // Determine label for current combination
  const getThemeCombinationLabel = () => {
    if (accent === 'pink') {
      return theme === 'light' ? 'ชมพูขาว (Pink-White)' : 'ชมพูดำ (Pink-Black)';
    }
    return theme === 'light' ? 'ฟ้าขาว (Blue-White)' : 'ฟ้าดำ (Blue-Black)';
  };

  return (
    <div className="flex flex-col min-h-screen cyber-grid relative transition-colors duration-200">
      <StudentNav />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>SYSTEM CONFIGURATION</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-cyber font-bold tracking-wide">
            ตั้งค่าระบบ (Settings)
          </h1>
          <p className="text-sm font-thai text-slate-400 mt-1">
            ปรับแต่งธีมสว่าง/มืด และคู่สีประจำตัว (ฟ้า/ชมพู) ของ Com Quest
          </p>
        </div>

        {/* Current Active Theme Banner */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner ${
              accent === 'pink' ? 'bg-pink-950/80 border border-pink-500 text-pink-400' : 'bg-cyan-950/80 border border-cyan-500 text-cyan-400'
            }`}>
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                ACTIVE PALETTE COMBINATION
              </span>
              <div className="font-cyber font-bold text-base sm:text-lg text-glow-cyan flex items-center gap-2">
                <span>{getThemeCombinationLabel()}</span>
                {accent === 'pink' ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/40">
                    NEON PINK
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                    CYBER BLUE
                  </span>
                )}
              </div>
            </div>
          </div>

          {savedNotice && (
            <span className="text-xs font-thai text-emerald-400 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 animate-in fade-in w-fit">
              <Check className="w-3.5 h-3.5" /> บันทึกการเปลี่ยนแปลงแล้ว
            </span>
          )}
        </div>

        {/* Settings Container */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-10">
          {/* SECTION 1: ACCENT COLOR (ฟ้า หรือ ชมพู) */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-6">
              <div>
                <h2 className="text-lg font-cyber font-bold tracking-wide flex items-center gap-2">
                  <Palette className="w-5 h-5 text-cyan-400" />
                  <span>คู่สีหลักของระบบ (Accent Palette)</span>
                </h2>
                <p className="text-xs font-thai text-slate-400 mt-0.5">
                  เลือกเฉดสีไฮไลต์ระหว่างสีฟ้าและสีชมพู ซึ่งจะนำไปผสมผสานกับโหมดมืดหรือโหมดสว่าง
                </p>
              </div>
            </div>

            {/* Accent Color Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option Cyan */}
              <button
                type="button"
                onClick={() => handleSelectAccent('cyan')}
                className={`
                  p-5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-4
                  ${
                    accent === 'cyan'
                      ? 'bg-slate-900/90 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)] ring-2 ring-cyan-400/40'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                  }
                `}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/60 flex items-center justify-center text-cyan-300 font-bold">
                      CY
                    </div>
                    <div>
                      <h3 className="text-base font-cyber font-bold">
                        ธีมสีฟ้า (Cyber Cyan / Blue)
                      </h3>
                      <span className="text-[11px] font-mono text-cyan-400">
                        {theme === 'light' ? 'ฟ้าขาว (Blue-White)' : 'ฟ้าดำ (Blue-Black)'}
                      </span>
                    </div>
                  </div>
                  {accent === 'cyan' && (
                    <span className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                  )}
                </div>

                <p className="text-xs font-thai text-slate-400 leading-relaxed">
                  สีฟ้านีออนสไตล์ Cyberpunk ผสมผสานกลิ่นอายอวกาศและความทันสมัย เหมาะกับเกม Com Quest ดั้งเดิม
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                  <span className="w-3 h-3 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
                  <span className="text-cyan-400">#00F0FF &bull; #38BDF8</span>
                </div>
              </button>

              {/* Option Pink */}
              <button
                type="button"
                onClick={() => handleSelectAccent('pink')}
                className={`
                  p-5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-4
                  ${
                    accent === 'pink'
                      ? 'bg-slate-900/90 border-pink-400 shadow-[0_0_20px_rgba(255,45,149,0.3)] ring-2 ring-pink-400/50'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                  }
                `}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-950 border border-pink-500/60 flex items-center justify-center text-pink-300 font-bold">
                      <Heart className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-cyber font-bold text-pink-300">
                        ธีมสีชมพู (Neon Pink / Rose)
                      </h3>
                      <span className="text-[11px] font-mono text-pink-400">
                        {theme === 'light' ? 'ชมพูขาว (Pink-White)' : 'ชมพูดำ (Pink-Black)'}
                      </span>
                    </div>
                  </div>
                  {accent === 'pink' && (
                    <span className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                  )}
                </div>

                <p className="text-xs font-thai text-slate-400 leading-relaxed">
                  สีชมพูนีออนและโรสเบอร์รี่ สดใส น่ารัก โดดเด่น ให้ความรู้สึกมีชีวิตชีวาและเป็นเอกลักษณ์
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                  <span className="w-3 h-3 rounded-full bg-[#ff2d95] shadow-[0_0_8px_#ff2d95]" />
                  <span className="text-pink-400">#FF2D95 &bull; #F43F5E</span>
                </div>
              </button>
            </div>
          </div>

          {/* SECTION 2: THEME MODE (มืด หรือ สว่าง) */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-6">
              <div>
                <h2 className="text-lg font-cyber font-bold tracking-wide flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-400" />
                  <span>โหมดการแสดงผล (Display Mode)</span>
                </h2>
                <p className="text-xs font-thai text-slate-400 mt-0.5">
                  เลือกความสว่างของพื้นหลังเว็บ (ดำมืด หรือ ขาวสว่าง)
                </p>
              </div>
            </div>

            {/* Segmented Radio Cards (2 Options) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Dark Mode */}
              <button
                type="button"
                onClick={() => handleSelectTheme('dark')}
                className={`
                  p-5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-4
                  ${
                    theme === 'dark'
                      ? 'bg-slate-900/90 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)] ring-2 ring-cyan-400/40'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                  }
                `}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 shadow-inner">
                    <Moon className="w-5 h-5" />
                  </div>
                  {theme === 'dark' && (
                    <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-cyber font-bold mb-1">
                    โหมดมืด (Dark Mode)
                  </h3>
                  <p className="text-xs font-thai text-slate-400 leading-relaxed">
                    {accent === 'pink'
                      ? 'ธีม "ชมพูดำ" — พื้นหลังไวน์เข้ม ไฮไลต์นีออนสีชมพู ถนอมสายตาในยามค่ำคืน'
                      : 'ธีม "ฟ้าดำ" — พื้นหลังสีกรมท่าเข้ม ไฮไลต์นีออนสีฟ้า-ไซอัน สไตล์เกมไซเบอร์ยุคอวกาศ'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>{accent === 'pink' ? 'PINK-BLACK PALETTE' : 'CYBER DARK PALETTE'}</span>
                </div>
              </button>

              {/* Option 2: Light Mode */}
              <button
                type="button"
                onClick={() => handleSelectTheme('light')}
                className={`
                  p-5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-4
                  ${
                    theme === 'light'
                      ? 'bg-white/95 border-sky-500 text-slate-900 shadow-[0_0_20px_rgba(2,132,199,0.25)] ring-2 ring-sky-500/40'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                  }
                `}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-600 shadow-inner">
                    <Sun className="w-5 h-5 text-amber-500" />
                  </div>
                  {theme === 'light' && (
                    <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-cyber font-bold mb-1">
                    โหมดสว่าง (Light Mode)
                  </h3>
                  <p className="text-xs font-thai text-slate-400 leading-relaxed">
                    {accent === 'pink'
                      ? 'ธีม "ชมพูขาว" — พื้นหลังขาวสะอาด อักษรอ่านง่าย ไฮไลต์สีชมพูกลีบกุหลาบทั่วทั้งเว็บ'
                      : 'ธีม "ฟ้าขาว" — พื้นหลังขาวสะอาด อักษรอ่านง่าย ไฮไลต์สีฟ้าสดใสทั่วทั้งเว็บ'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-sky-500">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>{accent === 'pink' ? 'PINK-WHITE PALETTE' : 'BLUE-WHITE PALETTE'}</span>
                </div>
              </button>
            </div>
          </div>

          {/* SECTION 3: SOUND EFFECTS (ระดับเสียงเอฟเฟกต์ และเปิด/ปิดเสียง) */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-6">
              <div>
                <h2 className="text-lg font-cyber font-bold tracking-wide flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-amber-400" />
                  <span>ระดับเสียงเอฟเฟกต์ (Sound Effects & Volume)</span>
                </h2>
                <p className="text-xs font-thai text-slate-400 mt-0.5">
                  ปรับความดัง-เบาของเสียงเมื่อทำแบบทดสอบผ่าน (Clear) หรือไม่ผ่าน (Game Over) และทดลองฟังเสียง
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Master Volume Slider & Mute Toggle Card */}
              <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-lg space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        sfxMuted
                          ? 'bg-rose-950/80 border border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                          : 'bg-cyan-950/80 border border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                      }`}
                      title={sfxMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
                    >
                      {sfxMuted ? <VolumeX className="w-6 h-6" /> : sfxVolume > 0.5 ? <Volume2 className="w-6 h-6" /> : <Volume1 className="w-6 h-6" />}
                    </button>
                    <div>
                      <div className="text-xs font-mono uppercase text-slate-400">MASTER SFX VOLUME</div>
                      <div className="text-lg font-cyber font-bold text-white flex items-center gap-2">
                        <span>{sfxMuted ? 'ปิดเสียงอยู่ (Muted)' : `ความดัง: ${Math.round(sfxVolume * 100)}%`}</span>
                        {sfxMuted ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 border border-rose-500/60 text-rose-300 font-mono">
                            MUTED
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/60 text-emerald-300 font-mono">
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Mute/Unmute Switch Button */}
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className={`px-4 py-2 rounded-xl font-cyber text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      sfxMuted
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : 'bg-rose-950/70 hover:bg-rose-900 border border-rose-500/50 text-rose-300'
                    }`}
                  >
                    {sfxMuted ? (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span>เปิดเสียง (Unmute)</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-4 h-4" />
                        <span>ปิดเสียง (Mute)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Range Slider */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>0% (เงียบ)</span>
                    <span className="text-cyan-400 font-bold font-pixel text-sm">{Math.round(sfxVolume * 100)}%</span>
                    <span>100% (ดังสุด)</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={sfxMuted ? 0 : Math.round(sfxVolume * 100)}
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10) / 100)}
                    className="w-full h-2.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800"
                  />
                </div>

                {/* Quick Preset Buttons (0%, 25%, 50%, 75%, 100%) */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-thai text-slate-400 mr-1">ระดับเสียงด่วน:</span>
                  {[
                    { label: 'ปิดเสียง (0%)', val: 0 },
                    { label: '25%', val: 0.25 },
                    { label: '50%', val: 0.5 },
                    { label: '75%', val: 0.75 },
                    { label: '100% (สูงสุด)', val: 1 },
                  ].map((preset) => {
                    const isSelected = !sfxMuted && Math.abs(sfxVolume - preset.val) < 0.05;
                    return (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => handleVolumeChange(preset.val)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                            : 'bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sound Test Panel */}
              <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-cyber font-bold text-white flex items-center gap-2">
                      <Music className="w-4 h-4 text-cyan-400" />
                      <span>ทดลองฟังเสียงเอฟเฟกต์ (Sound Preview)</span>
                    </h3>
                    <p className="text-[11px] font-thai text-slate-400 mt-0.5">
                      คลิกเพื่อทดสอบระดับความดังของเสียงก่อนทำแบบทดสอบจริง
                    </p>
                  </div>
                  {playingType && (
                    <button
                      type="button"
                      onClick={handleStopSound}
                      className="px-3 py-1 rounded-lg bg-rose-950/80 border border-rose-500/60 text-rose-300 hover:text-white text-xs font-cyber flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>หยุดเล่น</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Test Clear Sound */}
                  <button
                    type="button"
                    onClick={() => handleTestSound('clear')}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      playingType === 'clear'
                        ? 'bg-amber-950/60 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        playingType === 'clear'
                          ? 'bg-amber-500 text-slate-950 animate-bounce'
                          : 'bg-amber-950 border border-amber-500/50 text-amber-400'
                      }`}>
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                      <div>
                        <div className="text-xs font-cyber font-bold text-amber-300">
                          1. เสียงผ่านด่าน (Clear.mp3)
                        </div>
                        <div className="text-[11px] font-thai text-slate-400">
                          ดังพร้อมหน้าต่างรับเหรียญเมื่อได้ 5/10 ขึ้นไป
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300">
                      {playingType === 'clear' ? 'กำลังเล่น...' : 'กดทดสอบ'}
                    </span>
                  </button>

                  {/* Test Over Sound */}
                  <button
                    type="button"
                    onClick={() => handleTestSound('over')}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      playingType === 'over'
                        ? 'bg-rose-950/60 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-rose-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        playingType === 'over'
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-rose-950 border border-rose-500/50 text-rose-400'
                      }`}>
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                      <div>
                        <div className="text-xs font-cyber font-bold text-rose-300">
                          2. เสียงไม่ผ่าน (Over.mp3)
                        </div>
                        <div className="text-[11px] font-thai text-slate-400">
                          ดังพร้อมหน้าต่าง Failed เมื่อได้ต่ำกว่า 5/10
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300">
                      {playingType === 'over' ? 'กำลังเล่น...' : 'กดทดสอบ'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* System Specs & Storage notice */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3 text-xs font-thai text-slate-400">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-300">
                การตั้งค่าธีมสี คู่สี และระดับเสียงจะถูกบันทึกลงในบราวเซอร์ของคุณโดยอัตโนมัติ
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                เมื่อเปิดใช้งานใหม่หรือรีเฟรชหน้าเว็บ ระบบจะจดจำค่าที่คุณเลือกไว้ทันทีโดยไม่มีการกะพริบ
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
