'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Gamepad2, ShieldAlert, LogIn, UserPlus, Menu, X, LogOut, User, ShieldCheck } from 'lucide-react';
import { PrimaryButton } from '../ui/PrimaryButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import { createClient } from '@/lib/supabase/client';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email?: string;
    name: string;
    role: 'user' | 'admin';
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/teacher/login';

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) {
            setCurrentUser(null);
            setAuthLoading(false);
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

          setCurrentUser({
            id: user.id,
            email: user.email,
            name: displayName,
            role: (profile?.role === 'admin' ? 'admin' : 'user'),
          });
          setAuthLoading(false);
        }
      } catch (e) {
        if (isMounted) setAuthLoading(false);
      }
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setCurrentUser(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-500/20 bg-[#060913]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group focus:outline-none"
          aria-label="COM QUEST หน้าแรก"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-[0_0_15px_rgba(0,240,255,0.4)] group-hover:shadow-[0_0_25px_rgba(0,240,255,0.7)] transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-pixel text-base sm:text-lg tracking-wider text-white group-hover:text-cyan-300 transition-colors drop-shadow-sm">
              COM QUEST
            </span>
            <span className="text-[10px] font-mono text-cyan-400/80 tracking-widest uppercase">
              LEVEL 1: HTML & COMPUTING
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-xs font-cyber tracking-wider transition-colors ${
              pathname === '/'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            หน้าแรก
          </Link>

          {/* Quick status pill */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SYSTEM ONLINE</span>
          </div>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            /* Logged in state */
            <div className="flex items-center gap-2.5">
              {currentUser.role === 'admin' ? (
                /* Admin / Teacher Active Badge */
                <Link
                  href="/teacher"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/50 text-amber-300 hover:bg-amber-900/60 text-xs font-cyber transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  title="คลิกเพื่อไปแดชบอร์ดครูผู้สอน"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-bold truncate max-w-[160px]">ครู: {currentUser.name}</span>
                </Link>
              ) : (
                /* Student Active Badge */
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/60 text-xs font-cyber transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                  title="คลิกเพื่อไปโปรไฟล์ของคุณ"
                >
                  <User className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-bold truncate max-w-[160px]">{currentUser.name}</span>
                </Link>
              )}

              {/* Portal Jump Button */}
              <Link
                href={currentUser.role === 'admin' ? '/teacher' : '/profile'}
                className="px-3 py-1.5 rounded-md text-xs font-cyber font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all"
              >
                {currentUser.role === 'admin' ? 'ไปแดชบอร์ดครู' : 'โปรไฟล์นักเรียน'}
              </Link>

              {/* Direct Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-cyber text-rose-300 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-500/40 hover:border-rose-400 transition-all cursor-pointer"
                title="ออกจากระบบ เพื่อสลับบัญชีหรือเข้าสู่ระบบใหม่"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          ) : !authLoading && (
            /* Logged out state */
            <>
              <Link
                href="/teacher/login"
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-cyber tracking-wide whitespace-nowrap shrink-0
                  text-amber-400/90 hover:text-amber-300 bg-amber-950/30 hover:bg-amber-950/60
                  border border-amber-500/30 hover:border-amber-400/60 transition-all
                `}
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>สำหรับครู</span>
              </Link>

              {!isAuthPage && (
                <>
                  <SecondaryButton href="/login" size="sm" icon={<LogIn className="w-3.5 h-3.5" />}>
                    เข้าสู่ระบบ
                  </SecondaryButton>
                  <PrimaryButton href="/register" size="sm" icon={<UserPlus className="w-3.5 h-3.5" />}>
                    สมัครสมาชิก
                  </PrimaryButton>
                </>
              )}

              {isAuthPage && (
                <SecondaryButton href="/" size="sm">
                  กลับหน้าแรก
                </SecondaryButton>
              )}
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none"
            aria-label="เมนูหลัก"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-cyan-500/20 bg-[#060913]/98 px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-2 pt-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-cyber text-slate-200 hover:bg-slate-900"
            >
              หน้าแรก
            </Link>

            {currentUser ? (
              <>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="text-xs font-thai">
                    <div className="text-slate-400 text-[10px]">เข้าสู่ระบบในชื่อ:</div>
                    <div className="font-bold text-cyan-300">{currentUser.name}</div>
                    <div className="text-[10px] text-amber-400">
                      {currentUser.role === 'admin' ? '🛡️ ครูผู้สอน / Admin' : '👤 นักเรียน (Student)'}
                    </div>
                  </div>
                  <Link
                    href={currentUser.role === 'admin' ? '/teacher' : '/profile'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-1.5 rounded bg-cyan-500 text-slate-950 font-bold text-xs"
                  >
                    ไปหน้าหลัก
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full px-3 py-2 rounded-md text-sm font-cyber text-rose-300 bg-rose-950/40 border border-rose-500/40 flex items-center justify-between"
                >
                  <span>ออกจากระบบ (สลับบัญชี)</span>
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-md text-sm font-cyber text-cyan-400 font-bold hover:bg-slate-900 flex items-center justify-between"
                >
                  <span>สมัครสมาชิก (นักเรียน)</span>
                  <UserPlus className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-md text-sm font-cyber text-slate-200 hover:bg-slate-900 flex items-center justify-between"
                >
                  <span>เข้าสู่ระบบ (นักเรียน)</span>
                  <LogIn className="w-4 h-4" />
                </Link>
                <Link
                  href="/teacher/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-md text-sm font-cyber text-amber-400 bg-amber-950/20 border border-amber-500/30 flex items-center justify-between"
                >
                  <span>เข้าสู่ระบบครูผู้สอน</span>
                  <ShieldAlert className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
