-- ==============================================================================
-- COM QUEST: Supabase Migration 010 - Update Student ID to 11 Digits & Delete Student RPC
-- Description: Updates student_id check constraint to 11 digits and creates instant purge RPC
-- ==============================================================================

-- 1. อัปเดตเงื่อนไขรหัสนักเรียนบน public.profiles ให้รองรับ 11 หลัก (และคง 12 หลักไว้รองรับข้อมูลเดิม)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_profiles_student_id;
ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_student_id 
    CHECK (student_id IS NULL OR student_id ~ '^[0-9]{11}$' OR student_id ~ '^[0-9]{12}$');

-- 1.1 อัปเดต Trigger handle_new_user ให้บันทึกรหัสนักเรียน 11 หลัก
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_first_name TEXT;
    v_last_name TEXT;
    v_student_id VARCHAR(20);
    v_username TEXT;
    v_meta_name TEXT;
    v_clean_student_id TEXT;
BEGIN
    v_first_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), '');
    v_last_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), '');
    v_clean_student_id := NULLIF(TRIM(NEW.raw_user_meta_data->>'student_id'), '');
    v_username := NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), '');

    IF v_first_name IS NULL THEN
        v_meta_name := COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name'
        );
        IF v_meta_name IS NOT NULL THEN
            v_first_name := SPLIT_PART(v_meta_name, ' ', 1);
            v_last_name := NULLIF(SUBSTRING(v_meta_name FROM LENGTH(v_first_name) + 2), '');
        END IF;
    END IF;

    -- รองรับรหัสนักเรียน 11 หลัก (และคง 12 หลักเดิมไว้เพื่อความเข้ากันได้)
    IF v_clean_student_id IS NOT NULL AND (v_clean_student_id ~ '^[0-9]{11}$' OR v_clean_student_id ~ '^[0-9]{12}$') THEN
        v_student_id := v_clean_student_id;
    ELSE
        v_student_id := NULL;
    END IF;

    IF v_username IS NULL THEN
        v_username := 'quest_' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', '') FROM 1 FOR 8);
    END IF;

    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        student_id,
        username,
        role,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_first_name,
        v_last_name,
        v_student_id,
        v_username,
        'user'
    )
    ON CONFLICT (id) DO UPDATE SET
        first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
        student_id = COALESCE(EXCLUDED.student_id, public.profiles.student_id),
        username = COALESCE(EXCLUDED.username, public.profiles.username),
        updated_at = NOW();

    RETURN NEW;
END;
$$;

-- 2. สร้างฟังก์ชัน SECURITY DEFINER ลบบัญชีนักเรียนและประวัติการส่งงาน/สอบทั้งหมดทันที
CREATE OR REPLACE FUNCTION public.delete_student_account(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- ลบประวัติการส่งแบบทดสอบทั้งหมดของนักเรียน
    DELETE FROM public.quiz_attempts WHERE user_id = target_user_id;

    -- ลบเหรียญและความก้าวหน้าบทเรียนทั้งหมด
    DELETE FROM public.lesson_progress WHERE user_id = target_user_id;

    -- ลบความก้าวหน้ารายวิชา
    DELETE FROM public.subject_progress WHERE user_id = target_user_id;

    -- ลบโปรไฟล์นักเรียน
    DELETE FROM public.profiles WHERE id = target_user_id;

    -- ลบบัญชีผู้ใช้งานออกจาก auth.users
    DELETE FROM auth.users WHERE id = target_user_id;

    RETURN jsonb_build_object('success', true, 'message', 'ลบบัญชีและประวัติทั้งหมดเรียบร้อยแล้ว');
END;
$$;

-- 3. ให้สิทธิ์ Admin และ Service Role เรียกใช้งานฟังก์ชัน
GRANT EXECUTE ON FUNCTION public.delete_student_account(UUID) TO authenticated, service_role;
