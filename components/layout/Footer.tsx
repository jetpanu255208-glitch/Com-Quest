import React from 'react';
import Link from 'next/link';
import { Gamepad2, Shield, Sparkles, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#040711] text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand & Bio */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-pixel text-base text-white tracking-wider">
                COM QUEST
              </span>
            </div>
            <p className="text-sm font-thai leading-relaxed text-slate-400 max-w-md">
              แพลตฟอร์มการเรียนรู้วิชาคอมพิวเตอร์และ HTML สไตล์เกม RPG ผจญภัย 8-Bit
              พร้อมระบบสะสมค่าประสบการณ์ (EXP) อัปเลเวล และปลดล็อกเหรียญตราความสำเร็จ
            </p>
            <div className="flex items-center gap-3 text-xs font-mono text-cyan-400/70 pt-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> GAMIFIED LEARNING
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" /> HTML & CS QUESTS
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-cyber uppercase tracking-wider text-slate-200">
              ระบบเข้าใช้งาน
            </h4>
            <ul className="space-y-2 text-xs font-thai">
              <li>
                <Link href="/register" className="hover:text-cyan-400 transition-colors">
                  สมัครสมาชิกนักเรียน (Register)
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-cyan-400 transition-colors">
                  เข้าสู่ระบบนักเรียน (Student Login)
                </Link>
              </li>
              <li>
                <Link
                  href="/teacher/login"
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <Shield className="w-3 h-3 text-amber-500" />
                  <span>เข้าสู่ระบบครูผู้สอน (Teacher Portal)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Architecture & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-cyber uppercase tracking-wider text-slate-200">
              เทคโนโลยีความปลอดภัย
            </h4>
            <ul className="space-y-2 text-xs font-mono text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Next.js App Router (SSR)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Supabase PostgreSQL + RLS</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Supabase Auth & Security</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Role-Based Access Control</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div>
            © 2026 COM QUEST. All Quest Rights Reserved.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>STABLE BUILD v1.0.0</span>
            <span>•</span>
            <span className="text-emerald-400">ENCRYPTION ACTIVE</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
