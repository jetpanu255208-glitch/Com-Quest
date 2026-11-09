import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { TeacherLobbyView } from '@/components/teacher/TeacherLobbyView';

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

  // Fetch initial participants
  const { data: participants } = await supabase
    .from('exam_participants')
    .select(`
      *,
      profiles:student_id (
        username,
        avatar_url,
        character_config,
        level
      )
    `)
    .eq('exam_id', id)
    .order('created_at', { ascending: true });

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 px-4 py-8">
        <TeacherLobbyView
          initialSession={session}
          initialParticipants={(participants || []) as any}
        />
      </main>

      <Footer />
    </div>
  );
}

