'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, User, Settings, Gamepad2 } from 'lucide-react';
import { LogoutButton } from '../dashboard/LogoutButton';
import { createClient } from '@/lib/supabase/client';
import { OFFICIAL_HTML_LESSONS } from '@/lib/supabase/types';

interface StudentNavProps {
  username?: string;
  level?: number;
  avatarUrl?: string | null;
}

export const StudentNav: React.FC<StudentNavProps> = ({
  username,
  level = 0,
  avatarUrl: initialAvatarUrl = null,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [imgError, setImgError] = useState(false);
  const [unlockedBonusGame, setUnlockedBonusGame] = useState<boolean>(level >= 800);

  useEffect(() => {
    if (initialAvatarUrl) {
      setAvatarUrl(initialAvatarUrl);
      setImgError(false);
    }
  }, [initialAvatarUrl]);

  useEffect(() => {
    if (level >= 800) {
      setUnlockedBonusGame(true);
      try {
        sessionStorage.setItem('comquest_bonus_unlocked', 'true');
      } catch {}
    }
  }, [level]);

  useEffect(() => {
    router.prefetch('/profile');
    router.prefetch('/subjects');
    router.prefetch('/settings');

    try {
      if (sessionStorage.getItem('comquest_bonus_unlocked') === 'true') {
        setUnlockedBonusGame(true);
        router.prefetch('/quest');
      }
    } catch {}

    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (!user) return;

        if (!initialAvatarUrl) {
          const meta = user.user_metadata;
          const pic = meta?.avatar_url || meta?.picture || null;
          if (pic) {
            setAvatarUrl(pic);
          }
        }

        if (level < 800) {
          const [progRes, quizRes, profRes] = await Promise.all([
            supabase
              .from('lesson_progress')
              .select('lesson_id, completed')
              .eq('user_id', user.id)
              .eq('completed', true),
            supabase
              .from('quiz_attempts')
              .select('lesson_id, passed')
              .eq('user_id', user.id)
              .eq('passed', true),
            supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .maybeSingle(),
          ]);

          const completedIds = new Set<string>();
          progRes.data?.forEach((p) => {
            if (p.completed) completedIds.add(p.lesson_id);
          });
          quizRes.data?.forEach((q) => {
            if (q.passed) completedIds.add(q.lesson_id);
          });

          let count = 0;
          OFFICIAL_HTML_LESSONS.forEach((l) => {
            if (completedIds.has(l.id)) count += 1;
          });

          const isUnlocked = count >= 8 || profRes.data?.role === 'admin';
          setUnlockedBonusGame(isUnlocked);
          try {
            sessionStorage.setItem('comquest_bonus_unlocked', isUnlocked ? 'true' : 'false');
          } catch {}
          if (isUnlocked) {
            router.prefetch('/quest');
          }
        }
      })
      .catch(() => {});
  }, [router, initialAvatarUrl, level]);

  const showBonusGame = level >= 800 || unlockedBonusGame;

  // Core Navigation Items (Special Game menu appears only when all 8 lessons are completed)
  const navItems = [
    {
      name: 'โปรไฟล์',
      href: '/profile',
      icon: <User className="w-5 h-5 sm:w-4 sm:h-4" />,
      isSpecial: false,
    },
    {
      name: 'วิชา',
      href: '/subjects',
      icon: <BookOpen className="w-5 h-5 sm:w-4 sm:h-4" />,
      isSpecial: false,
    },
    ...(showBonusGame
      ? [
          {
            name: 'เกมพิเศษ',
            href: '/quest',
            icon: <Gamepad2 className="w-5 h-5 sm:w-4 sm:h-4" />,
            isSpecial: true,
          },
        ]
      : []),
    {
      name: 'ตั้งค่า',
      href: '/settings',
      icon: <Settings className="w-5 h-5 sm:w-4 sm:h-4" />,
      isSpecial: false,
    },
  ];

  return (
    <>
      {/* =========================================================================
          MOBILE TOP HEADER (< md: Compact & Elegant)
          ========================================================================= */}
      <header
        className="md:hidden sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--bg-surface)]/95 backdrop-blur-md transition-colors"
        aria-label="Student Mobile Header"
      >
        <div className="px-4 h-12 flex items-center justify-between gap-2">
          {/* Left: Brand Logo */}
          <Link
            href="/profile"
            className="flex items-center gap-2 group focus:outline-none shrink-0"
            aria-label="Com Quest"
          >
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-badge-bg)] border border-[var(--border-color)] flex items-center justify-center">
              <span className="font-pixel text-[var(--neon-accent)] text-xs font-bold">
                C
              </span>
            </div>
            <span className="font-pixel text-xs text-[var(--text-primary)] tracking-wider">
              Com Quest
            </span>
          </Link>

          {/* Center: Current Page Name */}
          <div className="font-thai text-xs font-semibold text-[var(--text-secondary)] truncate">
            {navItems.find((item) => item.href === pathname)?.name || 'นักเรียน'}
          </div>

          {/* Right: Avatar Link */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/profile"
              title="โปรไฟล์ของฉัน"
              className="w-7 h-7 rounded-lg bg-[var(--accent-badge-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--neon-accent)] overflow-hidden active:scale-95 transition-all"
            >
              {avatarUrl && !imgError ? (
                <img
                  src={avatarUrl}
                  alt={username || 'Profile'}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* =========================================================================
          DESKTOP TOP HEADER (>= md: Full Cyberpunk Desktop Bar)
          ========================================================================= */}
      <header
        className="hidden md:block sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--bg-surface)]/95 backdrop-blur-md transition-colors"
        aria-label="Student Desktop Navigation"
      >
        <div className="w-full px-4 sm:px-6 lg:px-10 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: Brand Logo */}
          <Link
            href="/profile"
            className="flex items-center gap-2.5 group focus:outline-none shrink-0"
            aria-label="COM QUEST หน้าโปรไฟล์"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-badge-bg)] border border-[var(--border-color)] flex items-center justify-center group-hover:border-[var(--neon-accent)] transition-colors">
              <span className="font-pixel text-[var(--neon-accent)] text-sm font-bold">
                C
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-pixel text-xs sm:text-sm text-[var(--text-primary)] tracking-wider group-hover:text-[var(--neon-accent)] transition-colors">
                Com Quest
              </span>
              <span className="text-[9px] font-mono text-[var(--text-muted)] tracking-wider">
                STUDENT
              </span>
            </div>
          </Link>

          {/* Center: Minimal Navigation Tabs */}
          <div className="flex items-center gap-1 bg-[var(--accent-badge-bg)] p-1 rounded-xl border border-[var(--border-color)]">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-thai font-medium
                    transition-colors select-none whitespace-nowrap
                    ${
                      isActive
                        ? 'bg-[var(--neon-accent)] text-white dark:text-[#080D1A] font-semibold shadow-sm'
                        : item.isSpecial
                        ? 'bg-gradient-to-r from-amber-400/20 to-orange-400/20 border border-amber-400/50 text-amber-300 hover:from-amber-400 hover:to-orange-400 hover:text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                    }
                  `}
                >
                  <span
                    className={
                      isActive
                        ? 'text-white dark:text-[#080D1A]'
                        : item.isSpecial
                        ? 'text-amber-300 group-hover:text-slate-950'
                        : 'text-[var(--text-muted)]'
                    }
                  >
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right: Avatar & Logout */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Character / Avatar button */}
            <Link
              href="/profile"
              title="โปรไฟล์ของฉัน"
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--neon-accent)] text-xs font-mono transition-colors group"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[var(--accent-badge-bg)] border border-cyan-500/30 flex items-center justify-center text-[var(--neon-accent)] overflow-hidden shrink-0">
                {avatarUrl && !imgError ? (
                  <img
                    src={avatarUrl}
                    alt={username || 'Profile'}
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
              {username && (
                <span className="hidden lg:inline text-xs text-[var(--text-primary)] font-thai font-medium max-w-[130px] truncate">
                  {username}
                </span>
              )}
            </Link>

            {/* Desktop Logout Button */}
            <LogoutButton variant="red" />
          </div>
        </div>
      </header>

      {/* =========================================================================
          MOBILE BOTTOM NAVIGATION BAR (Clean & Minimal)
          ========================================================================= */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--bg-surface)]/98 backdrop-blur-md border-t border-[var(--border-color)] px-4 py-1.5 safe-bottom-nav transition-colors"
        aria-label="Mobile Navigation"
      >
        <div
          className={`max-w-md mx-auto grid ${
            showBonusGame ? 'grid-cols-4 gap-1.5' : 'grid-cols-3 gap-2'
          }`}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center py-1.5 rounded-lg transition-colors min-h-[46px] select-none
                  ${
                    isActive
                      ? 'bg-[var(--accent-badge-bg)] text-[var(--neon-accent)] border border-[var(--border-color)]'
                      : item.isSpecial
                      ? 'bg-amber-500/15 border border-amber-400/50 text-amber-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }
                `}
              >
                <div
                  className={
                    isActive
                      ? 'text-[var(--neon-accent)]'
                      : item.isSpecial
                      ? 'text-amber-300'
                      : 'text-slate-400'
                  }
                >
                  {item.icon}
                </div>
                <span
                  className={`text-[11px] font-thai mt-0.5 ${
                    isActive
                      ? 'font-semibold text-slate-100'
                      : item.isSpecial
                      ? 'font-bold text-amber-300'
                      : 'font-normal'
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
