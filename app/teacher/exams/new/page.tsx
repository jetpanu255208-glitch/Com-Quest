import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { TeacherNewExamWizard } from '@/components/teacher/TeacherNewExamWizard';

export const dynamic = 'force-dynamic';

export default async function NewExamPage() {
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

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 px-4 py-8">
        <TeacherNewExamWizard />
      </main>

      <Footer />
    </div>
  );
}

