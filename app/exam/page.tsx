import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StudentNav } from '@/components/layout/StudentNav';
import { Footer } from '@/components/layout/Footer';
import { ExamEntryView } from '@/components/exam/ExamEntryView';

export const dynamic = 'force-dynamic';

export default async function ExamEntryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectedFrom=/exam');
  }

  // Check user profile role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, username')
    .eq('id', user.id)
    .single();

  const userRole = profile?.role === 'admin' ? 'teacher' : 'student';
  const username = profile?.username || user.email?.split('@')[0];
  const level = 1;

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col justify-between">
      <StudentNav username={username} level={level} />

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 relative">
        {/* Cyber grid bg */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

        <div className="relative z-10 w-full">
          <ExamEntryView userEmail={user.email} userRole={userRole} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

