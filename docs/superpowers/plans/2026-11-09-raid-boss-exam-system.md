# Raid Boss Shared HP Synchronous Exam System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a real-time, synchronous "Raid Boss Shared HP" exam system for Com-Quest, where students in a classroom join a shared lobby, start the exam simultaneously, and collectively deal damage to a shared Mecha Dragon Boss whose health is displayed on the teacher's projector screen in real time.

**Architecture:** Next.js 16 App Router with Server Actions + Supabase PostgreSQL (Atomic damage RPC, Realtime replication on `exam_sessions` and `exam_combat_logs`) + Dual-Engine Synchronization (Supabase WebSocket Realtime + 2-3s interval Polling fallback for classroom firewall resiliency) + SVG/CSS Retro 8-bit Boss Arena with live damage tickers and top damage dealer leaderboards.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind CSS v4, Supabase (PostgreSQL, Realtime, RPC), Lucide React.

**Spec:** [Design Document accepted in conversation](./docs/superpowers/plans/2026-11-09-raid-boss-exam-system.md)

## Global Constraints

- Never break existing student/teacher authentication or role-based access control (`profiles.role === 'admin'`).
- Always preserve question security: never expose `correct_option` or `explanation` to student clients ahead of time.
- All database state mutations must be atomic (especially deducting shared boss HP concurrently from 30+ students).
- Network resiliency is mandatory: every real-time screen must feature both Supabase Realtime WebSocket listeners and smart HTTP polling fallback.
- Exam question creation must NEVER yield 0 questions: fallback to `lib/constants/default-questions.ts` if database seed questions are missing.

## Review Focus

1. Concurrency conflict when multiple students answer correctly at the exact same millisecond (prevented by atomic SQL RPC `deal_raid_boss_damage`).
2. WebSocket connection drop in school lab firewall (prevented by Dual-Engine Polling fallback every 2-3s).
3. Student joining late or reloading page mid-exam (handled by fetching persisted draft answers and current shared boss HP).
4. Teacher emergency close or time expiration (auto-submit answers and transition all screens cleanly).
5. Zero-question edge case if teacher selects lessons not yet seeded in database (handled by falling back to static questions).

---

### Task 1: Database Migration 019 for Raid Boss Exam System

**Files:**
- Create: `supabase/migrations/019_raid_boss_shared_hp.sql`
- Modify: `lib/supabase/types.ts`

- [x] **Step 1: Write Migration 019 SQL**
  - Add `boss_name`, `boss_max_hp`, `boss_current_hp` columns to `public.exam_sessions`.
  - Create table `public.exam_combat_logs` (`id`, `exam_id`, `student_id`, `student_name`, `question_number`, `damage`, `is_critical`, `created_at`).
  - Create PostgreSQL function `public.deal_raid_boss_damage(p_exam_id UUID, p_student_id UUID, p_student_name TEXT, p_question_number INTEGER, p_damage INTEGER, p_is_critical BOOLEAN) RETURNS JSONB` that atomically reduces `boss_current_hp`, inserts into `exam_combat_logs`, and returns updated HP.
  - Enable RLS and create policies for `exam_combat_logs` (read for authenticated users, insert via server/RPC).
  - Add `exam_combat_logs` to `supabase_realtime` publication.
- [x] **Step 2: Update TypeScript types in `lib/supabase/types.ts`**
  - Add `ExamCombatLog` interface.
  - Update `ExamSession` with `boss_name`, `boss_max_hp`, `boss_current_hp`.
  - Add `deal_raid_boss_damage` definition to `Database['public']['Functions']`.

---

### Task 2: Server Actions Upgrade in `app/actions/exam-actions.ts`

**Files:**
- Modify: `app/actions/exam-actions.ts`

- [x] **Step 1: Enhance `createExamSession` with robust question fallback & Boss HP**
  - When `quiz_questions` from DB yields fewer questions than requested, fallback to `getDefaultQuestions(lessonId)` from `lib/constants/default-questions.ts`.
  - Initialize `boss_name = 'MECHA DRAGON (Lv.99)'`, `boss_max_hp = 10000`, `boss_current_hp = 10000`.
