'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, BookOpen, Settings, Gamepad2 } from 'lucide-react';
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

  const navItems = [
    {
      name: 'โปรไฟล์',
      enName: 'Profile',
      href: '/profile',
      icon: <User className="w-4 h-4" />,
    },
    {
      name: 'วิชา',
      enName: 'Subjects',
      href: '/subjects',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      name: 'ตั้งค่า',
      enName: 'Settings',
      href: '/settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <nav
      className="sticky top-0 z-40 w-full border-b border-cyan-500/20 bg-[#060913]/90 backdrop-blur-md"
      aria-label="Student Main Navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <Link
          href="/profile"
          className="flex items-center gap-3 group focus:outline-none shrink-0"
          aria-label="COM QUEST หน้าโปรไฟล์"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-[0_0_15px_rgba(0,240,255,0.35)] group-hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] transition-all flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-pixel text-sm sm:text-base text-white tracking-wider group-hover:text-cyan-300 transition-colors">
              COM QUEST
            </span>
            <span className="text-[10px] font-mono text-cyan-400/80 tracking-widest uppercase">
              STUDENT RPG PORTAL
            </span>
          </div>
        </Link>

        {/* Center: Retro RPG Menu Items */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-cyber tracking-wider
                  transition-all duration-200 select-none whitespace-nowrap
                  ${
                    isActive
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 shadow-[0_0_15px_rgba(0,240,255,0.3)] font-bold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
                  }
                `}
              >
                <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span className="font-thai">{item.name}</span>
                <span className="hidden md:inline text-[10px] opacity-60 font-mono">
                  ({item.enName})
                </span>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-cyan-400 rounded-full blur-[1px]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: Player Level & Logout */}
        <div className="flex items-center gap-3 shrink-0">
          {username && (
            <span className="hidden lg:inline text-xs font-cyber text-slate-300 truncate max-w-[120px]">
              {username}
            </span>
          )}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-slate-400">LVL</span>
            <span className="text-cyan-300 font-bold">{level}</span>
          </div>
          <LogoutButton variant="cyan" />
        </div>
      </div>
    </nav>
  );
};
