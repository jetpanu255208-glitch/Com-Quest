'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database, Profile } from '@/lib/supabase/types';

export interface SaveProfileInput {
  firstName: string;
  lastName: string;
  studentId: string;
}

export interface SaveProfileResult {
  success: boolean;
  profile?: Profile;
  error?: string;
}

/**
 * Server Action to safely save or self-heal student profile in Supabase.
 * Enforces authentication, 11-digit validation, duplicate check,
 * and handles missing profile rows gracefully without throwing JSON coercion errors.
 */
export async function saveStudentProfile(
  input: SaveProfileInput
): Promise<SaveProfileResult> {
  try {
    const cookieStore = await cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      '';

    const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored in Server Actions
          }
        },
      },
    });

    // 1. Verify Authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูลส่วนตัว',
      };
    }

    // 2. Validate Student ID (must be exactly 11 numeric digits if provided)
    const cleanStudentId = (input.studentId || '').trim();
    if (cleanStudentId) {
      if (!/^\d+$/.test(cleanStudentId)) {
        return {
          success: false,
          error: 'รหัสนักเรียนต้องเป็นตัวเลขเท่านั้น (ห้ามมีตัวอักษรหรือสัญลักษณ์)',
        };
      }
      if (cleanStudentId.length < 11) {
        return {
          success: false,
          error: `รหัสนักเรียนต้องเป็นตัวเลขครบ 11 หลัก (คุณกรอกไม่ครบ: มีเพียง ${cleanStudentId.length} หลัก)`,
        };
      }
      if (cleanStudentId.length > 11) {
        return {
          success: false,
          error: `รหัสนักเรียนต้องเป็นตัวเลขครบ 11 หลัก (คุณกรอกเกิน: มี ${cleanStudentId.length} หลัก)`,
        };
      }
    }

    // 3. Check for Duplicate Student ID
    if (cleanStudentId) {
      const { data: duplicateUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('student_id', cleanStudentId)
        .neq('id', user.id)
        .maybeSingle();

      if (duplicateUser) {
        return {
          success: false,
          error: 'รหัสนักเรียน 11 หลักนี้มีอยู่ในระบบแล้ว กรุณาตรวจสอบรหัสของท่านอีกครั้ง',
        };
      }
    }

    const cleanFirstName = input.firstName.trim() || null;
    const cleanLastName = input.lastName.trim() || null;
    const finalStudentId = cleanStudentId || null;

    // 4. Try RPC function if available in database
    try {
      const { data: rpcProfile, error: rpcErr } = await (supabase as any).rpc(
        'save_student_profile',
        {
          p_first_name: cleanFirstName,
          p_last_name: cleanLastName,
          p_student_id: finalStudentId,
        }
      );

      if (!rpcErr && rpcProfile) {
        return {
          success: true,
          profile: rpcProfile as Profile,
        };
      }
    } catch {
      // Fallback to direct table operations if RPC does not exist
    }

    // 5. Check if profile row exists for this user
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      // 5.1 Row exists: perform standard UPDATE
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: cleanFirstName,
          last_name: cleanLastName,
          student_id: finalStudentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .maybeSingle();

      if (updateError) {
        if (
          updateError.message?.includes('chk_profiles_student_id') ||
          (updateError as any).code === '23514'
        ) {
          // Attempt fallback update without student_id so names are safely saved
          const { data: fallbackUpdated } = await supabase
            .from('profiles')
            .update({
              first_name: cleanFirstName,
              last_name: cleanLastName,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .select()
            .maybeSingle();

          return {
            success: false,
            profile: (fallbackUpdated as Profile) || undefined,
            error:
              'บันทึกชื่อ-นามสกุลแล้ว แต่ตาราง profiles ใน Supabase ยังติดเงื่อนไขรหัส 12 หลักเดิม (กรุณารันคำสั่ง SQL Migration 014 ใน Supabase SQL Editor เพื่อปลดล็อกเป็น 11 หลัก)',
          };
        }

        return {
          success: false,
          error: updateError.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
        };
      }

      if (updated) {
        return {
          success: true,
          profile: updated as Profile,
        };
      }
    }

    // 5.2 Row does NOT exist: Self-healing INSERT
    const meta = user.user_metadata || {};
    const emailPrefix = user.email ? user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') : 'student';
    const fallbackUsername =
      meta.username || emailPrefix || ('quest_' + user.id.replace(/-/g, '').slice(0, 8));

    const newProfileData = {
      id: user.id,
      email: user.email || '',
      username: fallbackUsername,
      first_name: cleanFirstName,
      last_name: cleanLastName,
      student_id: finalStudentId,
      role: 'user' as const,
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .insert(newProfileData)
      .select()
      .maybeSingle();

    if (insertError) {
      if (
        insertError.message?.includes('chk_profiles_student_id') ||
        (insertError as any).code === '23514'
      ) {
        const { data: fallbackInserted } = await supabase
          .from('profiles')
          .insert({
            ...newProfileData,
            student_id: null,
          })
          .select()
          .maybeSingle();

        if (fallbackInserted) {
          return {
            success: false,
            profile: fallbackInserted as Profile,
            error:
              'สร้างโปรไฟล์สำเร็จแล้ว แต่ตาราง profiles ใน Supabase ยังติดเงื่อนไขรหัส 12 หลักเดิม (กรุณารันคำสั่ง SQL Migration 014 ใน Supabase SQL Editor เพื่อปลดล็อกเป็น 11 หลัก)',
          };
        }
      }

      // If insert failed due to conflict on id, retry update
      const { data: retryUpdate, error: retryErr } = await supabase
        .from('profiles')
        .update({
          first_name: cleanFirstName,
          last_name: cleanLastName,
          student_id: finalStudentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .maybeSingle();

      if (retryErr || !retryUpdate) {
        return {
          success: false,
          error: insertError.message || 'ไม่สามารถสร้างข้อมูลโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง',
        };
      }

      return {
        success: true,
        profile: retryUpdate as Profile,
      };
    }

    return {
      success: true,
      profile: (inserted as Profile) || (newProfileData as unknown as Profile),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ';
    return {
      success: false,
      error: message,
    };
  }
}
