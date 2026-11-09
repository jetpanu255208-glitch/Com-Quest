'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Play,
  StopCircle,
  Copy,
  Check,
  Clock,
  HelpCircle,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
  Flame,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  startExam,
  closeExam,
  approveLateParticipant,
  rejectLateParticipant,
  getLobbyParticipants,
} from '@/app/actions/exam-actions';
import { ExamSession, ExamParticipant, Profile } from '@/lib/supabase/types';
import { PixelCharacter } from '@/components/character/PixelCharacter';

interface ParticipantWithProfile extends ExamParticipant {
  profiles?: Partial<Profile>;
}

interface TeacherLobbyViewProps {
  initialSession: ExamSession;
  initialParticipants: ParticipantWithProfile[];
}

export const TeacherLobbyView: React.FC<TeacherLobbyViewProps> = ({
  initialSession,
  initialParticipants,
}) => {
  const router = useRouter();
  const supabase = createClient();

  const [session, setSession] = useState<ExamSession>(initialSession);
  const [participants, setParticipants] = useState<ParticipantWithProfile[]>(initialParticipants);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Helper to extract student real name
  const getStudentDisplayName = (p: ParticipantWithProfile) => {
    const pr = p.profiles || p.profile;
    const firstName = pr?.first_name?.trim();
    const lastName = pr?.last_name?.trim();
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) {
      return firstName;
    }
    if (pr?.username) {
      return pr.username;
    }
    return 'นักเรียน';
  };

  // Safe participant refresh using Server Action
  const refreshParticipants = React.useCallback(async () => {
    const res = await getLobbyParticipants(session.id);
    if (res.success && res.participants) {
      setParticipants(res.participants as ParticipantWithProfile[]);
    }
  }, [session.id]);

  // Realtime subscription + Guaranteed 2.5s Polling Fallback
  useEffect(() => {
    refreshParticipants();

    const sessionChannel = supabase
      .channel(`teacher_exam_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exam_sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            setSession(payload.new as ExamSession);
          }
        }
      )
      .subscribe();

    const participantChannel = supabase
      .channel(`teacher_participants_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exam_participants',
          filter: `exam_id=eq.${session.id}`,
        },
        () => {
          refreshParticipants();
        }
      )
      .subscribe();

    // 2.5s Polling interval to guarantee 100% zero-drop synchronization
    const pollInterval = setInterval(() => {
      refreshParticipants();
    }, 2500);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(participantChannel);
    };
  }, [session.id, supabase, refreshParticipants]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(session.room_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartExam = () => {
    if (!confirm('ยืนยันเริ่มการสอบตอนนี้? นักเรียนทุกคนในห้องจะเข้าสู่สนามต่อสู้ทันที')) return;
    startTransition(async () => {
      const res = await startExam(session.id);
      if (!res.success) {
        alert(res.error || 'ไม่สามารถเริ่มการสอบได้');
      }
    });
  };

  const handleCloseExam = () => {
    if (!confirm('ยืนยันปิดการสอบนี้? การส่งคำตอบจะสิ้นสุดลง')) return;
    startTransition(async () => {
      const res = await closeExam(session.id);
      if (res.success) {
        router.push(`/teacher/exams/${session.id}/results`);
      } else {
        alert(res.error || 'ไม่สามารถปิดการสอบได้');
      }
    });
  };

  const handleApproveLate = (participantId: string) => {
    startTransition(async () => {
      await approveLateParticipant(participantId, session.id);
    });
  };

  const handleRejectLate = (participantId: string) => {
    startTransition(async () => {
      await rejectLateParticipant(participantId, session.id);
    });
  };

  const lateRequests = participants.filter((p) => p.status === 'late_request');
  const activeStudents = participants.filter((p) => p.status !== 'rejected');
  const submittedCount = participants.filter((p) => p.status === 'submitted').length;

  const isLobby = session.status === 'lobby' || session.status === 'draft';
  const isInProgress = session.status === 'in_progress';
  const isCompleted = session.status === 'completed';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb & Nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/teacher/exams"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับสู่หน้ารวมข้อสอบ</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/teacher/exams/${session.id}/results`}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>หน้ารายงานผลคะแนน</span>
          </Link>
        </div>
      </div>

      {/* Hero: Room Code & Action Controls */}
      <div className="relative bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Room Code Card (Designed for Projector) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-block" />
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                {isLobby ? 'LOBBY WAITING ROOM' : isInProgress ? 'BATTLE IN PROGRESS' : 'EXAM COMPLETED'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">{session.title}</h1>

            {/* Giant Room Code Display */}
            <div className="pt-2">
              <div className="text-xs font-mono text-slate-400 mb-1">รหัสสำหรับให้นักเรียนเข้าร่วม (ROOM CODE):</div>
              <div className="inline-flex items-center gap-3 bg-slate-950 p-2 sm:p-3 rounded-2xl border-2 border-cyan-500/50 shadow-[0_0_25px_rgba(0,207,239,0.25)]">
                <span className="text-3xl sm:text-5xl font-mono font-black text-cyan-300 tracking-widest px-2">
                  {session.room_code}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all cursor-pointer active:scale-95"
                  title="คัดลอกรหัส"
                >
                  {copied ? <Check className="w-5 h-5 stroke-[3]" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-3 min-w-[240px]">
            {isLobby && (
              <button
                onClick={handleStartExam}
                disabled={isPending}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 active:scale-95 text-slate-950 font-black text-base sm:text-lg shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2.5 cursor-pointer transition-all animate-pulse"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>เริ่มการสอบทันที (START)</span>
              </button>
            )}

            {isInProgress && (
              <>
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-center">
                  <div className="flex items-center justify-center gap-2 text-rose-300 text-xs font-bold animate-pulse">
                    <Flame className="w-4 h-4 text-rose-400" />
                    กำลังดำเนินการสอบ
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    ส่งข้อสอบแล้ว {submittedCount}/{activeStudents.length} คน
                  </div>
                </div>

                <button
                  onClick={handleCloseExam}
                  disabled={isPending}
                  className="w-full py-3 px-5 rounded-xl bg-slate-950 border border-rose-500/50 hover:bg-rose-950/50 text-rose-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>สิ้นสุดและปิดการสอบ</span>
                </button>
              </>
            )}

            {isCompleted && (
              <Link
                href={`/teacher/exams/${session.id}/results`}
                className="w-full py-3.5 px-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <BarChart3 className="w-4 h-4" />
                <span>ดูรายงานสรุปผลคะแนน</span>
              </Link>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">เวลา</span>
                <span className="font-bold text-slate-200 font-mono">{session.duration_minutes}น.</span>
              </div>
              <div className="border-x border-slate-800">
                <span className="text-[10px] text-slate-400 block">จำนวนข้อ</span>
                <span className="font-bold text-slate-200 font-mono">{session.total_questions}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">เกณฑ์ผ่าน</span>
                <span className="font-bold text-emerald-400 font-mono">{session.passing_score}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Late Join Requests Alert Banner */}
      {lateRequests.length > 0 && (
        <div className="bg-amber-950/40 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 animate-pulse">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            คำขอเข้าสอบช้า (Late Requests) รอการอนุมัติ ({lateRequests.length} คน)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {lateRequests.map((lr) => (
              <div
                key={lr.id}
                className="bg-slate-950/90 border border-amber-500/40 p-3 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {lr.profiles?.username || 'นักเรียน'}
                  </div>
                  <div className="text-[10px] text-amber-400">ขอเข้าสอบช้า</div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleApproveLate(lr.id)}
                    className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    title="อนุมัติให้เข้าสอบ"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>อนุญาต</span>
                  </button>
                  <button
                    onClick={() => handleRejectLate(lr.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-white text-xs cursor-pointer"
                    title="ปฏิเสธ"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participants Roster Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-7 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">รายชื่อนักเรียนในห้อง</h2>
            <span className="text-xs font-mono bg-cyan-950 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/30 font-bold">
              {activeStudents.length} คน
            </span>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {isLobby ? 'กำลังรอนักเรียนเข้าห้อง...' : `ส่งข้อสอบแล้ว ${submittedCount} คน`}
          </div>
        </div>

        {activeStudents.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs sm:text-sm">
            ยังไม่มีนักเรียนเข้าร่วมห้องสอบ... ให้นักเรียนกรอกรหัส{' '}
            <strong className="text-cyan-400 font-mono">{session.room_code}</strong> ที่หน้า{' '}
            <span className="text-slate-300 font-mono">/exam</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {activeStudents.map((p) => {
              const isSubmitted = p.status === 'submitted';
              const isInBattle = p.status === 'in_progress';
              const displayName = getStudentDisplayName(p);
              const pr = p.profiles || p.profile;
              return (
                <div
                  key={p.id}
                  className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center gap-3 hover:border-cyan-500/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                    <PixelCharacter
                      config={pr?.character_config}
                      size={36}
                      animate={false}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-100 truncate" title={displayName}>
                      {displayName}
                    </div>
                    {pr?.student_id && (
                      <div className="text-[10px] text-cyan-400 font-mono truncate">
                        {pr.student_id}
                      </div>
                    )}

                    <div className="text-[10px] truncate mt-0.5">
                      {isSubmitted ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> ได้ {p.score}/{session.total_questions}
                        </span>
                      ) : isInBattle ? (
                        <span className="text-cyan-400 flex items-center gap-1 font-semibold">
                          <Flame className="w-3 h-3 text-cyan-400" /> กำลังต่อสู้
                        </span>
                      ) : (
                        <span className="text-emerald-400/80 font-mono">พร้อมสอบ</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile Fixed Bottom Action Bar for Teacher */}
      {isLobby && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/95 backdrop-blur-xl border-t border-cyan-500/30 z-50 lg:hidden shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
          <button
            onClick={handleStartExam}
            disabled={isPending}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 active:scale-95 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>เริ่มการสอบทันที (START) • {activeStudents.length} คนพร้อม</span>
          </button>
        </div>
      )}
    </div>
  );
};

