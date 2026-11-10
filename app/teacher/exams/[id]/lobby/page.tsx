import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { TeacherLobbyView } from '@/components/teacher/TeacherLobbyView';
import { getLobbyParticipants } from '@/app/actions/exam-actions';

interface TeacherLobbyPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function TeacherLobbyPage({ params }: TeacherLobbyPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/teacher/login');
  }

  // Teacher check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/profile?error=unauthorized');
  }

  // Fetch session
  const { data: session } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (!session) {
    notFound();
  }

  // Fetch initial participants safely using lobby action
  const pRes = await getLobbyParticipants(id);
  const initialParticipants = pRes.success && pRes.participants ? pRes.participants : [];

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 px-4 py-8">
        <TeacherLobbyView
          initialSession={session}
          initialParticipants={initialParticipants as any}
        />
      </main>

      <Footer />
    </div>
  );
}

