import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StudentNav } from '@/components/layout/StudentNav';
import { Footer } from '@/components/layout/Footer';
import { StudentLobbyView } from '@/components/exam/StudentLobbyView';
import { getExamLobbyData, joinExamLobby } from '@/app/actions/exam-actions';

interface LobbyPageProps {
  params: Promise<{ code: string }>;
}

export const dynamic = 'force-dynamic';

export default async function LobbyPage({ params }: LobbyPageProps) {
  const { code } = await params;
  const uppercaseCode = code.toUpperCase();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectedFrom=/exam/lobby/${uppercaseCode}`);
  }

  // Attempt to join or retrieve lobby data
  let lobbyData = await getExamLobbyData(uppercaseCode);

  // If user is not yet a participant, join automatically
  if (!lobbyData.participant && lobbyData.session) {
    const joinRes = await joinExamLobby(uppercaseCode);
    if (joinRes.success) {
      lobbyData = await getExamLobbyData(uppercaseCode);
    } else {
      redirect(`/exam?error=${encodeURIComponent(joinRes.error || 'ไม่สามารถเข้าร่วมห้องสอบได้')}`);
    }
  }

  const session = lobbyData.session;
  let participant = lobbyData.participant;

  if (!session) {
    notFound();
  }

  if (!participant) {
    const retryJoin = await joinExamLobby(uppercaseCode);
    if (retryJoin.success && retryJoin.participant) {
      participant = retryJoin.participant;
    } else {
      redirect(`/exam?error=${encodeURIComponent(retryJoin.error || 'ไม่สามารถเข้าร่วมห้องสอบได้')}`);
    }
  }

  if (!participant) {
    notFound();
  }

  // If exam is already active and participant is ready, redirect directly to battle
  if (
    session.status === 'in_progress' &&
    (participant.status === 'in_progress' ||
      participant.status === 'waiting' ||
      participant.status === 'approved')
  ) {
    redirect(`/exam/battle/${session.id}`);
  }

  // If exam is already completed, redirect to results
  if (session.status === 'completed' || participant.status === 'submitted') {
    redirect(`/exam/result/${session.id}`);
  }

  // Get user profile for StudentNav
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  const username = profile?.username || user.email?.split('@')[0];
  const level = 1;

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col justify-between">
      <StudentNav username={username} level={level} />

      <main className="flex-1 px-4 py-6 sm:py-10">
        <StudentLobbyView
          initialSession={session}
          initialParticipant={participant as any}
          initialParticipantsList={(lobbyData.participants || []) as any}
          currentUserId={user.id}
        />
      </main>

      <Footer />
    </div>
  );
}

