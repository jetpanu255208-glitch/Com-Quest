'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Swords,
  Plus,
  Clock,
  HelpCircle,
  Trophy,
  Users,
  Play,
  BarChart3,
  Trash2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { ExamSession } from '@/lib/supabase/types';
import { deleteExamSession, openExamLobby } from '@/app/actions/exam-actions';

interface TeacherExamsListViewProps {
  exams: (ExamSession & {
    participant_count?: number;
  })[];
}

export const TeacherExamsListView: React.FC<TeacherExamsListViewProps> = ({ exams: initialExams }) => {
  const router = useRouter();
  const [exams, setExams] = useState(initialExams);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isPending, startTransition] = useTransition();

  const filteredExams = exams.filter((e) => {
    if (filter === 'active') return e.status === 'lobby' || e.status === 'in_progress';
    if (filter === 'completed') return e.status === 'completed';
    return true;
  });

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบห้องสอบ "${title}"?`)) return;
    startTransition(async () => {
      const res = await deleteExamSession(id);
      if (res.success) {
        setExams((prev) => prev.filter((e) => e.id !== id));
      } else {
        alert(res.error || 'ไม่สามารถลบห้องสอบได้');
      }
    });
  };

  const handleOpenLobby = (id: string) => {
    startTransition(async () => {
      const res = await openExamLobby(id);
      if (res.success) {
        router.push(`/teacher/exams/${id}/lobby`);
      } else {
        alert(res.error || 'ไม่สามารถเปิด Lobby ได้');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-2xl backdrop-blur-md">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold mb-2">
            <Swords className="w-3.5 h-3.5 text-cyan-400" />
            TEACHER EXAM HUB
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">ระบบจัดการสอบ Boss Battle</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            สร้างห้องสอบแบบ RPG ควบคุมการเปิดห้องแบบเรียลไทม์ และดูรายงานคะแนนนักเรียน
          </p>
        </div>

        <Link
          href="/teacher/exams/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-[0_4px_20px_rgba(0,207,239,0.35)] cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>สร้างห้องสอบใหม่</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          ทั้งหมด ({exams.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            filter === 'active'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          กำลังเปิดสอบ/รอเริ่ม ({exams.filter((e) => e.status === 'lobby' || e.status === 'in_progress').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            filter === 'completed'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          สิ้นสุดแล้ว ({exams.filter((e) => e.status === 'completed').length})
        </button>
      </div>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 mb-4">
            <Swords className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">ยังไม่มีห้องสอบในหมวดนี้</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            คุณสามารถกดปุ่ม "สร้างห้องสอบใหม่" เพื่อเริ่มสร้างสนามประลองและรับรหัสห้องสำหรับให้นักเรียนเข้าร่วมได้ทันที
          </p>
          <div className="mt-5">
            <Link
              href="/teacher/exams/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" /> สร้างห้องสอบเดี๋ยวนี้
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExams.map((exam) => {
            const isLobby = exam.status === 'lobby';
            const isInProgress = exam.status === 'in_progress';
            const isCompleted = exam.status === 'completed';

            let statusBadge = (
              <span className="bg-slate-800 text-slate-400 text-[11px] px-2.5 py-1 rounded-md font-mono">
                ร่าง (Draft)
              </span>
            );
            if (isLobby) {
              statusBadge = (
                <span className="bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[11px] px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  เปิด Lobby รอเริ่ม
                </span>
              );
            } else if (isInProgress) {
              statusBadge = (
                <span className="bg-rose-950 border border-rose-500/40 text-rose-300 text-[11px] px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 animate-pulse">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  กำลังต่อสู้ (In Progress)
                </span>
              );
            } else if (isCompleted) {
              statusBadge = (
                <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[11px] px-2.5 py-1 rounded-md font-semibold">
                  สอบเสร็จสิ้น
                </span>
              );
            }

            return (
              <div
                key={exam.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between transition-all"
              >
                <div>
                  {/* Top Status & Code */}
                  <div className="flex items-center justify-between mb-3">
                    {statusBadge}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">ROOM CODE</span>
                      <span className="text-base font-black font-mono text-cyan-400 tracking-wider">
                        {exam.room_code}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{exam.title}</h3>

                  {/* Stats Pill Row */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-center mb-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">เวลา</span>
                      <span className="font-bold text-slate-200 font-mono">
                        {exam.duration_minutes} นาที
                      </span>
                    </div>
                    <div className="border-x border-slate-800">
                      <span className="text-slate-400 block text-[10px]">จำนวนข้อ</span>
                      <span className="font-bold text-slate-200 font-mono">
                        {exam.total_questions} ข้อ
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">เกณฑ์ผ่าน</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {exam.passing_score} คะแนน
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleDelete(exam.id, exam.title)}
                    disabled={isPending}
                    className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="ลบห้องสอบ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <Link
                        href={`/teacher/exams/${exam.id}/results`}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>ดูผลคะแนน</span>
                      </Link>
                    ) : (
                      <>
                        <Link
                          href={`/teacher/exams/${exam.id}/lobby`}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isInProgress ? 'เข้าคุมสอบสด' : 'เข้าห้อง Lobby'}</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

