'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Clock,
  HelpCircle,
  Trophy,
  Loader2,
  Swords,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Flame,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  requestLateJoin,
  getLobbyParticipants,
  getExamSessionStatus,
} from '@/app/actions/exam-actions';
import { PixelCharacter } from '@/components/character/PixelCharacter';
import { ExamSession, ExamParticipant, Profile } from '@/lib/supabase/types';

interface ParticipantWithProfile extends ExamParticipant {
  profiles?: Partial<Profile>;
}

interface StudentLobbyViewProps {
  initialSession: ExamSession;
  initialParticipant: ParticipantWithProfile;
  initialParticipantsList: ParticipantWithProfile[];
  currentUserId: string;
}

export const StudentLobbyView: React.FC<StudentLobbyViewProps> = ({
  initialSession,
  initialParticipant,
  initialParticipantsList,
  currentUserId,
}) => {
  const router = useRouter();
  const supabase = createClient();

  const [session, setSession] = useState<ExamSession>(initialSession);
  const [participant, setParticipant] = useState<ParticipantWithProfile>(initialParticipant);
  const [participants, setParticipants] = useState<ParticipantWithProfile[]>(initialParticipantsList);
  const [isPending, startTransition] = useTransition();
  const [lateMessage, setLateMessage] = useState<string>('');

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

  // Handle auto-redirect when battle starts or participant approved
  useEffect(() => {
    if (session.status === 'in_progress') {
      if (participant.status === 'waiting' || participant.status === 'approved' || participant.status === 'in_progress') {
        router.push(`/exam/battle/${session.id}`);
      }
    }
  }, [session.status, participant.status, session.id, router]);

  // Realtime subscription + Guaranteed 2s Polling Fallback
  useEffect(() => {
    refreshParticipants();

    // 1. Listen to exam session status changes via Supabase Realtime
    const sessionChannel = supabase
      .channel(`student_exam_${session.id}`)
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
            if (payload.new.status === 'in_progress') {
              router.push(`/exam/battle/${session.id}`);
            }
          }
        }
      )
      .subscribe();

    // 2. Listen to participants list updates via Supabase Realtime
    const participantChannel = supabase
      .channel(`student_participants_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exam_participants',
          filter: `exam_id=eq.${session.id}`,
        },
        async (payload: any) => {
          if (payload.new && payload.new.student_id === currentUserId) {
            setParticipant((prev) => ({ ...prev, ...payload.new }));
          }
          refreshParticipants();
        }
      )
      .subscribe();

    // 3. Fallback interval to guarantee zero-drop sync across devices (every 1.5s)
    const pollInterval = setInterval(async () => {
      refreshParticipants();
      const statusRes = await getExamSessionStatus(session.id);
      if (statusRes.success && statusRes.status === 'in_progress') {
        router.push(`/exam/battle/${session.id}`);
      }
    }, 1500);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(participantChannel);
    };
  }, [session.id, currentUserId, supabase, refreshParticipants, router]);

  // Handle late join request
  const handleRequestLate = () => {
    startTransition(async () => {
      const res = await requestLateJoin(session.id);
      if (res.success) {
        setLateMessage('ส่งคำขอเข้าสอบไปยังอาจารย์แล้ว กรุณารอการอนุมัติ...');
        setParticipant((prev) => ({ ...prev, status: 'late_request' }));
      } else {
        setLateMessage(res.error || 'ไม่สามารถส่งคำขอได้');
      }
    });
  };

  const isExamAlreadyRunning = session.status === 'in_progress';
  const isLatePending = participant.status === 'late_request';
  const isRejected = participant.status === 'rejected';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Header & Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/exam"
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ออกจากห้อง</span>
        </Link>
        <div className="text-right">
          <div className="text-[11px] font-mono text-cyan-400 tracking-wider">ROOM CODE</div>
          <div className="text-xl sm:text-2xl font-mono font-black text-cyan-300 tracking-widest">
            {session.room_code}
          </div>
        </div>
      </div>

      {/* Main Banner / Status Card */}
      <div className="relative bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 sm:p-7 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              ห้องสอบ RPG BOSS BATTLE
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white">{session.title}</h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
              เตรียมพร้อมเข้าสู่การต่อสู้กับบอส ตอบคำถามเพื่อทำดาเมจ ตอบถูกผ่านเกณฑ์เพื่อพิชิตบอสและรับคะแนน
            </p>
          </div>

          {/* Exam Specs Badges */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-center shrink-0">
            <div className="px-2">
              <div className="flex items-center justify-center text-cyan-400 mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-400">เวลาสอบ</div>
              <div className="text-sm font-bold text-white font-mono">{session.duration_minutes} นาที</div>
            </div>
            <div className="px-2 border-x border-slate-800">
              <div className="flex items-center justify-center text-amber-400 mb-1">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-400">จำนวนข้อ</div>
              <div className="text-sm font-bold text-white font-mono">{session.total_questions} ข้อ</div>
            </div>
            <div className="px-2">
              <div className="flex items-center justify-center text-emerald-400 mb-1">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-400">เกณฑ์ผ่าน</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">{session.passing_score} คะแนน</div>
            </div>
          </div>
        </div>

        {/* Current User Status Banner */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          {isExamAlreadyRunning && participant.status !== 'waiting' && participant.status !== 'approved' && participant.status !== 'in_progress' ? (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-200 text-sm">การสอบเริ่มไปแล้ว!</div>
                  <div className="text-xs text-amber-300/80 mt-0.5">
                    {isLatePending
                      ? 'ระบบได้ส่งคำขอเข้าสอบช้าไปยังอาจารย์แล้ว กรุณารออาจารย์กดอนุมัติ...'
                      : isRejected
                      ? 'อาจารย์ไม่อนุมัติให้เข้าสอบช้าในครั้งนี้'
                      : 'คุณมาสาย หากต้องการเข้าทำข้อสอบ กรุณากดส่งคำขอให้อาจารย์อนุมัติ'}
                  </div>
                  {lateMessage && <div className="text-xs text-cyan-300 mt-2 font-medium">{lateMessage}</div>}
                </div>
              </div>

              {!isLatePending && !isRejected && (
                <button
                  onClick={handleRequestLate}
                  disabled={isPending}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                >
                  {isPending ? 'กำลังส่งคำขอ...' : 'ขออนุญาตเข้าสอบช้า'}
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping shrink-0" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-cyan-300">
                    {session.status === 'lobby' ? 'กำลังรออาจารย์เปิดเริ่มทำข้อสอบ...' : 'พร้อมเริ่มการต่อสู้!'}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-400">
                    หน้าจอจะเปลี่ยนเข้าสู่สนามรบทันทีเมื่ออาจารย์กดปุ่มเริ่มสอบ
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-cyan-300 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-cyan-500/20">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>STANDBY</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Participant Roster */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">ผู้เข้าสอบในห้อง</h2>
            <span className="text-xs font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
              {participants.length} คน
            </span>
          </div>
          <div className="text-xs text-slate-400">อัปเดตแบบเรียลไทม์</div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {participants.map((p) => {
            const isMe = p.student_id === currentUserId;
            const displayName = getStudentDisplayName(p);
            const pr = p.profiles || p.profile;
            return (
              <div
                key={p.id}
                className={`relative p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  isMe
                    ? 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_15px_rgba(0,207,239,0.15)]'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                {/* Avatar */}
                <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center">
                  <PixelCharacter
                    config={pr?.character_config}
                    size={36}
                    animate={false}
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-100 truncate flex items-center gap-1" title={displayName}>
                    <span className="truncate">{displayName}</span>
                    {isMe && <span className="text-[10px] text-cyan-400 font-semibold shrink-0">(ฉัน)</span>}
                  </div>
                  {pr?.student_id && (
                    <div className="text-[10px] text-cyan-400/90 font-mono truncate">
                      {pr.student_id}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                    {p.status === 'in_progress' ? (
                      <span className="text-cyan-400 inline-flex items-center gap-1">
                        <Swords className="w-3 h-3" /> กำลังสอบ
                      </span>
                    ) : p.status === 'waiting' || p.status === 'approved' ? (
                      <span className="text-emerald-400 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> พร้อมสอบ
                      </span>
                    ) : p.status === 'late_request' ? (
                      <span className="text-amber-400 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> ขอเข้าสอบ
                      </span>
                    ) : (
                      <span className="text-slate-400">ไม่อนุมัติ</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