- [x] **Step 2: Scale Boss HP in `startExam` dynamically**
  - Count registered participants and adjust `boss_max_hp` and `boss_current_hp` (e.g. `Math.max(1000, participantCount * totalQuestions * 80)`), ensuring the challenge scales accurately to class size.
- [x] **Step 3: Implement `recordRaidAttack` Server Action**
  - Verify question answer on server.
  - If correct, calculate damage (100 base + 50 critical if answered in under 10 seconds).
  - Call `deal_raid_boss_damage` RPC to atomically deduct boss HP and log combat entry.
  - Return `{ isCorrect, damage, isCritical, remainingHp }`.
- [x] **Step 4: Update `getExamLobbyData` and `getStudentExamBattleData`**
  - Return current `boss_name`, `boss_max_hp`, `boss_current_hp` in payload.
- [x] **Step 5: Implement `getExamCombatFeed` Server Action**
  - Fetch recent combat logs (last 30 entries) for live ticker and leaderboard calculation.

---

### Task 3: Dual-Engine Synchronization for Student Views

**Files:**
- Modify: `components/exam/StudentLobbyView.tsx`
- Modify: `components/exam/BossBattleView.tsx`

- [x] **Step 1: Add Polling Fallback to `StudentLobbyView.tsx`**
  - Add `setInterval` every 2000ms to check `session.status`. If status switches to `in_progress`, push router to `/exam/battle/[id]`, even if WebSocket was blocked or dropped.
- [x] **Step 2: Upgrade `BossBattleView.tsx` to display Shared Raid Boss HP**
  - Listen to `exam_sessions` Realtime channel for live `boss_current_hp` updates and `status` changes.
  - Add 2500ms polling fallback for `exam_sessions` status and HP.
  - When student selects an option:
    - Save draft answer.
    - Call `recordRaidAttack` on server.
    - If correct, trigger student character attack animation + floating damage numbers (`-100 HP HIT!` or `-150 HP CRITICAL!`).
    - If wrong, trigger player hurt animation.
  - Top HP bar shows live Shared Raid HP: `${bossHp} / ${maxHp}`.
  - If `boss_current_hp <= 0`: Show Boss Defeated celebration banner.
  - If teacher ends exam or session closes: auto-submit and redirect to `/exam/result/[id]`.

---

### Task 4: Teacher Live Projector Dashboard (Classroom Raid Arena)

**Files:**
- Create: `components/teacher/TeacherLiveRaidArena.tsx`
- Modify: `components/teacher/TeacherLobbyView.tsx`

- [x] **Step 1: Create `TeacherLiveRaidArena.tsx`**
  - Giant Mecha Dragon Boss display with HP bar, animated states (`idle`, `hurt`, `defeated`).
  - Rolling Combat Ticker at bottom: Displays live attacks (e.g. `⚔️ [นายสมชาย] โจมตี Mecha Dragon! (-100 HP)`).
  - Live Damage Leaderboard: Displays Top 5 students with highest damage dealt in the session.
  - Subscribes to `exam_combat_logs` Realtime channel + 2000ms polling fallback.
  - Big "PROJECTOR MODE" / Fullscreen toggle for classroom presentation.
  - End Exam button with confirmation modal.
- [x] **Step 2: Embed `TeacherLiveRaidArena` in `TeacherLobbyView.tsx`**
  - When `session.status === 'in_progress'`, render `TeacherLiveRaidArena` as the primary view on teacher's screen.

---

### Task 5: Testing, Seed Script & Verification

**Files:**
- Create: `scripts/test-raid-boss-system.js`

- [x] **Step 1: Create diagnostic test script**
  - Verify migration file syntax and schema definitions.
  - Validate question bank fallback logic.
  - Verify calculation of scaled Boss HP.
- [x] **Step 2: Run verification and review all components**
  - Ensure zero build/lint errors across all modified files (32/32 tests passed).
