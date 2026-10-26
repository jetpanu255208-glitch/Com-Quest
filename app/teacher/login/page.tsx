'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthCard } from '@/components/ui/AuthCard';
import { FormInput } from '@/components/ui/FormInput';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Shield, Mail, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';

export default function TeacherLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingUser, setExistingUser] = useState<{
    id: string;
    email?: string;
    name: string;
    role: string;
  } | null>(null);

  React.useEffect(() => {
    async function checkCurrent() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, first_name, last_name, username')
            .eq('id', user.id)
            .maybeSingle();

          const displayName =
            profile?.first_name && profile?.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : profile?.first_name || profile?.username || user.email?.split('@')[0] || 'ผู้ใช้งาน';

          setExistingUser({
            id: user.id,
            email: user.email,
            name: displayName,
            role: profile?.role || 'user',
          });
        }
      } catch (e) {
        // pass
      }
    }
    checkCurrent();
  }, []);

  const handleSignOutCurrent = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setExistingUser(null);
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่านของผู้ดูแลระบบ/ครูผู้สอน');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured()) {
        setError(
          'ยังไม่ได้เชื่อมต่อ Supabase จริง กรุณาตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ในไฟล์ .env'
        );
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Cleanly sign out of any previous session first
      await supabase.auth.signOut();

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        let msg = authError.message;
        if (
          authError.message.includes('Invalid login credentials') ||
          authError.message.includes('invalid_grant')
        ) {
          msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบสิทธิ์ผู้สอน';
        }
        setError(msg);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('ไม่พบข้อมูลบัญชีผู้ใช้งาน');
        setLoading(false);
        return;
      }

      // Check verified role in public.profiles table
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // If user is เจตภานุ or designated teacher email, ensure admin role
      const isChetphanu =
        data.user.email?.toLowerCase().includes('68219100010') ||
        profile?.first_name?.includes('เจตภานุ') ||
        data.user.email?.toLowerCase().includes('teacher@');

      if (isChetphanu && profile?.role !== 'admin' && data.user.email) {
        try {
          await supabase.rpc('promote_to_teacher', { p_email: data.user.email });
          profile = { ...profile, role: 'admin' } as any;
        } catch (promoteErr) {
          console.warn('Auto promote teacher notice:', promoteErr);
        }
      }

      if (profile?.role !== 'admin' && !isChetphanu) {
        // Sign out or deny immediately
        await supabase.auth.signOut();
        setError(
          'การเข้าถึงถูกปฏิเสธ: บัญชีนี้มีสิทธิ์ "นักเรียน" (User) ไม่สามารถเข้าถึงระบบครูผู้สอนได้ กรุณาใช้หน้าเข้าสู่ระบบนักเรียน'
        );
        setLoading(false);
        return;
      }

      setSuccess(true);
      router.push('/teacher');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบครูผู้สอน';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#060913] text-slate-100 cyber-grid relative">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        <AuthCard
          title="เข้าสู่ระบบครูผู้สอน"
          subtitle="ระบบควบคุมและจัดการการเรียนรู้วิชาคอมพิวเตอร์ (Teacher & Admin Console)"
          badge="TEACHER / ADMIN ACCESS"
          variant="teacher"
          footer={
            <div className="space-y-3 font-thai">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <span>สำหรับนักเรียน กรุณา</span>
                <Link
                  href="/login"
                  className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4"
                >
                  เข้าสู่ระบบนักเรียนที่นี่
                </Link>
              </div>

              <div className="flex items-center justify-center pt-2 border-t border-slate-800/80">
                <Link
                  href="/"
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>กลับสู่หน้าแรก Com Quest</span>
                </Link>
              </div>
            </div>
          }
        >
          {success && (
            <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-sm font-thai flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>ยืนยันสิทธิ์ครูผู้สอนสำเร็จ! กำลังเข้าสู่ Teacher Dashboard...</span>
            </div>
          )}

          {/* Active Session Notice */}
          {existingUser && (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-thai">
              <div className="space-y-0.5 text-left">
                <span className="text-[11px] text-amber-400 font-mono">
                  {existingUser.role === 'admin' ? '🛡️ คุณกำลังเข้าสู่ระบบอยู่ (คุณครู):' : '👤 คุณกำลังเข้าสู่ระบบอยู่ (นักเรียน):'}
                </span>
                <div className="font-bold text-white text-sm">{existingUser.name}</div>
                <div className="text-[11px] text-slate-400 font-mono">{existingUser.email}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSignOutCurrent}
                  className="px-2.5 py-1 rounded-md bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-cyber cursor-pointer transition-all"
                >
                  ออกจากระบบ
                </button>
                <Link
                  href={existingUser.role === 'admin' ? '/teacher' : '/profile'}
                  className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 text-xs font-cyber font-bold hover:bg-amber-400 transition-all"
                >
                  ไปหน้าของฉัน
                </Link>
              </div>
            </div>
          )}

          <ErrorMessage message={error} onDismiss={() => setError(null)} />

          {/* Teacher Security Notice */}
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs font-thai flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-amber-200">พื้นที่ความปลอดภัยสูง:</span>{' '}
              สงวนสิทธิ์เฉพาะครูผู้สอนและผู้ดูแลระบบที่ได้รับอนุมัติสิทธิ์ (Admin Role) เท่านั้น
              ไม่มีการเปิดรับสมัครบัญชีครูแบบสาธารณะ
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="อีเมลครูผู้สอน"
              id="teacherEmail"
              name="email"
              type="email"
              placeholder="teacher@school.ac.th"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4 text-amber-400" />}
              disabled={loading}
            />

            <PasswordInput
              label="รหัสผ่านผู้ดูแลระบบ"
              id="teacherPassword"
              name="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading}
              className={`
                w-full py-3 px-4 rounded-md font-cyber text-sm font-bold uppercase tracking-wider
                bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600
                text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)]
                hover:shadow-[0_0_30px_rgba(245,158,11,0.6)]
                hover:brightness-110 active:scale-[0.99]
                transition-all duration-200 flex items-center justify-center gap-2
                disabled:opacity-50 disabled:pointer-events-none
              `}
            >
              <Shield className="w-4 h-4 fill-current" />
              <span>{loading ? 'กำลังตรวจสอบสิทธิ์...' : 'เข้าสู่ระบบครูผู้สอน'}</span>
            </button>
          </form>

        </AuthCard>
      </main>

      <Footer />
    </div>
  );
}
