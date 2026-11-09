-- ==============================================================================
-- COM QUEST: Migration 018 - Boss Battle Exam System
-- Realtime exam sessions, question bank selection, late join approval,
-- and side-view RPG Boss Battle tracking.
-- ==============================================================================

-- 0. Cleanly reset tables if they exist with outdated/mismatched columns
DROP TABLE IF EXISTS public.exam_student_answers CASCADE;
DROP TABLE IF EXISTS public.exam_participants CASCADE;
DROP TABLE IF EXISTS public.exam_questions CASCADE;
DROP TABLE IF EXISTS public.exam_sessions CASCADE;

-- 1. Table: exam_sessions (Created by teachers)
CREATE TABLE IF NOT EXISTS public.exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    room_code VARCHAR(8) NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'lobby', 'in_progress', 'completed', 'cancelled')),
    duration_minutes INTEGER NOT NULL DEFAULT 15 CHECK (duration_minutes > 0),
    total_questions INTEGER NOT NULL DEFAULT 10 CHECK (total_questions > 0),
    passing_score INTEGER NOT NULL DEFAULT 5 CHECK (passing_score >= 0),
    subject_id TEXT DEFAULT 'html_basic',
    selected_lessons TEXT[] DEFAULT ARRAY['html_01'],
    started_at TIMESTAMPTZ DEFAULT NULL,
    ended_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on room_code and status for fast lookups
CREATE INDEX IF NOT EXISTS idx_exam_sessions_room_code ON public.exam_sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON public.exam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_teacher_id ON public.exam_sessions(teacher_id);

-- 2. Table: exam_questions (Questions tied to an exam session)
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option VARCHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    explanation TEXT DEFAULT '',
    points INTEGER NOT NULL DEFAULT 1 CHECK (points > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_exam_question_number UNIQUE (exam_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON public.exam_questions(exam_id);

-- 3. Table: exam_participants (Students joined an exam session)
CREATE TABLE IF NOT EXISTS public.exam_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'late_request', 'approved', 'rejected', 'in_progress', 'submitted')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ DEFAULT NULL,
    started_at TIMESTAMPTZ DEFAULT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NULL,
    score INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    boss_remaining_hp INTEGER DEFAULT 1000 CHECK (boss_remaining_hp BETWEEN 0 AND 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_exam_participant UNIQUE (exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_participants_exam_id ON public.exam_participants(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_participants_student_id ON public.exam_participants(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_participants_status ON public.exam_participants(status);

-- 4. Table: exam_student_answers (Student recorded answers)
CREATE TABLE IF NOT EXISTS public.exam_student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES public.exam_participants(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
    selected_option VARCHAR(1) DEFAULT NULL CHECK (selected_option IN ('A', 'B', 'C', 'D') OR selected_option IS NULL),
    is_correct BOOLEAN DEFAULT NULL,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_participant_question UNIQUE (participant_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_student_answers_participant_id ON public.exam_student_answers(participant_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_student_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Teacher full access to exam_sessions" ON public.exam_sessions;
DROP POLICY IF EXISTS "Public/Students can view active exam_sessions" ON public.exam_sessions;

DROP POLICY IF EXISTS "Teacher manage exam_questions" ON public.exam_questions;
DROP POLICY IF EXISTS "Student view questions during exam" ON public.exam_questions;

DROP POLICY IF EXISTS "Teacher manage exam_participants" ON public.exam_participants;
DROP POLICY IF EXISTS "Student manage own exam_participant" ON public.exam_participants;

DROP POLICY IF EXISTS "Teacher view exam_student_answers" ON public.exam_student_answers;
DROP POLICY IF EXISTS "Student manage own exam_student_answers" ON public.exam_student_answers;

-- Exam Sessions Policies:
CREATE POLICY "Teacher full access to exam_sessions" ON public.exam_sessions
    FOR ALL
    TO authenticated
    USING (teacher_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Public/Students can view active exam_sessions" ON public.exam_sessions
    FOR SELECT
    TO authenticated
    USING (true);

-- Exam Questions Policies:
CREATE POLICY "Teacher manage exam_questions" ON public.exam_questions
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.exam_sessions WHERE id = exam_questions.exam_id AND (teacher_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        ))
    ));

CREATE POLICY "Student view questions during exam" ON public.exam_questions
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.exam_participants
        WHERE exam_participants.exam_id = exam_questions.exam_id
          AND exam_participants.student_id = auth.uid()
          AND exam_participants.status IN ('in_progress', 'submitted')
    ));

-- Exam Participants Policies:
CREATE POLICY "Anyone authenticated can view exam_participants" ON public.exam_participants
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Students can insert own participant" ON public.exam_participants
    FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students and teachers can update participant" ON public.exam_participants
    FOR UPDATE
    TO authenticated
    USING (student_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Teacher manage exam_participants" ON public.exam_participants
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.exam_sessions WHERE id = exam_participants.exam_id AND (teacher_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        ))
    ));

-- Exam Student Answers Policies:
CREATE POLICY "Teacher view exam_student_answers" ON public.exam_student_answers
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.exam_participants p
        JOIN public.exam_sessions s ON s.id = p.exam_id
        WHERE p.id = exam_student_answers.participant_id
          AND (s.teacher_id = auth.uid() OR EXISTS (
              SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
          ))
    ));

CREATE POLICY "Student manage own exam_student_answers" ON public.exam_student_answers
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.exam_participants
        WHERE id = exam_student_answers.participant_id
          AND student_id = auth.uid()
    ));

-- 6. Enable Supabase Realtime for instant Lobby and Late Join updates
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_sessions;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_participants;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

