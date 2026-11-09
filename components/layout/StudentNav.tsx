'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, User, Settings, LogOut } from 'lucide-react';
import { LogoutButton } from '../dashboard/LogoutButton';

interface StudentNavProps {
  username?: string;
  level?: number;
}

export const StudentNav: React.FC<StudentNavProps> = ({
  username,
  level = 0,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    router.prefetch('/profile');
    router.prefetch('/subjects');
    router.prefetch('/settings');
  }, [router]);

  // Core Navigation Items
  const navItems = [
    {
      name: 'โปรไฟล์',
      href: '/profile',
      icon: <User className="w-5 h-5 sm:w-4 sm:h-4" />,
    },
    {
      name: 'วิชา',
      href: '/subjects',
      icon: <BookOpen className="w-5 h-5 sm:w-4 sm:h-4" />,
    },
    {
      name: 'ตั้งค่า',
      href: '/settings',
      icon: <Settings className="w-5 h-5 sm:w-4 sm:h-4" />,
    },
  ];

  return (
    <>
      {/* =========================================================================
          MOBILE TOP HEADER (< md: Compact & Elegant)
          ========================================================================= */}
      <header
        className="md:hidden sticky top-0 z-40 w-full border-b border-[#263449] bg-[#080D1A]/95 backdrop-blur-md"
        aria-label="Student Mobile Header"
      >
        <div className="px-4 h-12 flex items-center justify-between gap-2">
          {/* Left: Brand Logo */}
          <Link
            href="/profile"
            className="flex items-center gap-2 group focus:outline-none shrink-0"
            aria-label="Com Quest"
          >
            <div className="w-7 h-7 rounded-lg bg-[#151F30] border border-[#263449] flex items-center justify-center">
              <span className="font-pixel text-[#00CFEF] text-xs font-bold">
                C
              </span>
            </div>
            <span className="font-pixel text-xs text-slate-100 tracking-wider">
              Com Quest
            </span>
          </Link>

          {/* Center: Current Page Name */}
          <div className="font-thai text-xs font-semibold text-slate-200 truncate">
            {navItems.find((item) => item.href === pathname)?.name || 'นักเรียน'}
          </div>

          {/* Right: Level & Avatar Link */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-2 py-0.5 rounded-md bg-[#151F30] border border-[#263449] text-[10px] font-mono text-[#00CFEF] font-semibold">
              {level > 0 ? `LV.${level}` : 'LV.00'}
            </div>
            <Link
              href="/character"
              title="แต่งตัวละคร"
              className="w-7 h-7 rounded-lg bg-[#151F30] border border-[#263449] flex items-center justify-center text-[#00CFEF] active:scale-95 transition-all"
            >
              <User className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* =========================================================================
          DESKTOP TOP HEADER (>= md: Full Cyberpunk Desktop Bar)
          ========================================================================= */}
      <header
        className="hidden md:block sticky top-0 z-40 w-full border-b border-[#263449] bg-[#080D1A]/95 backdrop-blur-md"
        aria-label="Student Desktop Navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: Brand Logo */}
          <Link
            href="/profile"
            className="flex items-center gap-2.5 group focus:outline-none shrink-0"
            aria-label="COM QUEST หน้าโปรไฟล์"
          >
            <div className="w-8 h-8 rounded-lg bg-[#151F30] border border-[#263449] flex items-center justify-center group-hover:border-[#00CFEF] transition-colors">
              <span className="font-pixel text-[#00CFEF] text-sm font-bold">
                C
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-pixel text-xs sm:text-sm text-slate-100 tracking-wider group-hover:text-[#00CFEF] transition-colors">
                Com Quest
              </span>
              <span className="text-[9px] font-mono text-slate-400 tracking-wider">
                STUDENT
              </span>
            </div>
          </Link>

          {/* Center: Minimal Navigation Tabs */}
          <div className="flex items-center gap-1 bg-[#101827] p-1 rounded-xl border border-[#263449]">
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
                        ? 'bg-[#00CFEF] text-[#080D1A] font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-[#151F30]'
                    }
                  `}
                >
                  <span className={isActive ? 'text-[#080D1A]' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right: Level & Avatar */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Level Pill */}
            <div className="px-2.5 py-1 rounded-lg bg-[#151F30] border border-[#263449] text-[11px] font-mono text-[#00CFEF] font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00CFEF]" />
              <span>{level > 0 ? `LV.${level}` : 'LV.00'}</span>
            </div>

            {/* Character / Avatar button */}
            <Link
              href="/character"
              title="แต่งตัวละคร"
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-lg bg-[#101827] border border-[#263449] hover:border-slate-600 text-xs font-mono transition-colors group"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#151F30] flex items-center justify-center text-[#00CFEF]">
                <User className="w-3.5 h-3.5" />
              </div>
              {username && (
                <span className="hidden lg:inline text-xs text-slate-200 font-medium max-w-[100px] truncate">
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
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#101827]/98 backdrop-blur-md border-t border-[#263449] px-4 py-1.5 safe-bottom-nav"
        aria-label="Mobile Navigation"
      >
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
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
                      ? 'bg-[#151F30] text-[#00CFEF]'
                      : 'text-slate-400 hover:text-slate-200'
                  }
                `}
              >
                <div className={isActive ? 'text-[#00CFEF]' : 'text-slate-400'}>
                  {item.icon}
                </div>
                <span className={`text-[11px] font-thai mt-0.5 ${isActive ? 'font-semibold text-slate-100' : 'font-normal'}`}>
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
