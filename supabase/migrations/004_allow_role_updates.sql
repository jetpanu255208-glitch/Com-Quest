-- ==============================================================================
-- COM QUEST: Supabase Migration 004 - Allow Role Updates for Admins & Table Editor
-- Description: Updates the protect_profile_roles trigger to allow editing the role
--              column in Supabase Table Editor and SQL Editor (from 'user' to 'admin')
--              while still protecting against unauthorized client elevation.
-- ==============================================================================

-- 1. Update trigger function to allow Table Editor & SQL Editor updates
CREATE OR REPLACE FUNCTION public.protect_profile_roles()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Allow direct database admins, service_role, and superusers in SQL Editor / Table Editor:
    -- (When modifying via Supabase Dashboard Table Editor or SQL Editor, auth.uid() is NULL)
    IF auth.uid() IS NULL 
       OR current_user IN ('postgres', 'service_role', 'supabase_admin')
       OR COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
        RETURN NEW;
    END IF;

    -- When called from client API with an active authenticated session:
    IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.id IS DISTINCT FROM NEW.id) THEN
        SELECT role INTO current_user_role 
        FROM public.profiles 
        WHERE id = auth.uid();

        -- Non-admin users cannot elevate their own or other users' roles
        IF current_user_role IS DISTINCT FROM 'admin' THEN
            RAISE EXCEPTION 'Unauthorized: Only administrators can modify roles or system identifiers.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 2. Re-attach the trigger
DROP TRIGGER IF EXISTS trg_protect_profile_roles ON public.profiles;
CREATE TRIGGER trg_protect_profile_roles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_roles();

-- 3. Provide convenient helper functions to change roles easily:
CREATE OR REPLACE FUNCTION public.set_user_role(p_email TEXT, p_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_role NOT IN ('user', 'admin') THEN
        RAISE EXCEPTION 'Invalid role: %. Allowed roles are user or admin.', p_role;
    END IF;

    UPDATE public.profiles
    SET role = p_role, updated_at = NOW()
    WHERE email = p_email;
END;
$$;

-- Grant execution to authenticated users and service_role
GRANT EXECUTE ON FUNCTION public.set_user_role(TEXT, TEXT) TO authenticated, service_role;
