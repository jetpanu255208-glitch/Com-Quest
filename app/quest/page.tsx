import React from 'react';
import Link from 'next/link';
import { StudentNav } from '@/components/layout/StudentNav';
import { Footer } from '@/components/layout/Footer';
import { Swords, Clock, Trophy } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function QuestPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#060913] text-slate-100 cyber-grid relative">
      <StudentNav />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-2">
            <Swords className="w-3.5 h-3.5 text-cyan-400" />
            <span>QUEST BOARD</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-cyber font-bold text-white tracking-wide">
            กระดานเควสต์การผจญภัย (Quests)
          </h1>
          <p className="text-sm font-thai text-slate-400 mt-1">
            ระบบเควสต์รายวัน เควสต์เนื้อเรื่อง และภารกิจท้าทายเขียนโค้ด
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-8 border border-cyan-500/30 text-center space-y-6 relative overflow-hidden">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-inner">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-cyber font-bold text-white">
              ระบบเควสต์กำลังเตรียมเปิดให้บริการ
            </h2>
            <p className="text-sm font-thai text-slate-400 leading-relaxed">
              ในระยะถัดไป ครูผู้สอนจะสามารถมอบหมายภารกิจแบบฝึกหัด และนักเรียนสามารถทำเควสต์เพื่อรับเหรียญตราพิเศษได้
            </p>
          </div>

          <div className="pt-4 flex justify-center gap-4">
            <Link
              href="/profile"
              className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-cyber font-bold text-xs tracking-wider transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
            >
              <Trophy className="w-4 h-4" />
              <span>กลับไปดูหน้าโปรไฟล์ & ถ้วยรางวัล</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
