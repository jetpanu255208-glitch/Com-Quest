import { createClient } from '@/lib/supabase/server';
import { getLessonMission } from '@/lib/constants/missions';
import { OFFICIAL_HTML_LESSONS, Lesson, QuizAttempt } from '@/lib/supabase/types';
import { cookies } from 'next/headers';

export type StudentLessonStatus =
  | 'not_started'
  | 'in_progress'
  | 'mission_passed'
  | 'mission_passed_quiz_failed'
  | 'quiz_passed'
  | 'completed';

export interface StudentLessonProgressSummary {
  userId: string;
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string;
  status: StudentLessonStatus;
  statusLabel: string;
  isCompleted: boolean;
  hasMission: boolean;
  missionPassed: boolean;
  quizPassed: boolean;
  attemptsCount: number;
  latestScore: number | null;
  bestScore: number | null;
  latestAttemptDate: string | null;
  latestPassed: boolean;
  canAttemptQuiz: boolean;
  canDoMission: boolean;
  reviewOnly: boolean;
  actionButtonLabel: string;
  actionButtonUrl: string;
}

/**
 * Get comprehensive, unified progression state for a student on a specific lesson.
 * Enforces one-time mission and one-time quiz rules across the entire platform.
 */
export async function getStudentLessonState(
  userId: string,
  lessonId: string
): Promise<StudentLessonProgressSummary> {
  const supabase = await createClient();

  // Find catalog lesson
  const catalogLesson = OFFICIAL_HTML_LESSONS.find((l) => l.id === lessonId);
  const lessonNumber = catalogLesson?.lesson_number ?? 1;
  const lessonTitle = catalogLesson?.title ?? lessonId;

  // Check if mission exists for this lesson
  const mission = getLessonMission(lessonId);
  const hasMission = !!mission;

  // 1 & 2. Fetch lesson progress row, quiz attempts history, and cookies in parallel
  const [lpResult, attemptsResult, cookieStore] = await Promise.all([
    supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle(),
    supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false }),
    cookies().catch(() => null),
  ]);

  const lp = lpResult.data;
  const pastAttempts: QuizAttempt[] = (attemptsResult.data as QuizAttempt[]) || [];
  const attemptsCount = pastAttempts.length;
  const passedAttempts = pastAttempts.filter((a) => a.passed);
  // Strict rule: A lesson quiz is only passed if the user has an actual passed record in quiz_attempts
  const hasPassedQuiz = passedAttempts.length > 0;

  // Scores
  const latestAttempt = pastAttempts.length > 0 ? pastAttempts[0] : null;
  const latestScore = latestAttempt ? latestAttempt.score : null;
  const latestAttemptDate = latestAttempt ? latestAttempt.created_at : null;
  const latestPassed = latestAttempt ? latestAttempt.passed : false;
  const bestScore = pastAttempts.length > 0 ? Math.max(...pastAttempts.map((a) => a.score)) : null;

  // Check cookie for mission pass
  let cookieMissionPassed = false;
  if (cookieStore) {
    try {
      cookieMissionPassed = cookieStore.get(`mission_passed_${lessonId}`)?.value === 'true';
    } catch {
      // cookies() unavailable in non-request contexts
    }
  }

  // Determine if mission has been passed
  // Note: if user already has quiz attempts, they must have already passed the mission (or lesson has no mission)
  const isMissionPassed =
    !hasMission ||
    !!lp?.mission_completed ||
    cookieMissionPassed ||
    attemptsCount > 0 ||
    hasPassedQuiz;

  // Determine overall completion: ONLY completed when quiz has actually been passed!
  const isCompleted = hasPassedQuiz;

  // Determine strict status according to Com Quest rules:
  // - 'not_started' (ยังไม่เริ่มเรียน)
  // - 'in_progress' (กำลังเรียน)
  // - 'mission_passed' (ทำภารกิจผ่านแล้ว)
  // - 'mission_passed_quiz_failed' (ทำภารกิจผ่านแล้ว แต่สอบหลังเรียนไม่ผ่าน)
  // - 'quiz_passed' / 'completed' (สอบหลังเรียนผ่านแล้ว / เรียนจบบทแล้ว)
  let status: StudentLessonStatus = 'not_started';
  let statusLabel = 'ยังไม่เริ่มเรียน';

  if (isCompleted) {
    status = 'completed';
    statusLabel = 'เรียนจบบทแล้ว';
  } else if (hasPassedQuiz) {
    status = 'quiz_passed';
    statusLabel = 'สอบหลังเรียนผ่านแล้ว';
  } else if (isMissionPassed && attemptsCount > 0 && !latestPassed) {
    status = 'mission_passed_quiz_failed';
    statusLabel = 'ทำภารกิจผ่านแล้ว แต่สอบหลังเรียนไม่ผ่าน';
  } else if (isMissionPassed && hasMission) {
    status = 'mission_passed';
    statusLabel = 'ทำภารกิจผ่านแล้ว';
  } else if (lp) {
    status = 'in_progress';
    statusLabel = 'กำลังเรียน';
  } else {
    status = 'not_started';
    statusLabel = 'ยังไม่เริ่มเรียน';
  }

  // Permission flags
  const reviewOnly = isCompleted || hasPassedQuiz;
  const canAttemptQuiz = !reviewOnly && isMissionPassed;
  const canDoMission = hasMission && !isMissionPassed && !isCompleted;

  // Action button configuration
  let actionButtonLabel = 'เริ่มเรียนรู้';
  let actionButtonUrl = `/learn/${lessonId}`;

  if (reviewOnly) {
    actionButtonLabel = 'ทบทวนเนื้อหา';
    actionButtonUrl = `/learn/${lessonId}?mode=review`;
  } else if (status === 'mission_passed_quiz_failed' || (isMissionPassed && hasMission)) {
    actionButtonLabel = 'ทำแบบทดสอบต่อ';
    actionButtonUrl = `/quiz/${lessonId}`;
  } else {
    actionButtonLabel = 'เริ่มเรียนรู้';
    actionButtonUrl = `/learn/${lessonId}`;
  }

  return {
    userId,
    lessonId,
    lessonNumber,
    lessonTitle,
    status,
    statusLabel,
    isCompleted,
    hasMission,
    missionPassed: isMissionPassed,
    quizPassed: hasPassedQuiz,
    attemptsCount,
    latestScore,
    bestScore,
    latestAttemptDate,
    latestPassed,
    canAttemptQuiz,
    canDoMission,
    reviewOnly,
    actionButtonLabel,
    actionButtonUrl,
  };
}

