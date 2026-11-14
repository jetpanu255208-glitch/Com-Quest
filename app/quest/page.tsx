import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StudentNav } from '@/components/layout/StudentNav';
import { Footer } from '@/components/layout/Footer';
import { SuperHtmlRunnerGame } from '@/components/quest/SuperHtmlRunnerGame';
import { getAllStudentLessonsState } from '@/lib/learning/student-lesson-state';
import { OFFICIAL_HTML_LESSONS, CharacterConfig } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function QuestPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectedFrom=/quest');
  }

  const [profileResult, lessonSummaries] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, first_name, last_name, role, character_config')
      .eq('id', user.id)
      .maybeSingle(),
    getAllStudentLessonsState(user.id),
  ]);

  const profile = profileResult.data;
  const completedLessonIds = new Set(
    lessonSummaries.filter((s) => s.isCompleted).map((s) => s.lessonId)
  );

  let completedCount = 0;
  OFFICIAL_HTML_LESSONS.forEach((l) => {
    if (completedLessonIds.has(l.id)) {
      completedCount += 1;
    }
  });

  const currentLevel = Math.min(completedCount * 100, 800);
  const isTeacher = profile?.role === 'admin';
  const displayName =
    profile?.username ||
    profile?.first_name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'Adventurer';

  const avatarUrl =
    user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-dark)] text-[var(--text-primary)] transition-colors duration-200 relative overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--border-glow),transparent_70%)] pointer-events-none -z-10 opacity-30" />

      <StudentNav
        username={displayName}
        level={currentLevel}
        avatarUrl={avatarUrl}
      />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-5 pb-20 md:pb-6 relative z-10 flex flex-col">
        <SuperHtmlRunnerGame
          completedLessonsCount={completedCount}
          totalLessonsCount={8}
          isTeacher={isTeacher}
          characterConfig={(profile?.character_config as CharacterConfig) || null}
          playerName={displayName}
        />
      </main>

      <Footer />
    </div>
  );
}
