'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Swords, ArrowRight, ShieldAlert, KeyRound, Sparkles, BookOpen } from 'lucide-react';
import { joinExamLobby } from '@/app/actions/exam-actions';

interface ExamEntryViewProps {
  userEmail?: string;
  userRole?: string;
}

export const ExamEntryView: React.FC<ExamEntryViewProps> = ({ userEmail, userRole }) => {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanedCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!cleanedCode || cleanedCode.length < 4) {
      setErrorMsg('กรุณากรอกรหัสห้องสอบ 6 หลักให้ถูกต้อง');
      return;
    }

    startTransition(async () => {
      const res = await joinExamLobby(cleanedCode);
      if (!res.success) {
        setErrorMsg(res.error || 'ไม่สามารถเข้าร่วมห้องสอบได้');
      } else {
        router.push(`/exam/lobby/${cleanedCode}`);
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* RPG Card Container */}
      <div className="relative bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,207,239,0.15)] overflow-hidden">
        {/* Glow corner accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-rose-500/20 border border-cyan-400/40 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(0,207,239,0.3)]">
            <Swords className="w-8 h-8 text-cyan-300 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            BOSS BATTLE EXAM
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            เข้าสู่สนามสอบบอส
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed">
            กรอกรหัสห้องสอบ (Room Code) ที่ได้รับจากอาจารย์ผู้สอน เพื่อเข้าสู่ห้อง Lobby เตรียมประลองความรู้
          </p>
        </div>

        {/* Room Code Form */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              รหัสห้องสอบ (Room Code)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-5 h-5 text-cyan-400" />
              </div>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="เช่น CQ1024"
                maxLength={10}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-950/80 border-2 border-slate-700/80 focus:border-cyan-400 rounded-xl text-center text-xl sm:text-2xl font-mono font-bold tracking-widest text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all uppercase"
                disabled={isPending}
                autoFocus
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs sm:text-sm animate-shake">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !roomCode.trim()}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(0,207,239,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer text-sm sm:text-base"
          >
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                กำลังตรวจสอบห้อง...
              </span>
            ) : (
              <>
                <span>เข้าสู่ห้องสอบ (LOBBY)</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Teacher Shortcut if role is teacher */}
        {userRole === 'teacher' && (
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <Link
              href="/teacher/exams"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>จัดการห้องสอบสำหรับอาจารย์ (Teacher Hub)</span>
            </Link>
          </div>
        )}
      </div>

      {/* Rules & Info Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
          <span className="text-cyan-400 text-base">⚔️</span>
          <div>
            <div className="font-semibold text-slate-200">ตอบถูก = โจมตีบอส</div>
            <div>ทุกคำตอบที่ถูกต้องจะลดพลังชีวิตของบอส ยิ่งคะแนนสูง บอสยิ่งพ่ายแพ้</div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
          <span className="text-rose-400 text-base">⏳</span>
          <div>
            <div className="font-semibold text-slate-200">เวลาเรียลไทม์</div>
            <div>นับถอยหลังพร้อมกัน เมื่อหมดเวลาจะตรวจและส่งคำตอบอัตโนมัติ</div>
          </div>
        </div>
      </div>
    </div>
  );
};

