import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StudentNav } from '@/components/layout/StudentNav';
import { Footer } from '@/components/layout/Footer';
import { ExamResultView } from '@/components/exam/ExamResultView';
import { getExamResultData } from '@/app/actions/exam-actions';

interface ResultPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectedFrom=/exam/result/${id}`);
  }

  const resultData = await getExamResultData(id);

  if (!resultData.session || !resultData.participant) {
    notFound();
  }

  // Profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, character_config')
    .eq('id', user.id)
    .single();

  const username = profile?.username || user.email?.split('@')[0] || 'นักเรียน';
  const level = 1;

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col justify-between">
      <StudentNav username={username} level={level} />

      <main className="flex-1 px-4 py-8 sm:py-12">
        <ExamResultView
          session={resultData.session}
          participant={resultData.participant}
          questions={resultData.questions || []}
          answers={resultData.answers || []}
          playerConfig={profile?.character_config}
          playerName={username}
        />
      </main>

      <Footer />
    </div>
  );
}

