-- ==============================================================================
-- COM QUEST: Migration 019 - Raid Boss Shared HP System
-- Description:
-- 1. Adds boss_name, boss_max_hp, boss_current_hp to exam_sessions
-- 2. Creates exam_combat_logs table to track realtime hits & damage
-- 3. Creates deal_raid_boss_damage atomic RPC function
-- 4. Enables Supabase Realtime for exam_combat_logs
-- ==============================================================================

-- 1. Add Raid Boss HP columns to exam_sessions if not existing
ALTER TABLE public.exam_sessions
ADD COLUMN IF NOT EXISTS boss_name TEXT NOT NULL DEFAULT 'MECHA DRAGON (Lv.99)',
ADD COLUMN IF NOT EXISTS boss_max_hp INTEGER NOT NULL DEFAULT 10000,
ADD COLUMN IF NOT EXISTS boss_current_hp INTEGER NOT NULL DEFAULT 10000;

-- 2. Create exam_combat_logs table
CREATE TABLE IF NOT EXISTS public.exam_combat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL DEFAULT 'นักเรียน',
    question_number INTEGER NOT NULL,
    damage INTEGER NOT NULL DEFAULT 100,
    is_critical BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exam_combat_logs_exam_id ON public.exam_combat_logs(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_combat_logs_created_at ON public.exam_combat_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_combat_logs_student_id ON public.exam_combat_logs(student_id);

-- 3. Enable RLS on exam_combat_logs
ALTER TABLE public.exam_combat_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view exam_combat_logs" ON public.exam_combat_logs;
CREATE POLICY "Anyone authenticated can view exam_combat_logs"
    ON public.exam_combat_logs
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Students can insert own combat logs" ON public.exam_combat_logs;
CREATE POLICY "Students can insert own combat logs"
    ON public.exam_combat_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

-- 4. Atomic Stored Procedure to Deduct Boss HP and Log Combat Event
CREATE OR REPLACE FUNCTION public.deal_raid_boss_damage(
    p_exam_id UUID,
    p_student_id UUID,
    p_student_name TEXT,
    p_question_number INTEGER,
    p_damage INTEGER,
    p_is_critical BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_hp INTEGER;
    v_max_hp INTEGER;
    v_new_hp INTEGER;
    v_log_id UUID;
BEGIN
    -- 1. Lock exam_session row atomically to prevent race condition
    SELECT boss_current_hp, boss_max_hp 
    INTO v_current_hp, v_max_hp
    FROM public.exam_sessions
    WHERE id = p_exam_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Exam session not found');
    END IF;

    -- Calculate new HP (clamped to 0)
    v_new_hp := GREATEST(0, COALESCE(v_current_hp, 10000) - p_damage);

    -- Update session with new HP
    UPDATE public.exam_sessions
    SET boss_current_hp = v_new_hp,
        updated_at = NOW()
    WHERE id = p_exam_id;

    -- 2. Insert combat log record
    INSERT INTO public.exam_combat_logs (
        exam_id,
        student_id,
        student_name,
        question_number,
        damage,
        is_critical,
        created_at
    )
    VALUES (
        p_exam_id,
        p_student_id,
        COALESCE(NULLIF(TRIM(p_student_name), ''), 'นักเรียน'),
        p_question_number,
        p_damage,
        p_is_critical,
        NOW()
    )
    RETURNING id INTO v_log_id;

    -- 3. Also update participant remaining HP column
    UPDATE public.exam_participants
    SET boss_remaining_hp = v_new_hp,
        updated_at = NOW()
    WHERE exam_id = p_exam_id AND student_id = p_student_id;

    RETURN jsonb_build_object(
        'success', true,
        'new_hp', v_new_hp,
        'max_hp', v_max_hp,
        'damage', p_damage,
        'is_critical', p_is_critical,
        'log_id', v_log_id
    );
END;
$$;

-- 5. Enable Realtime Replication for exam_combat_logs
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_combat_logs;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- 6. Reload schema cache
NOTIFY pgrst, 'reload schema';
