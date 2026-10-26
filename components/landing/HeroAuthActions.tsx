'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Zap, ArrowRight, ShieldAlert, LogOut, User, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export const HeroAuthActions: React.FC = () => {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<{
    id: string;
    email?: string;
    name: string;
    role: 'user' | 'admin';
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) {
            setSessionUser(null);
            setLoading(false);
          }
          return;
        }

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
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setSessionUser(null);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="h-12 flex items-center justify-center lg:justify-start">
        <span className="text-xs font-mono text-cyan-400 animate-pulse">กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</span>
      </div>
    );
  }

  if (sessionUser) {
    const targetUrl = sessionUser.role === 'admin' ? '/teacher' : '/profile';
    const roleLabel = sessionUser.role === 'admin' ? '🛡️ คุณครูผู้สอน / ผู้ดูแลระบบ' : '👤 นักเรียน (Student)';

    return (
      <div className="space-y-4 pt-2 w-full max-w-xl mx-auto lg:mx-0">
        {/* Active Session Notification Box */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.15)] flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="space-y-1">
            <div className="text-[11px] font-mono text-cyan-400 font-semibold flex items-center gap-1.5">
              {sessionUser.role === 'admin' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <User className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>{roleLabel}</span>
            </div>
            <div className="text-base font-cyber font-bold text-white tracking-wide">
              {sessionUser.name}
            </div>
            <div className="text-xs font-mono text-slate-400">
              {sessionUser.email}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-300 hover:text-white text-xs font-cyber flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            title="ออกจากระบบ เพื่อให้ผู้อื่นสามารถเข้าสู่ระบบหรือสมัครใหม่ได้"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>

        {/* Action Buttons for Logged In User */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
          <PrimaryButton
            href={targetUrl}
            size="md"
            className="w-full sm:w-auto text-sm sm:text-base whitespace-nowrap"
            icon={<ArrowRight className="w-4 h-4 text-slate-950 shrink-0" />}
          >
            {sessionUser.role === 'admin' ? 'ไปยังแดชบอร์ดครูผู้สอน' : 'ไปยังหน้าโปรไฟล์ของฉัน'}
          </PrimaryButton>

          <SecondaryButton
            href="/login"
            size="md"
            className="w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap"
          >
            เข้าสู่ระบบด้วยบัญชีอื่น
          </SecondaryButton>

          <SecondaryButton
            href="/register"
            size="md"
            className="w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap"
          >
            สมัครสมาชิกใหม่
          </SecondaryButton>
        </div>
      </div>
    );
  }

  // Not Logged In
  return (
    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
      {/* 1. Primary CTA: Register */}
      <PrimaryButton
        href="/register"
        size="md"
        className="w-full sm:w-auto text-sm sm:text-base font-bold whitespace-nowrap shadow-[0_0_20px_rgba(0,240,255,0.4)]"
        icon={<Zap className="w-4 h-4 text-slate-950 fill-current shrink-0" />}
      >
        สมัครสมาชิก
      </PrimaryButton>

      {/* 2. Login (Student Blue) */}
      <SecondaryButton
        href="/login"
        size="md"
        className="w-full sm:w-auto text-sm sm:text-base font-bold whitespace-nowrap"
        icon={<ArrowRight className="w-4 h-4 shrink-0" />}
      >
        เข้าสู่ระบบ
      </SecondaryButton>

      {/* 3. Teacher Login (Teacher Yellow) */}
      <SecondaryButton
        href="/teacher/login"
        variant="teacher"
        size="md"
        className="w-full sm:w-auto text-sm sm:text-base font-bold whitespace-nowrap"
        icon={<ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />}
      >
        เข้าสู่ระบบครูผู้สอน
      </SecondaryButton>
    </div>
  );
};
