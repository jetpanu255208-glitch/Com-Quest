'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Gamepad2, UserPlus, GraduationCap, ShieldCheck, ArrowRight, Play } from 'lucide-react';

type ScreenState = 'idle' | 'loading' | 'menu';

export function MobileStartScreen() {
  const router = useRouter();
  const [state, setState] = useState<ScreenState>('idle');
  const [progress, setProgress] = useState(0);

  const handleStartGame = () => {
    if (state !== 'idle') return;
    setState('loading');
    setProgress(0);
  };

  useEffect(() => {
    if (state !== 'loading') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setState('menu');
          }, 250);
          return 100;
        }
        return prev + 5;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [state]);

  return (
    <section
      className="md:hidden flex flex-col justify-between min-h-screen bg-[#060913] text-slate-100 relative overflow-hidden px-4 py-6 select-none"
      aria-label="Mobile Game Start Screen"
    >
      {/* Background Cyber Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#060913]/90 via-[#071126]/85 to-[#060913]/98" />
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-cyan-500/15 blur-[90px]" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-blue-600/10 blur-[80px]" />
      </div>

      {/* Top Header Tag */}
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#151F30] border border-[#263449] flex items-center justify-center">
            <span className="font-pixel text-[#00CFEF] text-xs font-bold">C</span>
          </div>
          <span className="font-pixel text-xs text-slate-200 tracking-wider">COM QUEST</span>
        </div>
        <div className="px-2.5 py-0.5 rounded-full bg-[#101827] border border-[#263449] text-[10px] font-mono text-[#00CFEF]">
          MOBILE RPG
        </div>
      </header>

      {/* Centerpiece: Pixel Art Smartphone Screen */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-4">
        {/* Phone Frame */}
        <div className="relative w-[280px] sm:w-[300px] rounded-[32px] p-3.5 bg-gradient-to-b from-[#1b2638] via-[#101827] to-[#0a0f1d] border-2 border-[#263449] shadow-[0_0_40px_rgba(0,207,239,0.25)] transition-all">
          
          {/* Phone Top Speaker & Camera Notch */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-12 h-1 rounded-full bg-slate-700/60" />
            <div className="w-2 h-2 rounded-full bg-slate-700/80" />
          </div>

          {/* Inner Phone Screen */}
          <div className="relative w-full h-[360px] rounded-[22px] bg-[#080D1A] border border-[#1e2c44] overflow-hidden flex flex-col justify-between p-4 shadow-inner">
            
            {/* Screen Cyber Grid Pattern */}
            <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />

            {/* Screen Top Status Bar */}
            <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-slate-400 border-b border-slate-800/80 pb-1.5">
              <span>QUEST OS v1.0</span>
              <span className="flex items-center gap-1 text-[#00CFEF]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00CFEF] animate-pulse" />
                ONLINE
              </span>
            </div>

            {/* Screen Content by State */}
            <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center px-1">
              {/* STATE 1: IDLE */}
              {state === 'idle' && (
                <div className="space-y-4 w-full">
                  {/* Pixel Game Logo inside phone */}
                  <div className="space-y-1">
                    <div className="inline-flex p-2.5 rounded-xl bg-[#151F30] border border-[#263449] text-[#00CFEF] shadow-[0_0_15px_rgba(0,207,239,0.3)]">
                      <Gamepad2 className="w-7 h-7" />
                    </div>
                    <h2 className="font-pixel text-xl sm:text-2xl text-slate-100 tracking-wider text-glow-cyan leading-tight mt-1">
                      COM QUEST
                    </h2>
                    <p className="text-[11px] font-thai text-slate-300">
                      ผจญภัยในโลกคอมพิวเตอร์ RPG
                    </p>
                  </div>

                  {/* START GAME BUTTON (prominent in screen center) */}
                  <div className="pt-2">
                    <button
                      onClick={handleStartGame}
                      type="button"
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00CFEF] to-cyan-400 hover:from-cyan-300 hover:to-cyan-400 text-[#080D1A] font-pixel text-sm font-bold tracking-wider shadow-[0_0_20px_rgba(0,207,239,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                      aria-label="เริ่มเกม"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>เริ่มเกม</span>
                    </button>
                    <p className="text-[9px] font-mono text-slate-400 mt-2">
                      TAP TO START
                    </p>
                  </div>
                </div>
              )}

              {/* STATE 2: LOADING */}
              {state === 'loading' && (
                <div className="space-y-4 w-full py-6">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-[#151F30] border border-cyan-500/40 flex items-center justify-center text-[#00CFEF] animate-bounce">
                    <Sparkles className="w-6 h-6 animate-spin" />
                  </div>

                  <div className="space-y-1.5">
                    <p className="font-thai text-xs font-semibold text-slate-100">
                      กำลังเริ่มต้นระบบ...
                    </p>
                    <p className="font-mono text-[10px] text-cyan-300">
                      LOADING QUEST DATA [{progress}%]
                    </p>
                  </div>

                  {/* Pixel Loading Bar */}
                  <div className="w-full bg-[#101827] rounded-full h-2.5 p-0.5 border border-[#263449] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-[#00CFEF] rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(0,207,239,0.8)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* STATE 3: MENU */}
              {state === 'menu' && (
                <div className="space-y-2.5 w-full animate-in fade-in zoom-in-95 duration-200">
                  <div className="text-center pb-1">
                    <h3 className="font-thai text-xs font-bold text-slate-100">
                      ยินดีต้อนรับสู่ Com Quest
                    </h3>
                    <p className="text-[10px] font-thai text-slate-400">
                      เลือกโหมดเพื่อเข้าสู่ระบบ
                    </p>
                  </div>

                  {/* Student Login */}
                  <Link
                    href="/login"
                    className="flex items-center justify-between w-full p-2.5 rounded-xl bg-[#00CFEF] hover:bg-[#00b8d4] text-[#080D1A] font-thai font-bold text-xs shadow-[0_0_15px_rgba(0,207,239,0.4)] active:scale-95 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4 shrink-0" />
                      <span>เข้าสู่ระบบ (นักเรียน)</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {/* Register */}
                  <Link
                    href="/register"
                    className="flex items-center justify-between w-full p-2.5 rounded-xl bg-[#151F30] hover:bg-[#1c2940] border border-[#263449] text-slate-200 font-thai font-semibold text-xs active:scale-95 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>สมัครสมาชิกใหม่</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>

                  {/* Teacher Login */}
                  <Link
                    href="/teacher/login"
                    className="flex items-center justify-between w-full p-2 rounded-lg bg-[#101827]/80 hover:bg-[#151F30] border border-slate-800 text-slate-400 hover:text-slate-200 font-thai text-[11px] transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>พอร์ทัลครูผู้สอน</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">TEACHER</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Screen Bottom Bar */}
            <div className="relative z-10 flex items-center justify-center pt-2 border-t border-slate-800/80">
              <div className="w-16 h-1 rounded-full bg-slate-700/60" />
            </div>

          </div>

          {/* Phone Bottom Home Indicator */}
          <div className="flex justify-center mt-2.5">
            <div className="w-10 h-1 rounded-full bg-slate-600/50" />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="relative z-10 text-center space-y-1">
        <p className="text-[11px] font-thai text-slate-400">
          หลักสูตรการเขียนภาษา HTML เบื้องต้น 8 เควสต์
        </p>
        <p className="text-[9px] font-mono text-slate-400">
          COM QUEST &bull; MOBILE EXPERIENCE
        </p>
      </footer>
    </section>
  );
}

