'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Sparkles,
  HelpCircle,
  LayoutGrid,
  Flame,
  Trophy,
  Swords,
} from 'lucide-react';
import { BossArena } from './BossArena';
import { saveStudentDraftAnswer, submitStudentExam, recordRaidAttack } from '@/app/actions/exam-actions';
import { createClient } from '@/lib/supabase/client';
import { ExamSession, ExamParticipant, ExamQuestion, CharacterConfig } from '@/lib/supabase/types';
import { getBossConfigForExam } from '@/lib/exam/boss-config';

interface BossBattleViewProps {
  session: ExamSession;
  participant: ExamParticipant;
  questions: ExamQuestion[];
  draftAnswers: Record<string, string>; // question_id -> option
  playerConfig?: CharacterConfig | null;
  playerName?: string;
}

export const BossBattleView: React.FC<BossBattleViewProps> = ({
  session,
  participant,
  questions,
  draftAnswers: initialDraftAnswers,
  playerConfig,
  playerName = 'นักเรียน',
}) => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialDraftAnswers || {});
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showGridDrawer, setShowGridDrawer] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // Shared Raid Boss Combat States & Boss Preset Config
  const bossConfig = getBossConfigForExam(
    session.total_questions || questions.length,
    session.passing_score,
    session.boss_name
  );
  const maxBossHp = session.boss_max_hp || bossConfig.maxHp;
  const [bossHp, setBossHp] = useState<number>(session.boss_current_hp ?? maxBossHp);
  const [playerAction, setPlayerAction] = useState<'idle' | 'attack' | 'hurt'>('idle');
  const [bossAction, setBossAction] = useState<'idle' | 'attack' | 'hurt' | 'defeated'>('idle');
  const [floatingText, setFloatingText] = useState<{
    text: string;
    type: 'damage' | 'miss' | 'critical';
  } | null>(null);

  // Student progress & Minecraft Achievement states
  const [correctCount, setCorrectCount] = useState<number>(participant.score || 0);
  const [studentDamage, setStudentDamage] = useState<number>(
    (participant.score || 0) * bossConfig.damagePerHit
  );
  const [hasPassed, setHasPassed] = useState<boolean>(
    (participant.score || 0) >= bossConfig.passingScore
  );
  const [showMinecraftToast, setShowMinecraftToast] = useState(false);
  const [showBattleClearModal, setShowBattleClearModal] = useState(false);

  // Prefetch result route for instant, zero-lag navigation
  useEffect(() => {
    router.prefetch(`/exam/result/${session.id}`);
  }, [router, session.id]);

  // Reset question timer on question index change
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentIndex]);

  // Dual-Engine Synchronization: Realtime + Smart Polling Fallback
  useEffect(() => {
    const supabase = createClient();

    // 1. Realtime listener for shared exam_sessions status and boss HP
    const sessionChannel = supabase
      .channel(`student_battle_${session.id}`)
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
            if (updated.boss_current_hp !== undefined) {
              setBossHp(updated.boss_current_hp);
              if (updated.boss_current_hp <= 0) {
                setBossAction('defeated');
                setShowBattleClearModal(true);
              }
            }
            if (updated.status === 'completed' && !isSubmitting) {
              handleSubmitExam(true);
            }
          }
        }
      )
      .subscribe();

    // 2. Realtime listener on combat logs: every student's hit reduces HP synchronously
    const combatChannel = supabase
      .channel(`student_combat_${session.id}`)
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
            const newLog = payload.new;
            if (newLog.damage && newLog.damage > 0) {
              setBossHp((prev) => {
                const nextHp = Math.max(0, prev - newLog.damage);
                if (nextHp <= 0) {
                  setBossAction('defeated');
                  setShowBattleClearModal(true);
                }
                return nextHp;
              });

              setBossAction('hurt');
              setTimeout(() => {
                setBossAction((prev) => (prev === 'defeated' ? 'defeated' : 'idle'));
              }, 450);
            }
          }
        }
      )
      .subscribe();

    // 3. Fallback Polling every 2.5s (ensures synchronization under proxy/firewalls)
    const pollTimer = setInterval(async () => {
      try {
        const { data: latest } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('id', session.id)
          .single();

        if (latest) {
          if (latest.boss_current_hp !== undefined) {
            setBossHp(latest.boss_current_hp);
            if (latest.boss_current_hp <= 0) {
              setBossAction('defeated');
              setShowBattleClearModal(true);
            }
          }
          if (latest.status === 'completed' && !isSubmitting) {
            handleSubmitExam(true);
          }
        }
      } catch {
        // silent polling catch
      }
    }, 2500);

    return () => {
      clearInterval(pollTimer);
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(combatChannel);
    };
  }, [session.id, isSubmitting]);

  // Calculate remaining timer
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
      const remaining = calculateSecondsRemaining();
      setSecondsLeft(remaining);

      // Auto submit on time expired
      if (remaining <= 0 && !isSubmitting) {
        clearInterval(timer);
        handleSubmitExam(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateSecondsRemaining, isSubmitting]);

  // Handle Answer Selection & Real-Time Raid Attack
  const handleSelectOption = (optionKey: 'A' | 'B' | 'C' | 'D') => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    const newAnswers = { ...answers, [currentQuestion.id]: optionKey };
    setAnswers(newAnswers);

    const secondsSpent = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));

    // Save draft answer and dispatch Raid Attack in parallel
    startTransition(async () => {
      // 1. Save draft
      await saveStudentDraftAnswer(participant.id, currentQuestion.id, optionKey);

      // 2. Perform Raid Attack
      const res = await recordRaidAttack({
        examId: session.id,
        participantId: participant.id,
        questionId: currentQuestion.id,
        selectedOption: optionKey,
        secondsSpent,
      });

      if (res.success && res.isCorrect) {
        setPlayerAction('attack');

        // Track student pass criteria (Minecraft achievement trigger)
        setCorrectCount((prev) => {
          const nextCount = prev + 1;
          const damageGained = res.damage || bossConfig.damagePerHit;
          setStudentDamage((prevDmg) => prevDmg + damageGained);

          if (!hasPassed && nextCount >= bossConfig.passingScore) {
            setHasPassed(true);
            setShowMinecraftToast(true);
            setTimeout(() => {
              setShowMinecraftToast(false);
            }, 6500);
          }
          return nextCount;
        });

        setTimeout(() => {
          setPlayerAction('idle');
          setBossAction('hurt');
          const hitText = res.isCritical ? `-${res.damage} HP CRITICAL!` : `-${res.damage} HP! HIT`;
          setFloatingText({ text: hitText, type: res.isCritical ? 'critical' : 'damage' });

          if (res.newBossHp !== undefined) {
            setBossHp(res.newBossHp);
            if (res.newBossHp <= 0) {
              setBossAction('defeated');
              setShowBattleClearModal(true);
            }
          }

          setTimeout(() => {
            setBossAction((prev) => (prev === 'defeated' ? 'defeated' : 'idle'));
          }, 650);
        }, 400);
      } else if (res.success && !res.isCorrect) {
        setPlayerAction('hurt');
        setFloatingText({ text: 'MISS / ตอบผิด!', type: 'miss' });
        setTimeout(() => {
          setPlayerAction('idle');
        }, 650);
      }
    });
  };

  // Submit Exam
  const handleSubmitExam = async (force: boolean = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const res = await submitStudentExam(participant.id, session.id);
    if (res.success) {
      setShowConfirmModal(false);
      setShowBattleClearModal(true);
    } else {
      setIsSubmitting(false);
      setShowConfirmModal(false);
      if (!force) {
        alert(res.error || 'ไม่สามารถส่งข้อสอบได้ กรุณาลองใหม่อีกครั้ง');
      } else {
        router.push(`/exam/result/${session.id}`);
      }
    }
  };

  const currentQ = questions[currentIndex];
  const selectedOption = currentQ ? answers[currentQ.id] : null;
  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;
  const isBossDefeated = bossHp <= 0;

  // Format Time Display mm:ss
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isTimeCritical = secondsLeft <= 120; // < 2 minutes

  const choices: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = currentQ
    ? [
        { key: 'A', text: currentQ.option_a },
        { key: 'B', text: currentQ.option_b },
        { key: 'C', text: currentQ.option_c },
        { key: 'D', text: currentQ.option_d },
      ]
    : [];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Minecraft-Style Achievement Toast */}
      {showMinecraftToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300 drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
        >
          <div className="bg-[#18191c] border-2 border-[#22c55e] rounded-xl p-3 sm:p-3.5 flex items-center gap-3 max-w-sm shadow-[0_0_24px_rgba(34,197,94,0.4)]">
            {/* Green Minecraft Achievement Icon Box */}
            <div className="w-10 h-10 rounded-lg bg-emerald-950 border-2 border-[#22c55e] flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-[#22c55e] font-black text-2xl leading-none">✓</span>
            </div>
            {/* Text block */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                <Trophy className="w-3 h-3 text-amber-400" />
                ADVANCEMENT MADE!
              </div>
              <div className="text-sm sm:text-base font-extrabold text-[#22c55e] leading-snug flex items-center gap-1.5">
                <span>สอบผ่านเรียบร้อย</span>
                <span className="text-emerald-400 font-black">✓</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                ตอบถูก {correctCount}/{bossConfig.passingScore} ข้อ (ทำดาเมจ {studentDamage.toLocaleString()} HP)
              </div>
            </div>
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowMinecraftToast(false)}
              className="text-slate-400 hover:text-white text-xs p-1 rounded transition-colors cursor-pointer"
              aria-label="ปิด"
            >
              ✕
            </button>
          </div>
        </aside>
      )}

      {/* 1. HUD Navigation & Header */}
      <header className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-3 sm:p-4 backdrop-blur-md flex items-center justify-between shadow-lg">
        {/* Left: Progress info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowGridDrawer(!showGridDrawer)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-950 border border-cyan-500/40 hover:bg-cyan-950/60 text-cyan-300 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
            title="ดูแผนที่ข้อสอบทั้งหมด"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">ข้อที่ {currentIndex + 1}/{totalCount}</span>
          </button>

          <div className="text-xs text-slate-300 font-medium">
            ตอบแล้ว <span className="text-cyan-400 font-bold">{answeredCount}</span>/{totalCount}
          </div>

          {hasPassed && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold animate-in fade-in duration-300 shadow-[0_0_12px_rgba(34,197,94,0.25)]">
              <span className="text-emerald-400 font-black">✓</span>
              <span>สอบผ่านเรียบร้อย</span>
            </div>
          )}
        </div>

        {/* Center: Countdown Timer */}
        <div
          className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl border font-mono font-bold text-sm sm:text-base ${
            isTimeCritical
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
              : 'bg-slate-950/80 border-cyan-500/40 text-cyan-300'
          }`}
        >
          <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-400' : 'text-cyan-400'}`} />
          <span>{formattedTime}</span>
        </div>

        {/* Right: Submit Button */}
        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={isSubmitting}
          className="px-3.5 sm:px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-[0_2px_12px_rgba(16,185,129,0.3)] flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>ส่งข้อสอบ</span>
        </button>
      </header>

      {/* 2. Raid Mode Status Banner */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs">
        <div className="flex items-center gap-2 text-cyan-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
          <span className="font-mono font-bold uppercase tracking-wider">RAID BATTLE</span>
          <span className="text-slate-400">— เลือดบอสรวมพลังทั้งห้องเรียน</span>
        </div>
        <div className="font-mono text-cyan-300 font-bold text-xs">
          {bossHp.toLocaleString()} / {maxBossHp.toLocaleString()} HP
        </div>
      </div>

      {/* Boss Defeated Celebration Banner */}
      {isBossDefeated && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-cyan-500/20 border-2 border-emerald-400/60 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2.5 text-center animate-bounce">
          <Trophy className="w-5 h-5 text-amber-300" />
          <span className="text-sm sm:text-base font-black text-emerald-300 uppercase tracking-wide">
            🏆 RAID BOSS DEFEATED! รวมพลังปราบบอสสำเร็จแล้ว!
          </span>
        </div>
      )}

      {/* 3. Interactive RPG Boss Arena */}
      <section>
        <BossArena
          bossName={session.boss_name || bossConfig.name}
          bossHp={bossHp}
          maxHp={maxBossHp}
          playerConfig={playerConfig}
          playerName={playerName}
          playerAction={playerAction}
          bossAction={bossAction}
          floatingText={floatingText}
        />
      </section>

      {/* 4. Question Card & Choices */}
      {currentQ && (
        <main className="bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-4 sm:p-7 backdrop-blur-xl shadow-xl space-y-5">
          {/* Question Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              <span className="text-xs sm:text-sm font-bold text-cyan-400 uppercase tracking-wider font-mono">
                คำถามข้อที่ {currentIndex + 1}
              </span>
            </div>
            <span className="text-[11px] sm:text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
              1 คะแนน (100 EXP)
            </span>
          </div>

          {/* Question Text */}
          <div className="text-sm sm:text-lg font-medium text-slate-100 leading-relaxed sm:leading-loose">
            {currentQ.question_text}
          </div>

          {/* 4 Multiple Choices */}
          <div className="grid grid-cols-1 gap-2.5 sm:gap-3 pt-2">
            {choices.map((choice) => {
              const isSelected = selectedOption === choice.key;
              return (
                <button
                  key={choice.key}
                  type="button"
                  onClick={() => handleSelectOption(choice.key)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all flex items-center gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-[0_0_20px_rgba(0,207,239,0.25)]'
                      : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700 text-slate-300 hover:bg-slate-900/80'
                  }`}
                >
                  {/* Choice Letter Pill */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-all font-mono ${
                      isSelected
                        ? 'bg-cyan-400 text-slate-950 shadow-md font-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {choice.key}
                  </div>

                  {/* Choice Text */}
                  <div className="text-xs sm:text-base font-normal flex-1">
                    {choice.text}
                  </div>

                  {/* Radio Checked Icon */}
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Navigation Controls: Prev / Next */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>ข้อก่อนหน้า</span>
            </button>

            <span className="text-xs text-slate-400 font-mono">
              {currentIndex + 1} / {totalCount}
            </span>

            {currentIndex < totalCount - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(totalCount - 1, prev + 1))}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-[0_2px_12px_rgba(0,207,239,0.3)] cursor-pointer"
              >
                <span>ข้อถัดไป</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-[0_2px_12px_rgba(16,185,129,0.3)] cursor-pointer"
              >
                <span>พร้อมส่งข้อสอบ</span>
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </main>
      )}

      {/* 5. Question Navigation Grid Palette (Modal) */}
      {showGridDrawer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-cyan-400" />
                แผนที่ข้อสอบทั้งหมด
              </h3>
              <button
                onClick={() => setShowGridDrawer(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ ปิด
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2.5 max-h-60 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowGridDrawer(false);
                    }}
                    className={`h-11 rounded-xl text-sm font-bold font-mono transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isCurrent
                        ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-900'
                        : isAnswered
                        ? 'bg-cyan-950/80 border border-cyan-500/60 text-cyan-300'
                        : 'bg-slate-950 border border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    <span className="text-[9px] font-normal">
                      {isAnswered ? answers[q.id] : '-'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-cyan-950 border border-cyan-500" /> ตอบแล้ว
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-950 border border-slate-800" /> ยังไม่ตอบ
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-cyan-500" /> ข้อปัจจุบัน
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Confirmation Submit Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mx-auto flex items-center justify-center text-cyan-400">
              <Send className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">ยืนยันส่งข้อสอบ?</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                คุณตอบไปแล้ว <strong className="text-cyan-300">{answeredCount}</strong> จากทั้งหมด{' '}
                <strong className="text-slate-200">{totalCount}</strong> ข้อ
                {answeredCount < totalCount && (
                  <span className="block text-amber-400 mt-1 font-semibold">
                    (ยังมีอีก {totalCount - answeredCount} ข้อที่ยังไม่ได้ตอบ)
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs sm:text-sm font-semibold cursor-pointer transition-colors"
              >
                กลับไปทำต่อ
              </button>
              <button
                onClick={() => handleSubmitExam(false)}
                disabled={isSubmitting}
                className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs sm:text-sm font-bold shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>ยืนยันส่งผล</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Battle Clear! Celebration Modal */}
      {showBattleClearModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-400/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_60px_rgba(16,185,129,0.35)] text-center space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.4)]">
              <Trophy className="w-9 h-9 text-amber-400 animate-bounce" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold tracking-wider uppercase mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                RAID COMPLETE
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 tracking-wider">
                Battle Clear!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2">
                การต่อสู้เสร็จสิ้น! คุณได้ร่วมต่อสู้กับเพื่อนๆ ในห้องเรียน
              </p>
            </div>

            {/* Stats Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-400">สถานะการสอบ:</span>
                {hasPassed || correctCount >= bossConfig.passingScore ? (
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span>✓ สอบผ่านเรียบร้อย</span>
                  </span>
                ) : (
                  <span className="font-bold text-rose-400 flex items-center gap-1">
                    <span>ยังไม่ผ่านเกณฑ์ (ต้องได้ {bossConfig.passingScore} ข้อ)</span>
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-400">ตอบถูกทั้งหมด:</span>
                <span className="font-bold text-cyan-300 font-mono">
                  {correctCount} / {totalCount} ข้อ
                </span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-400">ดาเมจที่ทำได้ต่อบอส:</span>
                <span className="font-bold text-amber-400 font-mono">
                  {studentDamage.toLocaleString()} HP
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => router.push(`/exam/result/${session.id}`)}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm sm:text-base shadow-[0_4px_20px_rgba(16,185,129,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ดูสรุปผลคะแนนและรับรางวัล</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
