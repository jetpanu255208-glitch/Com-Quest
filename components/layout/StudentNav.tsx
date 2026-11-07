'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, Trophy, User, Gamepad2 } from 'lucide-react';
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
    router.prefetch('/quest');
  }, [router]);

  const navItems = [
    {
      name: 'หน้าหลัก',
      href: '/',
      icon: <Home className="w-4 h-4" />,
    },
    {
      name: 'บทเรียน',
      href: '/subjects',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      name: 'รางวัล',
      href: '/quest',
      icon: <Trophy className="w-4 h-4" />,
    },
    {
      name: 'โปรไฟล์',
      href: '/profile',
      icon: <User className="w-4 h-4" />,
    },
  ];

  return (
    <nav
      className="sticky top-0 z-40 w-full border-b border-cyan-500/20 bg-[#060913]/90 backdrop-blur-md"
      aria-label="Student Main Navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Left: Brand Logo with pixel 3D badge */}
        <Link
          href="/profile"
          className="flex items-center gap-3 group focus:outline-none shrink-0"
          aria-label="COM QUEST หน้าโปรไฟล์"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 p-0.5 shadow-[0_0_15px_rgba(0,240,255,0.4)] group-hover:shadow-[0_0_25px_rgba(0,240,255,0.7)] transition-all flex items-center justify-center">
            <div className="w-full h-full bg-[#050b18] rounded-[9px] flex items-center justify-center">
              <span className="font-pixel text-cyan-400 text-lg font-bold group-hover:scale-110 transition-transform">
                C
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-pixel text-sm sm:text-base text-white tracking-wider group-hover:text-cyan-300 transition-colors">
              Com Quest
            </span>
            <span className="text-[9px] font-mono text-cyan-400/80 tracking-widest uppercase">
              STUDENT RPG
            </span>
          </div>
        </Link>

        {/* Center: Rounded Pill Navbar (Matching Concept Art) */}
        <div className="flex items-center gap-1 sm:gap-2 bg-[#091533]/80 p-1 sm:p-1.5 rounded-full border border-cyan-500/40 backdrop-blur-md overflow-x-auto scrollbar-none shadow-[0_0_20px_rgba(0,240,255,0.15)]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-thai font-semibold
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

        {/* Right: Player Avatar & Level Pill */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
              <span className="hidden md:inline text-xs font-cyber text-slate-200 font-bold max-w-[100px] truncate">
                {username}
              </span>
            )}
          </Link>
          <LogoutButton variant="cyan" />
        </div>
      </div>
    </nav>
  );
};
