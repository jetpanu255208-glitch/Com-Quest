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
import { User, IdCard, Mail, UserCheck, CheckCircle2 } from 'lucide-react';

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

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific error as user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'กรุณากรอกชื่อจริง';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'กรุณากรอกนามสกุล';
    }

    // Student ID must be exactly 11 digits
    const cleanStudentId = formData.studentId.trim();
    if (!cleanStudentId) {
      newErrors.studentId = 'กรุณากรอกรหัสนักเรียน';
    } else if (!/^\d+$/.test(cleanStudentId)) {
      newErrors.studentId = 'รหัสนักเรียนต้องเป็นตัวเลขเท่านั้น (ห้ามมีตัวอักษรหรือสัญลักษณ์)';
    } else if (cleanStudentId.length < 11) {
      newErrors.studentId = `รหัสนักเรียนต้องเป็นตัวเลขครบ 11 หลัก (คุณกรอกไม่ครบ: มีเพียง ${cleanStudentId.length} หลัก)`;
    } else if (cleanStudentId.length > 11) {
      newErrors.studentId = `รหัสนักเรียนต้องเป็นตัวเลขครบ 11 หลัก (คุณกรอกเกิน: มี ${cleanStudentId.length} หลัก)`;
    }

    // Username validation
    const cleanUsername = formData.username.trim();
    if (!cleanUsername) {
      newErrors.username = 'กรุณากรอกชื่อผู้ใช้ (Username)';
    } else if (cleanUsername.length < 3) {
      newErrors.username = 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร';
    } else if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      newErrors.username = 'ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และ _ เท่านั้น';
    }

    // Email validation
    const cleanEmail = formData.email.trim();
    if (!cleanEmail) {
      newErrors.email = 'กรุณากรอกอีเมล';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = 'กรุณากรอกรูปแบบอีเมลให้ถูกต้อง';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (formData.password.length < 6) {
      newErrors.password = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'กรุณายืนยันรหัสผ่าน';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านยืนยันไม่ตรงกับรหัสผ่านที่ตั้งไว้';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors({});

      if (!isSupabaseConfigured()) {
        setErrors({
          general:
            'ยังไม่ได้เชื่อมต่อ Supabase จริง (อยู่ในโหมดจำลอง) กรุณาระบุ NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ในไฟล์ .env',
        });
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Check username and student_id uniqueness using RPC check_identifier_exists or direct query
      try {
        const { data: rpcCheck } = await supabase.rpc('check_identifier_exists', {
          p_username: formData.username.trim(),
          p_student_id: formData.studentId.trim(),
        });

        if (rpcCheck) {
          if (rpcCheck.username_taken) {
            setErrors({
              username: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาเลือกชื่อผู้ใช้อื่น',
            });
            setLoading(false);
            return;
          }
          if (rpcCheck.student_id_taken) {
            setErrors({
              studentId: 'รหัสนักเรียน 11 หลักนี้มีอยู่ในระบบแล้ว',
            });
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fallback to direct query if RPC does not exist yet
      }

      // Fallback check username uniqueness in profiles table
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', formData.username.trim())
        .maybeSingle();

      if (existingUser) {
        setErrors({
          username: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาเลือกชื่อผู้ใช้อื่น',
        });
        setLoading(false);
        return;
      }

      // Fallback check student_id uniqueness
      const { data: existingStudentId } = await supabase
        .from('profiles')
        .select('id')
        .eq('student_id', formData.studentId.trim())
        .maybeSingle();

      if (existingStudentId) {
        setErrors({
          studentId: 'รหัสนักเรียน 11 หลักนี้มีอยู่ในระบบแล้ว',
        });
        setLoading(false);
        return;
      }

      // Cleanly sign out of any previous session first so cookies/credentials are never mixed
      await supabase.auth.signOut();

      // Register user with Supabase Auth
      // The role is securely defaulted to 'user' in the database trigger
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            student_id: formData.studentId.trim(),
            username: formData.username.trim(),
          },
        },
      });

      if (error) {
        let thaiError = error.message;
        if (error.message.includes('already registered')) {
          thaiError = 'อีเมลนี้ถูกลงทะเบียนไว้ในระบบแล้ว กรุณาเข้าสู่ระบบ';
        } else if (error.message.includes('Password should be')) {
          thaiError = 'รหัสผ่านสั้นเกินไป ต้องมีอย่างน้อย 6 ตัวอักษร';
        }
        setErrors({ general: thaiError });
        setLoading(false);
        return;
      }

      // Check if session established or confirmation required
      if (data?.session && data.user) {
        // Ensure student profile is reliably recorded in profiles table
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (existingProfile) {
          const { error: updateErr } = await supabase
            .from('profiles')
            .update({
              student_id: formData.studentId.trim(),
              first_name: formData.firstName.trim(),
              last_name: formData.lastName.trim(),
              username: formData.username.trim(),
            })
            .eq('id', data.user.id);

          if (updateErr) {
            console.warn('Profile update with 11 digits failed, falling back without student_id:', updateErr);
            // If constraint chk_profiles_student_id in DB only allows 12 digits, still update names
            await supabase
              .from('profiles')
              .update({
                first_name: formData.firstName.trim(),
                last_name: formData.lastName.trim(),
                username: formData.username.trim(),
              })
              .eq('id', data.user.id);
          }
        } else {
          const { error: insertErr } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: formData.email.trim(),
              first_name: formData.firstName.trim(),
              last_name: formData.lastName.trim(),
              student_id: formData.studentId.trim(),
              username: formData.username.trim(),
              role: 'user',
            });

          if (insertErr) {
            console.warn('Profile insert with 11 digits failed, falling back without student_id:', insertErr);
            // Fallback insert without student_id so row is guaranteed to exist in profiles table
            await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: formData.email.trim(),
                first_name: formData.firstName.trim(),
                last_name: formData.lastName.trim(),
                username: formData.username.trim(),
                role: 'user',
              });
          }
        }

        setSuccessMessage('สมัครสมาชิกสำเร็จ! กำลังนำท่านเข้าสู่โปรไฟล์ Com Quest...');
        setTimeout(() => {
          router.push('/profile');
          router.refresh();
        }, 1500);
      } else {
        setSuccessMessage(
          'สมัครสมาชิกสำเร็จเรียบร้อย! หากมีการเปิดระบบยืนยันอีเมล กรุณาตรวจสอบอีเมลของคุณก่อนเข้าสู่ระบบ'
        );
        setTimeout(() => {
          router.push('/login?registered=true');
        }, 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#060913] text-slate-100 cyber-grid relative">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        <AuthCard
          title="สร้างบัญชีนักเรียน"
          subtitle="ลงทะเบียนเพื่อเริ่มสะสม EXP ปลดล็อกบทเรียน และสร้างตัวละคร Com Quest"
          badge="STUDENT REGISTRATION"
          variant="student"
          className="max-w-xl"
          footer={
            <div className="flex items-center justify-center gap-1.5 font-thai">
              <span>มีบัญชีนักเรียนแล้วหรือยัง?</span>
              <Link
                href="/login"
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 transition-colors"
              >
                เข้าสู่ระบบที่นี่
              </Link>
            </div>
          }
        >
          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-sm font-thai flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
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

          {/* General Error Banner */}
          <ErrorMessage
            message={errors.general}
            onDismiss={() => setErrors((prev) => ({ ...prev, general: undefined }))}
          />


          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields (2 columns on sm+) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="ชื่อจริง"
                id="firstName"
                name="firstName"
                type="text"
                placeholder="สมชาย"
                required
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                icon={<User className="w-4 h-4" />}
                disabled={loading}
              />

              <FormInput
                label="นามสกุล"
                id="lastName"
                name="lastName"
                type="text"
                placeholder="ใจดี"
                required
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                icon={<User className="w-4 h-4" />}
                disabled={loading}
              />
            </div>

            {/* Student ID (11 digits) */}
            <FormInput
              label="รหัสนักเรียน (11 หลัก)"
              id="studentId"
              name="studentId"
              type="text"
              inputMode="numeric"
              maxLength={15}
              placeholder="68219100010"
              required
              value={formData.studentId}
              onChange={handleChange}
              error={errors.studentId}
              helperText="กรอกตัวเลข 11 หลักตามบัตรประจำตัวนักเรียน (ระบบจะเก็บเลข 0 ตัวหน้าไว้ครบถ้วน)"
              icon={<IdCard className="w-4 h-4" />}
              disabled={loading}
            />

            {/* Username & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="ชื่อผู้ใช้ (Username)"
                id="username"
                name="username"
                type="text"
                placeholder="somchai_quest"
                required
                value={formData.username}
                onChange={handleChange}
                error={errors.username}
                icon={<UserCheck className="w-4 h-4" />}
                disabled={loading}
              />

              <FormInput
                label="อีเมล"
                id="email"
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
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PasswordInput
                label="รหัสผ่าน"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                helperText="ขั้นต่ำ 6 ตัวอักษร"
                disabled={loading}
              />

              <PasswordInput
                label="ยืนยันรหัสผ่าน"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                disabled={loading}
              />
            </div>

            {/* Role Notice */}
            <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[11px] font-thai text-slate-400">
              🛡 บัญชีนักเรียนจะได้รับสิทธิ์ <span className="text-cyan-400 font-mono">user</span> โดยอัตโนมัติ
              รหัสผ่านของคุณจะถูกเข้ารหัสความปลอดภัยตามมาตรฐานสากล
            </div>

            {/* Submit Button */}
            <PrimaryButton
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              disabled={loading}
              className="mt-2"
            >
              {loading ? 'กำลังลงทะเบียน...' : 'ยืนยันการสมัครสมาชิก'}
            </PrimaryButton>
          </form>
        </AuthCard>
      </main>

      <Footer />
    </div>
  );
}
