'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

/**
 * Server action to record that a student has completed and passed a coding mission.
 * Persists immediately into Supabase public.lesson_progress and sets a secure cookie.
 * Once passed, the student cannot redo this mission and will skip it on future attempts.
 */
export async function recordMissionPassed(payload: { lessonId: string }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนบันทึกผลภารกิจ' };
    }

    const lessonId = payload.lessonId;

    // 1. Check existing lesson_progress
    const { data: existingLP } = await supabase
      .from('lesson_progress')
      .select('id, completed, mission_completed, status')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    // If already passed or completed, acknowledge idempotently
    if (existingLP?.mission_completed || existingLP?.completed) {
      // Ensure cookie is set
      try {
        const cookieStore = await cookies();
        cookieStore.set(`mission_passed_${lessonId}`, 'true', {
          path: '/',
          maxAge: 31536000,
          sameSite: 'lax',
        });
      } catch {
        // ignore cookie errors
      }
      return { success: true, alreadyPassed: true };
    }

    const now = new Date().toISOString();

    if (existingLP) {
      // Update existing record
      const { error: updateErr } = await supabase
        .from('lesson_progress')
        .update({
          mission_completed: true,
          mission_completed_at: now,
          status: existingLP.status === 'completed' ? 'completed' : 'mission_passed',
          updated_at: now,
        } as any)
        .eq('id', existingLP.id);

      if (updateErr) {
        console.warn('lesson_progress update warning (falling back to minimal update):', updateErr);
        // Fallback for case where migration 011 columns are not yet in PostgREST cache
        await supabase
          .from('lesson_progress')
          .update({
            updated_at: now,
          } as any)
          .eq('id', existingLP.id);
      }
    } else {
      // Insert new progression row
      const { error: insertErr } = await supabase.from('lesson_progress').insert({
        user_id: user.id,
        lesson_id: lessonId,
        completed: false,
        mission_completed: true,
        mission_completed_at: now,
        status: 'mission_passed',
        updated_at: now,
      } as any);

      if (insertErr) {
        console.warn('lesson_progress insert warning (retrying basic insert):', insertErr);
        await supabase.from('lesson_progress').insert({
          user_id: user.id,
          lesson_id: lessonId,
          completed: false,
        } as any);
      }
    }

    // Set persistent cookie
    try {
      const cookieStore = await cookies();
      cookieStore.set(`mission_passed_${lessonId}`, 'true', {
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
      });
    } catch (e) {
      console.warn('Cookie set notice in recordMissionPassed:', e);
    }

    revalidatePath(`/learn/${lessonId}`);
    revalidatePath(`/mission/${lessonId}`);
    revalidatePath(`/quiz/${lessonId}`);
    revalidatePath('/subjects');
    revalidatePath('/profile');
    revalidatePath('/teacher');

    return { success: true };
  } catch (err: any) {
    console.error('recordMissionPassed error:', err);
    return { success: false, error: err.message };
  }
}
