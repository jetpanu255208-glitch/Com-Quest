'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  BookOpen,
  Award,
  Sparkles,
  RotateCcw,
  Flame,
} from 'lucide-react';
import { PixelCharacter } from '@/components/character/PixelCharacter';
import { ExamSession, ExamParticipant, ExamQuestion, CharacterConfig } from '@/lib/supabase/types';
import { getBossConfigForExam } from '@/lib/exam/boss-config';

interface ExamResultViewProps {
  session: ExamSession;
  participant: ExamParticipant;
  questions: ExamQuestion[];
  answers: {
    question_id: string;
    selected_option?: string | null;
    is_correct?: boolean | null;
  }[];
  playerConfig?: CharacterConfig | null;
  playerName?: string;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  session,
  participant,
  questions,
  answers,
  playerConfig,
  playerName = 'นักเรียน',
}) => {
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');

  const score = participant.score ?? 0;
  const totalQuestions = questions.length || session.total_questions || 10;
  const percentage = Math.round((score / totalQuestions) * 100);
  const isPassed = participant.passed ?? score >= session.passing_score;

  const bossConfig = getBossConfigForExam(
    totalQuestions,
    session.passing_score,
    session.boss_name
  );

  // Map answers by question_id
  const answerMap = new Map(answers.map((a) => [a.question_id, a]));

  const filteredQuestions = questions.filter((q) => {
    const studentAns = answerMap.get(q.id);
    const isCorrect = studentAns?.is_correct ?? false;
    if (filter === 'correct') return isCorrect;
    if (filter === 'incorrect') return !isCorrect;
    return true;
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 1. Victory / Defeat Hero Banner */}
      <div
        className={`relative rounded-3xl p-6 sm:p-10 border-2 overflow-hidden shadow-2xl backdrop-blur-xl text-center ${
          isPassed
            ? 'bg-gradient-to-b from-emerald-950/70 via-slate-900/90 to-slate-950 border-emerald-500/40 shadow-[0_8px_32px_rgba(16,185,129,0.25)]'
            : 'bg-gradient-to-b from-rose-950/70 via-slate-900/90 to-slate-950 border-rose-500/40 shadow-[0_8px_32px_rgba(239,68,68,0.2)]'
        }`}
      >
        {/* Glow backdrop circles */}
        <div
          className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none ${
            isPassed ? 'bg-emerald-500/20' : 'bg-rose-500/20'
          }`}
        />
        <div
          className={`absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none ${
            isPassed ? 'bg-cyan-500/20' : 'bg-amber-500/20'
          }`}
        />

        {/* Boss Defeated Sprite or Escaped Silhouette */}
        <div className="relative mb-4 flex items-center justify-center">
          <div
            className={`relative w-28 h-28 sm:w-36 sm:h-36 transition-all ${
              isPassed ? 'filter grayscale brightness-75 scale-95 opacity-80' : 'filter brightness-110'
            }`}
            style={{ imageRendering: 'pixelated' }}
          >
            <Image
              src={bossConfig.image}
              alt={session.boss_name || bossConfig.name}
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-widest mb-3 border backdrop-blur-md shadow-md">
          {isPassed ? (
            <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-emerald-300" />
              BOSS DEFEATED • ชนะการต่อสู้!
            </span>
          ) : (
            <span className="bg-rose-950/80 text-rose-400 border border-rose-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-300" />
              BOSS SURVIVED • ยังไม่ผ่านเกณฑ์
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-wide">
          {isPassed ? 'คุณพิชิตบอสเมก้าดราก้อนสำเร็จ!' : 'บอสยังคงแข็งแกร่ง อย่าเพิ่งยอมแพ้!'}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-lg mx-auto leading-relaxed">
          {isPassed
            ? 'ยอดเยี่ยมมาก! การตอบคำถามของคุณสร้างความเสียหายจนบอสพ่ายแพ้ ได้รับคะแนนและค่าประสบการณ์เต็มเปี่ยม'
            : `คะแนนของคุณยังไม่ถึงเกณฑ์ผ่าน (${session.passing_score} คะแนน) ทบทวนบทเรียนเพิ่มเติมแล้วกลับมาท้าประลองใหม่ได้เสมอ`}
        </p>

        {/* Scorecard Metric Grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-xs text-slate-400">คะแนนที่ได้</div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono mt-0.5">
              {score}
              <span className="text-sm font-normal text-slate-500">/{totalQuestions}</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-xs text-slate-400">คิดเป็นร้อยละ</div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5">
              {percentage}%
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-xs text-slate-400">เกณฑ์ขั้นต่ำ</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mt-0.5">
              {session.passing_score}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-xs text-slate-400">ผลการประเมิน</div>
            <div
              className={`text-lg sm:text-xl font-black mt-1 ${
                isPassed ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPassed ? 'ผ่านเกณฑ์' : 'ไม่ผ่าน'}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/subjects"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-[0_4px_20px_rgba(0,207,239,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            <span>กลับสู่หน้ารายวิชา</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/profile"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-500 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <span>ดูโปรไฟล์และค่า EXP</span>
          </Link>
        </div>
      </div>

      {/* 2. Detailed Question Review */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-8 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
              เฉลยและทบทวนข้อสอบ
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ตรวจสอบคำตอบของคุณ พร้อมคำอธิบายเพื่อเสริมสร้างความเข้าใจ
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ทั้งหมด ({questions.length})
            </button>
            <button
              onClick={() => setFilter('correct')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filter === 'correct'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ตอบถูก ({score})
            </button>
            <button
              onClick={() => setFilter('incorrect')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filter === 'incorrect'
                  ? 'bg-rose-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ตอบผิด ({totalQuestions - score})
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const studentAns = answerMap.get(q.id);
            const isCorrect = studentAns?.is_correct ?? false;
            const chosenOption = studentAns?.selected_option || 'ยังไม่ได้ตอบ';

            const optionList: { key: string; text: string }[] = [
              { key: 'A', text: q.option_a },
              { key: 'B', text: q.option_b },
              { key: 'C', text: q.option_c },
              { key: 'D', text: q.option_d },
            ];

            return (
              <div
                key={q.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isCorrect
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-rose-950/20 border-rose-500/30'
                }`}
              >
                {/* Header: Question Number & Result Status */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      ข้อที่ {q.question_number}
                    </span>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ตอบถูกต้อง (+1)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-500/30">
                        <XCircle className="w-3.5 h-3.5" /> ตอบไม่ถูกต้อง (0)
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-sm sm:text-base font-medium text-slate-100 mb-3">
                  {q.question_text}
                </div>

                {/* Options Review */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {optionList.map((opt) => {
                    const isStudentChoice = chosenOption === opt.key;
                    const isAnswerCorrect = q.correct_option === opt.key;

                    let optBg = 'bg-slate-950/50 border-slate-800 text-slate-400';
                    if (isAnswerCorrect) {
                      optBg = 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 font-semibold';
                    } else if (isStudentChoice && !isCorrect) {
                      optBg = 'bg-rose-950/50 border-rose-500/50 text-rose-300 line-through';
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${optBg}`}
                      >
                        <span className="font-mono font-bold w-5 h-5 rounded flex items-center justify-center bg-black/40 text-[11px]">
                          {opt.key}
                        </span>
                        <span className="flex-1 truncate">{opt.text}</span>
                        {isAnswerCorrect && (
                          <span className="text-[10px] text-emerald-400 font-bold ml-1">เฉลย</span>
                        )}
                        {isStudentChoice && (
                          <span className="text-[10px] text-cyan-400 font-semibold ml-1">
                            (ที่คุณเลือก)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {q.explanation && (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                    <span className="font-bold text-cyan-400 mr-1.5">คำอธิบาย:</span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

