'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
}

export function QuizPlayer({
  lesson,
  questions,
  characterConfig,
  playerName = 'นักเรียน',
}: QuizPlayerProps) {
  const router = useRouter();
  const bossConfig = getQuizBossConfig(lesson.lesson_number);

  // Sound Mute State
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    setMuted(isSoundMuted());
  }, []);

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
  };

  // Quiz Navigation State
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQuestion = questions[currentIndex];

  // Timer State (30 seconds per question)
  const QUESTION_DURATION = 30;
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION);
  const startTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Interaction State
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const selectedOptionRef = useRef<'A' | 'B' | 'C' | 'D' | null>(null);
  selectedOptionRef.current = selectedOption;

  const [isAnswered, setIsAnswered] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const [feedback, setFeedback] = useState<QuestionFeedback | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Score & History State
  const [score, setScore] = useState(0);
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

    if (isAnsweredRef.current || isEvaluatingRef.current || answeredQuestionsRef.current.has(q.question_number)) {
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

    // Clash charge animation
    setPlayerAction('clash-charge');
    setBossAction('clash-charge');

    try {
      const res = await checkSingleQuestionAnswer({
        lessonId: lesson.id,
        questionNumber: q.question_number,
        selectedOption: currentOpt,
        isTimeout: isActuallyTimeout,
      });

      // Impact moment after 260ms charge
      setTimeout(() => {
        if (res.success && res.isCorrect) {
          playHitSound();
          setPlayerAction('clash-strike');
          setBossAction('hurt');
          setFloatingText({ text: `-${bossConfig.damagePerHit.toLocaleString()} HP! HIT`, type: 'damage' });

          setScore((prev) => Math.min(questions.length, prev + 1));
          setBossHp((prev) => {
            const nextHp = Math.max(0, prev - bossConfig.damagePerHit);
            if (!hasAchievementPopped && score + 1 >= bossConfig.passingScore) {
              setHasAchievementPopped(true);
              setShowSteamAchievement(true);
              setTimeout(() => setShowSteamAchievement(false), 5000);
            }
            return nextHp;
          });

          setTimeout(() => {
            setPlayerAction('idle');
            setBossAction((prev) => (prev === 'defeated' ? 'defeated' : 'idle'));
          }, 650);
        } else {
          // Miss / Timeout -> Boss strikes player
          playHurtSound();
          setPlayerAction('knockback');
          setBossAction('clash-strike');
          setFloatingText({ text: 'MISS!', type: 'miss' });

          setTimeout(() => {
            setPlayerAction('idle');
            setBossAction('idle');
          }, 750);
        }

        setFeedback({
          isCorrect: res.isCorrect ?? false,
          correctOption: res.correctOption || '',
          explanation: res.explanation || (isActuallyTimeout ? 'หมดเวลาตอบข้อนี้' : ''),
        });
      }, 260);

      const timeoutRecord: UserAnswerRecord = {
        questionNumber: q.question_number,
        selectedOption: currentOpt,
        isTimeout: isActuallyTimeout,
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
  }, [clearTimer, lesson.id, hasAchievementPopped, score, questions.length, bossConfig]);

  // Effect: When currentIndex changes, initialize new question & 30s timer
  useEffect(() => {
    if (finalResult || !currentQuestion) {
      clearTimer();
      return;
    }

    // Reset interaction state for the new question
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
    startTimeRef.current = Date.now();

    clearTimer();
    timerIntervalRef.current = setInterval(() => {
      if (isAnsweredRef.current) return;

      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, QUESTION_DURATION - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearTimer();
        triggerTimeout();
      }
    }, 200);

    return () => clearTimer();
  }, [currentIndex, finalResult, currentQuestion, clearTimer, triggerTimeout]);

  // Handle selecting or changing an option
  const handleSelectOption = (option: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswered || isEvaluating) return;
    setSelectedOption(option);
  };

  // Handle confirming the answer when clicking "ยืนยันคำตอบ / โจมตีบอส"
  const handleConfirmAnswer = async () => {
    if (
      isAnswered ||
      isEvaluating ||
      isAnsweredRef.current ||
      isEvaluatingRef.current ||
      !selectedOption ||
      !currentQuestion ||
      answeredQuestionsRef.current.has(currentQuestion.question_number)
    ) {
      return;
    }

    clearTimer();
    isAnsweredRef.current = true;
    isEvaluatingRef.current = true;
    answeredQuestionsRef.current.add(currentQuestion.question_number);

    setIsAnswered(true);
    setIsEvaluating(true);

    // Clash charge: Both player and boss rush toward center
    setPlayerAction('clash-charge');
    setBossAction('clash-charge');

    try {
      const res = await checkSingleQuestionAnswer({
        lessonId: lesson.id,
        questionNumber: currentQuestion.question_number,
        selectedOption: selectedOption,
        isTimeout: false,
      });

      // Impact moment after 260ms charge
      setTimeout(() => {
        if (res.success && res.isCorrect) {
          playHitSound(); // EXhit.mp3
          setPlayerAction('clash-strike');
          setBossAction('hurt');
          setFloatingText({ text: `-${bossConfig.damagePerHit.toLocaleString()} HP! HIT`, type: 'damage' });

          // Increment score with strict 10 cap
          setScore((prev) => Math.min(questions.length, prev + 1));

          setBossHp((prev) => {
            const nextHp = Math.max(0, prev - bossConfig.damagePerHit);
            if (!hasAchievementPopped && score + 1 >= bossConfig.passingScore) {
              setHasAchievementPopped(true);
              setShowSteamAchievement(true);
              setTimeout(() => setShowSteamAchievement(false), 5000);
            }
            return nextHp;
          });

          setTimeout(() => {
            setPlayerAction('idle');
            setBossAction((prev) => (prev === 'defeated' ? 'defeated' : 'idle'));
          }, 650);
        } else {
          // Miss / Wrong: Boss counters and knocks player back
          playHurtSound(); // Undertelhit.mp3
          setPlayerAction('knockback');
          setBossAction('clash-strike');
          setFloatingText({ text: 'MISS!', type: 'miss' });

          setTimeout(() => {
            setPlayerAction('idle');
            setBossAction('idle');
          }, 750);
        }

        setFeedback({
          isCorrect: res.isCorrect ?? false,
          correctOption: res.correctOption || '',
          explanation: res.explanation || '',
        });
      }, 260);

      const answerRecord: UserAnswerRecord = {
        questionNumber: currentQuestion.question_number,
        selectedOption: selectedOption,
        isTimeout: false,
      };
      answersHistoryRef.current = [
        ...answersHistoryRef.current.filter((a) => a.questionNumber !== currentQuestion.question_number),
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
  };

  // Move to Next Question or Finalize
  const handleNextQuestion = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Finished all questions!
      setIsSubmitting(true);

      const isPassed = score >= bossConfig.passingScore;
      if (isPassed) {
        // Trigger Boss Defeat Explosion & play Exprosion 8 bit.mp3
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

      const finalPassed = res.success ? (res.passed ?? score >= bossConfig.passingScore) : score >= bossConfig.passingScore;
      const rawScore = res.success ? (res.score ?? score) : score;
      const finalScore = Math.max(0, Math.min(questions.length, rawScore));

      if (finalPassed) {
        playExplosionSound();
        setBossAction('defeated');
      }

      setTimeout(() => {
        setFinalResult({
          score: finalScore,
          passed: finalPassed,
          coinAwarded: res.success ? (res.coinAwarded ?? finalPassed) : finalPassed,
          newLevel: res.success ? (res.newLevel ?? (finalPassed ? 100 : 0)) : (finalPassed ? 100 : 0),
        });
        setIsSubmitting(false);
      }, finalPassed ? 800 : 200);
    }
  };

  // Handle Retry Quiz
  const handleReplay = () => {
    clearTimer();
    stopAllSounds();
    answeredQuestionsRef.current.clear();
    setCurrentIndex(0);
    setScore(0);
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
    <div className="w-full max-w-[1360px] mx-auto space-y-4 px-2 sm:px-4">
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
                คุณผ่านบทเรียนนี้แล้วนะ!
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                ตอบถูกครบ {bossConfig.passingScore} ข้อแล้ว (ผ่านเกณฑ์) &bull; สู้ต่อไปจนกว่าบอสจะตาย!
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
          1. TOP HEADER UI BAR (แถบ UI ด้านบน - Spanning full width per wireframe)
          ========================================================================= */}
      <header className="glass-panel rounded-2xl px-4 py-3 sm:px-6 sm:py-3.5 border border-cyan-500/40 shadow-[0_0_25px_rgba(0,240,255,0.15)] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back button & Quest Info */}
        <div className="flex items-center gap-3">
          <Link
            href="/subjects"
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-colors"
            title="กลับหน้ารวมบทเรียน"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                บทเรียนที่ {lesson.lesson_number}
              </span>
              <span className="text-xs font-mono text-slate-400">
                ข้อ {currentIndex + 1} / {questions.length}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-cyber font-bold text-white truncate max-w-xs sm:max-w-md">
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* Center: Live Timer */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-pixel text-sm sm:text-base border transition-all ${
              isTimeCritical
                ? 'bg-rose-950/80 border-rose-500 text-rose-400 shadow-[0_0_20px_#f43f5e] animate-pulse'
                : isTimeWarning
                ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeCritical ? 'animate-spin' : ''}`} />
            <span>{timeLeft}s</span>
          </div>
        </div>

        {/* Right: Score Counter & Audio Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 transition-colors cursor-pointer"
            title={muted ? 'เปิดเสียง' : 'ปิดเสียง'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">SCORE:</span>
            <span className="font-bold text-amber-400">{score} / 10</span>
            {score >= bossConfig.passingScore && (
              <span className="ml-1 text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50">
                ✓ ผ่าน
              </span>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. MAIN TWO-COLUMN LAYOUT (Matching attached wireframe diagram)
             - LEFT COLUMN: Boss Arena (Top) + Question Prompt Box (Bottom)
             - RIGHT COLUMN: Choices / Options Box (Full Height)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* LEFT COLUMN: Arena + Question */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-4">
          {/* Top: Boss Battle Arena (หน้าลานบอส มีผู้เล่น และ บอส) */}
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
          />

          {/* Bottom: Question Prompt Box (โจทย์) */}
          <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4 relative overflow-hidden bg-slate-950/90 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold">
                โจทย์ข้อที่ {currentQuestion.question_number} จาก 10
              </span>
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-cyan-400" />
                <span>โจมตีบอส {bossConfig.damagePerHit.toLocaleString()} HP</span>
              </span>
            </div>

            {/* Question Text */}
            <h2 className="text-base sm:text-xl font-thai font-bold text-white leading-relaxed min-h-[56px]">
              {currentQuestion.question_text}
            </h2>

            {/* FEEDBACK & EXPLANATION (Appears here in Question Card after answering) */}
            {isAnswered && feedback && (
              <div
                className={`p-4 rounded-xl border space-y-2 animate-fadeIn ${
                  feedback.isCorrect
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold font-cyber">
                  <div className="flex items-center gap-2">
                    {feedback.isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>ตอบถูกต้อง! โจมตีสำเร็จ (-{bossConfig.damagePerHit.toLocaleString()} HP)</span>
                      </>
                    ) : isTimeout ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>หมดเวลาตอบ! โดนบอสตี (MISS)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>ตอบผิด! โดนบอสตี (MISS)</span>
                      </>
                    )}
                  </div>
                  <span className="font-mono text-xs">
                    เฉลย: <strong>ข้อ {feedback.correctOption}</strong>
                  </span>
                </div>

                <div className="text-xs font-thai text-slate-200 leading-relaxed bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                  <strong className="text-amber-400 font-mono block mb-0.5">
                    💡 คำอธิบายเฉลย:
                  </strong>
                  {feedback.explanation}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Choices Box (ช้อย/เลือกคำตอบ) */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col">
          <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800 flex-1 flex flex-col justify-between gap-4 bg-slate-950/90 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  ช้อย / เลือกคำตอบ
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {selectedOption ? `เลือกข้อ ${selectedOption}` : 'ยังไม่ได้เลือก'}
                </span>
              </div>

              {/* 4 Choices */}
              <div className="space-y-2.5">
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
                    'bg-slate-900/80 border-slate-800 hover:border-cyan-400/70 hover:bg-slate-850 hover:-translate-y-0.5 active:scale-[0.99] text-slate-200 cursor-pointer';

                  if (isAnswered) {
                    if (isCorrectAnswer) {
                      cardStyle =
                        'bg-emerald-950/90 border-emerald-500 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-bold';
                    } else if (isWrongSelected) {
                      cardStyle =
                        'bg-rose-950/90 border-rose-500 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)] line-through';
                    } else {
                      cardStyle = 'bg-slate-950/60 border-slate-800/80 text-slate-500 opacity-60';
                    }
                  } else if (isSelected) {
                    cardStyle =
                      'bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_18px_rgba(0,240,255,0.4)] ring-1 ring-cyan-400 font-semibold';
                  }

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectOption(key)}
                      disabled={isAnswered || isEvaluating}
                      className={`w-full p-3.5 sm:p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${cardStyle}`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${
                          isAnswered && isCorrectAnswer
                            ? 'bg-emerald-500 text-slate-950'
                            : isAnswered && isWrongSelected
                            ? 'bg-rose-500 text-white'
                            : isSelected
                            ? 'bg-cyan-400 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {key}
                      </span>

                      <span className="flex-1 font-thai text-sm sm:text-base leading-relaxed">
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
            <div className="pt-3 border-t border-slate-800/80">
              {!isAnswered ? (
                <button
                  type="button"
                  onClick={handleConfirmAnswer}
                  disabled={!selectedOption || isEvaluating}
                  className={`w-full py-3.5 rounded-xl font-cyber font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    selectedOption && !isEvaluating
                      ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer btn-neon-hover'
                      : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-70'
                  }`}
                >
                  {isEvaluating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>กำลังโจมตีบอส...</span>
                    </>
                  ) : (
                    <>
                      <Swords className="w-4 h-4" />
                      <span>ยืนยันคำตอบ &amp; โจมตีบอส</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-cyber font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 cursor-pointer btn-neon-hover"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>กำลังสรุปผลคะแนน...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {currentIndex + 1 < questions.length ? 'ข้อถัดไป (Next)' : 'ส่งข้อสอบและดูผล (Finish)'}
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
            <div className="glass-panel max-w-md w-full rounded-2xl p-6 sm:p-8 border-2 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.5)] text-center space-y-6 relative overflow-hidden bg-slate-950/95 animate-modal-pop">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Victory Badge */}
              <div className="py-2 flex justify-center">
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
                  VICTORY!
                </span>
                <h3 className="text-xl sm:text-2xl font-cyber font-bold text-white text-glow-cyan leading-snug">
                  {lesson.lesson_number === 1
                    ? 'ยินดีด้วยนายได้พิชิตปีศาจหีบโค้ดไปแล้ว!'
                    : `ยินดีด้วยนายได้พิชิต${bossConfig.bossName}ไปแล้ว!`}
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
                <Award className="w-5 h-5 text-amber-400" />
                <span>+100 EXP &bull; UNLOCKED HTML COIN #{lesson.lesson_number}</span>
              </div>

              {/* Action Buttons: กลับสู่หน้าบทเรียน / ไปดูโปรไฟล์ */}
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
                    window.location.href = '/profile';
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
            <div className="glass-panel max-w-md w-full rounded-2xl p-6 sm:p-8 border-2 border-rose-500/80 text-center space-y-6 relative overflow-hidden bg-slate-950/95 animate-modal-pop shadow-[0_0_40px_rgba(244,63,94,0.4)]">
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

              {/* Action Buttons: ทบทวนสไลด์ / สอบใหม่ */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReplay}
                  className="py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-cyber font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>สอบใหม่</span>
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
