import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StudentNav } from '@/components/layout/StudentNav';
import { BossBattleView } from '@/components/exam/BossBattleView';
import { getStudentExamBattleData } from '@/app/actions/exam-actions';

interface BattlePageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function BattlePage({ params }: BattlePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectedFrom=/exam/battle/${id}`);
  }

  // Get sanitized exam battle data
  const battleData = await getStudentExamBattleData(id);

  if (!battleData.session || !battleData.participant) {
    notFound();
  }

  // If already submitted or session closed, go to results
  if (
    battleData.participant.status === 'submitted' ||
    battleData.session.status === 'completed'
  ) {
    redirect(`/exam/result/${id}`);
  }

  // If session is still in lobby, go to lobby
  if (battleData.session.status === 'lobby') {
    redirect(`/exam/lobby/${battleData.session.room_code}`);
  }

  // Fetch player profile info for customization & avatar
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, character_config')
    .eq('id', user.id)
    .single();

  const username = profile?.username || user.email?.split('@')[0] || 'นักเรียน';
  const level = 1;

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col justify-between">
      <StudentNav username={username} level={level} />

      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-8 relative">
        {/* Subtle Cyber Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        <div className="relative z-10 w-full">
          <BossBattleView
            session={battleData.session}
            participant={battleData.participant}
            questions={battleData.questions || []}
            draftAnswers={battleData.draftAnswers || {}}
            playerConfig={profile?.character_config}
            playerName={username}
          />
        </div>
      </main>
    </div>
  );
}

