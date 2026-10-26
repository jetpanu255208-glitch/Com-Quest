-- ==============================================================================
-- COM QUEST: Supabase Migration 008 - Cleanup Dummy Test Accounts & Credit วีระภาพ
-- ==============================================================================

-- 1. เพิ่มนโยบาย DELETE สำหรับ Admin บน public.profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
    ON public.profiles
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 2. ฟังก์ชัน SECURITY DEFINER ลบบัญชีทดสอบทั้งหมด (test_* และ check_*)
CREATE OR REPLACE FUNCTION public.clean_test_accounts()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_count INT := 0;
BEGIN
    -- ลบประวัติการสอบของบัญชีทดสอบ
    DELETE FROM public.quiz_attempts 
    WHERE user_id IN (
        SELECT id FROM public.profiles 
        WHERE email LIKE 'test_%' OR email LIKE 'check_%'
    );

    -- ลบเหรียญและความคืบหน้าของบัญชีทดสอบ
    DELETE FROM public.lesson_progress 
    WHERE user_id IN (
        SELECT id FROM public.profiles 
        WHERE email LIKE 'test_%' OR email LIKE 'check_%'
    );

    DELETE FROM public.subject_progress 
    WHERE user_id IN (
        SELECT id FROM public.profiles 
        WHERE email LIKE 'test_%' OR email LIKE 'check_%'
    );

    -- ลบโปรไฟล์บัญชีทดสอบ
    DELETE FROM public.profiles
    WHERE email LIKE 'test_%' OR email LIKE 'check_%';

    -- ลบจาก auth.users
    DELETE FROM auth.users
    WHERE email LIKE 'test_%' OR email LIKE 'check_%';

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN jsonb_build_object('success', true, 'deleted_count', v_deleted_count);
END;
$$;

-- 3. ให้สิทธิ์เรียกใช้งานฟังก์ชัน
GRANT EXECUTE ON FUNCTION public.clean_test_accounts() TO authenticated, service_role, anon;

-- 4. รันการลบทันที
SELECT public.clean_test_accounts();

-- 5. มอบคะแนนและเหรียญบทเรียนที่ 1 ให้นักเรียน วีระภาพ สุขเจริญ (68219100037@svc.ac.th)
DO $$
DECLARE
    v_student_id UUID;
BEGIN
    SELECT id INTO v_student_id 
    FROM public.profiles 
    WHERE email = '68219100037@svc.ac.th' OR student_id = '682191000037'
    LIMIT 1;

    IF v_student_id IS NOT NULL THEN
        -- รับประกันเหรียญบทที่ 1 ผ่านแล้ว (+100 LVL)
        INSERT INTO public.lesson_progress (user_id, lesson_id, completed, completed_at)
        VALUES (v_student_id, 'html_01', true, NOW())
        ON CONFLICT (user_id, lesson_id) 
        DO UPDATE SET completed = true, completed_at = NOW();

        -- ลบผลสอบเดิมที่เป็น fallback หรือว่าง แล้วบันทึกผลสอบ 10/10 คะแนนเต็ม (ผ่าน)
        DELETE FROM public.quiz_attempts 
        WHERE user_id = v_student_id AND lesson_id = 'html_01';

        INSERT INTO public.quiz_attempts (user_id, lesson_id, score, total_questions, passed, created_at)
        VALUES (v_student_id, 'html_01', 10, 10, true, NOW());
    END IF;
END $$;
