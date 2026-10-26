-- ==============================================================================
-- COM QUEST: Supabase Migration 001 - Initial Profiles & RLS
-- Description: Creates the public.profiles table, triggers, and RLS policies
-- ==============================================================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    student_id VARCHAR(12),
    username TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_profiles_role CHECK (role IN ('user', 'admin')),
    CONSTRAINT chk_profiles_student_id CHECK (student_id IS NULL OR student_id ~ '^[0-9]{12}$')
);

-- Partial unique index on student_id (ignoring NULL for teachers/admins)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_student_id_unique 
    ON public.profiles(student_id) 
    WHERE student_id IS NOT NULL;

-- 2. Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Prevent privilege escalation (non-admins cannot alter their role or id)
CREATE OR REPLACE FUNCTION public.protect_profile_roles()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Check caller's role if changing role or id
    IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.id IS DISTINCT FROM NEW.id) THEN
        SELECT role INTO current_user_role 
        FROM public.profiles 
        WHERE id = auth.uid();

        IF current_user_role IS DISTINCT FROM 'admin' THEN
            RAISE EXCEPTION 'Unauthorized: Only administrators can modify roles or system identifiers.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_roles ON public.profiles;
CREATE TRIGGER trg_protect_profile_roles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_roles();

-- 4. Trigger to automatically create profile on auth.users INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_first_name TEXT;
    v_last_name TEXT;
    v_student_id VARCHAR(12);
    v_username TEXT;
    v_meta_name TEXT;
    v_clean_student_id TEXT;
BEGIN
    -- Extract metadata from registration form or OAuth provider
    v_first_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), '');
    v_last_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), '');
    v_clean_student_id := NULLIF(TRIM(NEW.raw_user_meta_data->>'student_id'), '');
    v_username := NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), '');

    -- For Google OAuth or third-party sign-ins where full_name or name is provided
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

    -- Validate student_id format (must be exactly 12 digits if supplied)
    IF v_clean_student_id IS NOT NULL AND v_clean_student_id ~ '^[0-9]{12}$' THEN
        v_student_id := v_clean_student_id;
    ELSE
        v_student_id := NULL;
    END IF;

    -- Ensure a valid username exists
    IF v_username IS NULL THEN
        -- Generate safe fallback username from email or user uuid
        v_username := 'quest_' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', '') FROM 1 FOR 8);
    END IF;

    -- Insert into public.profiles with default role 'user'
    -- Never trust client-sent role in metadata
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
        'user', -- Always default to 'user' for student security
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Catch unexpected errors to prevent blocking authentication
        RAISE WARNING 'handle_new_user error for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to check if caller is an administrator without infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
          AND role = 'admin'
    );
$$;

-- Policy 1: Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy 2: Users can update their own profile fields
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Administrators can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Policy 4: Administrators can update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. Helper procedure for administrators to promote a teacher
-- Usage: SELECT public.promote_to_teacher('teacher@school.ac.th');
CREATE OR REPLACE FUNCTION public.promote_to_teacher(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles
    SET role = 'admin', updated_at = NOW()
    WHERE email = LOWER(TRIM(p_email));

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No profile found with email %', p_email;
    END IF;
END;
$$;
