-- ==============================================================================
-- COM QUEST: Supabase Migration 014 - Comprehensive Profile Self-Healing & RLS Fix
-- Description: 
--   1. ปลดล็อกรหัสนักเรียนเป็น 11 หลัก (พร้อมรองรับ 12 หลักเดิม)
--   2. เพิ่ม RLS INSERT Policy ให้ผู้ใช้สร้างโปรไฟล์ตนเองได้
--   3. ปรับปรุง Trigger handle_new_user ให้ปลอดภัยสูงสุด ป้องกัน Username ชนกัน
--   4. เพิ่ม RPC check_identifier_exists สำหรับตรวจเช็ค username / รหัสนักเรียนก่อนสมัคร
--   5. เพิ่ม RPC save_student_profile สำหรับบันทึกข้อมูลนักเรียนอย่างปลอดภัย
--   6. กู้คืนและสร้างแถวโปรไฟล์ย้อนหลัง (Backfill) ดักจับ unique_violation (เช่น Vachi_08) 100%
--   7. กู้คืนรหัสนักเรียน 11 หลักเดิมที่เคยถูกเซฟเป็น NULL
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. อัปเดตโครงสร้างและเงื่อนไขของตาราง public.profiles
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles 
    ALTER COLUMN student_id TYPE VARCHAR(20);

ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS chk_profiles_student_id;

ALTER TABLE public.profiles 
    ADD CONSTRAINT chk_profiles_student_id 
    CHECK (student_id IS NULL OR student_id ~ '^[0-9]{11}$' OR student_id ~ '^[0-9]{12}$');

