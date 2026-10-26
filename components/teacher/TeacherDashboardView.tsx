'use client';

import React, { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Profile,
  QuizAttempt,
  LessonProgress,
  Lesson,
  OFFICIAL_HTML_LESSONS,
} from '@/lib/supabase/types';
import { deleteStudent, cleanDummyTestAccounts } from '@/app/actions/teacher-manage';
import { getLessonMission } from '@/lib/constants/missions';
import {
  Users,
  UserCheck,
  ClipboardCheck,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Award,
  Trophy,
  BookOpen,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  AlertTriangle,
  Zap,
  GraduationCap,
  Eye,
  Filter,
  UserX,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface TeacherDashboardViewProps {
  teacherName: string;
  teacherEmail: string;
  studentList: Profile[];
  lessonProgressRecords: LessonProgress[];
  allQuizAttempts: QuizAttempt[];
  lessons: Lesson[];
}

export function TeacherDashboardView({
  teacherName,
  teacherEmail,
  studentList: initialStudents,
  lessonProgressRecords: initialProgress,
  allQuizAttempts: initialAttempts,
  lessons,
}: TeacherDashboardViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active Tab state: 'students' | 'missions' | 'manage'
  const [activeTab, setActiveTab] = useState<'students' | 'missions' | 'manage'>('students');

  // Search & filter states
  const [studentSearch, setStudentSearch] = useState('');
  const [missionSearch, setMissionSearch] = useState('');
  const [missionFilterLesson, setMissionFilterLesson] = useState<string>('all');
  const [missionFilterStatus, setMissionFilterStatus] = useState<string>('all');

  // Modal states
  const [selectedStudentForView, setSelectedStudentForView] = useState<Profile | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Profile | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Synchronized student list
  const [students, setStudents] = useState<Profile[]>(initialStudents);
  const [progressRecords, setProgressRecords] = useState<LessonProgress[]>(initialProgress);
  const [attempts, setAttempts] = useState<QuizAttempt[]>(initialAttempts);

  React.useEffect(() => {
    setStudents(initialStudents);
    setProgressRecords(initialProgress);
    setAttempts(initialAttempts);
  }, [initialStudents, initialProgress, initialAttempts]);

  // Effect to hide the top bar (header) and lock background scrolling when modal is open
  React.useEffect(() => {
    const isModalOpen = Boolean(selectedStudentForView || studentToDelete);
    if (isModalOpen) {
      document.body.classList.add('modal-open-hide-header');
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (studentToDelete) {
            setStudentToDelete(null);
          } else if (selectedStudentForView) {
            setSelectedStudentForView(null);
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.classList.remove('modal-open-hide-header');
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.classList.remove('modal-open-hide-header');
    }
  }, [selectedStudentForView, studentToDelete]);

  // Helper to calculate student metrics
  const getStudentMetrics = (studentId: string) => {
    const studentAttempts = attempts.filter((a) => a.user_id === studentId);
    const studentProgress = progressRecords.filter((p) => p.user_id === studentId);

    const totalLessons = OFFICIAL_HTML_LESSONS.length; // 8
    const completedLessonIds = new Set<string>();

    for (const lesson of OFFICIAL_HTML_LESSONS) {
      // Completed only if completed in progress OR passed the quiz
      const isProgressCompleted = studentProgress.some(
        (p) => p.lesson_id === lesson.id && p.completed
      );
      const isQuizPassed = studentAttempts.some(
        (a) => a.lesson_id === lesson.id && a.passed
      );
      if (isProgressCompleted || isQuizPassed) {
        completedLessonIds.add(lesson.id);
      }
    }

    const completedLessonCount = completedLessonIds.size;
    const completionPercentage = Math.round((completedLessonCount / totalLessons) * 100);
    const calculatedLevel = Math.min(completedLessonCount * 100, totalLessons * 100);
    const coinsCount = completedLessonCount;

    return {
      level: calculatedLevel,
      coins: coinsCount,
      completedCount: completedLessonCount,
      totalLessons,
      completionPercentage,
      hasCourseTrophy: completedLessonCount >= totalLessons,
      attemptsCount: studentAttempts.length,
      html01BestScore:
        studentAttempts.filter((a) => a.lesson_id === 'html_01').length > 0
          ? Math.max(...studentAttempts.filter((a) => a.lesson_id === 'html_01').map((a) => a.score))
          : null,
      studentAttempts,
      studentProgress,
    };
  };

  // Filtered Students for "ดูนักเรียน" & "จัดการนักเรียน"
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase().trim();
    return students.filter((s) => {
      const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      const uname = (s.username || '').toLowerCase();
      const code = (s.student_id || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      return name.includes(q) || uname.includes(q) || code.includes(q) || email.includes(q);
    });
  }, [students, studentSearch]);

  // Filtered Submissions for "ตรวจสอบภารกิจ"
  const filteredSubmissions = useMemo(() => {
    return attempts.filter((att) => {
      const student = students.find((s) => s.id === att.user_id);
      const studentName = `${student?.first_name || ''} ${student?.last_name || ''}`.toLowerCase();
      const studentCode = (student?.student_id || '').toLowerCase();
      const studentUname = (student?.username || '').toLowerCase();

      // Search match
      if (missionSearch.trim()) {
        const q = missionSearch.toLowerCase().trim();
        const matchesQuery =
          studentName.includes(q) ||
          studentCode.includes(q) ||
          studentUname.includes(q) ||
          att.lesson_id.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Lesson filter
      if (missionFilterLesson !== 'all' && att.lesson_id !== missionFilterLesson) {
        return false;
      }

      // Status filter
      if (missionFilterStatus === 'passed' && !att.passed) return false;
      if (missionFilterStatus === 'failed' && att.passed) return false;

      return true;
    });
  }, [attempts, students, missionSearch, missionFilterLesson, missionFilterStatus]);

  // Handle Clean Dummy Accounts
  const handleCleanDummy = () => {
    if (!window.confirm('คุณต้องการล้างบัญชีทดสอบที่ผิดปกติและไม่รู้จักทั้งหมดออกจากระบบ ใช่หรือไม่?')) {
      return;
    }

    startTransition(async () => {
      setFeedbackMessage({ type: 'success', text: 'กำลังทำความสะอาดบัญชีทดสอบ...' });
      const res = await cleanDummyTestAccounts();
      if (res.success) {
        setFeedbackMessage({ type: 'success', text: res.message || 'ล้างบัญชีทดสอบเรียบร้อยแล้ว' });
        router.refresh();
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'เกิดข้อผิดพลาดในการล้างบัญชี' });
      }
      setTimeout(() => setFeedbackMessage(null), 4000);
    });
  };

  // Handle Student Deletion
  const confirmDeleteStudent = () => {
    if (!studentToDelete) return;

    const target = studentToDelete;
    startTransition(async () => {
      setFeedbackMessage({ type: 'success', text: `กำลังลบข้อมูลของ ${target.first_name || target.username}...` });
      const res = await deleteStudent(target.id);
      if (res.success) {
        // Instantly remove from local states
        setStudents((prev) => prev.filter((s) => s.id !== target.id));
        setAttempts((prev) => prev.filter((a) => a.user_id !== target.id));
        setProgressRecords((prev) => prev.filter((p) => p.user_id !== target.id));
        setStudentToDelete(null);

        // Close details modal if it was open for this student
        if (selectedStudentForView?.id === target.id) {
          setSelectedStudentForView(null);
        }

        setFeedbackMessage({
          type: 'success',
          text: `ลบบัญชีนักเรียน (${target.student_id || target.username}) และประวัติการส่งงาน/สอบทั้งหมดเรียบร้อยแล้ว`,
        });
        router.refresh();
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'ไม่สามารถลบข้อมูลนักเรียนได้' });
      }
      setTimeout(() => setFeedbackMessage(null), 5000);
    });
  };

  // Selected student metrics for details modal
  const selectedMetrics = selectedStudentForView ? getStudentMetrics(selectedStudentForView.id) : null;

  return (
    <div className="space-y-8">
      {/* 1. TOP HEADER & QUICK METRICS */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-amber-500/40 relative overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.12)]">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-amber-950 border border-amber-500/50 text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                VERIFIED TEACHER / ADMINISTRATOR
              </span>
              <span className="text-slate-400 text-xs font-mono">
                SECURITY LEVEL: MAX
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-cyber font-bold tracking-wide text-white">
              แดชบอร์ดครูผู้สอน —{' '}
              <span className="text-amber-400 text-glow-blue">{teacherName}</span>
            </h1>
            <p className="text-xs sm:text-sm font-thai text-slate-300 max-w-2xl">
              ศูนย์ควบคุมการเรียนการสอน ติดตามรายชื่อนักเรียน ตรวจสอบภารกิจและการส่งแบบทดสอบ พร้อมระบบจัดการบัญชีนักเรียนแบบเรียลไทม์
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/teacher/lessons"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-cyber font-bold text-xs tracking-wider uppercase flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>จัดการบทเรียนและสไลด์</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feedback Toast Notification */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-thai animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              : 'bg-rose-950/80 border-rose-500/60 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. THREE PRIMARY NAVIGATION TABS REQUESTED BY TEACHER */}
      <div className="flex border-b border-cyan-500/30 gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
        {/* TAB 1: ดูนักเรียน */}
        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2.5 px-5 py-3.5 rounded-t-xl text-xs sm:text-sm font-cyber font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border-t border-x ${
            activeTab === 'students'
              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60 shadow-[0_-5px_15px_rgba(0,240,255,0.2)]'
              : 'bg-slate-950/50 text-slate-400 border-transparent hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <UserCheck className={`w-4 h-4 ${activeTab === 'students' ? 'text-cyan-400' : 'text-slate-400'}`} />
          <span>1. ดูนักเรียน (View Students)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 ml-1">
            {students.length}
          </span>
        </button>

        {/* TAB 2: ตรวจสอบภารกิจ */}
        <button
          type="button"
          onClick={() => setActiveTab('missions')}
          className={`flex items-center gap-2.5 px-5 py-3.5 rounded-t-xl text-xs sm:text-sm font-cyber font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border-t border-x ${
            activeTab === 'missions'
              ? 'bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-[0_-5px_15px_rgba(245,158,11,0.2)]'
              : 'bg-slate-950/50 text-slate-400 border-transparent hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <ClipboardCheck className={`w-4 h-4 ${activeTab === 'missions' ? 'text-amber-400' : 'text-slate-400'}`} />
          <span>2. ตรวจสอบภารกิจ (Review Missions)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-900/60 text-amber-300 border border-amber-500/30 ml-1">
            {attempts.length}
          </span>
        </button>

        {/* TAB 3: จัดการนักเรียน */}
        <button
          type="button"
          onClick={() => setActiveTab('manage')}
          className={`flex items-center gap-2.5 px-5 py-3.5 rounded-t-xl text-xs sm:text-sm font-cyber font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border-t border-x ${
            activeTab === 'manage'
              ? 'bg-rose-950/80 text-rose-300 border-rose-500/60 shadow-[0_-5px_15px_rgba(244,63,94,0.2)]'
              : 'bg-slate-950/50 text-slate-400 border-transparent hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <UserX className={`w-4 h-4 ${activeTab === 'manage' ? 'text-rose-400' : 'text-slate-400'}`} />
          <span>3. จัดการนักเรียน (Manage & Delete)</span>
        </button>
      </div>

      {/* =========================================================================
          TAB CONTENT 1: ดูนักเรียน (VIEW STUDENTS & STATS)
          ========================================================================= */}
      {activeTab === 'students' && (
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-cyan-500/40 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl sm:text-2xl font-cyber font-bold text-white tracking-wide">
                  รายชื่อนักเรียนทั้งหมด (Student Roster)
                </h2>
              </div>
              <p className="text-xs sm:text-sm font-thai text-slate-400 mt-1">
                คลิกที่ปุ่ม &quot;ดูข้อมูลนักเรียน&quot; เพื่อดูเลเวล, จำนวนเหรียญที่มี และจำนวนบทเรียนที่ได้เรียนไปแล้วของนักเรียนแต่ละคน
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, รหัส 11 หลัก..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none font-thai"
              />
            </div>
          </div>

          {/* Students Grid / Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-thai">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-cyber uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">รหัสนักเรียน (11 หลัก)</th>
                  <th className="py-3 px-3">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-3">บัญชีผู้ใช้</th>
                  <th className="py-3 px-3 text-center">เลเวล (Player Level)</th>
                  <th className="py-3 px-3 text-center">เหรียญสะสม</th>
                  <th className="py-3 px-3 text-center">บทเรียนที่เรียนไปแล้ว</th>
                  <th className="py-3 px-3 text-center">คะแนนแบบทดสอบหลังบท</th>
                  <th className="py-3 px-3 text-center">ข้อมูลแบบละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((std) => {
                    const metrics = getStudentMetrics(std.id);
                    const displayName =
                      std.first_name && std.last_name
                        ? `${std.first_name} ${std.last_name}`
                        : std.first_name || std.username || 'นักเรียน';

                    // Calculate quiz scores for each lesson
                    const studentAttempts = attempts.filter((a) => a.user_id === std.id);
                    const stdProgress = progressRecords.filter((p) => p.user_id === std.id);

                    // Show quiz status for currently active lessons (Lesson 1 & Lesson 2)
                    const activeLessons = OFFICIAL_HTML_LESSONS.slice(0, 2);
                    const lessonScores = activeLessons.map((l) => {
                      const lessonAtts = studentAttempts.filter((a) => a.lesson_id === l.id);
                      const latestAtt = lessonAtts[0];
                      const lp = stdProgress.find((p) => p.lesson_id === l.id);
                      const isCompleted = lp?.completed || (latestAtt ? latestAtt.passed : false);
                      return {
                        lessonNumber: l.lesson_number,
                        latestScore: latestAtt ? latestAtt.score : null,
                        totalQuestions: latestAtt ? (latestAtt.total_questions || 10) : 10,
                        passed: isCompleted || (latestAtt ? latestAtt.passed : false),
                        attemptCount: lessonAtts.length,
                        hasAttempt: !!latestAtt,
                      };
                    });

                    return (
                      <tr key={std.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3.5 px-3">
                          {std.student_id ? (
                            <span className="font-bold text-cyan-400 font-mono tracking-wider">{std.student_id}</span>
                          ) : (
                            <span className="text-slate-500 italic">ยังไม่ระบุ</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-thai font-bold text-white text-sm">{displayName}</span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                          <div>@{std.username || 'user'}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{std.email}</div>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              metrics.level >= 800
                                ? 'bg-amber-950/90 text-amber-300 border border-amber-500/60 shadow-[0_0_12px_#fbbf24]'
                                : metrics.level > 0
                                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                                : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}
                          >
                            LVL {metrics.level} / 800
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="font-pixel text-amber-400 font-bold text-sm">
                            {metrics.coins} / 8 เหรียญ
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-mono text-xs font-bold text-emerald-400">
                              {metrics.completedCount}/{metrics.totalLessons} บท
                            </span>
                            <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                                style={{ width: `${metrics.completionPercentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">
                              {metrics.completionPercentage}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex flex-wrap items-center gap-1.5 justify-center">
                            {lessonScores.map((item) => (
                              <span
                                key={item.lessonNumber}
                                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 border ${
                                  !item.hasAttempt
                                    ? 'bg-slate-900/80 text-slate-400 border-slate-800'
                                    : item.passed
                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                                    : 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                                }`}
                                title={`บทที่ ${item.lessonNumber}: ${
                                  item.hasAttempt
                                    ? `${item.latestScore}/${item.totalQuestions} คะแนน (${item.passed ? 'ผ่านเกณฑ์' : 'ไม่ผ่าน'})`
                                    : 'ยังไม่สอบ'
                                }`}
                              >
                                <span className="text-slate-400">บท {item.lessonNumber}:</span>
                                {item.hasAttempt ? (
                                  <span className={item.passed ? 'text-amber-400 font-pixel font-bold' : 'text-rose-400 font-pixel font-bold'}>
                                    {item.latestScore}/{item.totalQuestions} {item.passed ? '(ผ่าน)' : '(ไม่ผ่าน)'}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-thai font-normal text-[11px]">
                                    ยังไม่สอบ
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForView(std)}
                            className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 text-xs font-thai font-bold flex items-center justify-center gap-1.5 mx-auto transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)] cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ดูข้อมูลนักเรียน</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-thai">
                      ไม่พบข้อมูลนักเรียนที่ค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT 2: ตรวจสอบภารกิจ (REVIEW MISSIONS & SUBMISSIONS)
          ========================================================================= */}
      {activeTab === 'missions' && (
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-amber-500/40 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl sm:text-2xl font-cyber font-bold text-white tracking-wide">
                  ตรวจสอบภารกิจที่นักเรียนส่งมา (Student Mission Submissions)
                </h2>
              </div>
              <p className="text-xs sm:text-sm font-thai text-slate-400 mt-1">
                รายการส่งแบบทดสอบและภารกิจการเรียนรู้ของนักเรียน พร้อมคะแนน เวลาที่ส่ง และสถานะการผ่านเกณฑ์
              </p>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, รหัสนักเรียน..."
                  value={missionSearch}
                  onChange={(e) => setMissionSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-xs text-white outline-none font-thai w-44"
                />
              </div>

              {/* Filter Lesson */}
              <select
                value={missionFilterLesson}
                onChange={(e) => setMissionFilterLesson(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 outline-none font-thai"
              >
                <option value="all">ทุกบทเรียน</option>
                {OFFICIAL_HTML_LESSONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    บทที่ {l.lesson_number}: {l.title}
                  </option>
                ))}
              </select>

              {/* Filter Status */}
              <select
                value={missionFilterStatus}
                onChange={(e) => setMissionFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 outline-none font-thai"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="passed">เฉพาะที่ผ่าน</option>
                <option value="failed">เฉพาะที่ไม่ผ่าน</option>
              </select>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-thai">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-cyber uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">วันที่ - เวลาส่ง</th>
                  <th className="py-3 px-3">รหัสนักเรียน (11 หลัก)</th>
                  <th className="py-3 px-3">นักเรียน</th>
                  <th className="py-3 px-3">ภารกิจ / บทเรียน</th>
                  <th className="py-3 px-3 text-center">คะแนนที่ได้</th>
                  <th className="py-3 px-3 text-center">สถานะภารกิจ</th>
                  <th className="py-3 px-3 text-center">รางวัลที่ได้รับ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map((attempt) => {
                    const student = students.find((s) => s.id === attempt.user_id);
                    const stdName = student
                      ? student.first_name && student.last_name
                        ? `${student.first_name} ${student.last_name}`
                        : student.first_name || student.username || student.email
                      : 'นักเรียน (' + attempt.user_id.slice(0, 8) + ')';
                    const stdCode = student?.student_id || '-';

                    const attemptDate = new Date(attempt.created_at).toLocaleString('th-TH', {
                      timeZone: 'Asia/Bangkok',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const lessonObj = OFFICIAL_HTML_LESSONS.find((l) => l.id === attempt.lesson_id);
                    const lessonTitle = lessonObj
                      ? `บทที่ ${lessonObj.lesson_number}: ${lessonObj.title}`
                      : attempt.lesson_id;

                    return (
                      <tr key={attempt.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3.5 px-3 text-slate-400 font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{attemptDate}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-cyan-400 font-mono tracking-wider">{stdCode}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-thai font-bold text-white text-sm">{stdName}</div>
                          {student?.username && (
                            <div className="text-[10px] text-slate-400">@{student.username}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-200 text-xs font-thai font-medium inline-block">
                            {lessonTitle}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`font-pixel text-base font-bold ${
                              attempt.passed ? 'text-amber-400' : 'text-rose-400'
                            }`}
                          >
                            {attempt.score} / {attempt.total_questions || 10}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {attempt.passed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 font-cyber font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>ผ่านเกณฑ์ (PASSED)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-950/90 text-rose-300 border border-rose-500/60 font-cyber font-bold text-[10px]">
                              <XCircle className="w-3 h-3 text-rose-400" />
                              <span>ไม่ผ่านเกณฑ์</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {attempt.passed ? (
                            <span className="text-amber-400 font-bold flex items-center justify-center gap-1 text-[11px]">
                              <Award className="w-3.5 h-3.5" />
                              <span>+100 LVL & 1 เหรียญ</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-thai">
                      ยังไม่มีประวัติการส่งภารกิจตามตัวกรองนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT 3: จัดการนักเรียน (MANAGE & DELETE ACCOUNTS)
          ========================================================================= */}
      {activeTab === 'manage' && (
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-rose-500/40 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <UserX className="w-5 h-5 text-rose-400" />
                <h2 className="text-xl sm:text-2xl font-cyber font-bold text-white tracking-wide">
                  จัดการบัญชีนักเรียน (Student Management & Permanent Delete)
                </h2>
              </div>
              <p className="text-xs sm:text-sm font-thai text-slate-400 mt-1">
                สามารถเห็นนักเรียนทุกคน และเมื่อกดลบ ระบบจะลบข้อมูลออกจากฐานข้อมูลทันทีรวมถึงลบประวัติการส่งงานและแบบทดสอบทั้งหมด
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCleanDummy}
                disabled={isPending}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-rose-500/50 text-rose-300 font-cyber font-bold text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>ลบรายชื่อทดสอบที่ไม่รู้จัก</span>
              </button>
            </div>
          </div>

          {/* Security alert box */}
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-3 text-xs font-thai text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-rose-300 text-sm">ข้อควรระวังในการลบบัญชีนักเรียน:</span>
              <p className="leading-relaxed text-slate-300">
                เมื่อกดปุ่มลบบัญชีของนักเรียนคนใด ระบบจะดำเนินการลบข้อมูลโปรไฟล์ ประวัติการทำแบบทดสอบ (Quiz Attempts) เหรียญรางวัลบทเรียน (Lesson Progress) และบัญชีการเข้าสู่ระบบออกจากฐานข้อมูลทันที โดยไม่สามารถกู้คืนได้
              </p>
            </div>
          </div>

          {/* Management Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-thai">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-cyber uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">รหัสนักเรียน (11 หลัก)</th>
                  <th className="py-3 px-3">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-3">อีเมลนักเรียน</th>
                  <th className="py-3 px-3 text-center">เลเวล / เหรียญ</th>
                  <th className="py-3 px-3 text-center">จำนวนการส่งงาน</th>
                  <th className="py-3 px-3 text-center">การจัดการบัญชี</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {students.length > 0 ? (
                  students.map((std) => {
                    const metrics = getStudentMetrics(std.id);
                    const displayName =
                      std.first_name && std.last_name
                        ? `${std.first_name} ${std.last_name}`
                        : std.first_name || std.username || 'นักเรียน';

                    return (
                      <tr key={std.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-cyan-400 font-mono tracking-wider">
                            {std.student_id || 'ยังไม่ระบุ'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-thai font-bold text-white text-sm">{displayName}</div>
                          <div className="text-[10px] text-slate-400">@{std.username || 'user'}</div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-300">
                          {std.email}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="text-amber-400 font-bold">
                            LVL {metrics.level} ({metrics.coins} เหรียญ)
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {metrics.attemptsCount} ครั้ง
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/profile?studentId=${std.id}`}
                              className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-thai text-xs flex items-center gap-1 transition-all"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>โปรไฟล์</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => setStudentToDelete(std)}
                              className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 hover:border-rose-400 text-rose-300 font-thai font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(244,63,94,0.3)] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบบัญชีนักเรียน</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-thai">
                      ไม่มีรายชื่อนักเรียนในระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ดูข้อมูลนักเรียนแต่ละคน (STUDENT DETAILS POPUP)
          ========================================================================= */}
      {/* =========================================================================
          MODAL: ดูข้อมูลนักเรียนแต่ละคน (STUDENT DETAILS POPUP - COMPACT)
          ========================================================================= */}
      {selectedStudentForView && selectedMetrics && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md px-3 sm:px-4 pt-12 sm:pt-16 pb-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedStudentForView(null);
            }
          }}
        >
          <div
            className="glass-panel w-full rounded-2xl border-2 border-cyan-400/80 shadow-[0_0_40px_rgba(0,240,255,0.25)] bg-[#070b16] flex flex-col overflow-hidden relative mt-2 sm:mt-4"
            style={{ width: 'min(680px, calc(100vw - 32px))', maxHeight: 'min(580px, 74vh)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Fixed at top) */}
            <div className="flex-shrink-0 p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/70 flex items-center justify-center text-cyan-400 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-cyber font-bold text-white line-clamp-1">
                    ข้อมูลนักเรียน: {selectedStudentForView.first_name || selectedStudentForView.username} {selectedStudentForView.last_name || ''}
                  </h3>
                  <p className="text-xs font-mono text-cyan-400 line-clamp-1">
                    รหัส 11 หลัก: <strong className="text-white">{selectedStudentForView.student_id || 'ยังไม่ระบุ'}</strong> &bull; @{selectedStudentForView.username}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudentForView(null)}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-cyan-400 flex items-center justify-center text-sm cursor-pointer shrink-0 transition-colors"
                title="ปิดหน้าต่าง"
              >
                ✕
              </button>
            </div>

            {/* Modal Content (Scrollable) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* 3 Core Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Highlight 1: เลเวลของนักเรียน */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-center space-y-0.5">
                  <div className="text-[10px] font-cyber text-slate-400 uppercase flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span>เลเวลของนักเรียน</span>
                  </div>
                  <div className="font-pixel text-xl sm:text-2xl text-cyan-300">
                    LVL {selectedMetrics.level}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {selectedMetrics.level >= 800 ? 'MAX LEVEL' : `${selectedMetrics.level} / 800`}
                  </div>
                </div>

                {/* Highlight 2: จำนวนเหรียญที่มี */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 text-center space-y-0.5">
                  <div className="text-[10px] font-cyber text-slate-400 uppercase flex items-center justify-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" />
                    <span>จำนวนเหรียญที่มี</span>
                  </div>
                  <div className="font-pixel text-xl sm:text-2xl text-amber-400">
                    {selectedMetrics.coins} / {selectedMetrics.totalLessons}
                  </div>
                  <div className="text-[10px] font-mono text-amber-300/80">
                    {selectedMetrics.hasCourseTrophy ? '★ ได้ถ้วยสำเร็จวิชา' : 'สะสมเพื่อรับถ้วย'}
                  </div>
                </div>

                {/* Highlight 3: บทที่เรียนจบ: X/8 พร้อม Progress Bar */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-center space-y-0.5">
                  <div className="text-[10px] font-cyber text-slate-400 uppercase flex items-center justify-center gap-1">
                    <BookOpen className="w-3 h-3 text-emerald-400" />
                    <span>บทที่เรียนจบ</span>
                  </div>
                  <div className="font-pixel text-xl sm:text-2xl text-emerald-300">
                    {selectedMetrics.completedCount}/{selectedMetrics.totalLessons}
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${selectedMetrics.completionPercentage}%` }}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-0.5">
                    <span>{selectedMetrics.completionPercentage}%</span>
                    <span>
                      {selectedMetrics.completedCount === selectedMetrics.totalLessons
                        ? 'ครบทุกบท'
                        : `เหลืออีก ${selectedMetrics.totalLessons - selectedMetrics.completedCount} บท`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed 8 Lessons Breakdown */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-cyber font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>สถานะทั้ง {selectedMetrics.totalLessons} บทเรียน (ผ่าน {selectedMetrics.completedCount}/{selectedMetrics.totalLessons})</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    ความคืบหน้า {selectedMetrics.completionPercentage}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-thai">
                  {OFFICIAL_HTML_LESSONS.map((lesson) => {
                    const lp = selectedMetrics.studentProgress.find((p) => p.lesson_id === lesson.id);
                    const lessonAtts = selectedMetrics.studentAttempts.filter((a) => a.lesson_id === lesson.id);
                    const isCompleted =
                      lesson.id === 'html_01'
                        ? selectedMetrics.studentProgress.some((p) => p.lesson_id === 'html_01' && p.completed) ||
                          selectedMetrics.studentAttempts.some((a) => a.lesson_id === 'html_01' && a.passed)
                        : (lp?.completed || lessonAtts.some((a) => a.passed));

                    const latestAtt = lessonAtts[0];
                    const mission = getLessonMission(lesson.id);
                    const isMissionPassed = lp?.mission_completed || isCompleted;

                    return (
                      <div
                        key={lesson.id}
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                          isCompleted
                            ? 'bg-slate-900/90 border-amber-500/50 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="font-bold flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                              บทที่ {lesson.lesson_number}
                            </span>
                            <span className="text-white text-xs">{lesson.title}</span>
                          </div>
                          <div className="shrink-0">
                            {isCompleted ? (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/50 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-amber-400" />
                                <span>จบบทแล้ว</span>
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">ยังไม่จบบท</span>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-0.5 text-[11px] pt-1 border-t border-slate-800/60">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400">คะแนนแบบทดสอบ:</span>
                            {latestAtt ? (
                              <span className={latestAtt.passed ? 'text-amber-400 font-bold font-mono' : 'text-rose-400 font-bold font-mono'}>
                                {latestAtt.score}/{latestAtt.total_questions || 10} {latestAtt.passed ? '(ผ่าน)' : '(ไม่ผ่าน)'}
                                {lessonAtts.length > 1 && ` [สอบ ${lessonAtts.length} ครั้ง]`}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-thai italic">ยังไม่สอบ</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400">สถานะภารกิจ:</span>
                            {mission ? (
                              <span className={isMissionPassed ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                                {isMissionPassed ? 'ทำภารกิจผ่านแล้ว' : 'ยังไม่ทำภารกิจ'}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">ไม่มีภารกิจเขียนโค้ด</span>
                            )}
                          </div>

                          {latestAtt?.created_at && (
                            <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                              <span>ส่งล่าสุด:</span>
                              <span>{new Date(latestAtt.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions (Fixed at bottom) */}
            <div className="flex-shrink-0 p-3 sm:p-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile?studentId=${selectedStudentForView.id}`}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-cyber font-bold text-xs uppercase flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>โปรไฟล์</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setStudentToDelete(selectedStudentForView);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 hover:border-rose-400 text-rose-300 font-thai text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบนักเรียน</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudentForView(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-thai font-semibold transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ยืนยันการลบบัญชีนักเรียน (DELETE CONFIRMATION)
          ========================================================================= */}
      {studentToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md px-4 pt-12 sm:pt-16 pb-8 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setStudentToDelete(null);
            }
          }}
        >
          <div
            className="glass-panel max-w-md w-full rounded-2xl p-5 sm:p-6 border-2 border-rose-500/80 shadow-[0_0_40px_rgba(244,63,94,0.35)] bg-[#0d0711] space-y-4 relative mt-2 sm:mt-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-rose-950">
              <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-500 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-cyber font-bold text-white text-glow-pink">
                  ยืนยันการลบนักเรียน
                </h3>
                <p className="text-xs font-mono text-cyan-400">
                  {studentToDelete.first_name || studentToDelete.username} {studentToDelete.last_name || ''}
                  {studentToDelete.student_id ? ` (${studentToDelete.student_id})` : ''}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-rose-500/30 text-xs sm:text-sm font-thai text-slate-300 leading-relaxed">
              การลบนี้จะลบโปรไฟล์ คะแนน ความคืบหน้าการเรียน และประวัติการทำข้อสอบของนักเรียนคนนี้อย่างถาวร คุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ?
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                disabled={isPending}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-thai font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={confirmDeleteStudent}
                disabled={isPending}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-cyber font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(244,63,94,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isPending ? 'กำลังดำเนินการ...' : 'ยืนยันการลบ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
