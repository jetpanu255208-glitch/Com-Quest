-- ==============================================================================
-- COM QUEST: Supabase Migration 013 - Sync Student ID Trigger & 11-Digit Constraints
-- Description: Updates handle_new_user() trigger function and profiles table check
--              constraint to strictly validate 11-digit student IDs for new users
--              while keeping full compatibility with any legacy 12-digit records.
-- ==============================================================================

-- 1. อัปเดตเงื่อนไขรหัสนักเรียนบน public.profiles ให้รองรับ 11 หลัก (และคง 12 หลักไว้รองรับข้อมูลเดิม)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_profiles_student_id;
ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_student_id 
    CHECK (student_id IS NULL OR student_id ~ '^[0-9]{11}$' OR student_id ~ '^[0-9]{12}$');

-- 2. ปรับปรุงฟังก์ชัน Trigger ตรวจสอบและบันทึกรหัสประจำตัวนักเรียน 11 หลักเมื่อสมัครสมาชิก
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
    -- สกัดข้อมูลจาก Registration Metadata หรือ OAuth Provider
    v_first_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), '');
    v_last_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), '');
    v_clean_student_id := NULLIF(TRIM(NEW.raw_user_meta_data->>'student_id'), '');
    v_username := NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), '');

    -- สำหรับ Google OAuth หรือผู้ให้บริการภายนอก
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

    -- ตรวจสอบรูปแบบรหัสประจำตัวนักเรียน: รองรับ 11 หลัก (และคง 12 หลักเดิม)
    IF v_clean_student_id IS NOT NULL AND (v_clean_student_id ~ '^[0-9]{11}$' OR v_clean_student_id ~ '^[0-9]{12}$') THEN
        v_student_id := v_clean_student_id;
    ELSE
        v_student_id := NULL;
    END IF;

    -- ตั้งชื่อผู้ใช้สำรองหากไม่มีการระบุ
    IF v_username IS NULL THEN
        v_username := 'quest_' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', '') FROM 1 FOR 8);
    END IF;

    -- บันทึกข้อมูลลงตาราง public.profiles (กำหนด Role เริ่มต้นเป็น 'user')
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

-- 3. ตรวจสอบให้แน่ใจว่า Trigger ยังคงผูกกับ auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 4. แจ้งเตือน PostgREST ให้รีโหลดแคช Schema
NOTIFY pgrst, 'reload schema';
