import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SpecialGamesHub } from '@/components/quest/SpecialGamesHub';
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
    <main className="fixed inset-0 w-screen h-[100dvh] overflow-hidden bg-[#050914] select-none">
      <Suspense
        fallback={
          <div className="fixed inset-0 bg-[#050914] flex items-center justify-center text-cyan-300 font-cyber font-bold">
            LOADING ARCADE HUB...
          </div>
        }
      >
        <SpecialGamesHub
          completedLessonsCount={completedCount}
          totalLessonsCount={8}
          isTeacher={isTeacher}
          characterConfig={(profile?.character_config as CharacterConfig) || null}
          playerName={displayName}
        />
      </Suspense>
    </main>
  );
}
