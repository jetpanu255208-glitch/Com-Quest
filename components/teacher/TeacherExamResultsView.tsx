'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Users,
  Award,
  CheckCircle2,
  XCircle,
  Download,
  ArrowLeft,
  BarChart2,
  Search,
  BookOpen,
} from 'lucide-react';
import { PixelCharacter } from '@/components/character/PixelCharacter';
import { ExamSession, ExamParticipant, ExamQuestion, CharacterConfig } from '@/lib/supabase/types';

interface ParticipantWithProfile extends ExamParticipant {
  profiles?: {
    username?: string;
    avatar_url?: string;
    character_config?: CharacterConfig;
    level?: number;
  };
}

interface TeacherExamResultsViewProps {
  session: ExamSession;
  analytics: {
    totalStudents: number;
    submittedCount: number;
    passCount: number;
    passRate: number;
    avgScore: number;
    maxScore: number;
    minScore: number;
  };
  participants: ParticipantWithProfile[];
  questions: ExamQuestion[];
}

export const TeacherExamResultsView: React.FC<TeacherExamResultsViewProps> = ({
  session,
  analytics,
  participants,
  questions,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

  const filteredParticipants = participants.filter((p) => {
    const username = p.profiles?.username || 'นักเรียน';
    const matchesSearch = username.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'passed') return p.passed;
    if (filter === 'failed') return !p.passed && p.status === 'submitted';
    return true;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ลำดับ', 'ชื่อนักเรียน', 'คะแนน', 'เต็ม', 'ร้อยละ', 'สถานะ', 'เวลาที่ส่ง'];
    const rows = participants.map((p, idx) => {
      const score = p.score ?? 0;
      const total = session.total_questions;
      const percent = Math.round((score / total) * 100);
      const status = p.passed ? 'ผ่าน' : p.status === 'submitted' ? 'ไม่ผ่าน' : 'ยังไม่ส่ง';
      const submittedAt = p.submitted_at ? new Date(p.submitted_at).toLocaleString('th-TH') : '-';
      return [
        idx + 1,
        `"${p.profiles?.username || 'นักเรียน'}"`,
        score,
        total,
        `${percent}%`,
        status,
        `"${submittedAt}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `exam-results-${session.room_code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/teacher/exams"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับสู่หน้ารายการห้องสอบ</span>
        </Link>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>ส่งออกรายงาน (CSV)</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold mb-2">
            <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
            รายงานผลการสอบ BOSS BATTLE
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{session.title}</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            รหัสห้อง: <strong className="font-mono text-cyan-400">{session.room_code}</strong> • เกณฑ์ผ่าน:{' '}
            <strong className="text-emerald-400 font-mono">{session.passing_score}</strong>/{session.total_questions} คะแนน
          </p>
        </div>

        {/* Quick pass badge */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center shrink-0 min-w-[160px]">
          <div className="text-xs text-slate-400">อัตราผ่านการสอบ</div>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-0.5">
            {analytics.passRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            ผ่าน {analytics.passCount} จาก {analytics.submittedCount} คน
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs text-slate-400">ผู้เข้าสอบทั้งหมด</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">{analytics.totalStudents} คน</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs text-slate-400">ส่งข้อสอบแล้ว</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {analytics.submittedCount} คน
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Trophy className="w-4 h-4" />
            <span className="text-xs text-slate-400">คะแนนเฉลี่ย</span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {analytics.avgScore} <span className="text-xs font-normal text-slate-500">/{session.total_questions}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <Award className="w-4 h-4" />
            <span className="text-xs text-slate-400">สูงสุด / ต่ำสุด</span>
          </div>
          <div className="text-2xl font-black text-indigo-300 font-mono">
            {analytics.maxScore} / {analytics.minScore}
          </div>
        </div>
      </div>

      {/* Student List Table & Search */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-7 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">รายชื่อและผลคะแนนรายบุคคล</h2>
            <span className="text-xs font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
              {filteredParticipants.length} คน
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อนักเรียน..."
                className="pl-9 pr-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 w-full sm:w-48"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg ${filter === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilter('passed')}
                className={`px-2.5 py-1 rounded-lg ${filter === 'passed' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
              >
                ผ่าน
              </button>
              <button
                onClick={() => setFilter('failed')}
                className={`px-2.5 py-1 rounded-lg ${filter === 'failed' ? 'bg-rose-500 text-slate-950 font-bold' : 'text-slate-400'}`}
              >
                ไม่ผ่าน
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950/70 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">นักเรียน</th>
                <th className="py-3 px-3 text-center">สถานะ</th>
                <th className="py-3 px-3 text-center">คะแนน</th>
                <th className="py-3 px-3 text-center">ร้อยละ</th>
                <th className="py-3 px-3 text-center">ผลการประเมิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredParticipants.map((p) => {
                const isSubmitted = p.status === 'submitted';
                const score = p.score ?? 0;
                const percent = Math.round((score / session.total_questions) * 100);

                return (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                          <PixelCharacter
                            config={p.profiles?.character_config}
                            size={28}
                            animate={false}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-200 truncate">
                            {p.profiles?.username || 'นักเรียน'}
                          </div>
                          <div className="text-[10px] text-slate-500">Lv. {p.profiles?.level || 1}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isSubmitted ? (
                        <span className="text-slate-300 text-xs">ส่งแล้ว</span>
                      ) : (
                        <span className="text-amber-400 text-xs">กำลังทำ/ยังไม่ส่ง</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-white">
                      {isSubmitted ? `${score} / ${session.total_questions}` : '-'}
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-cyan-300">
                      {isSubmitted ? `${percent}%` : '-'}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isSubmitted ? (
                        p.passed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ผ่าน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-500/40 px-2.5 py-0.5 rounded-full">
                            <XCircle className="w-3.5 h-3.5" /> ไม่ผ่าน
                          </span>
                        )
                      ) : (
                        <span className="text-slate-500 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

