'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StudentQuizQuestion, Lesson, CharacterConfig } from '@/lib/supabase/types';
import { checkSingleQuestionAnswer, submitQuizAttempt } from '@/app/actions/student-quiz';
import {
  playClearSound,
  playOverSound,
  playHitSound,
  playHurtSound,
  playExplosionSound,
  playSelectSound,
  playChargeSound,
  playComboSound,
  playTickSound,
  preloadSounds,
  stopAllSounds,
  isSoundMuted,
  setSoundMuted,
} from '@/lib/sound/sound-manager';
import { QuizBossArena, PlayerCombatAction, BossCombatAction } from './QuizBossArena';
import { getQuizBossConfig } from '@/lib/quiz/quiz-boss-config';
import {
  Clock,
  Swords,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Trophy,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Award,
  Volume2,
  VolumeX,
  Flame,
  Zap,
  Gamepad2,
} from 'lucide-react';

interface QuizPlayerProps {
  lesson: Lesson;
  questions: StudentQuizQuestion[];
  characterConfig?: CharacterConfig | null;
  playerName?: string;
}

interface QuestionFeedback {
  isCorrect: boolean;
  correctOption: string;
  explanation: string;
}

interface UserAnswerRecord {
  questionNumber: number;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isTimeout: boolean;
  isCorrect?: boolean;
}

