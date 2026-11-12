'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Swords,
  Flame,
  Trophy,
  Maximize2,
  Minimize2,
  StopCircle,
  Users,
  AlertTriangle,
  Sparkles,
  Zap,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { BossArena } from '@/components/exam/BossArena';
import { PixelCharacter } from '@/components/character/PixelCharacter';
import { createClient } from '@/lib/supabase/client';
import { closeExam, getExamCombatFeed } from '@/app/actions/exam-actions';
import { ExamSession, ExamParticipant, ExamCombatLog, CharacterConfig } from '@/lib/supabase/types';
import { getBossConfigForExam } from '@/lib/exam/boss-config';

interface ParticipantWithProfile extends ExamParticipant {
  profiles?: {
    username?: string;
    avatar_url?: string;
    character_config?: CharacterConfig;
    level?: number;
  };
}

interface TeacherLiveRaidArenaProps {
  session: ExamSession;
  participants: ParticipantWithProfile[];
}

export const TeacherLiveRaidArena: React.FC<TeacherLiveRaidArenaProps> = ({
  session: initialSession,
  participants: initialParticipants,
}) => {
  const router = useRouter();
  const [session, setSession] = useState<ExamSession>(initialSession);
  const [participants, setParticipants] = useState<ParticipantWithProfile[]>(initialParticipants);
  const [combatLogs, setCombatLogs] = useState<ExamCombatLog[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showEndModal, setShowEndModal] = useState(false);

  // Boss Animation States & Configuration
  const bossConfig = getBossConfigForExam(
    session.total_questions || 10,
    session.passing_score,
    session.boss_name
  );
  const maxBossHp = session.boss_max_hp || bossConfig.maxHp;
  const [bossHp, setBossHp] = useState<number>(session.boss_current_hp ?? maxBossHp);
  const [bossAction, setBossAction] = useState<'idle' | 'hurt' | 'defeated'>('idle');
  const [floatingDamage, setFloatingDamage] = useState<{ text: string; type: 'damage' | 'critical' } | null>(null);

  // Timer Calculation
  const calculateSecondsRemaining = useCallback(() => {
    if (!session.started_at) return session.duration_minutes * 60;
    const startTime = new Date(session.started_at).getTime();
    const endTime = startTime + session.duration_minutes * 60 * 1000;
    const now = Date.now();
    return Math.max(0, Math.floor((endTime - now) / 1000));
  }, [session.started_at, session.duration_minutes]);

  const [secondsLeft, setSecondsLeft] = useState<number>(calculateSecondsRemaining);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      const rem = calculateSecondsRemaining();
      setSecondsLeft(rem);
    }, 1000);
    return () => clearInterval(timer);
  }, [calculateSecondsRemaining]);

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Dual-Engine Synchronization: Realtime + Smart Polling Fallback
  useEffect(() => {
    const supabase = createClient();

    // 1. Initial Combat Feed fetch
    getExamCombatFeed(session.id).then((res) => {
      if (res.success && res.logs) {
        setCombatLogs(res.logs);
      }
      if (res.session?.boss_current_hp !== undefined) {
        setBossHp(res.session.boss_current_hp);
      }
    });

    // 2. Realtime listener on exam_combat_logs
    const combatChannel = supabase
      .channel(`teacher_raid_combat_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'exam_combat_logs',
          filter: `exam_id=eq.${session.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            const newLog = payload.new as ExamCombatLog;
            setCombatLogs((prev) => [newLog, ...prev.slice(0, 24)]);

            // Trigger visual hurt animation on the Projector Boss
            setBossAction('hurt');
            const hitText = newLog.is_critical ? `-${newLog.damage} HP CRITICAL!` : `-${newLog.damage} HP!`;
            setFloatingDamage({ text: hitText, type: newLog.is_critical ? 'critical' : 'damage' });

            setTimeout(() => {
              setBossAction((prev) => (prev === 'defeated' ? 'defeated' : 'idle'));
            }, 550);
          }
        }
      )
      .subscribe();

    // 3. Realtime listener on exam_sessions (HP updates)
    const sessionChannel = supabase
      .channel(`teacher_raid_session_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exam_sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            const updated = payload.new as ExamSession;
            setSession(updated);
            if (updated.boss_current_hp !== undefined) {
              setBossHp(updated.boss_current_hp);
              if (updated.boss_current_hp <= 0) {
                setBossAction('defeated');
              }
            }
          }
        }
      )
      .subscribe();

    // 4. Polling Fallback (every 2000ms)
    const pollInterval = setInterval(async () => {
      try {
        const feed = await getExamCombatFeed(session.id);
        if (feed.success) {
          if (feed.logs) setCombatLogs(feed.logs);
          if (feed.session?.boss_current_hp !== undefined) {
            setBossHp(feed.session.boss_current_hp);
            if (feed.session.boss_current_hp <= 0) {
              setBossAction('defeated');
            }
          }
        }

        // Re-fetch participants progress
        const { data: partData } = await supabase
          .from('exam_participants')
          .select(`
            *,
            profiles:student_id (
              username,
              avatar_url,
              character_config,
              level
            )
          `)
          .eq('exam_id', session.id);

        if (partData) {
          setParticipants(partData as unknown as ParticipantWithProfile[]);
        }
      } catch {
        // silent polling catch
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(combatChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [session.id]);

  // Handle Close / End Exam
  const handleConfirmClose = () => {
    startTransition(async () => {
      const res = await closeExam(session.id);
      if (res.success) {
        router.push(`/teacher/exams/${session.id}/results`);
      } else {
        alert(res.error || 'ไม่สามารถปิดการสอบได้');
      }
    });
  };

  // Compute Leaderboard: Total damage dealt per student from combat logs
  const studentDamageMap: Record<string, { name: string; damage: number; hits: number }> = {};
  for (const log of combatLogs) {
    if (!studentDamageMap[log.student_id]) {
      studentDamageMap[log.student_id] = { name: log.student_name, damage: 0, hits: 0 };
    }
    studentDamageMap[log.student_id].damage += log.damage;
    studentDamageMap[log.student_id].hits += 1;
  }

  const leaderboard = Object.entries(studentDamageMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.damage - a.damage)
    .slice(0, 5);

  const submittedCount = participants.filter((p) => p.status === 'submitted').length;
  const isBossDefeated = bossHp <= 0;

  // Format Time
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isTimeCritical = secondsLeft <= 120;

  return (
    <div className={`space-y-6 ${isFullscreen ? 'p-6 bg-[#060913] min-h-screen text-slate-100' : ''}`}>
      {/* 1. Top HUD Control Bar */}
      <header className="bg-slate-900/95 border-2 border-cyan-500/40 rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
        {/* Left: Room Badge & Title */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Swords className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
              <span className="text-xs font-mono font-black text-rose-400 uppercase tracking-widest">
                CLASSROOM RAID BATTLE IN PROGRESS
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">{session.title}</h1>
          </div>
        </div>

        {/* Center: Giant Room Code (Easy for Students to see) */}
        <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-2xl border border-cyan-500/50 shadow-[0_0_20px_rgba(0,207,239,0.25)]">
          <span className="text-xs font-mono text-slate-400 font-bold">CODE:</span>
          <span className="text-2xl sm:text-3xl font-mono font-black text-cyan-300 tracking-widest">
            {session.room_code}
          </span>
        </div>

        {/* Right: Controls & Countdown Timer */}
        <div className="flex items-center gap-3">
          {/* Synchronized Timer */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono font-black text-lg ${
              isTimeCritical
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-slate-950/80 border-cyan-500/40 text-cyan-300'
            }`}
          >
            <Clock className={`w-5 h-5 ${isTimeCritical ? 'text-rose-400' : 'text-cyan-400'}`} />
            <span>{formattedTime}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
            title="สลับโหมดจอใหญ่ (Fullscreen Projector)"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* End Exam Button */}
          <button
            onClick={() => setShowEndModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <StopCircle className="w-4 h-4" />
            <span>ยุติการสอบ</span>
          </button>
        </div>
      </header>

      {/* 2. Boss Defeated Celebration Banner */}
      {isBossDefeated && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/30 via-emerald-500/30 to-cyan-500/30 border-2 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.5)] flex items-center justify-center gap-4 text-center animate-bounce">
          <Trophy className="w-10 h-10 text-amber-300" />
          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-emerald-300 tracking-wider">
              🏆 RAID BOSS DEFEATED!
            </h2>
            <p className="text-sm sm:text-base text-slate-200 mt-1">
              นักเรียนทั้งห้องร่วมมือกันปราบ {session.boss_name || bossConfig.name} สำเร็จก่อนเวลาจะหมด!
            </p>
          </div>
          <Sparkles className="w-10 h-10 text-cyan-300" />
        </div>
      )}

      {/* 3. Main Stage: Giant Boss Arena on Projector */}
      <section className="relative">
        <BossArena
          bossName={session.boss_name || bossConfig.name}
          bossImage={bossConfig.image}
          bossHp={bossHp}
          maxHp={maxBossHp}
          bossAction={bossAction}
          floatingText={floatingDamage}
          className="min-h-[300px] sm:min-h-[360px]"
        />

        {/* Global Class Participation Floating Pill */}
        <div className="absolute top-4 right-4 bg-slate-950/90 border border-cyan-500/40 px-3.5 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2 text-xs font-semibold text-slate-300 shadow-lg">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            ส่งข้อสอบแล้ว <strong className="text-cyan-300">{submittedCount}</strong> / {participants.length} คน
          </span>
        </div>
      </section>

      {/* 4. Bottom Grid: Live Combat Feed & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Combat Log Ticker (2 cols on lg) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>บันทึกการโจมตีสด (LIVE COMBAT LOG)</span>
              </h3>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-full border border-cyan-500/40">
                REALTIME
              </span>
            </div>

            {/* Combat Entries Feed */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {combatLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs sm:text-sm">
                  กำลังรอการโจมตีแรกจากนักเรียนในห้อง...
                </div>
              ) : (
                combatLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between transition-all animate-fadeIn"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">
                        {log.is_critical ? '💥' : '⚔️'}
                      </span>
                      <div className="text-xs sm:text-sm text-slate-200">
                        <strong className="text-cyan-300 font-bold">{log.student_name}</strong>
                        <span className="text-slate-400 ml-1.5">
                          ตอบข้อที่ {log.question_number} ถูกต้อง!
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-mono font-black text-xs sm:text-sm">
                      <span className={log.is_critical ? 'text-amber-400 animate-pulse' : 'text-rose-400'}>
                        -{log.damage} HP
                      </span>
                      {log.is_critical && (
                        <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40">
                          CRIT
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 text-right">
            บันทึกการโจมตีล่าสุด {combatLogs.length} รายการ
          </div>
        </div>

        {/* Right Column: Top Damage MVP Leaderboard (1 col) */}
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>อันดับผู้ทำดาเมจสูงสุด (TOP RAID MVP)</span>
              </h3>
            </div>

            <div className="space-y-2.5">
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs sm:text-sm">
                  รอสรุปอันดับนักเรียน...
                </div>
              ) : (
                leaderboard.map((item, idx) => {
                  const medalEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between ${
                        idx === 0
                          ? 'bg-amber-950/40 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : 'bg-slate-950/70 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold font-mono text-slate-300 w-6">
                          {medalEmoji}
                        </span>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white truncate max-w-[130px]">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            ตอบถูก {item.hits} ข้อ
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-mono font-black text-cyan-300">
                          {item.damage.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">DMG</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>นักเรียนทั้งหมดในห้อง</span>
            <span className="font-mono font-bold text-slate-200">{participants.length} คน</span>
          </div>
        </div>
      </div>

      {/* 5. End Exam Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 mx-auto flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">ยืนยันยุติการสอบทั้งหมด?</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                การกดสิ้นสุดจะปิดห้องสอบทันที คำตอบของนักเรียนที่บันทึกไว้จะถูกประเมินคะแนน และระบบจะพาทุกคนไปยังหน้ารายงานผลสอบ
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                onClick={() => setShowEndModal(false)}
                disabled={isPending}
                className="py-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs sm:text-sm font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmClose}
                disabled={isPending}
                className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg cursor-pointer"
              >
                {isPending ? 'กำลังประมวลผล...' : 'ยืนยันยุติการสอบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
