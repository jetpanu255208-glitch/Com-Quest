'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthCard } from '@/components/ui/AuthCard';
import { FormInput } from '@/components/ui/FormInput';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
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
      setError('กรุณากรอกอีเมลหรือรหัสประจำตัวนักเรียน 11 หลัก และรหัสผ่าน');
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

      // Cleanly sign out of any previous session first so cookies are never mixed
      await supabase.auth.signOut();

      let targetEmail = email.trim();

      // If user provided a student ID (e.g. 11 digits) or username instead of email:
      if (!targetEmail.includes('@')) {
        const { data: matchedProfile } = await supabase
          .from('profiles')
          .select('email')
          .or(`student_id.eq.${targetEmail},username.eq.${targetEmail}`)
          .maybeSingle();

        if (matchedProfile && matchedProfile.email) {
          targetEmail = matchedProfile.email;
        } else {
          setError('ไม่พบรหัสประจำตัวนักเรียนหรือชื่อผู้ใช้นี้ในระบบ กรุณาตรวจสอบรหัส 11 หลักหรือใช้อีเมล');
          setLoading(false);
          return;
        }
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (authError) {
        let msg = authError.message;
        if (
          authError.message.includes('Invalid login credentials') ||
          authError.message.includes('invalid_grant')
        ) {
          msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง';
        } else if (authError.message.includes('Email not confirmed')) {
          msg = 'อีเมลนี้ยังไม่ได้รับการยืนยันตัวตน กรุณาตรวจสอบกล่องจดหมายของคุณ';
        }
        setError(msg);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('ไม่พบข้อมูลผู้ใช้งาน');
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Fetch user profile securely to determine role
      let { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      // Self-heal: If user has account in auth.users but profile row is missing
      if (!profile) {
        const meta = data.user.user_metadata || {};
        const emailPrefix = data.user.email ? data.user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') : 'student';
        const fallbackUsername = meta.username || emailPrefix || ('quest_' + data.user.id.replace(/-/g, '').slice(0, 8));

        const { data: healed } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email || '',
            username: fallbackUsername,
            first_name: meta.first_name || null,
            last_name: meta.last_name || null,
            student_id: meta.student_id ? String(meta.student_id).trim() : null,
            role: 'user',
          })
          .select('role')
          .maybeSingle();

        if (healed) {
          profile = healed;
        }
      }

      const targetRoute = profile?.role === 'admin' ? '/teacher' : '/profile';
      router.push(targetRoute);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#060913] text-slate-100 cyber-grid relative">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        <AuthCard
          title="เข้าสู่ระบบนักเรียน"
          subtitle="เข้าสู่ Com Quest เพื่อทำเควสต์การเรียนรู้และอัปเลเวล"
          badge="STUDENT LOGIN"
          variant="student"
          footer={
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-1.5 font-thai">
                <span>ยังไม่มีบัญชีนักเรียน?</span>
                <Link
                  href="/register"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 transition-colors"
                >
                  สมัครสมาชิกที่นี่
                </Link>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center">
                <Link
                  href="/teacher/login"
                  className="text-xs text-amber-400/90 hover:text-amber-300 flex items-center gap-1 font-cyber tracking-wide transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบสำหรับครูผู้สอน (Teacher Portal)</span>
                </Link>
              </div>
            </div>
          }
        >
          {success && (
            <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-sm font-thai flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>เข้าสู่ระบบสำเร็จ! กำลังนำท่านเข้าสู่เกม...</span>
            </div>
          )}

          {/* Active Session Notice */}
          {existingUser && (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-thai">
              <div className="space-y-0.5 text-left">
                <span className="text-[11px] text-cyan-400 font-mono">
                  {existingUser.role === 'admin' ? '🛡️ เข้าสู่ระบบอยู่ (คุณครู):' : '👤 เข้าสู่ระบบอยู่ (นักเรียน):'}
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
                  className="px-2.5 py-1 rounded-md bg-cyan-500 text-slate-950 text-xs font-cyber font-bold hover:bg-cyan-400 transition-all"
                >
                  ไปหน้าของฉัน
                </Link>
              </div>
            </div>
          )}

          <ErrorMessage message={error} onDismiss={() => setError(null)} />


          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="อีเมล หรือ รหัสนักเรียน (11 หลัก)"
              id="loginEmail"
              name="email"
              type="text"
              placeholder="เช่น 68219100010 หรือ student@svc.ac.th"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              helperText="สามารถใช้รหัสนักเรียน 11 หลัก หรืออีเมลที่ลงทะเบียนไว้"
              icon={<Mail className="w-4 h-4" />}
              disabled={loading}
            />

            <PasswordInput
              label="รหัสผ่าน"
              id="loginPassword"
              name="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <PrimaryButton
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              disabled={loading}
              className="mt-2"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Start Quest)'}
            </PrimaryButton>
          </form>
        </AuthCard>
      </main>

      <Footer />
    </div>
  );
}
