import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { GameCartridge } from '@/components/landing/GameCartridge';
import { HeroAuthActions } from '@/components/landing/HeroAuthActions';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import {
  Zap,
  ShieldAlert,
  Trophy,
  Swords,
  BookOpen,
  ArrowRight,
  Code2,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#060913] text-slate-100 cyber-grid relative overflow-x-hidden">
      {/* Background radial gradients */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-40 z-0">
        <div className="absolute top-12 left-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px]" />
        <div className="absolute top-32 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px]" />
      </div>

      <Navbar />

      <main className="flex-1 relative z-10">
        {/* HERO SECTION */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* LEFT SECTION */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
              {/* Badge Announcement */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-semibold tracking-wide">RPG LEARNING PLATFORM</span>
                <span className="text-cyan-500">•</span>
                <span className="text-slate-300">OPEN BETA 2026</span>
              </div>

              {/* Title & Brand Name */}
              <div className="space-y-3">
                <h1 className="font-pixel text-4xl sm:text-5xl md:text-6xl text-white tracking-wider leading-tight drop-shadow-[0_4px_20px_rgba(0,240,255,0.3)]">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-white">
                    COM QUEST
                  </span>
                </h1>
                <p className="text-xl sm:text-2xl md:text-3xl font-cyber font-bold text-cyan-300 text-glow-cyan tracking-wide">
                  &ldquo;มาเรียนรู้วิชาคอมพิวเตอร์ไม่ให้น่าเบื่อกันเลย&rdquo;
                </p>
              </div>

              {/* Supporting Description */}
              <p className="text-base sm:text-lg text-slate-300 font-thai max-w-2xl leading-relaxed mx-auto lg:mx-0">
                เปลี่ยนการเรียนรู้ให้เป็นการผจญภัย ทำแบบฝึกหัด เก็บ EXP อัปเลเวล
                และพัฒนาทักษะคอมพิวเตอร์ไปพร้อมกัน
                พร้อมระบบเควสต์การเขียนโค้ด HTML สุดท้าทายและเหรียญรางวัลความสำเร็จ
              </p>

              {/* Action Buttons (Session aware with clean switcher) */}
              <HeroAuthActions />

              {/* Quick Feature Perks */}
              <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0 text-left">
                <div className="flex items-center gap-2 text-xs font-cyber text-slate-300">
                  <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>ระบบ EXP & Badge</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-cyber text-slate-300">
                  <Code2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>แบบฝึกหัด HTML จริง</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-cyber text-slate-300">
                  <Swords className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>เควสต์ & บอสปริศนา</span>
                </div>
              </div>
            </div>

            {/* RIGHT SECTION: RETRO GAME CARTRIDGE ARTWORK */}
            <div className="lg:col-span-5 flex justify-center items-center py-6 lg:py-0">
              <GameCartridge />
            </div>
          </div>
        </section>

        {/* WHY COM QUEST SECTION (Aesthetic Game Modules) */}
        <section className="py-16 sm:py-24 border-t border-cyan-500/20 bg-gradient-to-b from-[#060913] via-[#091024] to-[#060913]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-block px-3 py-1 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-pixel text-xs tracking-wider">
                QUEST FEATURES
              </div>
              <h2 className="text-3xl sm:text-4xl font-cyber font-bold text-white tracking-wide">
                ออกแบบมาเพื่อให้นักเรียนทุกคนรักการเขียนโปรแกรม
              </h2>
              <p className="text-slate-400 font-thai text-base">
                ผสานโลกแห่งเกม RPG ยุค 8-Bit เข้ากับหลักสูตรวิชาคอมพิวเตอร์และเว็บเทคโนโลยีระดับมาตรฐาน
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="glass-panel glass-panel-hover p-6 sm:p-8 rounded-xl relative overflow-hidden group">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Code2 className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-cyber font-bold text-white mb-2">
                  1. ดันเจี้ยนโค้ด HTML แบบโต้ตอบ
                </h3>
                <p className="text-sm font-thai text-slate-300 leading-relaxed">
                  ฝึกเขียนแท็ก HTML, โครงสร้างเว็บ, CSS และ JavaScript
                  ผ่านหน้าต่างจำลองโค้ดแบบ Interactive ตรวจผลลัพธ์ทันทีไม่ต้องติดตั้งโปรแกรมเพิ่ม
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-panel glass-panel-hover p-6 sm:p-8 rounded-xl relative overflow-hidden group">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Trophy className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-cyber font-bold text-white mb-2">
                  2. เลเวลอัป & เก็บ EXP สะสมฉายา
                </h3>
                <p className="text-sm font-thai text-slate-300 leading-relaxed">
                  ทุกแบบฝึกหัดที่ทำสำเร็จจะได้รับคะแนนค่าประสบการณ์ (EXP)
                  ไต่ระดับตั้งแต่ Novice Coder สู่ Web Archmage พร้อมประวัติการเรียนแบบ Realtime
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-panel glass-panel-hover p-6 sm:p-8 rounded-xl relative overflow-hidden group">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-cyber font-bold text-white mb-2">
                  3. พื้นที่บริหารจัดการสำหรับครู
                </h3>
                <p className="text-sm font-thai text-slate-300 leading-relaxed">
                  ระบบ Portal เฉพาะสำหรับครูผู้สอน ตรวจสอบความคืบหน้านักเรียน ดูรายงานคะแนน
                  และสร้างโจทย์แบบฝึกหัดเสริมตามแผนการสอนได้อย่างปลอดภัย
                </p>
              </div>
            </div>

            {/* Bottom Call to Action Banner */}
            <div className="mt-16 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-blue-950/70 border border-cyan-500/40 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 glow-cyan-sm">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl sm:text-3xl font-cyber font-bold text-white">
                  พร้อมก้าวสู่โลกแห่ง Com Quest แล้วหรือยัง?
                </h3>
                <p className="text-sm sm:text-base text-slate-300 font-thai">
                  สมัครสมาชิกฟรีวันนี้ และเริ่มเก็บค่าประสบการณ์เควสต์แรกได้ทันที
                </p>
              </div>
              <PrimaryButton href="/register" size="md" className="shrink-0 whitespace-nowrap text-sm sm:text-base font-bold">
                สร้างตัวละครใหม่ (สมัครสมาชิก)
              </PrimaryButton>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
