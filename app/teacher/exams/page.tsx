import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { TeacherExamsListView } from '@/components/teacher/TeacherExamsListView';
import { ArrowLeft, BookOpen, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TeacherExamsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/teacher/login');
  }

  // Check role: must be admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/profile?error=unauthorized');
  }

  // Fetch teacher's exams
  const { data: exams } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3 mb-6 text-xs text-slate-400">
          <Link
            href="/teacher"
            className="hover:text-white flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับสู่ Dashboard อาจารย์</span>
          </Link>
          <span>/</span>
          <span className="text-cyan-400 font-semibold">ห้องสอบ Boss Battle</span>
        </div>

        <TeacherExamsListView exams={exams || []} />
      </main>

      <Footer />
    </div>
  );
}

