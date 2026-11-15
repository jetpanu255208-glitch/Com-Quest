'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StudentQuizQuestion, Lesson, CharacterConfig, DEFAULT_CHARACTER_CONFIG } from '@/lib/supabase/types';
import { submitQuizAttempt } from '@/app/actions/student-quiz';
import { buildSafeLessonQuestions } from '@/lib/constants/default-questions';
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

  // Character config with instant local cache fallback
  const [activeCharConfig, setActiveCharConfig] = useState<CharacterConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('com_quest_character_config');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            return { ...DEFAULT_CHARACTER_CONFIG, ...parsed };
          }
        }
      } catch {}
    }
    return characterConfig || DEFAULT_CHARACTER_CONFIG;
  });

  useEffect(() => {
    if (characterConfig) {
      setActiveCharConfig((prev) => ({ ...DEFAULT_CHARACTER_CONFIG, ...characterConfig }));
    }
  }, [characterConfig]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<CharacterConfig>;
      if (customEvt.detail) {
        setActiveCharConfig((prev) => ({ ...DEFAULT_CHARACTER_CONFIG, ...customEvt.detail }));
      }
    };
    window.addEventListener('comquest_character_updated', handleUpdate);
    return () => window.removeEventListener('comquest_character_updated', handleUpdate);
  }, []);

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

  // Normalize and deduplicate all 10 questions so every question (1..10) across all 8 lessons
  // is guaranteed to have valid options, correct_option ('A' | 'B' | 'C' | 'D'), and explanation.
  const safeQuestions = useMemo(
    () => buildSafeLessonQuestions(lesson.id, questions),
    [lesson.id, questions]
  );

  // Quiz Navigation State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [replayVersion, setReplayVersion] = useState(0);
  const currentQuestion = safeQuestions[currentIndex] || safeQuestions[0];

  // Timer State (30 seconds per question)
  const QUESTION_DURATION = 30;
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION);
  const startTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const clashTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resetAnimTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickSecondRef = useRef<number>(QUESTION_DURATION);

  // Interaction State
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const selectedOptionRef = useRef<'A' | 'B' | 'C' | 'D' | null>(null);

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

  // Prevent double-scoring or double-evaluating the same question index
  const answeredQuestionsRef = useRef<Set<number>>(new Set());
  const activeQuestionKeyRef = useRef<string>('');

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
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const currentQuestionRef = useRef(currentQuestion);
  currentQuestionRef.current = currentQuestion;

  // Stop Timer & Pending Combat Timeouts
  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const clearCombatTimeouts = useCallback(() => {
    if (clashTimeoutRef.current) {
      clearTimeout(clashTimeoutRef.current);
      clashTimeoutRef.current = null;
    }
    if (resetAnimTimeoutRef.current) {
      clearTimeout(resetAnimTimeoutRef.current);
      resetAnimTimeoutRef.current = null;
    }
  }, []);

  // Resolve and grade an answer locally & deterministically so network hiccups or DB duplicates
  // can NEVER cause the selected answer to disappear or lock up the UI.
  const evaluateAndApplyAnswer = useCallback(
    (chosenOption: 'A' | 'B' | 'C' | 'D' | null, didTimeout: boolean) => {
      const q = currentQuestionRef.current;
      const qIdx = currentIndexRef.current;
      if (!q) return;

      if (
        isAnsweredRef.current ||
        isEvaluatingRef.current ||
        answeredQuestionsRef.current.has(qIdx)
      ) {
        return;
      }

      clearTimer();
      clearCombatTimeouts();

      isEvaluatingRef.current = true;
      answeredQuestionsRef.current.add(qIdx);

      // Keep isAnswered = false during the 200ms charge so the selected option stays brightly highlighted!
      setIsTimeout(didTimeout);
      setIsEvaluating(true);

      // Clash charge animation + charge sound
      playChargeSound();
      setPlayerAction('clash-charge');
      setBossAction('clash-charge');

      const rawCorrect = String(q.correct_option || 'A').trim().toUpperCase();
      const correctOpt: 'A' | 'B' | 'C' | 'D' =
        rawCorrect === 'A' || rawCorrect === 'B' || rawCorrect === 'C' || rawCorrect === 'D'
          ? rawCorrect
          : 'A';
      const wasCorrect = !didTimeout && Boolean(chosenOption) && chosenOption === correctOpt;
      const explanationText =
        q.explanation || (didTimeout ? 'หมดเวลาตอบข้อนี้' : `คำตอบที่ถูกต้องคือข้อ ${correctOpt}`);

      const answerRecord: UserAnswerRecord = {
        questionNumber: q.question_number,
        selectedOption: chosenOption,
        isTimeout: didTimeout,
        isCorrect: wasCorrect,
      };
      answersHistoryRef.current = [
        ...answersHistoryRef.current.filter((a) => a.questionNumber !== q.question_number),
        answerRecord,
      ];
      setAnswersHistory([...answersHistoryRef.current]);

      clashTimeoutRef.current = setTimeout(() => {
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

          const nextScore = Math.min(
            safeQuestions.length,
            answersHistoryRef.current.filter((a) => a.isCorrect).length
          );
          scoreRef.current = nextScore;
          setScore(nextScore);

          const nextHp = Math.max(0, bossConfig.maxHp - nextScore * bossConfig.damagePerHit);
          setBossHp(nextHp);
          if (!hasAchievementPoppedRef.current && nextScore >= bossConfig.passingScore) {
            hasAchievementPoppedRef.current = true;
            setHasAchievementPopped(true);
            setShowSteamAchievement(true);
            setTimeout(() => setShowSteamAchievement(false), 5000);
          }

          resetAnimTimeoutRef.current = setTimeout(() => {
            setPlayerAction('idle');
            setBossAction((prev) => (prev === 'defeated' ? 'defeated' : 'idle'));
          }, 700);
        } else {
          // Miss / Wrong / Timeout -> Boss strikes player
          setComboStreak(0);
          const nextScore = Math.min(
            safeQuestions.length,
            answersHistoryRef.current.filter((a) => a.isCorrect).length
          );
          scoreRef.current = nextScore;
          setScore(nextScore);
          setBossHp(Math.max(0, bossConfig.maxHp - nextScore * bossConfig.damagePerHit));

          setPlayerHearts((prev) => Math.max(0, prev - 1));
          playHurtSound();
          setPlayerAction('knockback');
          setBossAction('clash-strike');
          setFloatingText({
            text: didTimeout ? 'TIME OUT! โดนบอสโจมตี!' : 'MISS! ตอบผิด โดนบอสตี!',
            type: 'miss',
          });

          resetAnimTimeoutRef.current = setTimeout(() => {
            setPlayerAction('idle');
            setBossAction('idle');
          }, 750);
        }

        // Atomically set feedback AND isAnswered together so the option card never loses its state!
        isAnsweredRef.current = true;
        isEvaluatingRef.current = false;
        setFeedback({
          isCorrect: wasCorrect,
          correctOption: correctOpt,
          explanation: explanationText,
        });
        setIsAnswered(true);
        setIsEvaluating(false);
      }, 200);
    },
    [clearTimer, clearCombatTimeouts, bossConfig, safeQuestions.length]
  );

  // Trigger timeout for current question
  const triggerTimeout = useCallback(() => {
    const currentOpt = selectedOptionRef.current;
    const isActuallyTimeout = !currentOpt;
    evaluateAndApplyAnswer(currentOpt, isActuallyTimeout);
  }, [evaluateAndApplyAnswer]);

  // Keep a ref to triggerTimeout so the timer effect doesn't re-run on every state change
  const triggerTimeoutRef = useRef(triggerTimeout);
  triggerTimeoutRef.current = triggerTimeout;

  // Stop timer when finalResult is shown
  useEffect(() => {
    if (finalResult) {
      clearTimer();
      clearCombatTimeouts();
    }
  }, [finalResult, clearTimer, clearCombatTimeouts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      clearCombatTimeouts();
    };
  }, [clearTimer, clearCombatTimeouts]);

  // Effect: Initialize question state & 30s timer ONLY when (lesson.id, currentIndex, replayVersion) changes.
  // Never depend on `currentQuestion` object reference so background Next.js RSC refreshes cannot wipe `selectedOption`!
  useEffect(() => {
    const questionKey = `${lesson.id}:${currentIndex}:${replayVersion}`;
    if (activeQuestionKeyRef.current === questionKey) {
      return;
    }
    activeQuestionKeyRef.current = questionKey;

    clearTimer();
    clearCombatTimeouts();

    // Ensure this question index is unlocked for answering
    answeredQuestionsRef.current.delete(currentIndex);
    isAnsweredRef.current = false;
    isEvaluatingRef.current = false;
    selectedOptionRef.current = null;

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

    timerIntervalRef.current = setInterval(() => {
      if (isAnsweredRef.current || isEvaluatingRef.current) return;

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
  }, [currentIndex, lesson.id, replayVersion, clearTimer, clearCombatTimeouts]);

  // Handle selecting or changing an option (also allows re-selecting if the user wants to re-answer the current question)
  const handleSelectOption = useCallback(
    (option: 'A' | 'B' | 'C' | 'D') => {
      if (isEvaluatingRef.current) return;
      playSelectSound();

      if (isAnsweredRef.current) {
        // User clicked an option after answering to re-answer this question
        answeredQuestionsRef.current.delete(currentIndexRef.current);
        isAnsweredRef.current = false;
        setIsAnswered(false);
        setIsTimeout(false);
        setFeedback(null);
      }

      selectedOptionRef.current = option;
      setSelectedOption(option);
    },
    []
  );

  // Explicit helper to unlock & re-answer the current question
  const handleRetryCurrentQuestion = useCallback(() => {
    if (isEvaluatingRef.current || isSubmitting) return;
    playSelectSound();
    answeredQuestionsRef.current.delete(currentIndexRef.current);
    isAnsweredRef.current = false;
    setIsAnswered(false);
    setIsTimeout(false);
    setFeedback(null);
  }, [isSubmitting]);

  // Handle confirming the answer when clicking "ยืนยันคำตอบ & โจมตีบอส"
  const handleConfirmAnswer = useCallback(() => {
    const chosen = selectedOptionRef.current;
    if (!chosen || isAnsweredRef.current || isEvaluatingRef.current) {
      return;
    }
    evaluateAndApplyAnswer(chosen, false);
  }, [evaluateAndApplyAnswer]);

  // Move to Next Question or Finalize
  const handleNextQuestion = useCallback(async () => {
    if (isSubmitting) return;
    playSelectSound();

    if (currentIndex + 1 < safeQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Finished all questions!
      setIsSubmitting(true);

      const isPassed = scoreRef.current >= bossConfig.passingScore;
      if (isPassed) {
        playExplosionSound();
        setBossAction('defeated');
      }

      const allAnswers: UserAnswerRecord[] = safeQuestions.map((q) => {
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
      const finalScore = Math.max(0, Math.min(safeQuestions.length, rawScore));

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
  }, [currentIndex, safeQuestions, bossConfig.passingScore, lesson.id, isSubmitting]);

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

  // Handle Retry / Reset Quiz (works both mid-quiz and from the Victory/Defeat modal)
  const handleReplay = useCallback(() => {
    clearTimer();
    clearCombatTimeouts();
    stopAllSounds();
    playSelectSound();

    answeredQuestionsRef.current.clear();
    activeQuestionKeyRef.current = '';
    isAnsweredRef.current = false;
    isEvaluatingRef.current = false;
    selectedOptionRef.current = null;
    scoreRef.current = 0;
    comboStreakRef.current = 0;
    hasAchievementPoppedRef.current = false;
    answersHistoryRef.current = [];

    setCurrentIndex(0);
    setReplayVersion((prev) => prev + 1);
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
    setFinalResult(null);
    setIsAnswered(false);
    setIsTimeout(false);
    setSelectedOption(null);
    setFeedback(null);
    setIsEvaluating(false);
    setIsSubmitting(false);
  }, [clearTimer, clearCombatTimeouts, bossConfig.maxHp]);

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
                ข้อที่ {currentIndex + 1} / {safeQuestions.length}
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
            {safeQuestions.map((q, idx) => {
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

        {/* Right: Combo Counter, Score Counter, Reset & Audio Toggle */}
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
            onClick={handleReplay}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 text-xs font-thai font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="เริ่มทำแบบทดสอบใหม่ตั้งแต่ข้อ 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เริ่มใหม่</span>
          </button>

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
                  โจทย์ข้อที่ {currentQuestion.question_number} จาก {safeQuestions.length}
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
            characterConfig={activeCharConfig}
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
                  {selectedOption ? `เลือกข้อ ${selectedOption} แล้ว` : 'คลิกเลือก 1 ข้อ'}
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
                  const hasFeedback = isAnswered && feedback !== null;
                  const isCorrectAnswer = hasFeedback && feedback.correctOption === key;
                  const isWrongSelected = hasFeedback && isSelected && !feedback.isCorrect;

                  let cardStyle =
                    'quiz-choice-btn quiz-choice-default bg-slate-900/90 border-slate-700/90 hover:border-cyan-400 hover:bg-slate-900 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] text-slate-100 cursor-pointer';

                  if (hasFeedback) {
                    if (isCorrectAnswer) {
                      cardStyle =
                        'quiz-choice-btn quiz-choice-correct bg-emerald-950/95 border-2 border-emerald-400 text-emerald-50 shadow-[0_0_20px_rgba(16,185,129,0.45)] font-bold cursor-pointer';
                    } else if (isWrongSelected) {
                      cardStyle =
                        'quiz-choice-btn quiz-choice-wrong bg-rose-950/95 border-2 border-rose-500 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.4)] font-bold cursor-pointer';
                    } else {
                      cardStyle =
                        'quiz-choice-btn quiz-choice-dim bg-slate-900/60 border-slate-800 text-slate-400 hover:border-cyan-400/60 hover:text-slate-200 cursor-pointer';
                    }
                  } else if (isSelected) {
                    cardStyle =
                      'quiz-choice-btn quiz-choice-selected bg-cyan-950/95 border-2 border-cyan-400 text-white shadow-[0_0_22px_rgba(0,240,255,0.5)] ring-2 ring-cyan-400/70 font-bold scale-[1.01] cursor-pointer';
                  }

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectOption(key)}
                      disabled={isEvaluating || isSubmitting}
                      className={`w-full flex-1 p-4 sm:p-5 rounded-xl border text-left transition-all flex items-center gap-3.5 select-none ${cardStyle}`}
                    >
                      <span
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-black text-sm shrink-0 transition-all ${
                          hasFeedback && isCorrectAnswer
                            ? 'bg-emerald-400 text-slate-950 shadow-[0_0_12px_#10b981]'
                            : hasFeedback && isWrongSelected
                            ? 'bg-rose-500 text-white shadow-[0_0_12px_#f43f5e]'
                            : isSelected
                            ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_12px_#00f0ff]'
                            : 'bg-slate-800 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {key}
                      </span>

                      <span className="quiz-choice-text flex-1 font-thai text-base sm:text-lg leading-snug break-words">
                        {text}
                      </span>

                      {/* Explicit Selection & Result Badges so the chosen option is ALWAYS visible */}
                      {!hasFeedback && isSelected && (
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-400 text-slate-950 font-mono font-black text-[11px] shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                          ✓ เลือกข้อนี้
                        </span>
                      )}
                      {hasFeedback && isCorrectAnswer && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded bg-emerald-400/20 border border-emerald-400/60 text-emerald-200 font-thai text-[11px] font-bold">
                              ที่คุณเลือก
                            </span>
                          )}
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        </div>
                      )}
                      {hasFeedback && isWrongSelected && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded bg-rose-500/25 border border-rose-400/60 text-rose-200 font-thai text-[11px] font-bold">
                            ที่คุณเลือก
                          </span>
                          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        </div>
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
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={handleRetryCurrentQuestion}
                    disabled={isSubmitting}
                    className="sm:w-auto px-4 py-3.5 sm:py-4 rounded-xl bg-slate-900 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-thai font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                    title="เลือกคำตอบข้อนี้ใหม่อีกครั้ง"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>ตอบซ้ำข้อนี้</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-cyber font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(251,191,36,0.55)] flex items-center justify-center gap-2 cursor-pointer btn-neon-hover font-black"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>กำลังสรุปผลคะแนนการต่อสู้...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {currentIndex + 1 < safeQuestions.length
                            ? `ลุยข้อถัดไป (ข้อที่ ${currentIndex + 2}/${safeQuestions.length})`
                            : 'ส่งข้อสอบและดูผลลัพธ์การปราบบอส!'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
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

              <button
                type="button"
                onClick={handleReplay}
                className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-thai font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>สู้บอสอีกครั้ง (ทำแบบทดสอบซ้ำ)</span>
              </button>
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
