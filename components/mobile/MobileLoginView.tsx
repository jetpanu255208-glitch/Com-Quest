'use client';

import React from 'react';
import Link from 'next/link';
import { FormInput } from '@/components/ui/FormInput';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Mail, CheckCircle2, ShieldAlert, Gamepad2, ArrowRight, UserPlus, GraduationCap } from 'lucide-react';

interface MobileLoginViewProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  setError: (val: string | null) => void;
  success: boolean;
  existingUser: {
    id: string;
    email?: string;
    name: string;
    role: string;
  } | null;
  handleSignOutCurrent: () => void;
}

export const MobileLoginView: React.FC<MobileLoginViewProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  handleSubmit,
  loading,
  error,
  setError,
  success,
  existingUser,
  handleSignOutCurrent,
}) => {
  return (
    <div className="md:hidden flex flex-col justify-between min-h-screen bg-[#060913] text-slate-100 px-4 py-6 select-none relative overflow-x-hidden">
      {/* Background Cyber Grid & Subtle Glow */}
      <div className="absolute inset-0 cyber-grid opacity-25 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[#151F30] border border-[#263449] flex items-center justify-center">
            <span className="font-pixel text-[#00CFEF] text-sm font-bold">C</span>
          </div>
          <span className="font-pixel text-xs text-slate-100 tracking-wider">
            Com Quest
          </span>
        </Link>
        <span className="px-2 py-0.5 rounded-full bg-[#101827] border border-[#263449] text-[10px] font-mono text-[#00CFEF]">
          LOGIN
        </span>
      </header>

      {/* Center Auth Card (Clean Single Card style) */}
      <div className="relative z-10 my-auto py-4 w-full max-w-sm mx-auto space-y-4">
        {/* Brand Hero inside card */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#151F30] border border-[#263449] flex items-center justify-center text-[#00CFEF] shadow-[0_0_20px_rgba(0,207,239,0.25)]">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <h1 className="font-pixel text-xl text-slate-100 tracking-wider pt-1">
            COM QUEST
          </h1>
          <p className="font-thai text-xs text-slate-300">
            ยินดีต้อนรับสู่ระบบการเรียนรู้ Com Quest
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl bg-[#101827] border border-[#263449] p-5 shadow-xl space-y-4">
          {/* Success Banner */}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs font-thai flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>เข้าสู่ระบบสำเร็จ! กำลังเริ่มเกม...</span>
            </div>
          )}

          {/* Active Session Notice */}
          {existingUser && (
            <div className="p-3 rounded-xl bg-[#151F30] border border-cyan-500/40 text-xs font-thai space-y-2">
              <div className="text-left">
                <span className="text-[10px] text-[#00CFEF] font-mono">
                  {existingUser.role === 'admin' ? '🛡️ เข้าสู่ระบบอยู่ (คุณครู):' : '👤 เข้าสู่ระบบอยู่ (นักเรียน):'}
                </span>
                <div className="font-bold text-white text-sm">{existingUser.name}</div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSignOutCurrent}
                  className="flex-1 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-thai"
                >
                  ออกจากระบบ
                </button>
                <Link
                  href={existingUser.role === 'admin' ? '/teacher' : '/profile'}
                  className="flex-1 py-1.5 rounded-lg bg-[#00CFEF] text-[#080D1A] font-bold text-xs font-thai text-center"
                >
                  ไปหน้าของฉัน
                </Link>
              </div>
            </div>
          )}

          <ErrorMessage message={error} onDismiss={() => setError(null)} />

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <FormInput
              label="อีเมล หรือ รหัสนักเรียน 11 หลัก"
              id="mobileLoginEmail"
              name="email"
              type="text"
              placeholder="เช่น 68219100010 หรือ student@svc.ac.th"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              helperText="ใช้รหัสนักเรียน 11 หลัก หรืออีเมล"
              icon={<Mail className="w-4 h-4" />}
              disabled={loading}
            />

            <PasswordInput
              label="รหัสผ่าน"
              id="mobileLoginPassword"
              name="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            {/* Vertical Primary Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00CFEF] to-cyan-400 hover:from-cyan-300 hover:to-cyan-400 text-[#080D1A] font-thai font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(0,207,239,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Start Quest)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Secondary Links (Vertical Stack) */}
          <div className="space-y-2 pt-2 border-t border-[#263449]">
            <Link
              href="/register"
              className="w-full py-2.5 px-3 rounded-xl bg-[#151F30] hover:bg-[#1d2a40] border border-[#263449] text-slate-200 font-thai text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-95 text-center"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#00CFEF]" />
              <span>ยังไม่มีบัญชี? สมัครสมาชิกใหม่</span>
            </Link>

            <Link
              href="/teacher/login"
              className="w-full py-2 px-3 rounded-lg text-slate-400 hover:text-slate-200 font-thai text-[11px] flex items-center justify-center gap-1.5 transition-colors text-center"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span>เข้าสู่ระบบสำหรับครูผู้สอน (Teacher Portal)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center text-[10px] font-mono text-slate-500">
        COM QUEST &bull; STUDENT RPG LOGIN
      </footer>
    </div>
  );
};