/**
 * Get progression summaries for all official lessons for a student.
 * High-performance batch implementation: fetches all progress and attempts in parallel,
 * eliminating 16 sequential database queries down to 2 parallel queries.
 */
export async function getAllStudentLessonsState(
  userId: string
): Promise<StudentLessonProgressSummary[]> {
  const supabase = await createClient();

  const [lpResult, attemptsResult, cookieStore] = await Promise.all([
    supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    cookies().catch(() => null),
  ]);

  const allProgress = lpResult.data || [];
  const allAttempts = (attemptsResult.data as QuizAttempt[]) || [];

  const lpMap = new Map(allProgress.map((p) => [p.lesson_id, p]));
  const attemptsMap = new Map<string, QuizAttempt[]>();
  for (const a of allAttempts) {
    const list = attemptsMap.get(a.lesson_id) || [];
    list.push(a);
    attemptsMap.set(a.lesson_id, list);
  }

  return OFFICIAL_HTML_LESSONS.map((catalogLesson) => {
    const lessonId = catalogLesson.id;
    const lessonNumber = catalogLesson.lesson_number;
    const lessonTitle = catalogLesson.title;
    const mission = getLessonMission(lessonId);
    const hasMission = !!mission;

    const lp = lpMap.get(lessonId);
    const pastAttempts = attemptsMap.get(lessonId) || [];
    const attemptsCount = pastAttempts.length;
    const passedAttempts = pastAttempts.filter((a) => a.passed);
    // Strict rule: A lesson quiz is only passed if the user has an actual passed record in quiz_attempts
    const hasPassedQuiz = passedAttempts.length > 0;

    const latestAttempt = pastAttempts.length > 0 ? pastAttempts[0] : null;
    const latestScore = latestAttempt ? latestAttempt.score : null;
    const latestAttemptDate = latestAttempt ? latestAttempt.created_at : null;
    const latestPassed = latestAttempt ? latestAttempt.passed : false;
    const bestScore = pastAttempts.length > 0 ? Math.max(...pastAttempts.map((a) => a.score)) : null;

    let cookieMissionPassed = false;
    if (cookieStore) {
      try {
        cookieMissionPassed = cookieStore.get(`mission_passed_${lessonId}`)?.value === 'true';
      } catch {
        // cookies() unavailable in non-request contexts
      }
    }

    const isMissionPassed =
      !hasMission ||
      !!lp?.mission_completed ||
      cookieMissionPassed ||
      attemptsCount > 0 ||
      hasPassedQuiz;

    const isCompleted = hasPassedQuiz;

    let status: StudentLessonStatus = 'not_started';
    let statusLabel = 'ยังไม่เริ่มเรียน';

    if (isCompleted) {
      status = 'completed';
      statusLabel = 'เรียนจบบทแล้ว';
    } else if (hasPassedQuiz) {
      status = 'quiz_passed';
      statusLabel = 'สอบหลังเรียนผ่านแล้ว';
    } else if (isMissionPassed && attemptsCount > 0 && !latestPassed) {
      status = 'mission_passed_quiz_failed';
      statusLabel = 'ทำภารกิจผ่านแล้ว แต่สอบหลังเรียนไม่ผ่าน';
    } else if (isMissionPassed && hasMission) {
      status = 'mission_passed';
      statusLabel = 'ทำภารกิจผ่านแล้ว';
    } else if (lp) {
      status = 'in_progress';
      statusLabel = 'กำลังเรียน';
    } else {
      status = 'not_started';
      statusLabel = 'ยังไม่เริ่มเรียน';
    }

    const reviewOnly = isCompleted || hasPassedQuiz;
    const canAttemptQuiz = !reviewOnly && isMissionPassed;
    const canDoMission = hasMission && !isMissionPassed && !isCompleted;

    let actionButtonLabel = 'เริ่มเรียนรู้';
    let actionButtonUrl = `/learn/${lessonId}`;

    if (reviewOnly) {
      actionButtonLabel = 'ทบทวนเนื้อหา';
      actionButtonUrl = `/learn/${lessonId}?mode=review`;
    } else if (status === 'mission_passed_quiz_failed' || (isMissionPassed && hasMission)) {
      actionButtonLabel = 'ทำแบบทดสอบต่อ';
      actionButtonUrl = `/quiz/${lessonId}`;
    } else {
      actionButtonLabel = 'เริ่มเรียนรู้';
      actionButtonUrl = `/learn/${lessonId}`;
    }

    return {
      userId,
      lessonId,
      lessonNumber,
      lessonTitle,
      status,
      statusLabel,
      isCompleted,
      hasMission,
      missionPassed: isMissionPassed,
      quizPassed: hasPassedQuiz,
      attemptsCount,
      latestScore,
      bestScore,
      latestAttemptDate,
      latestPassed,
      canAttemptQuiz,
      canDoMission,
      reviewOnly,
      actionButtonLabel,
      actionButtonUrl,
    };
  });
}
