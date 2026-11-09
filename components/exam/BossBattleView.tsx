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
} from 'lucide-react';
import { BossArena } from './BossArena';
import { saveStudentDraftAnswer, submitStudentExam } from '@/app/actions/exam-actions';
import { ExamSession, ExamParticipant, ExamQuestion, CharacterConfig } from '@/lib/supabase/types';

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

  // Combat Animation States
  const [bossHp, setBossHp] = useState(participant.boss_remaining_hp ?? 1000);
  const maxBossHp = 1000;
  const [playerAction, setPlayerAction] = useState<'idle' | 'attack' | 'hurt'>('idle');
  const [bossAction, setBossAction] = useState<'idle' | 'attack' | 'hurt' | 'defeated'>('idle');
  const [floatingText, setFloatingText] = useState<{
    text: string;
    type: 'damage' | 'miss' | 'critical';
  } | null>(null);

  // Calculate timer
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

  // Handle Answer Selection & Auto-Save
  const handleSelectOption = (optionKey: 'A' | 'B' | 'C' | 'D') => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    const newAnswers = { ...answers, [currentQuestion.id]: optionKey };
    setAnswers(newAnswers);

    // Trigger visual player attack & boss damage feedback
    setPlayerAction('attack');
    setTimeout(() => {
      setPlayerAction('idle');
      setBossAction('hurt');
      setFloatingText({ text: '-100 HP! HIT', type: 'damage' });

      // Calculate dynamic boss HP display based on answered count
      const answeredCount = Object.keys(newAnswers).length;
      const targetHp = Math.max(0, Math.round(maxBossHp * (1 - answeredCount / questions.length)));
      setBossHp(targetHp);

      setTimeout(() => {
        setBossAction('idle');
      }, 650);
    }, 450);

    // Save draft asynchronously in background
    startTransition(async () => {
      await saveStudentDraftAnswer(participant.id, currentQuestion.id, optionKey);
    });
  };

  // Submit Exam
  const handleSubmitExam = async (force: boolean = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const res = await submitStudentExam(participant.id, session.id);
    if (res.success) {
      router.push(`/exam/result/${session.id}`);
    } else {
      setIsSubmitting(false);
      setShowConfirmModal(false);
      alert(res.error || 'ไม่สามารถส่งข้อสอบได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const currentQ = questions[currentIndex];
  const selectedOption = currentQ ? answers[currentQ.id] : null;
  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;

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

      {/* 2. Interactive RPG Boss Arena */}
      <section>
        <BossArena
          bossName="MECHA DRAGON (Lv.99)"
          bossHp={bossHp}
          maxHp={maxBossHp}
          playerConfig={playerConfig}
          playerName={playerName}
          playerAction={playerAction}
          bossAction={bossAction}
          floatingText={floatingText}
        />
      </section>

      {/* 3. Question Card & Choices */}
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

      {/* 4. Question Navigation Grid Palette (Modal / Bottom Drawer) */}
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

      {/* 5. Confirmation Submit Modal */}
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
    </div>
  );
};

