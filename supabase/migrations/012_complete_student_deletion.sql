-- ==============================================================================
-- COM QUEST: Supabase Migration 012 - Complete Student Deletion System
-- Description: Cascading deletion RPC & Admin DELETE policies for profiles,
--              quiz_attempts, lesson_progress, subject_progress and auth.users
-- ==============================================================================

-- 1. Ensure Admins can DELETE records directly via RLS policies
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
    ON public.profiles
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete quiz_attempts" ON public.quiz_attempts;
CREATE POLICY "Admins can delete quiz_attempts"
    ON public.quiz_attempts
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete lesson_progress" ON public.lesson_progress;
CREATE POLICY "Admins can delete lesson_progress"
    ON public.lesson_progress
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete subject_progress" ON public.subject_progress;
CREATE POLICY "Admins can delete subject_progress"
    ON public.subject_progress
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 2. Comprehensive, Security-Definer RPC to purge all student data and auth user account
CREATE OR REPLACE FUNCTION public.delete_student_account(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    caller_role TEXT;
    target_role TEXT;
BEGIN
    -- 2.1 Authenticate caller role
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    IF caller_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can delete student accounts.';
    END IF;

    -- 2.2 Protect self from accidental deletion
    IF auth.uid() = target_user_id THEN
        RAISE EXCEPTION 'Cannot delete your own administrator account.';
    END IF;

    -- 2.3 Prevent deleting other administrator accounts
    SELECT role INTO target_role FROM public.profiles WHERE id = target_user_id;
    IF target_role = 'admin' THEN
        RAISE EXCEPTION 'Cannot delete another teacher/admin account.';
    END IF;

    -- 2.4 Delete student quiz attempts and submission answers
    DELETE FROM public.quiz_attempts WHERE user_id = target_user_id;

    -- 2.5 Delete student lesson progress, coins, and mission completion
    DELETE FROM public.lesson_progress WHERE user_id = target_user_id;

    -- 2.6 Delete student subject progress
    DELETE FROM public.subject_progress WHERE user_id = target_user_id;

    -- 2.7 Delete student profile record
    DELETE FROM public.profiles WHERE id = target_user_id;

    -- 2.8 Delete from Supabase Auth so deleted student can no longer login
    BEGIN
        DELETE FROM auth.users WHERE id = target_user_id;
    EXCEPTION WHEN OTHERS THEN
        -- Log warning if auth.users direct delete has schema restrictions
        RAISE WARNING 'auth.users delete notice for user %: %', target_user_id, SQLERRM;
    END;

    RETURN jsonb_build_object(
        'success', true, 
        'deleted_id', target_user_id, 
        'message', 'ลบข้อมูลนักเรียนและบัญชีผู้ใช้อย่างถาวรเรียบร้อยแล้ว'
    );
END;
$$;

-- Grant execution to authenticated users and service_role
GRANT EXECUTE ON FUNCTION public.delete_student_account(UUID) TO authenticated, service_role;
