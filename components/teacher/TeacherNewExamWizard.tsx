'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Swords,
  Clock,
  HelpCircle,
  Trophy,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { createExamSession } from '@/app/actions/exam-actions';
import { OFFICIAL_HTML_LESSONS } from '@/lib/supabase/types';

export const TeacherNewExamWizard: React.FC = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [title, setTitle] = useState('แบบทดสอบบอส: HTML พื้นฐาน');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [passingScore, setPassingScore] = useState(6);
  const [selectedLessons, setSelectedLessons] = useState<string[]>(
    OFFICIAL_HTML_LESSONS.map((l) => l.id)
  );

  // Toggle lesson selection
  const handleToggleLesson = (lessonId: string) => {
    setSelectedLessons((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  };

  const handleSelectAllLessons = () => {
    if (selectedLessons.length === OFFICIAL_HTML_LESSONS.length) {
      setSelectedLessons([]);
    } else {
      setSelectedLessons(OFFICIAL_HTML_LESSONS.map((l) => l.id));
    }
  };

  // Preset Configurations
  const applyPreset = (preset: 'quick' | 'standard' | 'final') => {
    if (preset === 'quick') {
      setTitle('แบบทดสอบด่วน: 5 ข้อ (Quick Quiz)');
      setDurationMinutes(8);
      setTotalQuestions(5);
      setPassingScore(3);
    } else if (preset === 'standard') {
      setTitle('แบบทดสอบประจำบทเรียน (10 ข้อ)');
      setDurationMinutes(15);
      setTotalQuestions(10);
      setPassingScore(6);
    } else if (preset === 'final') {
      setTitle('การสอบวัดผลสัมฤทธิ์: HTML ทั้ง 8 บทเรียน');
      setDurationMinutes(30);
      setTotalQuestions(20);
      setPassingScore(12);
      setSelectedLessons(OFFICIAL_HTML_LESSONS.map((l) => l.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('กรุณากรอกชื่อการสอบ');
      return;
    }

    if (selectedLessons.length === 0) {
      setErrorMsg('กรุณาเลือกอย่างน้อย 1 บทเรียนเพื่อดึงคลังข้อสอบ');
      return;
    }

    startTransition(async () => {
      const res = await createExamSession({
        title: title.trim(),
        durationMinutes,
        totalQuestions,
        passingScore,
        selectedLessons,
      });

      if (!res.success || !res.sessionId) {
        setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการสร้างห้องสอบ');
      } else {
        router.push(`/teacher/exams/${res.sessionId}/lobby`);
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link
          href="/teacher/exams"
          className="hover:text-white flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ย้อนกลับไปรายการห้องสอบ</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Wizard Main Card */}
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
          {/* Header */}
          <div className="border-b border-slate-800 pb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold mb-2">
              <Swords className="w-3.5 h-3.5 text-cyan-400" />
              สร้างห้องสอบ BOSS BATTLE
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">ตั้งค่าการสอบ RPG</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              ระบบจะสุ่มข้อสอบจากคลังบทเรียนที่คุณเลือก พร้อมสร้างรหัสห้องสอบ (Room Code) เพื่อให้นักเรียนเข้าร่วม
            </p>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              เทมเพลตด่วน (Quick Presets)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => applyPreset('quick')}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 text-left transition-all cursor-pointer group"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                  ⚡ แบบทดสอบด่วน (Mimic)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">5 ข้อ • 8 นาที • ผ่าน 3 ข้อ</div>
                <div className="text-[10px] text-rose-400/90 mt-1 font-mono">บอส: ปีศาจหีบสมบัติ (HP 500)</div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('standard')}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 text-left transition-all cursor-pointer group"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                  ⚔️ สอบประจำสัปดาห์ (Knight)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">10 ข้อ • 15 นาที • ผ่าน 6 ข้อ</div>
                <div className="text-[10px] text-emerald-400/90 mt-1 font-mono">บอส: อัศวินไวรัส (HP 1,000)</div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('final')}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 text-left transition-all cursor-pointer group"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                  🏆 สอบรวมทุกบท (Boss Dragon)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">20 ข้อ • 30 นาที • ผ่าน 12 ข้อ</div>
                <div className="text-[10px] text-amber-400/90 mt-1 font-mono">บอส: มังกรจักรกล (HP 20,000)</div>
              </button>
            </div>
          </div>

          {/* Exam Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              ชื่อการสอบ (Exam Title) *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น การสอบเก็บคะแนนบทที่ 1-4"
              required
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-cyan-400 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-sm sm:text-base font-medium"
            />
          </div>

          {/* Numeric Settings Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                เวลาสอบ (นาที)
              </label>
              <input
                type="number"
                min={1}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-400 rounded-xl text-cyan-300 font-mono font-bold text-center text-lg focus:outline-none"
              />
            </div>

            {/* Total Questions */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                จำนวนข้อสอบ
              </label>
              <input
                type="number"
                min={1}
                max={80}
                value={totalQuestions}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTotalQuestions(val);
                  if (passingScore > val) setPassingScore(Math.ceil(val * 0.6));
                }}
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-400 rounded-xl text-amber-300 font-mono font-bold text-center text-lg focus:outline-none"
              />
            </div>

            {/* Passing Score */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                เกณฑ์ผ่าน (คะแนน)
              </label>
              <input
                type="number"
                min={1}
                max={totalQuestions}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-400 rounded-xl text-emerald-300 font-mono font-bold text-center text-lg focus:outline-none"
              />
            </div>
          </div>

          {/* Lesson Sources Checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                เลือกขอบเขตบทเรียนที่ต้องการออกสอบ ({selectedLessons.length}/{OFFICIAL_HTML_LESSONS.length})
              </label>
              <button
                type="button"
                onClick={handleSelectAllLessons}
                className="text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
              >
                {selectedLessons.length === OFFICIAL_HTML_LESSONS.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
              {OFFICIAL_HTML_LESSONS.map((lesson) => {
                const isSelected = selectedLessons.includes(lesson.id);
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => handleToggleLesson(lesson.id)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                        isSelected
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                          : 'border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        บทที่ {lesson.lesson_number}: {lesson.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{lesson.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <Link
              href="/teacher/exams"
              className="px-5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-[0_4px_20px_rgba(0,207,239,0.35)] flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังสร้างห้องสอบ...
                </>
              ) : (
                <>
                  <span>สร้างห้องสอบและเปิด Lobby</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

