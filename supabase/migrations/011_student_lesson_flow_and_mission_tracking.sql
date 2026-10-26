-- ==============================================================================
-- COM QUEST: Supabase Migration 011 - Student Lesson Flow & Mission Tracking
-- Description: Adds status, mission_completed, and quiz_passed columns to
--              lesson_progress to track precise progression states per user per lesson.
-- ==============================================================================

-- 1. เพิ่มคอลัมน์สถานะและประวัติภารกิจในตาราง public.lesson_progress
ALTER TABLE public.lesson_progress
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS mission_completed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mission_completed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS quiz_passed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS quiz_passed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. อัปเดตข้อมูลบทเรียนที่เคยสำเร็จแล้วในระบบเดิม ให้สถานะสอดคล้องกัน
UPDATE public.lesson_progress
SET 
  status = 'completed',
  mission_completed = TRUE,
  mission_completed_at = COALESCE(completed_at, NOW()),
  quiz_passed = TRUE,
  quiz_passed_at = COALESCE(completed_at, NOW())
WHERE completed = TRUE;

-- 3. อัปเดตข้อมูลจากประวัติผลสอบใน quiz_attempts ที่สอบผ่านแล้ว
INSERT INTO public.lesson_progress (
    user_id, 
    lesson_id, 
    completed, 
    completed_at, 
    status, 
    mission_completed, 
    mission_completed_at, 
    quiz_passed, 
    quiz_passed_at
)
SELECT 
    qa.user_id,
    qa.lesson_id,
    TRUE,
    qa.created_at,
    'completed',
    TRUE,
    qa.created_at,
    TRUE,
    qa.created_at
FROM public.quiz_attempts qa
WHERE qa.passed = TRUE
ON CONFLICT (user_id, lesson_id) DO UPDATE SET
    completed = TRUE,
    status = 'completed',
    mission_completed = TRUE,
    quiz_passed = TRUE;

-- 4. แจ้งเตือน PostgREST ให้รีโหลดแคช Schema
NOTIFY pgrst, 'reload schema';
