'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StudentQuizQuestion, Lesson } from '@/lib/supabase/types';
import { checkSingleQuestionAnswer, submitQuizAttempt } from '@/app/actions/student-quiz';
import { playClearSound, playOverSound, stopAllSounds } from '@/lib/sound/sound-manager';
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
  Sparkles,
  HelpCircle,
  Award,
} from 'lucide-react';

interface QuizPlayerProps {
  lesson: Lesson;
  questions: StudentQuizQuestion[];
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

export function QuizPlayer({ lesson, questions }: QuizPlayerProps) {
  const router = useRouter();

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
  const [isAnswered, setIsAnswered] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const [feedback, setFeedback] = useState<QuestionFeedback | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Score & History State
  const [score, setScore] = useState(0);
  const [answersHistory, setAnswersHistory] = useState<UserAnswerRecord[]>([]);
  const answersHistoryRef = useRef<UserAnswerRecord[]>([]);

  // Final Results & RPG Modal State
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState<{
    score: number;
    passed: boolean;
    coinAwarded: boolean;
    newLevel: number;
  } | null>(null);

  // Refs to avoid circular dependency in timer callbacks
  const isAnsweredRef = useRef(false);
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
    if (isAnsweredRef.current) return;
    clearTimer();
    isAnsweredRef.current = true;
    setIsTimeout(true);
    setIsAnswered(true);
    setIsEvaluating(true);

    const q = currentQuestionRef.current;
    if (!q) return;

    try {
      const res = await checkSingleQuestionAnswer({
        lessonId: lesson.id,
        questionNumber: q.question_number,
        selectedOption: null,
        isTimeout: true,
      });

      if (res.success) {
        setFeedback({
          isCorrect: false,
          correctOption: res.correctOption || '',
          explanation: res.explanation || 'หมดเวลาตอบข้อนี้',
        });
      }

      const timeoutRecord: UserAnswerRecord = {
        questionNumber: q.question_number,
        selectedOption: null,
        isTimeout: true,
      };
      answersHistoryRef.current = [
        ...answersHistoryRef.current.filter((a) => a.questionNumber !== q.question_number),
        timeoutRecord,
      ];
      setAnswersHistory([...answersHistoryRef.current]);
    } catch (e) {
      console.error('Error handling timeout:', e);
    } finally {
      setIsEvaluating(false);
    }
  }, [clearTimer, lesson.id]);

  // Effect: When currentIndex changes, initialize new question & 30s timer
  useEffect(() => {
    if (isFinished || !currentQuestion) {
      clearTimer();
      return;
    }

    // Reset interaction state for the new question
    isAnsweredRef.current = false;
    setIsAnswered(false);
    setIsTimeout(false);
    setSelectedOption(null);
    setFeedback(null);
    setIsEvaluating(false);

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
  }, [currentIndex, isFinished, currentQuestion, clearTimer, triggerTimeout]);

  // Handle Option Selection
  const handleSelectOption = async (option: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswered || isEvaluating || isAnsweredRef.current) return;

    // Clear timer immediately so it doesn't trigger timeout while evaluating
    clearTimer();
    isAnsweredRef.current = true;

    setSelectedOption(option);
    setIsAnswered(true);
    setIsEvaluating(true);

    try {
      const res = await checkSingleQuestionAnswer({
        lessonId: lesson.id,
        questionNumber: currentQuestion.question_number,
        selectedOption: option,
        isTimeout: false,
      });

      if (res.success) {
        setFeedback({
          isCorrect: res.isCorrect ?? false,
          correctOption: res.correctOption || '',
          explanation: res.explanation || '',
        });

        if (res.isCorrect) {
          setScore((s) => s + 1);
        }
      }

      const answerRecord: UserAnswerRecord = {
        questionNumber: currentQuestion.question_number,
        selectedOption: option,
        isTimeout: false,
      };
      answersHistoryRef.current = [
        ...answersHistoryRef.current.filter((a) => a.questionNumber !== currentQuestion.question_number),
        answerRecord,
      ];
      setAnswersHistory([...answersHistoryRef.current]);
    } catch (e) {
      console.error('Error checking answer:', e);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Move to Next Question or Finalize
  const handleNextQuestion = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Finished all 10 questions! Submit to server
      setIsFinished(true);
      setIsSubmitting(true);

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

      if (res.success) {
        setFinalResult({
          score: res.score ?? score,
          passed: res.passed ?? score >= 5,
          coinAwarded: res.coinAwarded ?? (res.score ?? score) >= 5,
          newLevel: res.newLevel ?? ((res.score ?? score) >= 5 ? 100 : 0),
        });
      } else {
        console.error('submitQuizAttempt fallback:', res.error);
        const isPassed = score >= 5;
        setFinalResult({
          score: score,
          passed: isPassed,
          coinAwarded: isPassed,
          newLevel: isPassed ? 100 : 0,
        });
      }
      setIsSubmitting(false);
    }
  };

  // Handle Replay Quiz
  const handleReplay = () => {
    stopAllSounds();
    answersHistoryRef.current = [];
    setCurrentIndex(0);
    setScore(0);
    setAnswersHistory([]);
    setIsFinished(false);
    setFinalResult(null);
    setIsAnswered(false);
    setIsTimeout(false);
    setSelectedOption(null);
    setFeedback(null);
  };

  // Play Clear / Over sound effect as soon as the result modal pops up
  useEffect(() => {
    if (!isFinished || isSubmitting || !finalResult) return;

    if (finalResult.passed) {
      playClearSound();
    } else {
      playOverSound();
    }

    return () => {
      stopAllSounds();
    };
  }, [isFinished, isSubmitting, finalResult]);

  // Timer Progress Calculations
  const timerPercentage = (timeLeft / QUESTION_DURATION) * 100;
  const isTimeCritical = timeLeft <= 5;
  const isTimeWarning = timeLeft <= 12 && !isTimeCritical;

  return (
    <div className="max-w-4xl w-full mx-auto space-y-6">
      {/* QUIZ HUD BAR */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-cyan-500/40 shadow-[0_0_25px_rgba(0,240,255,0.15)] flex flex-wrap items-center justify-between gap-4">
        {/* Left: Quest Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              เควสต์: บทที่ {lesson.lesson_number}
            </span>
            <span className="text-xs font-mono text-slate-400">
              QUESTION {currentIndex + 1} / {questions.length}
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-cyber font-bold text-white truncate max-w-md">
            {lesson.title}
          </h2>
        </div>

        {/* Center: Live Timer */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-pixel text-base border transition-all ${
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

        {/* Right: Score Counter */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-slate-400">SCORE:</span>
          <span className="font-bold text-amber-400">{score} / 10</span>
        </div>
      </div>

      {/* QUESTION PROGRESS BAR */}
      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 shadow-[0_0_10px_#00f0ff]"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* QUESTION CARD */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6 relative overflow-hidden">
        {/* Subtle Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Question Header */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">
              คำถามข้อที่ {currentQuestion.question_number} จาก 10
            </span>
            <span className="text-xs font-mono text-slate-500">1 POINT</span>
          </div>

          <h3 className="text-lg sm:text-2xl font-thai font-bold text-white leading-relaxed">
            {currentQuestion.question_text}
          </h3>
        </div>

        {/* 4 Choices Grid */}
        <div className="grid grid-cols-1 gap-3 relative z-10">
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
              'bg-slate-900/80 border-slate-800 hover:border-cyan-400/70 hover:bg-slate-850 text-slate-200 cursor-pointer';

            if (isAnswered) {
              if (isCorrectAnswer) {
                cardStyle =
                  'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-bold';
              } else if (isWrongSelected) {
                cardStyle =
                  'bg-rose-950/80 border-rose-500 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)] line-through';
              } else if (isSelected && !hasFeedback) {
                // Evaluating answer: show cyan glow, NEVER flash red
                cardStyle =
                  'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.3)] animate-pulse font-semibold';
              } else {
                cardStyle = 'bg-slate-950/60 border-slate-800/80 text-slate-500 opacity-60';
              }
            }

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectOption(key)}
                disabled={isAnswered || isEvaluating}
                className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3.5 ${cardStyle}`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 transition-colors ${
                    isAnswered && isCorrectAnswer
                      ? 'bg-emerald-500 text-slate-950'
                      : isAnswered && isWrongSelected
                      ? 'bg-rose-500 text-white'
                      : isSelected
                      ? 'bg-cyan-500 text-slate-950'
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
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                )}
                {isAnswered && isWrongSelected && (
                  <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* FEEDBACK & EXPLANATION BOX */}
        {isAnswered && feedback && (
          <div
            className={`p-5 rounded-xl border space-y-2 animate-fadeIn ${
              feedback.isCorrect
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-cyber font-bold text-sm">
                {feedback.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>ตอบถูกต้อง! (+1 คะแนน)</span>
                  </>
                ) : isTimeout ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>หมดเวลาตอบ! (0 คะแนน)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>ตอบผิด! (0 คะแนน)</span>
                  </>
                )}
              </div>

              <span className="text-xs font-mono">
                เฉลยข้อที่ถูกต้อง: <strong>{feedback.correctOption}</strong>
              </span>
            </div>

            <div className="pt-1 text-xs font-thai text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <strong className="text-amber-400 font-mono text-[11px] block mb-0.5">
                💡 คำอธิบายเฉลย:
              </strong>
              {feedback.explanation}
            </div>
          </div>
        )}

        {/* NEXT QUESTION BUTTON */}
        {isAnswered && (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleNextQuestion}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-cyber font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-2 cursor-pointer"
            >
              <span>
                {currentIndex + 1 < questions.length ? 'ข้อถัดไป (Next)' : 'ดูผลคะแนนสอบ (Finish)'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* RPG RESULTS MODAL (QUEST CLEAR / QUEST FAILED) */}
      {isFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fadeIn">
          {isSubmitting ? (
            <div className="glass-panel p-8 rounded-2xl border border-cyan-500/50 text-center space-y-4 animate-modal-pop">
              <div className="w-12 h-12 mx-auto border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-cyber text-white">กำลังตรวจผลคะแนนและบันทึกข้อมูล...</p>
            </div>
          ) : finalResult ? (
            finalResult.passed ? (
              /* CASE 1: QUEST CLEAR (SCORE >= 5/10) */
              <div className="glass-panel max-w-md w-full rounded-2xl p-6 sm:p-8 border-2 border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.4)] text-center space-y-6 relative overflow-hidden bg-slate-950/95 animate-modal-pop">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* Pixel Art Victory Trophy */}
                <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-[0_0_25px_#fbbf24] animate-bounce">
                  <Trophy className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-amber-950 border border-amber-500 text-amber-300 font-pixel text-xs tracking-widest uppercase">
                    QUEST CLEAR
                  </span>
                  <h3 className="text-xl sm:text-2xl font-cyber font-bold text-white text-glow-cyan">
                    ยินดีด้วย! นายผ่านบทเรียนที่ {lesson.lesson_number} แล้ว
                  </h3>
                  <div className="text-3xl sm:text-4xl font-pixel text-amber-400 text-glow-amber py-1">
                    {finalResult.score} / 10
                  </div>
                  <p className="text-xs font-thai text-slate-300">
                    เกณฑ์ผ่าน 5/10 คะแนน &bull; ปลดล็อกเหรียญประจำบทเรียนที่ {lesson.lesson_number} แล้ว!
                  </p>
                </div>

                {/* Coin Reward Banner */}
                <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/50 flex items-center justify-center gap-3 text-xs font-mono text-amber-300">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>+100 EXP &bull; UNLOCKED HTML COIN #{lesson.lesson_number}</span>
                </div>

                {/* Confirm Button */}
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/profile';
                  }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-cyber font-bold text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(251,191,36,0.6)] hover:scale-[1.02] transition-all cursor-pointer"
                >
                  ตกลง (ไปดูโปรไฟล์และเหรียญ)
                </button>
              </div>
            ) : (
              /* CASE 2: QUEST FAILED (SCORE < 5/10) */
              <div className="glass-panel max-w-md w-full rounded-2xl p-6 sm:p-8 border-2 border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.3)] text-center space-y-6 relative overflow-hidden bg-slate-950/95 animate-modal-pop">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-rose-500" />

                <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-950/60 border border-rose-500 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                  <XCircle className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-rose-950 border border-rose-500 text-rose-300 font-pixel text-xs tracking-widest uppercase">
                    QUEST FAILED
                  </span>
                  <h3 className="text-xl font-cyber font-bold text-white">
                    ยังไม่ผ่านบทเรียนนี้
                  </h3>
                  <div className="text-2xl sm:text-3xl font-pixel text-rose-400 py-1">
                    {finalResult.score} / 10
                  </div>
                  <p className="text-xs font-thai text-slate-300">
                    ยังไม่ผ่านบทเรียนนี้ ลองทบทวนเนื้อหาแล้วกลับมาทำใหม่อีกครั้ง (เกณฑ์ผ่าน 5/10)
                  </p>
                </div>

                {/* 2 Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleReplay}
                    className="py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-cyber font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Replay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push(`/learn/${lesson.id}`)}
                    className="py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-cyber font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>เรียนรู้ใหม่</span>
                  </button>
                </div>
              </div>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}
