-- ==============================================================================
-- COM QUEST: Supabase Migration 003 - Auto Confirm Emails Trigger
-- Description: Automatically confirms all new and existing users' emails
--              without requiring email confirmation or SMTP setup.
-- ==============================================================================

-- 1. Create function to automatically confirm user email upon registration
CREATE OR REPLACE FUNCTION public.auto_confirm_new_users()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Automatically set email_confirmed_at to current timestamp
    NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
    RETURN NEW;
END;
$$;

-- 2. Attach BEFORE INSERT trigger on auth.users
DROP TRIGGER IF EXISTS trg_auto_confirm_new_users ON auth.users;
CREATE TRIGGER trg_auto_confirm_new_users
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_confirm_new_users();

-- 3. Confirm all existing users in the system immediately
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
