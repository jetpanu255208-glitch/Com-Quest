import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { TeacherExamResultsView } from '@/components/teacher/TeacherExamResultsView';
import { getTeacherExamAnalytics } from '@/app/actions/exam-actions';

interface ResultsPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function TeacherResultsPage({ params }: ResultsPageProps) {
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

  const { session, analytics, participants, questions } = await getTeacherExamAnalytics(id);

  if (!session || !analytics) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 px-4 py-8">
        <TeacherExamResultsView
          session={session}
          analytics={analytics}
          participants={(participants || []) as any}
          questions={questions || []}
        />
      </main>

      <Footer />
    </div>
  );
}

