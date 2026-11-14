import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SuperHtmlRunnerGame } from '@/components/quest/SuperHtmlRunnerGame';
import { getAllStudentLessonsState } from '@/lib/learning/student-lesson-state';
import { OFFICIAL_HTML_LESSONS, CharacterConfig } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function QuestPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

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

  const isTeacher = profile?.role === 'admin';
  const displayName =
    profile?.username ||
    profile?.first_name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'Adventurer';

  return (
    <main className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#060B16] select-none">
      <SuperHtmlRunnerGame
        completedLessonsCount={completedCount}
        totalLessonsCount={8}
        isTeacher={isTeacher}
        characterConfig={(profile?.character_config as CharacterConfig) || null}
        playerName={displayName}
      />
    </main>
  );
}
