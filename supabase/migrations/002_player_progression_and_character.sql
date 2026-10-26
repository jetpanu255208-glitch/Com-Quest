-- ==============================================================================
-- COM QUEST: Supabase Migration 002 - Player Progression & Character System
-- Description: Adds character_config to profiles, subjects table, and subject_progress
-- ==============================================================================

-- 1. Add character_config JSONB column to public.profiles if it does not exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS character_config JSONB DEFAULT '{
  "hairStyle": "short-neat",
  "hairColor": "black",
  "skinTone": "warm",
  "outfit": "academy-navy",
  "accessory": "none"
}'::jsonb;

-- 2. Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY,
    thai_name TEXT NOT NULL,
    program_name TEXT NOT NULL,
    short_label TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the 5 official curriculum subjects
INSERT INTO public.subjects (id, thai_name, program_name, short_label, description, icon_type)
VALUES
    ('word', 'โปรแกรมประมวลผลคำ', 'Microsoft Word', 'WORD', 'วิชาโปรแกรม Microsoft Word สำหรับจัดการเอกสารและรายงาน', 'document'),
    ('excel', 'โปรแกรมตารางคำนวณ', 'Microsoft Excel', 'EXCEL', 'วิชาโปรแกรม Microsoft Excel สำหรับจัดการตารางและการคำนวณข้อมูล', 'spreadsheet'),
    ('powerpoint', 'โปรแกรมสร้างภาพสื่อ', 'Microsoft PowerPoint', 'POWERPOINT', 'วิชาโปรแกรม Microsoft PowerPoint สำหรับออกแบบงานนำเสนอระดับมืออาชีพ', 'presentation'),
    ('after_effects', 'การสร้างสื่อโมชั่นกราฟิก', 'Adobe After Effects', 'AFTER EFFECTS', 'วิชาโปรแกรม Adobe After Effects สำหรับสร้างแอนิเมชันและโมชั่นกราฟิก', 'motion'),
    ('photoshop', 'การสร้างภาพสื่อ', 'Adobe Photoshop', 'PHOTOSHOP', 'วิชาโปรแกรม Adobe Photoshop สำหรับการตัดต่อและตกแต่งรูปภาพ', 'image')
ON CONFLICT (id) DO UPDATE SET
    thai_name = EXCLUDED.thai_name,
    program_name = EXCLUDED.program_name,
    short_label = EXCLUDED.short_label,
    description = EXCLUDED.description,
    icon_type = EXCLUDED.icon_type;

-- 3. Create subject_progress table to track verified completions
CREATE TABLE IF NOT EXISTS public.subject_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT true,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_subject UNIQUE (user_id, subject_id)
);

-- Index for fast user progress lookups
CREATE INDEX IF NOT EXISTS idx_subject_progress_user_id ON public.subject_progress(user_id);

-- 4. Enable RLS on new tables
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_progress ENABLE ROW LEVEL SECURITY;

-- Subjects policies: Anyone authenticated or anonymous can read the subject catalog
DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;
CREATE POLICY "Anyone can view subjects"
    ON public.subjects
    FOR SELECT
    USING (true);

-- Subject Progress policies:
-- Users can view only their own progress
DROP POLICY IF EXISTS "Users can view own subject progress" ON public.subject_progress;
CREATE POLICY "Users can view own subject progress"
    ON public.subject_progress
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Only verified admins or secure server procedures can grant completion
DROP POLICY IF EXISTS "Admins can view all subject progress" ON public.subject_progress;
CREATE POLICY "Admins can view all subject progress"
    ON public.subject_progress
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert subject progress" ON public.subject_progress;
CREATE POLICY "Admins can insert subject progress"
    ON public.subject_progress
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. Safe idempotent completion function (callable by authenticated users or for testing/curriculum completion)
-- It calculates level = min(completedCount * 100, 500)
CREATE OR REPLACE FUNCTION public.complete_subject_for_user(p_subject_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_completed_count INT;
    v_new_level INT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- Verify subject exists
    IF NOT EXISTS (SELECT 1 FROM public.subjects WHERE id = p_subject_id) THEN
        RAISE EXCEPTION 'Invalid subject ID %', p_subject_id;
    END IF;

    -- Idempotent insert: Does not reward duplicates
    INSERT INTO public.subject_progress (user_id, subject_id, completed, completed_at)
    VALUES (v_user_id, p_subject_id, true, NOW())
    ON CONFLICT (user_id, subject_id) DO NOTHING;

    -- Count total unique completed subjects
    SELECT COUNT(*) INTO v_completed_count
    FROM public.subject_progress
    WHERE user_id = v_user_id AND completed = true;

    -- Calculate level
    v_new_level := LEAST(v_completed_count * 100, 500);

    RETURN jsonb_build_object(
        'success', true,
        'subject_id', p_subject_id,
        'completed_subjects', v_completed_count,
        'level', v_new_level
    );
END;
$$;
