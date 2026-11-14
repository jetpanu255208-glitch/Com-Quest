import React from 'react';
import Link from 'next/link';
import { Gamepad2, Shield, Sparkles, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#040711]/95 text-slate-400 mt-auto relative z-10">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-3 sm:py-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 text-xs">
          {/* Left: Brand & Short Tagline */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="font-pixel text-xs text-white tracking-wider">
                COM QUEST
              </span>
            </div>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="text-[11px] font-thai text-slate-400 text-center sm:text-left">
              เว็บไซต์เรียนรู้วิชาภาษา HTML สไตล์เกม RPG 8-Bit
            </span>
            <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400/80 bg-cyan-950/50 border border-cyan-500/20 px-2 py-0.5 rounded">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>GAMIFIED LEARNING</span>
            </span>
          </div>

          {/* Center / Right: Quick Links & Build Status */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] font-thai">
            <Link href="/subjects" className="hover:text-cyan-400 transition-colors">
              บทเรียน HTML
            </Link>
            <span className="text-slate-700">•</span>
            <Link href="/profile" className="hover:text-cyan-400 transition-colors">
              โปรไฟล์นักเรียน
            </Link>
            <span className="text-slate-700">•</span>
            <Link
              href="/teacher/login"
              className="hover:text-amber-400 transition-colors inline-flex items-center gap-1"
            >
              <Shield className="w-3 h-3 text-amber-500" />
              <span>สำหรับครูผู้สอน</span>
            </Link>
            <span className="hidden sm:inline text-slate-700">|</span>
            <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-slate-500">
              <span>© 2026 COM QUEST</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Terminal className="w-3 h-3" />
                <span>ONLINE</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