export function QuizPlayer({
  lesson,
  questions,
  characterConfig,
  playerName = 'นักเรียน',
}: QuizPlayerProps) {
  const router = useRouter();

  // Stable memoized boss config
  const bossConfig = useMemo(
    () => getQuizBossConfig(lesson.lesson_number),
    [lesson.lesson_number]
  );

  // Sound Mute State & Preload MP3s
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    setMuted(isSoundMuted());
    preloadSounds();
  }, []);

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
    if (!next) {
      playSelectSound();
    }
  };

  // Quiz Navigation State
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQuestion = questions[currentIndex];

  // Timer State (30 seconds per question)
  const QUESTION_DURATION = 30;
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION);
  const startTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickSecondRef = useRef<number>(QUESTION_DURATION);

  // Interaction State
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const selectedOptionRef = useRef<'A' | 'B' | 'C' | 'D' | null>(null);
  selectedOptionRef.current = selectedOption;

  const [isAnswered, setIsAnswered] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const [feedback, setFeedback] = useState<QuestionFeedback | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Score, Combo Streak, Player Shield Hearts & History State
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  scoreRef.current = score;

  const [comboStreak, setComboStreak] = useState(0);
  const comboStreakRef = useRef(0);
  comboStreakRef.current = comboStreak;

  const MAX_PLAYER_HEARTS = 5;
  const [playerHearts, setPlayerHearts] = useState(MAX_PLAYER_HEARTS);

  const [answersHistory, setAnswersHistory] = useState<UserAnswerRecord[]>([]);
  const answersHistoryRef = useRef<UserAnswerRecord[]>([]);

  // Prevent double-scoring or double-evaluating the same question
  const answeredQuestionsRef = useRef<Set<number>>(new Set());

  // Boss Battle Combat States
  const [bossHp, setBossHp] = useState<number>(bossConfig.maxHp);
  const [playerAction, setPlayerAction] = useState<PlayerCombatAction>('idle');
  const [bossAction, setBossAction] = useState<BossCombatAction>('idle');
  const [floatingText, setFloatingText] = useState<{
    text: string;
    type: 'damage' | 'miss' | 'critical';
  } | null>(null);

  // Steam-style Achievement Toast State
  const [showSteamAchievement, setShowSteamAchievement] = useState(false);
  const [hasAchievementPopped, setHasAchievementPopped] = useState(false);
  const hasAchievementPoppedRef = useRef(false);
  hasAchievementPoppedRef.current = hasAchievementPopped;

  // Final Results & Single Modal State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState<{
    score: number;
    passed: boolean;
    coinAwarded: boolean;
    newLevel: number;
  } | null>(null);

  // Refs to avoid race conditions
  const isAnsweredRef = useRef(false);
  const isEvaluatingRef = useRef(false);
  const currentQuestionRef = useRef(currentQuestion);
  currentQuestionRef.current = currentQuestion;

  // Stop Timer
  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Trigger timeout for current question
  const triggerTimeout = useCallback(async () => {
    const q = currentQuestionRef.current;
    if (!q) return;

    if (
      isAnsweredRef.current ||
      isEvaluatingRef.current ||
      answeredQuestionsRef.current.has(q.question_number)
    ) {
      return;
    }

    clearTimer();
    isAnsweredRef.current = true;
    isEvaluatingRef.current = true;
    answeredQuestionsRef.current.add(q.question_number);

    const currentOpt = selectedOptionRef.current;
    const isActuallyTimeout = !currentOpt;

    setIsTimeout(isActuallyTimeout);
    setIsAnswered(true);
    setIsEvaluating(true);

    // Clash charge animation + charge sound
    playChargeSound();
    setPlayerAction('clash-charge');
    setBossAction('clash-charge');

    try {
      const res = await checkSingleQuestionAnswer({
        lessonId: lesson.id,
        questionNumber: q.question_number,
        selectedOption: currentOpt,
        isTimeout: isActuallyTimeout,
      });

      const wasCorrect = Boolean(res.success && res.isCorrect);

      // Impact moment after 250ms charge
      setTimeout(() => {
        if (wasCorrect) {
          const nextStreak = comboStreakRef.current + 1;
          setComboStreak(nextStreak);
          playHitSound();
          if (nextStreak >= 2) {
            playComboSound(nextStreak);
          }

          setPlayerAction('clash-strike');
          setBossAction('hurt');
          setFloatingText({
            text:
              nextStreak >= 2
                ? `CRITICAL -${bossConfig.damagePerHit.toLocaleString()} HP!`
                : `-${bossConfig.damagePerHit.toLocaleString()} HP! HIT`,
            type: nextStreak >= 2 ? 'critical' : 'damage',
          });

          setScore((prev) => Math.min(questions.length, prev + 1));
          setBossHp((prev) => {
            const nextHp = Math.max(0, prev - bossConfig.damagePerHit);
            if (!hasAchievementPoppedRef.current && scoreRef.current + 1 >= bossConfig.passingScore) {
              setHasAchievementPopped(true);
              setShowSteamAchievement(true);
              setTimeout(() => setShowSteamAchievement(false), 5000);
            }
            return nextHp;
          });

          setTimeout(() => {
            setPlayerAction('idle');
            setBossAction((prev) => (prev === 'defeated' ? 'defeated' : 'idle'));
          }, 700);
        } else {
          // Miss / Timeout -> Boss strikes player
          setComboStreak(0);
          setPlayerHearts((prev) => Math.max(0, prev - 1));
          playHurtSound();
          setPlayerAction('knockback');
          setBossAction('clash-strike');
          setFloatingText({
            text: isActuallyTimeout ? 'TIME OUT! โดนบอสโจมตี!' : 'MISS! ตอบผิด โดนบอสตี!',
            type: 'miss',
          });

          setTimeout(() => {
            setPlayerAction('idle');
            setBossAction('idle');
          }, 750);
        }

        setFeedback({
          isCorrect: wasCorrect,
          correctOption: res.correctOption || '',
          explanation: res.explanation || (isActuallyTimeout ? 'หมดเวลาตอบข้อนี้' : ''),
        });
      }, 250);

      const timeoutRecord: UserAnswerRecord = {
        questionNumber: q.question_number,
        selectedOption: currentOpt,
        isTimeout: isActuallyTimeout,
        isCorrect: wasCorrect,
      };
      answersHistoryRef.current = [
        ...answersHistoryRef.current.filter((a) => a.questionNumber !== q.question_number),
        timeoutRecord,
      ];
      setAnswersHistory([...answersHistoryRef.current]);
    } catch (e) {
      console.error('Error handling timeout:', e);
      setPlayerAction('idle');
      setBossAction('idle');
    } finally {
      setIsEvaluating(false);
      isEvaluatingRef.current = false;
    }
  }, [clearTimer, lesson.id, questions.length, bossConfig]);

  // Keep a ref to triggerTimeout so the timer effect doesn't re-run on every state change
  const triggerTimeoutRef = useRef(triggerTimeout);
  triggerTimeoutRef.current = triggerTimeout;

  // Effect: When currentIndex changes, initialize new question & 30s timer
  useEffect(() => {
    if (finalResult || !currentQuestion) {
      clearTimer();
      return;
    }

    // Reset interaction state ONLY when moving to a new question
    isAnsweredRef.current = false;
    isEvaluatingRef.current = false;
    setIsAnswered(false);
    setIsTimeout(false);
    setSelectedOption(null);
    setFeedback(null);
    setIsEvaluating(false);
    setPlayerAction('idle');
    setBossAction('idle');

    // Start 30-second countdown
    setTimeLeft(QUESTION_DURATION);
    lastTickSecondRef.current = QUESTION_DURATION;
    startTimeRef.current = Date.now();

    clearTimer();
    timerIntervalRef.current = setInterval(() => {
      if (isAnsweredRef.current) return;

      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, QUESTION_DURATION - elapsed);
      setTimeLeft(remaining);

      // Play countdown tick sound once per second during final 5 seconds
      if (remaining !== lastTickSecondRef.current) {
        lastTickSecondRef.current = remaining;
        if (remaining > 0 && remaining <= 5) {
          playTickSound(true);
        }
      }

      if (remaining <= 0) {
        clearTimer();
        triggerTimeoutRef.current();
      }
    }, 200);

    return () => clearTimer();
  }, [currentIndex, lesson.id, finalResult, currentQuestion, clearTimer]);

  // Handle selecting or changing an option
  const handleSelectOption = useCallback((option: 'A' | 'B' | 'C' | 'D') => {
    if (isAnsweredRef.current || isEvaluatingRef.current) return;
    playSelectSound();
    setSelectedOption(option);
  }, []);

  // Handle confirming the answer when clicking "ยืนยันคำตอบ & โจมตีบอส"
  const handleConfirmAnswer = useCallback(async () => {
    const q = currentQuestionRef.current;
    const chosen = selectedOptionRef.current;
    if (
      isAnsweredRef.current ||
      isEvaluatingRef.current ||
      !chosen ||
      !q ||
      answeredQuestionsRef.current.has(q.question_number)
    ) {
      return;
    }

    clearTimer();
    isAnsweredRef.current = true;
    isEvaluatingRef.current = true;
    answeredQuestionsRef.current.add(q.question_number);

    setIsAnswered(true);
    setIsEvaluating(true);

    // Clash charge: Both player and boss rush toward center
    playChargeSound();
    setPlayerAction('clash-charge');
    setBossAction('clash-charge');

    try {
      const res = await checkSingleQuestionAnswer({
        lessonId: lesson.id,
        questionNumber: q.question_number,
        selectedOption: chosen,
        isTimeout: false,
      });

      const wasCorrect = Boolean(res.success && res.isCorrect);

      // Impact moment after 250ms charge
      setTimeout(() => {
        if (wasCorrect) {
          const nextStreak = comboStreakRef.current + 1;
          setComboStreak(nextStreak);
          playHitSound(); // EXhit.mp3
          if (nextStreak >= 2) {
            playComboSound(nextStreak);
          }

          setPlayerAction('clash-strike');
          setBossAction('hurt');
          setFloatingText({
            text:
              nextStreak >= 2
                ? `CRITICAL -${bossConfig.damagePerHit.toLocaleString()} HP!`
                : `-${bossConfig.damagePerHit.toLocaleString()} HP! HIT`,
            type: nextStreak >= 2 ? 'critical' : 'damage',
          });

          // Increment score with strict cap at total questions
          setScore((prev) => Math.min(questions.length, prev + 1));

          setBossHp((prev) => {
            const nextHp = Math.max(0, prev - bossConfig.damagePerHit);
            if (!hasAchievementPoppedRef.current && scoreRef.current + 1 >= bossConfig.passingScore) {
              setHasAchievementPopped(true);
              setShowSteamAchievement(true);
              setTimeout(() => setShowSteamAchievement(false), 5000);
            }
            return nextHp;
          });

          setTimeout(() => {
            setPlayerAction('idle');
            setBossAction((prev) => (prev === 'defeated' ? 'defeated' : 'idle'));
          }, 700);
        } else {
          // Miss / Wrong: Boss counters and knocks player back
          setComboStreak(0);
          setPlayerHearts((prev) => Math.max(0, prev - 1));
          playHurtSound(); // Undertelhit.mp3
          setPlayerAction('knockback');
          setBossAction('clash-strike');
          setFloatingText({ text: 'MISS! ตอบผิด โดนบอสโจมตี!', type: 'miss' });

          setTimeout(() => {
            setPlayerAction('idle');
            setBossAction('idle');
          }, 750);
        }

        setFeedback({
          isCorrect: wasCorrect,
          correctOption: res.correctOption || '',
          explanation: res.explanation || '',
        });
      }, 250);

      const answerRecord: UserAnswerRecord = {
        questionNumber: q.question_number,
        selectedOption: chosen,
        isTimeout: false,
        isCorrect: wasCorrect,
      };
      answersHistoryRef.current = [
        ...answersHistoryRef.current.filter((a) => a.questionNumber !== q.question_number),
        answerRecord,
      ];
      setAnswersHistory([...answersHistoryRef.current]);
    } catch (e) {
      console.error('Error checking answer:', e);
      setPlayerAction('idle');
      setBossAction('idle');
    } finally {
      setIsEvaluating(false);
      isEvaluatingRef.current = false;
    }
  }, [clearTimer, lesson.id, questions.length, bossConfig]);

  // Move to Next Question or Finalize
  const handleNextQuestion = useCallback(async () => {
    if (isSubmitting) return;
    playSelectSound();

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Finished all questions!
      setIsSubmitting(true);

      const isPassed = scoreRef.current >= bossConfig.passingScore;
      if (isPassed) {
        playExplosionSound();
        setBossAction('defeated');
      }

      const allAnswers: UserAnswerRecord[] = questions.map((q) => {
        const found = answersHistoryRef.current.find((a) => a.questionNumber === q.question_number);
        if (found) return found;
        return {
          questionNumber: q.question_number,
          selectedOption: null,
          isTimeout: true,
        };
      });

      const res = await submitQuizAttempt({
        lessonId: lesson.id,
        answers: allAnswers,
      });

      const finalPassed = res.success
        ? (res.passed ?? scoreRef.current >= bossConfig.passingScore)
        : scoreRef.current >= bossConfig.passingScore;
      const rawScore = res.success ? (res.score ?? scoreRef.current) : scoreRef.current;
      const finalScore = Math.max(0, Math.min(questions.length, rawScore));

      if (finalPassed) {
        playExplosionSound();
        setBossAction('defeated');
      }

      setTimeout(
        () => {
          setFinalResult({
            score: finalScore,
            passed: finalPassed,
            coinAwarded: res.success ? (res.coinAwarded ?? finalPassed) : finalPassed,
            newLevel: res.success ? (res.newLevel ?? (finalPassed ? 100 : 0)) : finalPassed ? 100 : 0,
          });
          setIsSubmitting(false);
        },
        finalPassed ? 850 : 250
      );
    }
  }, [currentIndex, questions, bossConfig.passingScore, lesson.id, isSubmitting]);

  // Keyboard shortcuts: 1/A, 2/B, 3/C, 4/D, Enter to Confirm/Next
  useEffect(() => {
    if (finalResult) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toUpperCase();
      if (!isAnsweredRef.current && !isEvaluatingRef.current) {
        if (key === '1' || key === 'A') handleSelectOption('A');
        else if (key === '2' || key === 'B') handleSelectOption('B');
        else if (key === '3' || key === 'C') handleSelectOption('C');
        else if (key === '4' || key === 'D') handleSelectOption('D');
        else if (e.key === 'Enter' && selectedOptionRef.current) {
          e.preventDefault();
          handleConfirmAnswer();
        }
      } else if (isAnsweredRef.current && !isEvaluatingRef.current && e.key === 'Enter') {
        e.preventDefault();
        handleNextQuestion();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [finalResult, handleSelectOption, handleConfirmAnswer, handleNextQuestion]);

  // Handle Retry Quiz
  const handleReplay = () => {
    clearTimer();
    stopAllSounds();
    playSelectSound();
    answeredQuestionsRef.current.clear();
    setCurrentIndex(0);
    setScore(0);
    setComboStreak(0);
    setPlayerHearts(MAX_PLAYER_HEARTS);
    setBossHp(bossConfig.maxHp);
    setPlayerAction('idle');
    setBossAction('idle');
    setFloatingText(null);
    setShowSteamAchievement(false);
    setHasAchievementPopped(false);
    setAnswersHistory([]);
    answersHistoryRef.current = [];
    setFinalResult(null);
    setIsAnswered(false);
    setIsTimeout(false);
    setSelectedOption(null);
    setFeedback(null);
    setIsSubmitting(false);
  };

  // Play Clear / Over sound effect as soon as the result modal pops up
  useEffect(() => {
    if (!finalResult) return;

    if (finalResult.passed) {
      playClearSound();
    } else {
      playOverSound();
    }

    return () => {
      stopAllSounds();
    };
  }, [finalResult]);

  // Timer Progress Calculations
  const isTimeCritical = timeLeft <= 5;
  const isTimeWarning = timeLeft <= 12 && !isTimeCritical;

  return (
    <div className="w-full flex-1 flex flex-col gap-3">
      {/* STEAM-STYLE ACHIEVEMENT NOTIFICATION TOAST */}
      {showSteamAchievement && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 drop-shadow-[0_12px_36px_rgba(0,0,0,0.85)] max-w-sm pointer-events-auto"
        >
          <div className="bg-[#171a21] border border-[#2a475e] hover:border-[#66c0f4]/80 rounded-xl p-3 sm:p-3.5 flex items-center gap-3.5 shadow-[0_0_30px_rgba(102,192,244,0.3)]">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1b2838] to-[#2a475e] border border-[#66c0f4]/60 flex items-center justify-center shrink-0 shadow-inner">
              <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="text-[10px] font-mono font-bold text-[#66c0f4] uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#66c0f4]" />
                ACHIEVEMENT UNLOCKED
              </div>
              <div className="text-sm font-black text-white leading-snug mt-0.5 truncate">
                คุณผ่านเกณฑ์บทเรียนนี้แล้ว!
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                ตอบถูกครบ {bossConfig.passingScore} ข้อแล้ว &bull; โจมตีต่อไปจนจบ 10 ข้อเพื่อล้มบอส!
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSteamAchievement(false)}
              className="text-slate-400 hover:text-white text-xs p-1 rounded transition-colors cursor-pointer"
              title="ปิด"
            >
              ✕
            </button>
          </div>
        </aside>
      )}

      {/* =========================================================================
          1. COMPACT ARCADE TOP HUD BAR (Fits cleanly at top of screen)
          ========================================================================= */}
      <header className="glass-panel w-full rounded-2xl px-3.5 py-2.5 sm:px-5 sm:py-3 border border-cyan-500/40 shadow-[0_0_25px_rgba(0,240,255,0.12)] flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Back button & Quest Info */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/subjects"
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-colors"
            title="กลับหน้ารวมบทเรียน"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                STAGE 0{lesson.lesson_number}
              </span>
              <span className="text-xs font-mono text-slate-300 font-bold">
                ข้อที่ {currentIndex + 1} / {questions.length}
              </span>
            </div>
            <h1 className="text-xs sm:text-sm font-cyber font-bold text-white truncate max-w-[200px] sm:max-w-sm">
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* Center: 10-Question Battle Progress Dots + Live Timer */}
        <div className="flex items-center gap-3">
          {/* 10-Question Progress Dots (Desktop/Tablet) */}
          <div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800">
            {questions.map((q, idx) => {
              const rec = answersHistory.find((a) => a.questionNumber === q.question_number);
              const isCurrent = idx === currentIndex;
              return (
                <div
                  key={q.question_number}
                  title={`ข้อที่ ${q.question_number}`}
                  className={`w-6 h-6 rounded-lg font-mono text-[10px] font-bold flex items-center justify-center border transition-all ${
                    rec
                      ? rec.isCorrect
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                        : 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : isCurrent
                      ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-black scale-105 shadow-[0_0_10px_#00f0ff]'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {rec ? (rec.isCorrect ? '✓' : '✕') : q.question_number}
                </div>
              );
            })}
          </div>

          {/* Live Timer Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-pixel text-xs sm:text-sm border transition-all ${
              isTimeCritical
                ? 'bg-rose-950/90 border-rose-500 text-rose-400 shadow-[0_0_20px_#f43f5e] animate-pulse'
                : isTimeWarning
                ? 'bg-amber-950/90 border-amber-500 text-amber-300'
                : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${isTimeCritical ? 'animate-spin' : ''}`} />
            <span>{timeLeft}s</span>
          </div>
        </div>

        {/* Right: Combo Counter, Score Counter & Audio Toggle */}
        <div className="flex items-center gap-2">
          {comboStreak >= 2 && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-950/90 border border-amber-400 text-amber-300 text-xs font-mono font-bold shadow-[0_0_12px_rgba(251,191,36,0.4)]">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>x{comboStreak}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 hidden sm:inline">SCORE:</span>
            <span className="font-bold text-amber-400">{score}/10</span>
            {score >= bossConfig.passingScore && (
              <span className="ml-0.5 text-[10px] text-emerald-400 font-bold px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/50">
                ✓ ผ่าน
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 transition-colors cursor-pointer"
            title={muted ? 'เปิดเสียงเอฟเฟกต์' : 'ปิดเสียงเอฟเฟกต์'}
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. MAIN TWO-COLUMN FULL-SCREEN BOSS BATTLE LAYOUT
             - LEFT COLUMN (7 cols):
               1) TOP: Question Prompt + Instant Explanation Box (โจทย์ข้อสอบอยู่ด้านบน)
               2) BOTTOM: Boss Battle Arena (ตัวละครกับบอสอยู่ด้านล่าง ขยายเต็มพื้นที่)
             - RIGHT COLUMN (5 cols):
               4 Choices (A, B, C, D) + Attack / Next Action Button (ขยายเต็มความสูง)
          ========================================================================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-stretch w-full">
        {/* LEFT COLUMN: Question Card (Top) + Boss Arena (Bottom) */}
        <div className="lg:col-span-7 flex flex-col gap-3.5">
          {/* 1. TOP: Question Prompt Card + Feedback Explanation */}
          <div className="glass-panel w-full rounded-2xl p-4 sm:p-5 border border-cyan-500/30 flex flex-col justify-between gap-2.5 relative overflow-hidden bg-slate-950/92 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold">
                  โจทย์ข้อที่ {currentQuestion.question_number} จาก {questions.length}
                </span>
                <span className="text-[11px] font-mono text-amber-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>พลังโจมตี -{bossConfig.damagePerHit.toLocaleString()} HP</span>
                </span>
              </div>

              {/* Question Text */}
              <h2 className="text-base sm:text-xl lg:text-2xl font-thai font-bold text-white leading-relaxed">
                {currentQuestion.question_text}
              </h2>
            </div>

            {/* FEEDBACK & EXPLANATION (Appears smoothly inside Question Card after answering) */}
            {isAnswered && feedback ? (
              <div
                className={`p-3 rounded-xl border space-y-1.5 animate-fadeIn ${
                  feedback.isCorrect
                    ? 'bg-emerald-950/75 border-emerald-500/60 text-emerald-200'
                    : 'bg-rose-950/75 border-rose-500/60 text-rose-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-bold font-cyber">
                  <div className="flex items-center gap-1.5">
                    {feedback.isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          ตอบถูกต้อง! โจมตีบอส -{bossConfig.damagePerHit.toLocaleString()} HP
                          {comboStreak >= 2 ? ` (COMBO x${comboStreak}!)` : ''}
                        </span>
                      </>
                    ) : isTimeout ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>หมดเวลาตอบ! บอสโจมตีสวนกลับ</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>ตอบผิด! โดนบอสโจมตีสวนกลับ</span>
                      </>
                    )}
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950/80 border border-white/15">
                    คำตอบที่ถูก: <strong className="text-amber-300">ข้อ {feedback.correctOption}</strong>
                  </span>
                </div>

                {feedback.explanation && (
                  <div className="text-xs font-thai text-slate-200 leading-relaxed bg-slate-950/75 px-3 py-2 rounded-lg border border-slate-800">
                    <strong className="text-amber-400 font-mono mr-1.5">💡 คำอธิบาย:</strong>
                    <span>{feedback.explanation}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between text-[11px] font-thai text-slate-400 pt-1 border-t border-slate-800/80">
                <span>💡 เลือกช้อยส์ฝั่งขวา แล้วกดยืนยันเพื่อปล่อยพลังโจมตีใส่ {bossConfig.bossName}</span>
                <span className="hidden sm:inline font-mono text-[10px] text-slate-500">
                  คีย์ลัด: A/B/C/D + Enter
                </span>
              </div>
            )}
          </div>

          {/* 2. BOTTOM: Boss Battle Arena (Placed below Question Card, stretches to fill remaining height) */}
          <QuizBossArena
            bossName={bossConfig.bossName}
            bossTitle={bossConfig.bossTitle}
            bossImage={bossConfig.bossImage}
            arenaImage={bossConfig.arenaBackground}
            bossHp={bossHp}
            maxHp={bossConfig.maxHp}
            damagePerHit={bossConfig.damagePerHit}
            passingScore={bossConfig.passingScore}
            auraFilter={bossConfig.auraFilter}
            characterConfig={characterConfig}
            playerName={playerName}
            playerAction={playerAction}
            bossAction={bossAction}
            floatingText={floatingText}
            comboStreak={comboStreak}
            playerHearts={playerHearts}
            maxPlayerHearts={MAX_PLAYER_HEARTS}
          />
        </div>

        {/* RIGHT COLUMN: Choices Box (ช้อยส์ 4 ตัวเลือก + ปุ่มโจมตีบอส ขยายเต็มความสูง) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="glass-panel w-full rounded-2xl p-4 sm:p-6 border border-slate-800 flex-1 flex flex-col justify-between gap-4 bg-slate-950/92 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  เลือกสกิลคำตอบ (SELECT ANSWER)
                </span>
                <span className="text-xs font-mono text-cyan-300 font-semibold">
                  {selectedOption ? `พร้อมโจมตีด้วยข้อ ${selectedOption}` : 'คลิกเลือก 1 ข้อ'}
                </span>
              </div>

              {/* 4 Choices Buttons (Expand evenly to fill vertical space) */}
              <div className="flex-1 flex flex-col justify-between gap-2.5 sm:gap-3">
                {(['A', 'B', 'C', 'D'] as const).map((key) => {
                  const text =
                    key === 'A'
                      ? currentQuestion.option_a
                      : key === 'B'
                      ? currentQuestion.option_b
                      : key === 'C'
                      ? currentQuestion.option_c
                      : currentQuestion.option_d;

                  const isSelected = selectedOption === key;
                  const hasFeedback = feedback !== null;
                  const isCorrectAnswer = hasFeedback && feedback.correctOption === key;
                  const isWrongSelected = hasFeedback && isSelected && !feedback.isCorrect;

                  let cardStyle =
                    'bg-slate-900/85 border-slate-700/80 hover:border-cyan-400 hover:bg-slate-900 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] text-slate-200 cursor-pointer';

                  if (isAnswered) {
                    if (isCorrectAnswer) {
                      cardStyle =
                        'bg-emerald-950/90 border-2 border-emerald-400 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.45)] font-bold';
                    } else if (isWrongSelected) {
                      cardStyle =
                        'bg-rose-950/90 border-2 border-rose-500 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.4)] line-through';
                    } else {
                      cardStyle =
                        'bg-slate-950/60 border-slate-800/80 text-slate-500 opacity-50 cursor-not-allowed';
                    }
                  } else if (isSelected) {
                    cardStyle =
                      'bg-cyan-950/90 border-2 border-cyan-400 text-white shadow-[0_0_22px_rgba(0,240,255,0.5)] ring-2 ring-cyan-400/70 font-bold scale-[1.01]';
                  }

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectOption(key)}
                      disabled={isAnswered || isEvaluating}
                      className={`w-full flex-1 p-4 sm:p-5 rounded-xl border text-left transition-all flex items-center gap-3.5 select-none ${cardStyle}`}
                    >
                      <span
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-black text-sm shrink-0 transition-all ${
                          isAnswered && isCorrectAnswer
                            ? 'bg-emerald-400 text-slate-950 shadow-[0_0_12px_#10b981]'
                            : isAnswered && isWrongSelected
                            ? 'bg-rose-500 text-white shadow-[0_0_12px_#f43f5e]'
                            : isSelected
                            ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_12px_#00f0ff]'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {key}
                      </span>

                      <span className="flex-1 font-thai text-base sm:text-lg leading-snug">
                        {text}
                      </span>

                      {/* Status Badges */}
                      {isAnswered && isCorrectAnswer && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      )}
                      {isAnswered && isWrongSelected && (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Action Area of Right Column */}
            <div className="pt-2.5 border-t border-slate-800">
              {!isAnswered ? (
                <button
                  type="button"
                  onClick={handleConfirmAnswer}
                  disabled={!selectedOption || isEvaluating}
                  className={`w-full py-3.5 sm:py-4 rounded-xl font-cyber font-bold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    selectedOption && !isEvaluating
                      ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 text-slate-950 shadow-[0_0_25px_rgba(0,240,255,0.55)] cursor-pointer btn-neon-hover font-black'
                      : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isEvaluating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>กำลังปล่อยพลังโจมตีบอส...</span>
                    </>
                  ) : (
                    <>
                      <Swords className="w-4 h-4" />
                      <span>
                        {selectedOption
                          ? `ยืนยันตอบข้อ ${selectedOption} & โจมตีบอส ⚡`
                          : 'คลิกเลือกคำตอบ A, B, C หรือ D ก่อน'}
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={isSubmitting}
                  className="w-full py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-cyber font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(251,191,36,0.55)] flex items-center justify-center gap-2 cursor-pointer btn-neon-hover font-black"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>กำลังสรุปผลคะแนนการต่อสู้...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {currentIndex + 1 < questions.length
                          ? `ลุยข้อถัดไป (ข้อที่ ${currentIndex + 2}/${questions.length})`
                          : 'ส่งข้อสอบและดูผลลัพธ์การปราบบอส!'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SINGLE FINAL RESULT MODAL */}
      {finalResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fadeIn">
          {finalResult.passed ? (
            /* =========================================================================
               CASE 1: VICTORY! (Passed >= passingScore) - Boss Defeated
               ========================================================================= */
            <div className="glass-panel max-w-md w-full rounded-2xl p-6 sm:p-8 border-2 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.55)] text-center space-y-5 relative overflow-hidden bg-slate-950/95 animate-modal-pop">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Victory Badge */}
              <div className="py-1 flex justify-center">
                <div className="coin-3d-floating relative w-24 h-24 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border-4 border-yellow-100 shadow-[0_0_35px_rgba(251,191,36,0.9)] flex items-center justify-center relative">
                    <Trophy className="w-10 h-10 text-amber-950" />
                    <Sparkles className="w-4 h-4 text-white absolute -top-1 -right-1 animate-ping" />
                    <Sparkles className="w-3 h-3 text-yellow-200 absolute -bottom-1 -left-1 animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="inline-block px-3.5 py-1 rounded-full bg-amber-950/90 border border-amber-400 text-amber-300 font-pixel text-xs tracking-widest uppercase shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                  STAGE CLEAR &bull; VICTORY!
                </span>
                <h3 className="text-xl sm:text-2xl font-cyber font-bold text-white text-glow-cyan leading-snug">
                  {lesson.lesson_number === 1
                    ? 'ยินดีด้วย! นายพิชิตปีศาจหีบโค้ดสำเร็จแล้ว!'
                    : `ยินดีด้วย! นายพิชิต${bossConfig.bossName}สำเร็จแล้ว!`}
                </h3>
                <div className="text-3xl sm:text-4xl font-pixel text-amber-400 text-glow-amber py-1">
                  {finalResult.score} / 10
                </div>
                <p className="text-xs font-thai text-slate-300">
                  เกณฑ์ผ่าน {bossConfig.passingScore}/10 ข้อ &bull; ปราบ{bossConfig.bossName}สำเร็จ ปลดล็อกเหรียญประจำบทเรียนที่ {lesson.lesson_number} แล้ว!
                </p>
              </div>

              {/* Coin & EXP Reward Banner */}
              <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/50 flex items-center justify-center gap-3 text-xs font-mono text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                <span>+100 EXP &bull; UNLOCKED HTML COIN #{lesson.lesson_number}</span>
              </div>

              {/* Special Bonus Mario Game Unlock CTA when Lesson 8 is cleared */}
              {lesson.lesson_number === 8 && (
                <button
                  type="button"
                  onClick={() => {
                    stopAllSounds();
                    try {
                      sessionStorage.setItem('comquest_bonus_unlocked', 'true');
                    } catch {}
                    router.push('/quest');
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 via-amber-300 to-orange-400 hover:from-emerald-300 hover:to-amber-400 text-slate-950 font-thai font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(251,191,36,0.65)] cursor-pointer transition-all"
                >
                  <Gamepad2 className="w-5 h-5" />
                  <span>ปลดล็อกครบ 8 บทแล้ว! เข้าเล่นเกมพิเศษ (เต็มหน้าจอแนวนอน)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    stopAllSounds();
                    router.push('/subjects');
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-cyber font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer"
                >
                  กลับสู่หน้าบทเรียน
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopAllSounds();
                    router.push('/profile');
                    router.refresh();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 hover:from-amber-300 text-slate-950 font-cyber font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(251,191,36,0.6)] cursor-pointer"
                >
                  ดูเหรียญในโปรไฟล์
                </button>
              </div>
            </div>
          ) : (
            /* =========================================================================
               CASE 2: DEFEAT (Score < passingScore) - Boss Survived Modal
               ========================================================================= */
            <div className="glass-panel max-w-md w-full rounded-2xl p-6 sm:p-8 border-2 border-rose-500/80 text-center space-y-5 relative overflow-hidden bg-slate-950/95 animate-modal-pop shadow-[0_0_40px_rgba(244,63,94,0.4)]">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-950/60 border border-rose-500/80 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                <XCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-pixel tracking-widest font-bold text-rose-400 text-glow-rose uppercase">
                  DEFEAT
                </h2>
                <h3 className="text-lg font-cyber font-bold text-white">
                  ภารกิจล้มเหลว {bossConfig.bossName}ยังมีชีวิตอยู่!
                </h3>
                <div className="text-2xl sm:text-3xl font-pixel text-rose-400 py-1">
                  {finalResult.score} / 10
                </div>
                <p className="text-xs font-thai text-slate-300">
                  ยังไม่ผ่านเกณฑ์ {bossConfig.passingScore}/10 ข้อ ลองทบทวนสไลด์บทเรียนแล้วกลับมาสู้ใหม่อีกครั้งนะ!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleReplay}
                  className="py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-cyber font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>สู้บอสอีกครั้ง</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopAllSounds();
                    router.push(`/learn/${lesson.id}`);
                  }}
                  className="py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-cyber font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>ทบทวนสไลด์</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
