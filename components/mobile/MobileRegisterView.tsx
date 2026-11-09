'use client';

import React from 'react';
import Link from 'next/link';
import { FormInput } from '@/components/ui/FormInput';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { User, IdCard, Mail, CheckCircle2, UserPlus, ArrowRight, Gamepad2 } from 'lucide-react';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  studentId?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

interface MobileRegisterViewProps {
  formData: {
    firstName: string;
    lastName: string;
    studentId: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  errors: FormErrors;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  success: boolean;
}

export const MobileRegisterView: React.FC<MobileRegisterViewProps> = ({
  formData,
  errors,
  handleChange,
  handleSubmit,
  loading,
  success,
}) => {
  return (
    <div className="md:hidden flex flex-col justify-between min-h-screen bg-[#060913] text-slate-100 px-4 py-6 select-none relative overflow-x-hidden">
      {/* Background Cyber Grid */}
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
          REGISTER
        </span>
      </header>

      {/* Main Form Card */}
      <div className="relative z-10 my-auto py-4 w-full max-w-sm mx-auto space-y-4">
        {/* Brand Hero */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#151F30] border border-[#263449] flex items-center justify-center text-[#00CFEF] shadow-[0_0_20px_rgba(0,207,239,0.25)]">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="font-pixel text-xl text-slate-100 tracking-wider pt-1">
            สร้างตัวละครใหม่
          </h1>
          <p className="font-thai text-xs text-slate-300">
            ลงทะเบียนนักเรียนเพื่อเริ่มเก็บ EXP และเควสต์
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-[#101827] border border-[#263449] p-4 sm:p-5 shadow-xl space-y-3.5">
          {success && (
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs font-thai flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>สร้างตัวละครสำเร็จ! กำลังเข้าสู่เกม...</span>
            </div>
          )}

          <ErrorMessage message={errors.general} />

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <FormInput
                label="ชื่อจริง"
                id="mobFirstName"
                name="firstName"
                placeholder="สมชาย"
                required
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                disabled={loading}
              />

              <FormInput
                label="นามสกุล"
                id="mobLastName"
                name="lastName"
                placeholder="ใจดี"
                required
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                disabled={loading}
              />
            </div>

            <FormInput
              label="รหัสนักเรียน 11 หลัก"
              id="mobStudentId"
              name="studentId"
              inputMode="numeric"
              maxLength={11}
              placeholder="68219100010"
              required
              value={formData.studentId}
              onChange={handleChange}
              error={errors.studentId}
              icon={<IdCard className="w-4 h-4" />}
              disabled={loading}
            />

            <FormInput
              label="ชื่อในเกม (Username)"
              id="mobUsername"
              name="username"
              placeholder="Player_01"
              required
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              icon={<User className="w-4 h-4" />}
              disabled={loading}
            />

            <FormInput
              label="อีเมล"
              id="mobEmail"
              name="email"
              type="email"
              placeholder="student@school.ac.th"
              required
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={<Mail className="w-4 h-4" />}
              disabled={loading}
            />

            <PasswordInput
              label="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
              id="mobPassword"
              name="password"
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              disabled={loading}
            />

            <PasswordInput
              label="ยืนยันรหัสผ่าน"
              id="mobConfirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              disabled={loading}
            />

            {/* Vertical Primary Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00CFEF] to-cyan-400 hover:from-cyan-300 hover:to-cyan-400 text-[#080D1A] font-thai font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(0,207,239,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'กำลังลงทะเบียน...' : 'ยืนยันการสร้างตัวละคร'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Secondary Link */}
          <div className="pt-2 border-t border-[#263449] text-center">
            <Link
              href="/login"
              className="w-full py-2.5 px-3 rounded-xl bg-[#151F30] hover:bg-[#1d2a40] border border-[#263449] text-slate-200 font-thai text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-95 text-center"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-[#00CFEF]" />
              <span>มีบัญชีอยู่แล้ว? เข้าสู่ระบบที่นี่</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center text-[10px] font-mono text-slate-500">
        COM QUEST &bull; CREATE CHARACTER
      </footer>
    </div>
  );
};

