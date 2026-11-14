import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StudentNav } from '@/components/layout/StudentNav';
import { Footer } from '@/components/layout/Footer';
import { ProfileView } from '@/components/profile/ProfileView';
import {
  Profile,
  Lesson,
  LessonProgress,
  QuizAttempt,
  DEFAULT_CHARACTER_CONFIG,
  OFFICIAL_HTML_LESSONS,
} from '@/lib/supabase/types';
import { ShieldCheck, UserCheck, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProfilePageProps {
  searchParams?: Promise<{ studentId?: string }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const params = searchParams ? await searchParams : {};
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  // Guard: Must be authenticated
  if (!user) {
    redirect('/login');
  }

  // Fetch profile, 8 HTML lessons, user lesson progress, and quiz attempts ALL IN ONE PARALLEL BATCH!
  const initialTargetId = params.studentId || user.id;
  const [profileQueryResult, dbLessonsResult, dbProgressResult, dbAttemptsResult] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('lessons').select('*').order('lesson_number', { ascending: true }),
      supabase.from('lesson_progress').select('*').eq('user_id', initialTargetId),
      supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', initialTargetId)
        .order('created_at', { ascending: false }),
    ]);

  let loggedInProfileData = profileQueryResult.data;

  const meta = user.user_metadata || {};
  const googleAvatarUrl: string | null = meta.avatar_url || meta.picture || null;
  const metaFullName = String(meta.full_name || meta.name || '').trim();
  const extractedFirstName =
    meta.given_name ||
    meta.first_name ||
    (metaFullName ? metaFullName.split(/\s+/)[0] : null);
  const extractedLastName =
    meta.family_name ||
    meta.last_name ||
    (metaFullName && metaFullName.split(/\s+/).length > 1
      ? metaFullName.split(/\s+/).slice(1).join(' ')
      : null);

  const emailLocal = (user.email || '').split('@')[0] || '';
  const emailPrefix = emailLocal.replace(/[^a-zA-Z0-9_]/g, '_') || 'student';
  const emailStudentIdMatch = emailLocal.match(/\d{11}/);
  const rawStudentId = meta.student_id ? String(meta.student_id).trim() : null;
  const cleanStudentId =
    rawStudentId && /^\d{11}$/.test(rawStudentId)
      ? rawStudentId
      : emailStudentIdMatch
      ? emailStudentIdMatch[0]
      : null;

  // Self-healing: If user is authenticated but has no row in public.profiles yet:
  if (!loggedInProfileData && user.id) {
    const fallbackUsername =
      meta.username || extractedFirstName || emailPrefix || ('quest_' + user.id.replace(/-/g, '').slice(0, 8));

    const { data: createdProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        first_name: extractedFirstName,
        last_name: extractedLastName,
        student_id: cleanStudentId,
        username: fallbackUsername,
        role: 'user',
        character_config: DEFAULT_CHARACTER_CONFIG,
      })
      .select()
      .maybeSingle();

    if (createdProfile) {
      loggedInProfileData = createdProfile;
    }
  } else if (loggedInProfileData && user.id) {
    // Auto-populate 11-digit student_id from email and first/last name from Google metadata if missing
    // Also replace auto-generated email-prefix username (e.g. s6602041620106 or 68219100030) with Google first_name
    const isAutoEmailUsername =
      !loggedInProfileData.username ||
      loggedInProfileData.username === emailLocal ||
      loggedInProfileData.username === emailPrefix ||
      loggedInProfileData.username.startsWith('quest_');
    const needsUsernameUpgrade = isAutoEmailUsername && Boolean(extractedFirstName);
    const needsStudentId = !loggedInProfileData.student_id && Boolean(cleanStudentId);
    const needsFirstName = !loggedInProfileData.first_name && Boolean(extractedFirstName);
    const needsLastName = !loggedInProfileData.last_name && Boolean(extractedLastName);

    if (needsStudentId || needsFirstName || needsLastName || needsUsernameUpgrade) {
      const targetUsername = needsUsernameUpgrade
        ? extractedFirstName!
        : loggedInProfileData.username;

      let { data: syncedProfile, error: syncErr } = await supabase
        .from('profiles')
        .update({
          username: targetUsername,
          student_id: loggedInProfileData.student_id || cleanStudentId,
          first_name: loggedInProfileData.first_name || extractedFirstName,
          last_name: loggedInProfileData.last_name || extractedLastName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('*')
        .maybeSingle();

      // If username already taken by someone else, update without changing username
      if (syncErr && needsUsernameUpgrade) {
        const retry = await supabase
          .from('profiles')
          .update({
            student_id: loggedInProfileData.student_id || cleanStudentId,
            first_name: loggedInProfileData.first_name || extractedFirstName,
            last_name: loggedInProfileData.last_name || extractedLastName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select('*')
          .maybeSingle();
        syncedProfile = retry.data;
      }

      if (syncedProfile) {
        loggedInProfileData = syncedProfile;
      } else {
        loggedInProfileData = {
          ...loggedInProfileData,
          student_id: loggedInProfileData.student_id || cleanStudentId,
          first_name: loggedInProfileData.first_name || extractedFirstName,
          last_name: loggedInProfileData.last_name || extractedLastName,
        };
      }
    }
  }

  const isTeacher = loggedInProfileData?.role === 'admin';
  const targetStudentId = isTeacher && params.studentId ? params.studentId : user.id;

  // Fetch the target profile (either student being inspected or current user)
  let profileData = loggedInProfileData;
  let isViewingStudent = false;

  if (isTeacher && params.studentId && params.studentId !== user.id) {
    const { data: inspectedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', params.studentId)
      .maybeSingle();

    if (inspectedProfile) {
      profileData = inspectedProfile;
      isViewingStudent = true;
    }
  }

  // Construct safe profile object with fallback
  const profile: Profile = profileData || {
    id: targetStudentId,
    email: user.email || '',
    first_name: null,
    last_name: null,
    student_id: null,
    username: user.email?.split('@')[0] || 'student',
    role: isTeacher ? 'admin' : 'user',
    character_config: DEFAULT_CHARACTER_CONFIG,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const dbLessons = dbLessonsResult.data;
  const lessons: Lesson[] =
    dbLessons && dbLessons.length > 0 ? dbLessons : OFFICIAL_HTML_LESSONS;
  const lessonProgress: LessonProgress[] = dbProgressResult.data || [];
  const quizAttempts: QuizAttempt[] = (dbAttemptsResult.data as QuizAttempt[]) || [];

  // Filter out any unverified completions so new accounts start completely fresh with 0 completed lessons
  const finalLessonProgress: LessonProgress[] = lessonProgress.filter((p) => {
    return quizAttempts.some((qa) => qa.lesson_id === p.lesson_id && qa.passed);
  });

  // Ensure any lesson where user passed quiz is counted in lesson progress
  for (const qa of quizAttempts) {
    if (qa.passed && !finalLessonProgress.some((p) => p.lesson_id === qa.lesson_id && p.completed)) {
      finalLessonProgress.push({
        id: `quiz-backed-${qa.lesson_id}`,
        user_id: profile.id,
        lesson_id: qa.lesson_id,
        completed: true,
        completed_at: qa.created_at || new Date().toISOString(),
      });
    }
  }

  const finalQuizAttempts = [...quizAttempts];

  const completedCount = finalLessonProgress.filter((p) => p.completed).length;
  const currentLevel = Math.min(completedCount * 100, 800);

  return (
    <div className="min-h-screen flex flex-col justify-between relative bg-[var(--bg-dark)] text-[var(--text-primary)] cyber-grid transition-colors duration-200 pb-20 md:pb-0">

      <StudentNav
        username={profile.username || undefined}
        level={currentLevel}
        avatarUrl={googleAvatarUrl}
      />

      <main className="flex-1 flex flex-col justify-start w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-5 relative z-10">
        {/* Admin viewing banners */}
        {isTeacher && isViewingStudent && (
          <div className="mb-3 p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/60 shadow-[0_0_20px_rgba(0,240,255,0.2)] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-thai text-cyan-200">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                กำลังดูโปรไฟล์ของนักเรียน: <strong className="text-white text-sm">{profile.first_name || profile.username} {profile.last_name || ''}</strong> (รหัสนักเรียน: <span className="font-mono text-cyan-300 font-bold">{profile.student_id || 'ยังไม่ระบุ'}</span>)
              </span>
            </div>
            <Link
              href="/teacher"
              className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-cyber font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.4)] transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่แดชบอร์ดครู</span>
            </Link>
          </div>
        )}

        {isTeacher && !isViewingStudent && (
          <div className="mb-3 p-3 rounded-xl bg-amber-950/80 border border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-thai text-amber-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                คุณกำลังดูโปรไฟล์นี้ในฐานะอาจารย์ผู้ดูแลระบบ (Admin Mode)
              </span>
            </div>
            <Link
              href="/teacher"
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-cyber font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.4)] transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่แดชบอร์ดครูผู้สอน</span>
            </Link>
          </div>
        )}

        <ProfileView
          initialProfile={profile}
          initialLessons={lessons}
          initialLessonProgress={finalLessonProgress}
          initialQuizAttempts={finalQuizAttempts}
          avatarUrl={googleAvatarUrl}
        />
      </main>

      <Footer />
    </div>
  );
}
