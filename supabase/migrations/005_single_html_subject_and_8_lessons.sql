-- ==============================================================================
-- COM QUEST: Supabase Migration 005 - Single Subject HTML Basic & 8 Lessons System
-- Description: Replaces old subjects with single HTML Basic course,
--              adds 8 lessons, 8 coin rewards (+100 LVL each up to 800 MAX),
--              and 1 Master Course Trophy unlocked upon collecting all 8 coins.
-- ==============================================================================

-- 1. Create or ensure subjects table exists FIRST (handles cases where table was dropped)
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY,
    thai_name TEXT NOT NULL,
    program_name TEXT NOT NULL,
    short_label TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_type TEXT NOT NULL DEFAULT 'code',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely clear obsolete subjects if table and data existed
DELETE FROM public.subjects WHERE id IN ('word', 'excel', 'powerpoint', 'after_effects', 'photoshop');

-- Insert or update the single HTML Basic subject
INSERT INTO public.subjects (id, thai_name, program_name, short_label, description, icon_type)
VALUES (
    'html_basic',
    'การเขียนภาษา HTML เบื้องต้น',
    'HTML5',
    'HTML เบื้องต้น',
    'หลักสูตรการเขียนภาษา HTML เบื้องต้นเพื่อสร้างรากฐานเว็บไซต์ที่มั่นคง ประกอบด้วย 8 บทเรียน',
    'code'
)
ON CONFLICT (id) DO UPDATE SET
    thai_name = EXCLUDED.thai_name,
    program_name = EXCLUDED.program_name,
    short_label = EXCLUDED.short_label,
    description = EXCLUDED.description;

-- Enable RLS for subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;
CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);

-- Ensure subject_progress table exists (for backward compatibility if needed)
CREATE TABLE IF NOT EXISTS public.subject_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT true,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_subject UNIQUE (user_id, subject_id)
);
ALTER TABLE public.subject_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view own subject progress" ON public.subject_progress;
CREATE POLICY "Anyone can view own subject progress" ON public.subject_progress FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin());

-- 2. Create lessons table for the 8 lessons
CREATE TABLE IF NOT EXISTS public.lessons (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    lesson_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_lesson_number CHECK (lesson_number BETWEEN 1 AND 8)
);

-- Seed the 8 official HTML Basic Lessons
INSERT INTO public.lessons (id, subject_id, lesson_number, title, description, xp_reward)
VALUES
    ('html_01', 'html_basic', 1, 'โครงสร้างพื้นฐานของ HTML', 'เรียนรู้แท็กหลัก !DOCTYPE, html, head, title และ body', 100),
    ('html_02', 'html_basic', 2, 'หัวเรื่องและย่อหน้าข้อความ', 'การใช้แท็กหัวข้อ h1-h6 และย่อหน้าข้อความ p พร้อมการขึ้นบรรทัดใหม่', 100),
    ('html_03', 'html_basic', 3, 'การจัดรูปแบบข้อความ', 'การเน้นข้อความตัวหนา ตัวเอียง ขีดเส้นใต้ และไฮไลต์ข้อความ', 100),
    ('html_04', 'html_basic', 4, 'ลิงก์และการเชื่อมโยงเว็บ', 'การสร้าง Hyperlink ด้วยแท็ก a เชื่อมโยงหน้าเว็บภายในและภายนอก', 100),
    ('html_05', 'html_basic', 5, 'การแทรกรูปภาพและสื่อ', 'การแสดงผลรูปภาพด้วยแท็ก img กำหนด src, alt และขนาดภาพ', 100),
    ('html_06', 'html_basic', 6, 'รายการและตารางข้อมูล', 'การสร้างรายการแบบมีลำดับ ul/ol และการสร้างตาราง table/tr/td', 100),
    ('html_07', 'html_basic', 7, 'ฟอร์มและการรับข้อมูลผู้ใช้', 'การสร้างแบบฟอร์ม form, input ข้อความ ปุ่มกด และตัวเลือกต่าง ๆ', 100),
    ('html_08', 'html_basic', 8, 'Semantic HTML5 และโครงร่างเว็บ', 'การจัดโครงสร้างหน้าเว็บด้วย semantic tags: header, nav, main, footer', 100)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    xp_reward = EXCLUDED.xp_reward;

-- 3. Create lesson_progress table (tracks student coins for the 8 lessons)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT TRUE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_lesson UNIQUE (user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Helper function to check if caller is admin (ensures policy checks work safely)
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

-- RLS for lessons
DROP POLICY IF EXISTS "Anyone can view lessons" ON public.lessons;
CREATE POLICY "Anyone can view lessons" 
    ON public.lessons FOR SELECT 
    USING (true);

-- RLS for lesson_progress
DROP POLICY IF EXISTS "Users can read own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can read own lesson progress" 
    ON public.lesson_progress FOR SELECT 
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can insert own lesson progress" 
    ON public.lesson_progress FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can update own lesson progress" 
    ON public.lesson_progress FOR UPDATE 
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can delete own lesson progress" 
    ON public.lesson_progress FOR DELETE 
    USING (auth.uid() = user_id OR public.is_admin());

-- 4. RPC Function to complete a lesson and calculate updated stats
CREATE OR REPLACE FUNCTION public.complete_lesson_for_user(p_lesson_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_completed_count INT;
    v_new_level INT;
    v_has_master_trophy BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- Verify lesson exists
    IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE id = p_lesson_id) THEN
        RAISE EXCEPTION 'Invalid lesson ID %', p_lesson_id;
    END IF;

    -- Insert completion coin idempotently
    INSERT INTO public.lesson_progress (user_id, lesson_id, completed, completed_at)
    VALUES (v_user_id, p_lesson_id, true, NOW())
    ON CONFLICT (user_id, lesson_id) DO NOTHING;

    -- Count total completed lessons
    SELECT COUNT(*) INTO v_completed_count
    FROM public.lesson_progress
    WHERE user_id = v_user_id AND completed = true;

    -- Calculate level (up to 800)
    v_new_level := LEAST(v_completed_count * 100, 800);
    v_has_master_trophy := (v_completed_count >= 8);

    -- If 8 lessons completed, also mark the overall subject completed for record keeping
    IF v_has_master_trophy THEN
        INSERT INTO public.subject_progress (user_id, subject_id, completed, completed_at)
        VALUES (v_user_id, 'html_basic', true, NOW())
        ON CONFLICT (user_id, subject_id) DO NOTHING;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'lesson_id', p_lesson_id,
        'completed_lessons', v_completed_count,
        'level', v_new_level,
        'master_trophy', v_has_master_trophy
    );
END;
$$;

