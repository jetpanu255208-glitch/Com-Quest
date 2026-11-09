import React from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { InteractiveRetroRoomExperience } from '@/components/landing/InteractiveRetroRoomExperience';
import { MobileRedirectToLogin } from '@/components/mobile/MobileRedirectToLogin';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import {
  Zap,
  ShieldAlert,
  Trophy,
  Swords,
  BookOpen,
  ArrowRight,
  Code2,
} from 'lucide-react';

export default async function HomePage() {
  // 1. Server-side mobile detection: redirect straight to /login on mobile devices
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  if (isMobile) {
    redirect('/login');
  }

  return (
    <>
      {/* =========================================================================
          MOBILE HOMEPAGE: DIRECT REDIRECT TO LOGIN (< md)
          ========================================================================= */}
      <MobileRedirectToLogin />

      {/* =========================================================================
          DESKTOP HOMEPAGE: FULL RETRO ROOM & CARTRIDGE EXPERIENCE (>= md)
          ========================================================================= */}
      <div className="hidden md:flex flex-col min-h-screen bg-[#060913] text-slate-100 cyber-grid relative overflow-x-hidden">
      {/* Background radial gradients */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-40 z-0">
        <div className="absolute top-12 left-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px]" />
        <div className="absolute top-32 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px]" />
      </div>

      <Navbar />

      <main className="flex-1 relative z-10">
        {/* INTERACTIVE RETRO WORKSPACE HERO (Storyboard Flow: Room -> Insert -> Zoom -> Digital Space) */}
        <section className="relative pt-4 sm:pt-8 pb-12 sm:pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Brand Banner */}
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8 space-y-2">
            <h1 className="font-pixel text-2xl sm:text-4xl text-slate-100 tracking-wider leading-tight">
              COM QUEST
            </h1>

            <p className="text-sm sm:text-lg font-thai font-medium text-slate-300 px-2">
              &ldquo;มาเรียนรู้วิชาคอมพิวเตอร์ไม่ให้น่าเบื่อกันเลย&rdquo;
            </p>
          </div>

          {/* Interactive Retro Room Stage */}
          <div className="rounded-2xl border border-[#263449] bg-[#080D1A] overflow-hidden shadow-xl">
            <InteractiveRetroRoomExperience />
          </div>

          {/* Quick Feature Perks Underneath Stage */}
          <div className="mt-8 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto border-t border-slate-800/80 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-cyber text-slate-300 p-2 rounded-lg bg-slate-900/50 border border-slate-800">
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <span>ระบบ EXP, เลเวล &amp; เหรียญรางวัล</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-cyber text-slate-300 p-2 rounded-lg bg-slate-900/50 border border-slate-800">
              <Code2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>ด่านเขียนโค้ด HTML แบบ Interactive</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-cyber text-slate-300 p-2 rounded-lg bg-slate-900/50 border border-slate-800">
              <Swords className="w-4 h-4 text-purple-400 shrink-0" />
              <span>แบบฝึกหัด &amp; บอสปริศนาท้ายด่าน</span>
            </div>
          </div>
        </section>

        {/* WHY COM QUEST SECTION (Aesthetic Game Modules) */}
        <section className="py-16 sm:py-24 border-t border-cyan-500/20 bg-gradient-to-b from-[#060913] via-[#091024] to-[#060913]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-block px-3 py-1 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-pixel text-xs tracking-wider">
                QUEST FEATURES
              </div>
              <h2 className="text-3xl sm:text-4xl font-cyber font-bold text-white tracking-wide">
                ออกแบบมาเพื่อให้นักเรียนทุกคนรักการเขียนโปรแกรม
              </h2>
              <p className="text-slate-400 font-thai text-base">
                ผสานโลกแห่งเกม RPG ยุค 8-Bit เข้ากับหลักสูตรวิชาคอมพิวเตอร์และเว็บเทคโนโลยีระดับมาตรฐาน
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <ScrollReveal delay={0} className="h-full">
                <div className="rpg-stage-card card-rpg flex flex-col justify-between group h-full">
                  <div className="rpg-telemetry-bar">
                    <span>MODULE // 01</span>
                    <span className="text-cyan-300">INTERACTIVE CODE</span>
                  </div>
                  <div className="p-6 sm:p-8 space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                      <Code2 className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-cyber font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                      1. ดันเจี้ยนโค้ด HTML แบบโต้ตอบ
                    </h3>
                    <p className="text-sm font-thai text-slate-300 leading-relaxed">
                      ฝึกเขียนแท็ก HTML, โครงสร้างเว็บ, CSS และ JavaScript
                      ผ่านหน้าต่างจำลองโค้ดแบบ Interactive ตรวจผลลัพธ์ทันทีไม่ต้องติดตั้งโปรแกรมเพิ่ม
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              {/* Feature 2 */}
              <ScrollReveal delay={90} className="h-full">
                <div className="rpg-stage-card card-rpg flex flex-col justify-between group h-full">
                  <div className="rpg-telemetry-bar">
                    <span>MODULE // 02</span>
                    <span className="text-purple-300">EXP &amp; TROPHY</span>
                  </div>
                  <div className="p-6 sm:p-8 space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-400/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                      <Trophy className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-cyber font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                      2. เลเวลอัป &amp; เก็บ EXP สะสมฉายา
                    </h3>
                    <p className="text-sm font-thai text-slate-300 leading-relaxed">
                      ทุกแบบฝึกหัดที่ทำสำเร็จจะได้รับคะแนนค่าประสบการณ์ (EXP)
                      ไต่ระดับตั้งแต่ Novice Coder สู่ Web Archmage พร้อมประวัติการเรียนแบบ Realtime
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              {/* Feature 3 */}
              <ScrollReveal delay={180} className="h-full">
                <div className="rpg-stage-card card-rpg flex flex-col justify-between group h-full">
                  <div className="rpg-telemetry-bar">
                    <span>MODULE // 03</span>
                    <span className="text-amber-300">TEACHER PORTAL</span>
                  </div>
                  <div className="p-6 sm:p-8 space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                      <BookOpen className="w-6 h-6 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-cyber font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                      3. พื้นที่บริหารจัดการสำหรับครู
                    </h3>
                    <p className="text-sm font-thai text-slate-300 leading-relaxed">
                      ระบบ Portal เฉพาะสำหรับครูผู้สอน ตรวจสอบความคืบหน้านักเรียน ดูรายงานคะแนน
                      และสร้างโจทย์แบบฝึกหัดเสริมตามแผนการสอนได้อย่างปลอดภัย
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Bottom Call to Action Banner */}
            <ScrollReveal delay={80} className="mt-16">
              <div className="rpg-hud-panel rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-blue-950/70 border border-cyan-500/50 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_35px_rgba(0,240,255,0.25)]">
                <div className="space-y-2 text-center md:text-left">
                  <div className="text-xs font-mono text-cyan-400 tracking-wider">
                    [ START YOUR ADVENTURE TODAY ]
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-cyber font-bold text-white">
                    พร้อมก้าวสู่โลกแห่ง Com Quest แล้วหรือยัง?
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 font-thai">
                    สมัครสมาชิกฟรีวันนี้ และเริ่มเก็บค่าประสบการณ์เควสต์แรกได้ทันที
                  </p>
                </div>
                <PrimaryButton href="/register" size="md" className="shrink-0 whitespace-nowrap text-sm sm:text-base font-bold btn-neon-hover">
                  สร้างตัวละครใหม่ (สมัครสมาชิก)
                </PrimaryButton>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
    </>
  );
}
