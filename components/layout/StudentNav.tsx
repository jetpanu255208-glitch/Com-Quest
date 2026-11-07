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
          TOP HEADER (Compact & Slim on Mobile, Full on Desktop)
          ========================================================================= */}
      <header
        className="sticky top-0 z-40 w-full border-b border-cyan-500/20 bg-[#060913]/90 backdrop-blur-md"
        aria-label="Student Main Navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-20 flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: Brand Logo */}
          <Link
            href="/profile"
            className="flex items-center gap-2 sm:gap-3 group focus:outline-none shrink-0"
            aria-label="COM QUEST หน้าโปรไฟล์"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 p-0.5 shadow-[0_0_12px_rgba(0,240,255,0.4)] group-hover:shadow-[0_0_20px_rgba(0,240,255,0.7)] transition-all flex items-center justify-center">
              <div className="w-full h-full bg-[#050b18] rounded-[9px] flex items-center justify-center">
                <span className="font-pixel text-cyan-400 text-base sm:text-lg font-bold group-hover:scale-110 transition-transform">
                  C
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-pixel text-xs sm:text-base text-white tracking-wider group-hover:text-cyan-300 transition-colors">
                Com Quest
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono text-cyan-400/80 tracking-widest uppercase">
                STUDENT RPG
              </span>
            </div>
          </Link>

          {/* Center (Desktop only): Rounded Pill Navbar */}
          <div className="hidden md:flex items-center gap-2 bg-[#091533]/80 p-1.5 rounded-full border border-cyan-500/40 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.15)]">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-thai font-semibold
                    transition-all duration-200 select-none whitespace-nowrap
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(0,240,255,0.5)] font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }
                  `}
                >
                  <span className={isActive ? 'text-white' : 'text-cyan-400'}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right: Avatar, Level, & Logout (Desktop has full button, Mobile has avatar/character link) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Level Pill */}
            <div className="px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[10px] sm:text-xs font-mono text-cyan-300 font-bold flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>{level > 0 ? `LV.${level}` : 'LV.00'}</span>
            </div>

            {/* Character / Avatar button */}
            <Link
              href="/character"
              title="แต่งตัวละคร"
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-full bg-slate-900/90 border border-cyan-500/40 hover:border-cyan-400 text-xs font-mono transition-all group"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-sm">
                <div className="w-full h-full rounded-full bg-[#070e24] flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
                  <User className="w-4 h-4" />
                </div>
              </div>
              {username && (
                <span className="hidden lg:inline text-xs font-cyber text-slate-200 font-bold max-w-[100px] truncate">
                  {username}
                </span>
              )}
            </Link>

            {/* Desktop Logout Button */}
            <div className="hidden md:block">
              <LogoutButton variant="red" />
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly & Native App Feel)
          ========================================================================= */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#060913]/95 backdrop-blur-xl border-t border-cyan-500/30 shadow-[0_-8px_25px_rgba(0,0,0,0.7)] px-4 py-2"
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
                  flex flex-col items-center justify-center py-1.5 rounded-xl transition-all duration-200 min-h-[48px] select-none
                  ${
                    isActive
                      ? 'bg-cyan-950/80 border border-cyan-400/80 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }
                `}
              >
                <div className={`${isActive ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_#00f0ff]' : 'text-slate-400'} transition-transform`}>
                  {item.icon}
                </div>
                <span className={`text-[11px] font-thai mt-0.5 ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
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
