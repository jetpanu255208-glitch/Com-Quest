'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Verify teacher admin authorization
 */
async function verifyTeacher() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('กรุณาเข้าสู่ระบบก่อนทำรายการ');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new Error('ไม่อนุญาต: เฉพาะครูผู้สอน (Admin) เท่านั้นที่สามารถจัดการข้อมูลนักเรียนได้');
  }

  return { supabase, user };
}

/**
 * Clean all dummy test accounts (emails starting with test_ or check_ or @test.com)
 * and credit วีระภาพ สุขเจริญ
 */
export async function cleanDummyTestAccounts() {
  try {
    const { supabase } = await verifyTeacher();

    // 1. Try RPC function if migration 008 was run in SQL editor
    try {
      const { data: rpcRes, error: rpcErr } = await (supabase as any).rpc('clean_test_accounts');
      if (!rpcErr && rpcRes) {
        console.log('clean_test_accounts RPC succeeded:', rpcRes);
      }
    } catch (e) {
      console.warn('RPC clean_test_accounts not yet defined, performing direct cleanup:', e);
    }

    // 2. Direct cleanup of dummy accounts from profiles, quiz_attempts, lesson_progress
    const { data: dummyProfiles } = await supabase
      .from('profiles')
      .select('id, email')
      .or('email.ilike.test_%,email.ilike.check_%,email.ilike.%@test.com');

    let deletedCount = 0;
    if (dummyProfiles && dummyProfiles.length > 0) {
      for (const dummy of dummyProfiles) {
        // Delete related records
        await supabase.from('quiz_attempts').delete().eq('user_id', dummy.id);
        await supabase.from('lesson_progress').delete().eq('user_id', dummy.id);
        await supabase.from('subject_progress').delete().eq('user_id', dummy.id);

        // Delete profile
        const { error: delErr } = await supabase.from('profiles').delete().eq('id', dummy.id);
        if (delErr) {
          // If DELETE policy not yet created, neutralize by updating email and clear metadata
          await supabase.from('profiles').update({
            email: `purged_${dummy.id.slice(0, 8)}@deleted.invalid`,
            student_id: null,
            first_name: 'บัญชีทดสอบที่ถูกลบ',
            last_name: null,
          }).eq('id', dummy.id);
        }
        deletedCount++;
      }
    }

    // 3. Guarantee that วีระภาพ สุขเจริญ is credited with passed quiz (10/10) and Lesson 1 Coin
    const { data: veerapapProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .or('email.ilike.%68219100037%,student_id.eq.682191000037,username.eq.Supercell')
      .maybeSingle();

    if (veerapapProfile) {
      await creditStudentLesson1(veerapapProfile.id, 10);
    }

    // 4. Guarantee that ศุภรัสมิ์ พร้อมสุวรรณ (Yong) is credited with passed quiz (9/10) and Lesson 1 Coin
    const { data: yongProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .or('email.ilike.%68219100039%,username.ilike.Yong,first_name.ilike.%ศุภรัสมิ์%')
      .maybeSingle();

    if (yongProfile) {
      await creditStudentLesson1(yongProfile.id, 9);
    }

    // 5. Clean up any quiz attempt or coin mistakenly recorded under teacher (admin) accounts
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (adminProfiles && adminProfiles.length > 0) {
      for (const admin of adminProfiles) {
        await supabase.from('quiz_attempts').delete().eq('user_id', admin.id);
        await supabase.from('lesson_progress').delete().eq('user_id', admin.id);
      }
    }

    revalidatePath('/teacher');
    revalidatePath('/profile');

    return {
      success: true,
      deletedCount,
      message: `ลบบัญชีทดสอบเรียบร้อย (${deletedCount} รายการ) และบันทึกผลสอบให้คุณศุภรัสมิ์ (Yong 9/10) และคุณวีระภาพ (10/10) สำเร็จ`,
    };
  } catch (err: any) {
    console.error('cleanDummyTestAccounts error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a specific student account and all associated progression, quiz attempts, and auth credentials.
 */
export async function deleteStudent(studentId: string) {
  try {
    const { supabase, user: teacherUser } = await verifyTeacher();

    // 1. Guard against deleting self
    if (teacherUser.id === studentId) {
      return { success: false, error: 'ไม่อนุญาตให้ลบบัญชีของคุณเอง' };
    }

    // 2. Target validation: Ensure target exists and is not an administrator
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, email, username, role')
      .eq('id', studentId)
      .maybeSingle();

    if (targetProfile && targetProfile.role === 'admin') {
      return { success: false, error: 'ไม่อนุญาตให้ลบบัญชีผู้ดูแลระบบ / อาจารย์ท่านอื่น' };
    }

    // 3. Try RPC delete_student_account (executes cascading purge + auth.users deletion in Postgres)
    let rpcSucceeded = false;
    try {
      const { data: rpcRes, error: rpcErr } = await (supabase as any).rpc('delete_student_account', {
        target_user_id: studentId,
      });
      if (!rpcErr && rpcRes?.success) {
        rpcSucceeded = true;
      }
    } catch (rpcEx) {
      console.warn('RPC delete_student_account not available or threw:', rpcEx);
    }

    // 4. If Supabase Service Role Key is available in server environment, delete from Supabase Auth explicitly
    const adminClient = createAdminClient();
    if (adminClient) {
      try {
        await adminClient.auth.admin.deleteUser(studentId);
      } catch (authErr) {
        console.warn('adminClient.auth.admin.deleteUser warning:', authErr);
      }
    }

    // 5. Ensure all database records are completely purged even if RPC was not yet run in SQL Editor
    await supabase.from('quiz_attempts').delete().eq('user_id', studentId);
    await supabase.from('lesson_progress').delete().eq('user_id', studentId);
    await supabase.from('subject_progress').delete().eq('user_id', studentId);
    const { error: delErr } = await supabase.from('profiles').delete().eq('id', studentId);

    if (delErr) {
      // Fallback: If delete policy was restricted, scrub profile so it cannot be found or accessed
      await supabase.from('profiles').update({
        email: `purged_${studentId.slice(0, 8)}@deleted.invalid`,
        student_id: null,
        first_name: 'บัญชีที่ถูกลบ',
        last_name: null,
      }).eq('id', studentId);
    }

    revalidatePath('/teacher');
    revalidatePath('/profile');
    revalidatePath('/subjects');
    return { success: true, message: 'ลบโปรไฟล์ คะแนน ความคืบหน้า และบัญชีผู้ใช้นักเรียนอย่างถาวรเรียบร้อยแล้ว' };
  } catch (err: any) {
    console.error('deleteStudent error:', err);
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการลบข้อมูลนักเรียน' };
  }
}

/**
 * Manually award Lesson 1 completion and quiz score to a student
 */
export async function creditStudentLesson1(studentUserId: string, score: number = 10) {
  try {
    const supabase = await createClient();

    // 1. Insert/update lesson_progress
    const { data: existingLP } = await supabase
      .from('lesson_progress')
      .select('id')
      .eq('user_id', studentUserId)
      .eq('lesson_id', 'html_01')
      .maybeSingle();

    if (existingLP) {
      await supabase
        .from('lesson_progress')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', existingLP.id);
    } else {
      await supabase.from('lesson_progress').insert({
        user_id: studentUserId,
        lesson_id: 'html_01',
        completed: true,
        completed_at: new Date().toISOString(),
      });
    }

    // 2. Remove any previous failing attempts for html_01 if any
    // and insert verified 10/10 passed attempt
    const { data: existingAttempts } = await supabase
      .from('quiz_attempts')
      .select('id, passed')
      .eq('user_id', studentUserId)
      .eq('lesson_id', 'html_01');

    const alreadyPassed = existingAttempts?.some((a) => a.passed);
    if (!alreadyPassed) {
      await supabase.from('quiz_attempts').insert({
        user_id: studentUserId,
        lesson_id: 'html_01',
        score: score,
        total_questions: 10,
        passed: score >= 5,
        created_at: new Date().toISOString(),
      });
    }

    revalidatePath('/teacher');
    revalidatePath('/profile');

    return { success: true, message: 'บันทึกคะแนนและมอบเหรียญบทเรียนที่ 1 สำเร็จ' };
  } catch (err: any) {
    console.error('creditStudentLesson1 error:', err);
    return { success: false, error: err.message };
  }
}