-- ------------------------------------------------------------------------------
-- 2. ตั้งค่านโยบายความปลอดภัย RLS (Row Level Security) สำหรับ INSERT
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 3. ปรับปรุง Trigger handle_new_user ให้ทำงานอย่างปลอดภัยสูงสุด (Fail-Safe)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_first_name TEXT;
    v_last_name TEXT;
    v_student_id VARCHAR(20);
    v_username TEXT;
    v_base_username TEXT;
    v_meta_name TEXT;
    v_clean_student_id TEXT;
    v_suffix INT := 0;
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

    IF v_username IS NULL THEN
        v_username := COALESCE(
            NULLIF(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g'), ''),
            'quest_' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', '') FROM 1 FOR 8)
        );
    END IF;

    v_base_username := v_username;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(v_username) AND id != NEW.id) LOOP
        v_suffix := v_suffix + 1;
        v_username := v_base_username || '_' || v_suffix;
    END LOOP;

    IF v_clean_student_id IS NOT NULL AND (v_clean_student_id ~ '^[0-9]{11}$' OR v_clean_student_id ~ '^[0-9]{12}$') THEN
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE student_id = v_clean_student_id AND id != NEW.id) THEN
            v_student_id := v_clean_student_id;
        ELSE
            v_student_id := NULL;
        END IF;
    ELSE
        v_student_id := NULL;
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
        COALESCE(NEW.email, 'student@comquest.local'),
        v_first_name,
        v_last_name,
        v_student_id,
        v_username,
        CASE 
            WHEN NEW.email = '68219100010@comquest.ac.th' THEN 'admin'
            ELSE 'user'
        END,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(public.profiles.email, EXCLUDED.email),
        first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
        last_name = COALESCE(public.profiles.last_name, EXCLUDED.last_name),
        student_id = COALESCE(public.profiles.student_id, EXCLUDED.student_id),
        username = COALESCE(public.profiles.username, EXCLUDED.username),
        updated_at = NOW();

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        BEGIN
            INSERT INTO public.profiles (id, email, username, role, created_at, updated_at)
            VALUES (
                NEW.id,
                COALESCE(NEW.email, 'student@comquest.local'),
                'quest_' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', '') FROM 1 FOR 8),
                'user',
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
        RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 4. ฟังก์ชัน RPC ตรวจสอบความพร้อมของ Username และ รหัสนักเรียน
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_identifier_exists(
    p_username TEXT DEFAULT NULL,
    p_student_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_exists BOOLEAN := false;
    v_student_exists BOOLEAN := false;
BEGIN
    IF p_username IS NOT NULL AND TRIM(p_username) != '' THEN
        SELECT EXISTS(
            SELECT 1 FROM public.profiles 
            WHERE LOWER(username) = LOWER(TRIM(p_username))
        ) INTO v_user_exists;
    END IF;

    IF p_student_id IS NOT NULL AND TRIM(p_student_id) != '' THEN
        SELECT EXISTS(
            SELECT 1 FROM public.profiles 
            WHERE student_id = TRIM(p_student_id)
        ) INTO v_student_exists;
    END IF;

    RETURN jsonb_build_object(
        'username_taken', v_user_exists,
        'student_id_taken', v_student_exists
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_identifier_exists(TEXT, TEXT) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 5. ฟังก์ชัน RPC บันทึกข้อมูลส่วนตัวของนักเรียนอย่างปลอดภัย (SECURITY DEFINER)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_student_profile(
    p_first_name TEXT,
    p_last_name TEXT,
    p_student_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_clean_student_id TEXT;
    v_clean_first_name TEXT;
    v_clean_last_name TEXT;
    v_existing_id UUID;
    v_current_username TEXT;
    v_current_role TEXT;
    v_result RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล';
    END IF;

    v_clean_first_name := NULLIF(TRIM(p_first_name), '');
    v_clean_last_name := NULLIF(TRIM(p_last_name), '');
    v_clean_student_id := NULLIF(TRIM(p_student_id), '');

    IF v_clean_student_id IS NOT NULL AND NOT (v_clean_student_id ~ '^[0-9]{11}$') THEN
        RAISE EXCEPTION 'รหัสนักเรียนต้องเป็นตัวเลขครบ 11 หลักเท่านั้น';
    END IF;

    IF v_clean_student_id IS NOT NULL THEN
        SELECT id INTO v_existing_id 
        FROM public.profiles 
        WHERE student_id = v_clean_student_id AND id != v_user_id 
        LIMIT 1;

        IF v_existing_id IS NOT NULL THEN
            RAISE EXCEPTION 'รหัสนักเรียน 11 หลักนี้มีอยู่ในระบบแล้ว';
        END IF;
    END IF;

    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    SELECT username, role INTO v_current_username, v_current_role 
    FROM public.profiles WHERE id = v_user_id;

    IF v_current_username IS NULL THEN
        v_current_username := COALESCE(
            SPLIT_PART(v_user_email, '@', 1),
            'quest_' || SUBSTRING(REPLACE(v_user_id::TEXT, '-', '') FROM 1 FOR 8)
        );
    END IF;

    IF v_current_role IS NULL THEN
        v_current_role := 'user';
    END IF;

    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        student_id,
        username,
        role,
        updated_at
    )
    VALUES (
        v_user_id,
        COALESCE(v_user_email, 'student@comquest.local'),
        v_clean_first_name,
        v_clean_last_name,
        v_clean_student_id,
        v_current_username,
        v_current_role,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        student_id = EXCLUDED.student_id,
        email = COALESCE(public.profiles.email, EXCLUDED.email),
        updated_at = NOW()
    RETURNING * INTO v_result;

    RETURN to_jsonb(v_result);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_student_profile(TEXT, TEXT, TEXT) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 6. กู้คืนและสร้างแถวข้อมูลโปรไฟล์ย้อนหลัง (Backfill) ป้องกันปัญหา Username ซ้ำ (เช่น Vachi_08) 100%
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    u RECORD;
    v_clean_username TEXT;
    v_final_username TEXT;
    v_clean_student_id TEXT;
    v_final_student_id TEXT;
    v_email TEXT;
BEGIN
    FOR u IN (
        SELECT * FROM auth.users 
        WHERE id NOT IN (SELECT id FROM public.profiles)
    ) LOOP
        -- ป้องกัน Email ซ้ำ
        v_email := COALESCE(u.email, 'student_' || SUBSTRING(REPLACE(u.id::TEXT, '-', '') FROM 1 FOR 8) || '@comquest.local');
        IF EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(email) = LOWER(v_email) AND id != u.id) THEN
            v_email := 'student_' || SUBSTRING(REPLACE(u.id::TEXT, '-', '') FROM 1 FOR 8) || '@comquest.local';
        END IF;

        -- สกัด Username จาก Metadata
        v_clean_username := NULLIF(TRIM(u.raw_user_meta_data->>'username'), '');
        IF v_clean_username IS NULL THEN
            v_clean_username := COALESCE(
                NULLIF(REGEXP_REPLACE(SPLIT_PART(u.email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g'), ''),
                'quest_' || SUBSTRING(REPLACE(u.id::TEXT, '-', '') FROM 1 FOR 8)
            );
        END IF;

        -- ป้องกัน Username ซ้ำกับแถวเดิมใน profiles (แก้ปัญหา Vachi_08 ชนกัน)
        IF EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(v_clean_username) AND id != u.id) THEN
            -- หากมีคนใช้แล้ว (เช่น Vachi_08) ให้เติมรหัส 4 ตัวท้ายของ UUID บัญชีนั้น เพื่อให้กลายเป็นชื่อที่ไม่ซ้ำแน่นอน
            v_final_username := v_clean_username || '_' || SUBSTRING(REPLACE(u.id::TEXT, '-', '') FROM 1 FOR 4);
        ELSE
            v_final_username := v_clean_username;
        END IF;

        -- หากยังซ้ำอีก ให้ใช้ quest_<uuid 8 ตัว>
        IF EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(v_final_username) AND id != u.id) THEN
            v_final_username := 'quest_' || SUBSTRING(REPLACE(u.id::TEXT, '-', '') FROM 1 FOR 8);
        END IF;

        -- ตรวจสอบและป้องกัน Student ID ซ้ำ
        v_clean_student_id := NULLIF(TRIM(u.raw_user_meta_data->>'student_id'), '');
        IF v_clean_student_id IS NOT NULL AND (v_clean_student_id ~ '^[0-9]{11}$' OR v_clean_student_id ~ '^[0-9]{12}$') THEN
            IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE student_id = v_clean_student_id AND id != u.id) THEN
                v_final_student_id := v_clean_student_id;
            ELSE
                v_final_student_id := NULL;
            END IF;
        ELSE
            v_final_student_id := NULL;
        END IF;

        -- ทำการ INSERT พร้อมดักจับข้อผิดพลาดระดับบุคคล
        BEGIN
            INSERT INTO public.profiles (
                id,
                email,
                username,
                first_name,
                last_name,
                student_id,
                role,
                created_at,
                updated_at
            ) VALUES (
                u.id,
                v_email,
                v_final_username,
                NULLIF(TRIM(u.raw_user_meta_data->>'first_name'), ''),
                NULLIF(TRIM(u.raw_user_meta_data->>'last_name'), ''),
                v_final_student_id,
                CASE WHEN u.email = '68219100010@comquest.ac.th' THEN 'admin' ELSE 'user' END,
                COALESCE(u.created_at, NOW()),
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
                last_name = COALESCE(public.profiles.last_name, EXCLUDED.last_name),
                student_id = COALESCE(public.profiles.student_id, EXCLUDED.student_id),
                updated_at = NOW();
        EXCEPTION 
            WHEN unique_violation THEN
                -- Failsafe: หากติด unique violation ไม่ว่ากรณีใดๆ ให้บันทึกด้วย username เป็น UUID
                BEGIN
                    INSERT INTO public.profiles (
                        id, email, username, role, created_at, updated_at
                    ) VALUES (
                        u.id,
                        'student_' || SUBSTRING(REPLACE(u.id::TEXT, '-', '') FROM 1 FOR 8) || '@comquest.local',
                        'quest_' || SUBSTRING(REPLACE(u.id::TEXT, '-', '') FROM 1 FOR 8),
                        'user',
                        COALESCE(u.created_at, NOW()),
                        NOW()
                    )
                    ON CONFLICT (id) DO NOTHING;
                EXCEPTION WHEN OTHERS THEN NULL; END;
            WHEN OTHERS THEN
                NULL;
        END;
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 7. อัปเดตคืนค่า student_id ให้กับโปรไฟล์เดิมที่เคยถูกบันทึกเป็น NULL อย่างปลอดภัย
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    r RECORD;
    v_candidate_id TEXT;
BEGIN
    FOR r IN (
        SELECT p.id, u.raw_user_meta_data->>'student_id' AS candidate_student_id
        FROM public.profiles p
        JOIN auth.users u ON p.id = u.id
        WHERE p.student_id IS NULL
          AND (
              TRIM(u.raw_user_meta_data->>'student_id') ~ '^[0-9]{11}$' OR 
              TRIM(u.raw_user_meta_data->>'student_id') ~ '^[0-9]{12}$'
          )
    ) LOOP
        v_candidate_id := TRIM(r.candidate_student_id);
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE student_id = v_candidate_id AND id != r.id) THEN
            UPDATE public.profiles
            SET student_id = v_candidate_id, updated_at = NOW()
            WHERE id = r.id;
        END IF;
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 8. สั่งให้ PostgREST รีโหลด Schema แคชทันที
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
