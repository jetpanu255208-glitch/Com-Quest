'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Code2,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  User,
  Star,
  ShieldCheck,
  MousePointerClick,
  ChevronUp,
  RotateCcw,
  FastForward,
  X,
  Minus,
  Square,
  ArrowRight,
} from 'lucide-react';
import { DigitalSpaceCanvas } from './DigitalSpaceCanvas';
import { createClient } from '@/lib/supabase/client';

type AnimationStage = 'idle' | 'inserting' | 'inserted' | 'zooming' | 'digital_space';

export const InteractiveRetroRoomExperience: React.FC = () => {
  const router = useRouter();
  const [stage, setStage] = useState<AnimationStage>('idle');
  const [roomTheme, setRoomTheme] = useState<'room1' | 'room2'>('room1');
  const [isHovered, setIsHovered] = useState(false);
  const [flightVector, setFlightVector] = useState<{ x: number; y: number }>({ x: 320, y: 110 });
  const [sessionUser, setSessionUser] = useState<{
    id: string;
    email?: string;
    name: string;
    role: 'user' | 'admin';
  } | null>(null);

  // References to calculate exact 3D flight trajectory to the slot
  const cartridgeRef = useRef<HTMLDivElement | null>(null);
  const slotRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Check auth session
  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function checkAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user || !isMounted) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, first_name, last_name, username')
          .eq('id', user.id)
          .maybeSingle();

        if (isMounted) {
          const displayName =
            profile?.first_name && profile?.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : profile?.first_name || profile?.username || user.email?.split('@')[0] || 'ผู้ใช้งาน';

          setSessionUser({
            id: user.id,
            email: user.email,
            name: displayName,
            role: profile?.role === 'admin' ? 'admin' : 'user',
          });
        }
      } catch (e) {
        // pass
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Trigger sequence: idle -> inserting -> inserted -> zooming -> digital_space
  const handleStartSequence = () => {
    if (stage !== 'idle') return;

    // Calculate exact vector from cartridge center to slot center
    if (cartridgeRef.current && slotRef.current) {
      const cRect = cartridgeRef.current.getBoundingClientRect();
      const sRect = slotRef.current.getBoundingClientRect();
      const dx = sRect.left + sRect.width / 2 - (cRect.left + cRect.width / 2);
      const dy = sRect.top + sRect.height / 2 - (cRect.top + cRect.height / 2);
      setFlightVector({ x: dx, y: dy });
    }

    setStage('inserting');

    // 1.25s: Cartridge finishes laying flat and sliding into the slot -> switch to 'inserted'
    setTimeout(() => {
      setStage('inserted');
    }, 1250);

    // 2.7s: Zoom deeply into the center of the CRT screen
    setTimeout(() => {
      setStage('zooming');
    }, 2700);

    // 3.8s: Transition to Digital Space & Open Main Menu Window
    setTimeout(() => {
      setStage('digital_space');
    }, 3800);
  };

  // Instant skip to Digital Space Main Menu
  const handleSkipToMenu = () => {
    setStage('digital_space');
  };

  // Reset back to Retro Room
  const handleReset = () => {
    setStage('idle');
  };

  // Touch events for swipe-up gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY;

    if (deltaY > 35 && stage === 'idle') {
      handleStartSequence();
    }
    touchStartY.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full min-h-[640px] lg:min-h-[720px] flex items-center justify-center overflow-hidden transition-all duration-700 select-none"
    >
      {/* =========================================================================
          BACKGROUND 1: RETRO COMPUTER ROOM (Step 1, 2, 3)
          ========================================================================= */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 pixelated ${
          stage === 'digital_space' ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
        }`}
        style={{
          backgroundImage: `url('/images/${roomTheme === 'room1' ? 'retro-room-1.png' : 'retro-room-2.png'}')`,
        }}
      >
        {/* Ambient Darkened Vignette for high contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060913] via-[#060913]/60 to-[#060913]/40" />

        {/* Ambient Window Breathing Glow */}
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-sky-400/10 rounded-full blur-3xl animate-window-breathe pointer-events-none" />

        {/* Room Switcher Pill (Top Right) */}
        {stage === 'idle' && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-md text-[11px] font-thai text-slate-300">
            <button
              onClick={() => setRoomTheme('room1')}
              className={`px-2.5 py-1 rounded-full transition-all ${
                roomTheme === 'room1'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'hover:text-white'
              }`}
            >
              🏠 ห้องทำงาน 1
            </button>
            <button
              onClick={() => setRoomTheme('room2')}
              className={`px-2.5 py-1 rounded-full transition-all ${
                roomTheme === 'room2'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'hover:text-white'
              }`}
            >
              🐠 ห้องทำงาน 2
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          BACKGROUND 2: DIGITAL SPACE (Step 4: 3D Grid + Rising Particles)
          ========================================================================= */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          stage === 'digital_space' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <DigitalSpaceCanvas particleCount={48} showFloorGrid={true} />
      </div>

      {/* =========================================================================
          STAGE 1 - 3: RETRO WORKSTATION (Cartridge + Computer)
          ========================================================================= */}
      {stage !== 'digital_space' && (
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col items-center justify-center">
          
          {/* WORKSTATION CONTAINER (Smoothly transitions to center when inserted!) */}
          <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-12 transition-all duration-700 ease-out">
            
            {/* -------------------------------------------------------------------
                LEFT SIDE: 3D GAME CARTRIDGE & PEDESTAL
                ------------------------------------------------------------------- */}
            <div
              className={`flex flex-col items-center justify-center relative transition-all duration-700 ease-in-out ${
                stage === 'inserted' || stage === 'zooming'
                  ? 'w-0 opacity-0 pointer-events-none -mr-8 overflow-visible'
                  : 'w-full md:w-[320px] shrink-0'
              }`}
            >
              {/* Holographic Pedestal Glow */}
              <div
                className={`absolute -bottom-6 w-56 h-12 rounded-full bg-cyan-400/20 blur-md animate-pedestal-glow pointer-events-none border border-cyan-400/40 transition-opacity duration-500 ${
                  stage === 'inserting' || stage === 'inserted' || stage === 'zooming' ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <div
                className={`absolute -bottom-3 w-40 h-6 rounded-full bg-cyan-300/40 blur-sm pointer-events-none transition-opacity duration-500 ${
                  stage === 'inserting' || stage === 'inserted' || stage === 'zooming' ? 'opacity-0' : 'opacity-100'
                }`}
              />

              {/* 3D CARTRIDGE OBJECT (Tilts flat horizontally in 3D and slides into the slot!) */}
              <div
                ref={cartridgeRef}
                onClick={handleStartSequence}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '1200px',
                  transform:
                    stage === 'inserting'
                      ? `translate3d(${flightVector.x}px, ${flightVector.y}px, 0px) rotateX(76deg) rotateY(0deg) rotateZ(0deg) scale(0.48)`
                      : stage === 'inserted' || stage === 'zooming'
                      ? `translate3d(${flightVector.x}px, ${flightVector.y}px, 0px) rotateX(76deg) scale(0.48) opacity(0)`
                      : isHovered
                      ? 'perspective(1000px) translateY(-14px) scale(1.04) rotateX(6deg)'
                      : 'perspective(1000px) translateY(0px) scale(1) rotateX(0deg)',
                  transition:
                    stage === 'inserting'
                      ? 'transform 1.25s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease 1s'
                      : 'transform 0.3s ease-out, box-shadow 0.3s ease',
                  opacity: stage === 'inserting' ? 0.95 : stage === 'inserted' || stage === 'zooming' ? 0 : 1,
                  boxShadow: isHovered
                    ? '0 20px 40px rgba(0, 0, 0, 0.6)'
                    : '0 10px 25px rgba(0, 0, 0, 0.5)',
                }}
                className={`relative w-[210px] sm:w-[260px] h-[280px] sm:h-[340px] cursor-pointer rounded-2xl bg-[#0f1b33] border border-[#263449] flex flex-col justify-between overflow-hidden transition-all duration-300 group ${
                  stage === 'inserting' ? 'pointer-events-none z-40' : 'z-20'
                }`}
              >
                {/* 3D Top Beveled Edge / Cartridge Vent Grips */}
                <div className="w-full bg-[#0a1224] px-3.5 pt-2 pb-1.5 border-b border-[#263449] flex items-center justify-between">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-3.5 h-1.5 bg-slate-900 border border-slate-700/60 rounded-xs"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-slate-400 font-medium">
                      ROM v1.0
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00CFEF]" />
                  </div>
                </div>

                {/* Cartridge Main Sticker */}
                <div className="flex-1 p-3 flex flex-col justify-between relative overflow-hidden">
                  <div className="relative rounded-xl border border-[#263449] p-3 bg-[#151F30] flex flex-col justify-between h-full">
                    {/* Header Sticker */}
                    <div className="flex items-center justify-between border-b border-[#263449] pb-1.5">
                      <span className="text-[10px] font-mono text-[#00CFEF] font-semibold tracking-wider">
                        QUEST ROM
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-[#101827] border border-[#263449]">
                        8 LESSONS
                      </span>
                    </div>

                    {/* Central Title & Logo */}
                    <div className="my-auto text-center space-y-1">
                      <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#101827] border border-[#263449] text-[#00CFEF] mx-auto group-hover:scale-105 transition-transform">
                        <Code2 className="w-6 h-6 text-[#00CFEF]" />
                      </div>
                      <div>
                        <h3 className="font-pixel text-base sm:text-lg text-slate-100 tracking-wider">
                          Com Quest
                        </h3>
                        <p className="text-[10px] font-mono text-slate-400 tracking-wider mt-0.5">
                          HTML ADVENTURE
                        </p>
                      </div>
                    </div>

                    {/* Footer Sticker */}
                    <div className="pt-1.5 border-t border-[#263449] flex items-center justify-between text-[10px] font-mono">
                      <span className="text-amber-400 font-medium flex items-center gap-1">
                        <Award className="w-3 h-3" /> 8 เหรียญ
                      </span>
                      <span className="text-[#00CFEF] font-medium">+800 LVL</span>
                    </div>
                  </div>
                </div>

                {/* Cartridge Bottom Connector & Gold Contacts */}
                <div className="w-full bg-[#0a1224] border-t border-[#263449] px-3 py-1.5 flex items-center justify-between">
                  <span className="text-[8px] font-mono text-slate-500">EXP-CARTRIDGE</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                      <div
                        key={p}
                        className="w-1.5 h-2 bg-gradient-to-b from-amber-300 to-amber-600 rounded-b-xs"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------------------
                RIGHT SIDE: RETRO COMPUTER & CRT MONITOR
                (Smoothly glides to center in Image 3, and zooms dead center in Image 2 fix!)
                ------------------------------------------------------------------- */}
            <div
              className={`flex flex-col items-center justify-center transition-all duration-700 ease-out ${
                stage === 'zooming'
                  ? 'scale-[2.6] sm:scale-[3.6] z-50 origin-[50%_38%]'
                  : stage === 'inserted'
                  ? 'scale-100 sm:scale-105 z-30'
                  : 'scale-100 z-10'
              }`}
            >
              <div className="relative w-[295px] xs:w-[330px] sm:w-[440px] max-w-[calc(100vw-32px)] flex flex-col items-center">
                
                {/* 1. CRT MONITOR CASING (Classic 90s Curved Ivory/Beige PC) */}
                <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#e8ecef] via-[#d6dde4] to-[#b8c2cc] p-4 sm:p-5 border-2 border-slate-300 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                  
                  {/* CRT Screen Bezel (Dark Inset Frame) */}
                  <div className="relative rounded-xl bg-[#1e293b] p-3 sm:p-4 border-4 border-[#94a3b8] shadow-inner">
                    
                    {/* Inner Curved Glass Screen (Centered target for zoom!) */}
                    <div
                      className={`relative w-full h-[200px] sm:h-[240px] rounded-lg overflow-hidden flex flex-col items-center justify-center transition-colors duration-500 crt-scanlines ${
                        stage === 'inserted' || stage === 'zooming'
                          ? 'bg-[#042416] border-2 border-emerald-400 shadow-[inset_0_0_40px_rgba(52,211,153,0.5),0_0_35px_rgba(16,185,129,0.4)]'
                          : 'bg-[#0a0f1d] border-2 border-slate-700 shadow-inner'
                      }`}
                    >
                      {/* Scanline CRT overlay */}
                      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:4px_4px] pointer-events-none" />

                      {/* Screen Glass Glare Arc */}
                      <div className="absolute -top-12 -left-12 w-48 h-32 bg-white/10 rounded-full blur-xl pointer-events-none transform -rotate-45" />

                      {/* SCREEN CONTENT - STATE 1: NO SIGNAL */}
                      {(stage === 'idle' || stage === 'inserting') && (
                        <div className="flex flex-col items-center justify-center text-center p-4 space-y-2.5">
                          <div className="w-12 h-12 rounded-xl bg-slate-900/90 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse">
                            <AlertTriangle className="w-7 h-7" />
                          </div>
                          <div className="space-y-1">
                            <div className="font-pixel text-base sm:text-lg text-slate-200 tracking-widest font-bold">
                              NO SIGNAL
                            </div>
                            <p className="text-[11px] font-thai text-slate-400">
                              กรุณาเสียบตลับเกมเพื่อเริ่มระบบ
                            </p>
                          </div>
                        </div>
                      )}

                      {/* SCREEN CONTENT - STATE 2 & 3: MATCHING IMAGE 3 */}
                      {(stage === 'inserted' || stage === 'zooming') && (
                        <div className="flex flex-col items-center justify-center text-center px-2 py-3 space-y-2 animate-fade-in max-w-full">
                          {/* Checkmark Circle */}
                          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-emerald-950/90 border border-emerald-400 flex items-center justify-center text-emerald-300">
                            <CheckCircle2 className="w-7 h-7 sm:w-9 sm:h-9 text-emerald-300" />
                          </div>

                          {/* Success Message */}
                          <div className="space-y-0.5">
                            <h4 className="font-thai text-base sm:text-xl font-bold text-white tracking-wide">
                              อ่านตลับเรียบร้อย
                            </h4>
                            <p className="font-thai text-xs sm:text-sm text-emerald-300 font-semibold">
                              มาเริ่มเรียนรู้กันเลย!
                            </p>
                          </div>

                          {/* Booting Pill */}
                          <div className="px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-400/60 text-[9px] font-mono font-bold text-emerald-300">
                            SYSTEM BOOTING...
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Monitor Bottom Bezel (COM-QUEST CRT + Controls) */}
                    <div className="mt-2.5 flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-slate-500 font-bold tracking-wider">
                          COM-QUEST CRT
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Power LED Indicator */}
                        <div
                          className={`w-2.5 h-2.5 rounded-full transition-colors ${
                            stage === 'inserted' || stage === 'zooming'
                              ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]'
                              : 'bg-amber-400 animate-pulse'
                          }`}
                        />
                        {/* Rotary Knobs */}
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-600 border border-slate-500 shadow-inner" />
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-600 border border-slate-500 shadow-inner" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. BASE CPU UNIT WITH HORIZONTAL DRIVE SLOT */}
                <div className="w-[94%] bg-gradient-to-b from-[#d9e1e8] via-[#cbd5e1] to-[#94a3b8] rounded-b-xl border-x-2 border-b-2 border-slate-400 p-3 shadow-lg flex items-center justify-between -mt-1 relative z-0">
                  
                  {/* HORIZONTAL CARTRIDGE / ROM DRIVE SLOT */}
                  <div ref={slotRef} className="flex-1 max-w-[200px] sm:max-w-[240px] relative">
                    <div
                      className={`h-5 sm:h-6 rounded bg-[#070b14] border-2 border-slate-700 flex items-center justify-center shadow-inner relative overflow-hidden transition-all ${
                        stage === 'inserted' || stage === 'zooming'
                          ? 'border-emerald-400/90 shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                          : ''
                      }`}
                    >
                      {/* Deep slot aperture */}
                      <div className="w-full h-1.5 bg-[#03060c] border-b border-slate-800" />

                      {/* DOCKED 3D CARTRIDGE LIP (Visible when cartridge has slid inside!) */}
                      {(stage === 'inserted' || stage === 'zooming') && (
                        <div className="absolute inset-x-2 inset-y-0.5 rounded-xs bg-gradient-to-r from-blue-700 via-sky-600 to-blue-700 border border-cyan-300 flex items-center justify-between px-2 shadow-inner animate-fade-in">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4].map((n) => (
                              <div key={n} className="w-2.5 h-1 bg-slate-900 rounded-[1px]" />
                            ))}
                          </div>
                          <span className="text-[7px] font-mono text-cyan-200 font-bold">
                            LOCKED IN
                          </span>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                        </div>
                      )}

                      {/* Insertion Flash */}
                      {stage === 'inserting' && (
                        <div className="absolute inset-0 bg-cyan-400/40 animate-pulse" />
                      )}
                    </div>

                    <span className="text-[8px] font-mono text-slate-600 font-bold block text-center mt-0.5">
                      CARTRIDGE / ROM DRIVE
                    </span>
                  </div>

                  {/* Power Button & LED */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          stage === 'inserted' || stage === 'zooming'
                            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                            : 'bg-cyan-400 animate-ping'
                        }`}
                      />
                      <span className="text-[7px] font-mono text-slate-600 mt-0.5">PWR</span>
                    </div>
                    <div className="w-6 h-6 rounded-md bg-slate-300 border-2 border-slate-400 shadow-sm flex items-center justify-center text-[7px] font-mono text-slate-600 font-bold">
                      IO
                    </div>
                  </div>
                </div>

                {/* 3. KEYBOARD & MOUSE ON DESK */}
                <div className="w-[98%] mt-2 flex items-center justify-between gap-3 px-2">
                  <div className="flex-1 h-7 rounded-md bg-[#cbd5e1] border border-slate-400 p-1 flex gap-0.5 items-center justify-center shadow-sm">
                    {Array.from({ length: 18 }).map((_, idx) => (
                      <div key={idx} className="flex-1 h-4 bg-slate-200 border border-slate-300 rounded-[2px]" />
                    ))}
                  </div>
                  <div className="w-6 h-8 rounded-full bg-[#cbd5e1] border border-slate-400 shadow-sm flex flex-col items-center pt-1">
                    <div className="w-1.5 h-2 bg-slate-400 rounded-sm" />
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* -------------------------------------------------------------------
              INTERACTIVE PROMPT BUTTON (Only in Idle State)
              ------------------------------------------------------------------- */}
          {stage === 'idle' && (
            <div className="mt-5 sm:mt-7 flex flex-col items-center space-y-2.5 z-20 px-4 text-center">
              <button
                onClick={handleStartSequence}
                className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-[#00CFEF] hover:bg-[#00b8d4] text-[#080D1A] font-thai font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <MousePointerClick className="w-4 h-4 text-[#080D1A] shrink-0" />
                <span>คลิกตลับเกมเพื่อเข้าเรียน</span>
              </button>

              <button
                onClick={handleSkipToMenu}
                className="px-3.5 py-1 rounded-lg bg-[#101827]/80 hover:bg-[#151F30] border border-[#263449] text-xs font-thai text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>ข้ามไปยังเมนูเข้าสู่ระบบ (Skip)</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          STAGE 4: DIGITAL SPACE MAIN MENU MODAL (Clean Modern RPG Window)
          ========================================================================= */}
      {stage === 'digital_space' && (
        <div className="relative z-30 w-full max-w-xl mx-auto px-4 py-4 sm:py-8 animate-fade-in">
          {/* Clean Modal Window */}
          <div className="rounded-2xl overflow-hidden bg-[#101827] border border-[#263449] shadow-2xl">
            
            {/* Window Top Titlebar */}
            <div className="bg-[#0c1322] px-4 py-2.5 border-b border-[#263449] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00CFEF]" />
                <span className="font-pixel text-xs sm:text-sm text-slate-100 tracking-wider">
                  Com Quest
                </span>
                <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-[#151F30] border border-[#263449]">
                  LOGIN MENU
                </span>
              </div>

              {/* Window Control Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleReset}
                  title="ย้อนกลับไปห้องทำงาน"
                  className="w-6 h-6 rounded bg-[#151F30] hover:bg-[#1f2d47] border border-[#263449] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  onClick={handleReset}
                  title="ปิดหน้าต่าง"
                  className="w-6 h-6 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 flex items-center justify-center text-rose-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Window Content */}
            <div className="p-4 sm:p-6 space-y-4 text-center">
              
              {/* Header Title */}
              <div className="space-y-1">
                <h2 className="font-pixel text-xl sm:text-2xl text-slate-100 tracking-wider">
                  Com Quest
                </h2>
                <p className="text-xs sm:text-sm font-thai text-slate-400 max-w-md mx-auto">
                  ยินดีต้อนรับสู่โลกแห่งการเรียนรู้ภาษา HTML เลือกบทบาทเพื่อเข้าสู่ระบบ
                </p>
              </div>

              {/* ACTIVE SESSION BANNER (If user is already signed in) */}
              {sessionUser && (
                <div className="p-3 rounded-xl bg-[#151F30] border border-[#263449] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-thai text-left">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-mono text-[#00CFEF] font-semibold">
                      {sessionUser.role === 'admin' ? '🛡️ บัญชีครูผู้สอน:' : '👤 บัญชีนักเรียน:'}
                    </span>
                    <div className="text-white font-medium text-sm">{sessionUser.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{sessionUser.email}</div>
                  </div>
                  <Link
                    href={sessionUser.role === 'admin' ? '/teacher' : '/profile'}
                    className="px-3.5 py-1.5 rounded-lg bg-[#00CFEF] hover:bg-[#00b8d4] text-[#080D1A] font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>ไปที่ห้องเรียน</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* 3 ACTION BUTTONS (Clean & Spacious) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* 1. เข้าสู่ระบบฝ่ายนักเรียน */}
                <Link
                  href="/login"
                  className="flex sm:flex-col items-center justify-between sm:justify-center p-3 sm:p-4 rounded-xl bg-[#151F30] hover:bg-[#1a263c] border border-[#263449] hover:border-[#00CFEF]/60 text-slate-100 font-thai font-medium transition-colors group"
                >
                  <div className="flex sm:flex-col items-center gap-2.5 sm:gap-1.5">
                    <div className="w-8 h-8 rounded-lg bg-[#101827] border border-[#263449] flex items-center justify-center text-[#00CFEF] shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="text-left sm:text-center">
                      <div className="text-xs sm:text-sm font-semibold">เข้าสู่ระบบ</div>
                      <div className="text-[11px] text-slate-400">ฝ่ายนักเรียน</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 sm:hidden shrink-0" />
                </Link>

                {/* 2. สมัครสมาชิก (Primary Action) */}
                <Link
                  href="/register"
                  className="flex sm:flex-col items-center justify-between sm:justify-center p-3 sm:p-4 rounded-xl bg-[#00CFEF] hover:bg-[#00b8d4] text-[#080D1A] font-thai font-bold transition-colors shadow-sm group"
                >
                  <div className="flex sm:flex-col items-center gap-2.5 sm:gap-1.5">
                    <div className="w-8 h-8 rounded-lg bg-[#080D1A]/15 flex items-center justify-center text-[#080D1A] shrink-0">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                    <div className="text-left sm:text-center">
                      <div className="text-xs sm:text-sm font-bold">สมัครสมาชิก</div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#080D1A]/80">CREATE ACCOUNT</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#080D1A] sm:hidden shrink-0" />
                </Link>

                {/* 3. เข้าสู่ระบบฝ่ายครูผู้สอน */}
                <Link
                  href="/teacher/login"
                  className="flex sm:flex-col items-center justify-between sm:justify-center p-3 sm:p-4 rounded-xl bg-[#151F30] hover:bg-[#1a263c] border border-[#263449] text-slate-300 font-thai font-medium transition-colors group"
                >
                  <div className="flex sm:flex-col items-center gap-2.5 sm:gap-1.5">
                    <div className="w-8 h-8 rounded-lg bg-[#101827] border border-[#263449] flex items-center justify-center text-slate-400 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="text-left sm:text-center">
                      <div className="text-xs sm:text-sm font-semibold">เข้าสู่ระบบ</div>
                      <div className="text-[11px] text-slate-400">ฝ่ายครูผู้สอน</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 sm:hidden shrink-0" />
                </Link>
              </div>

              {/* Bottom Utilities */}
              <div className="pt-3 border-t border-[#263449] flex flex-wrap items-center justify-between gap-3 text-xs font-thai text-slate-400">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ย้อนกลับไปห้องทำงาน</span>
                </button>

                <Link
                  href="/subjects"
                  className="flex items-center gap-1.5 hover:text-[#00CFEF] transition-colors"
                >
                  <span>ดูบทเรียน 8 ด่าน</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};
