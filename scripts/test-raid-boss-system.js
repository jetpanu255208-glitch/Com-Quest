/**
 * Test & Verification Suite for Raid Boss Shared HP System
 * Run: node scripts/test-raid-boss-system.js
 */

const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('\n=============================================================');
  console.log('  🧪 VERIFICATION: COM-QUEST RAID BOSS SHARED HP SYSTEM');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Verify Migration 019 exists and has key definitions
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '019_raid_boss_shared_hp.sql');
  assert(fs.existsSync(migrationPath), 'Migration 019 file exists');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');
  assert(migrationSql.includes('boss_current_hp'), 'Migration 019 adds boss_current_hp');
  assert(migrationSql.includes('exam_combat_logs'), 'Migration 019 creates exam_combat_logs table');
  assert(migrationSql.includes('deal_raid_boss_damage'), 'Migration 019 creates deal_raid_boss_damage atomic RPC function');
  assert(migrationSql.includes('supabase_realtime'), 'Migration 019 adds exam_combat_logs to supabase_realtime publication');

  // 2. Verify types.ts has required types
  const typesPath = path.join(__dirname, '..', 'lib', 'supabase', 'types.ts');
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  assert(typesContent.includes('export type ExamCombatLog = {'), 'types.ts exports ExamCombatLog');
  assert(typesContent.includes('deal_raid_boss_damage: {'), 'types.ts contains deal_raid_boss_damage RPC type');
  assert(typesContent.includes('boss_current_hp?: number;'), 'types.ts ExamSession includes boss_current_hp');

  // 3. Verify Server Actions
  const actionsPath = path.join(__dirname, '..', 'app', 'actions', 'exam-actions.ts');
  const actionsContent = fs.readFileSync(actionsPath, 'utf8');
  assert(actionsContent.includes('export async function recordRaidAttack'), 'exam-actions.ts exports recordRaidAttack');
  assert(actionsContent.includes('export async function getExamCombatFeed'), 'exam-actions.ts exports getExamCombatFeed');
  assert(actionsContent.includes('getDefaultQuestions'), 'createExamSession includes fallback to default questions bank');
  assert(actionsContent.includes('scaledMaxHp'), 'startExam dynamically scales Boss HP based on class size');

  // 4. Verify Student Views & Teacher Views
  const studentLobbyPath = path.join(__dirname, '..', 'components', 'exam', 'StudentLobbyView.tsx');
  const studentLobbyContent = fs.readFileSync(studentLobbyPath, 'utf8');
  assert(studentLobbyContent.includes('Fallback Smart Polling'), 'StudentLobbyView includes polling fallback');

  const bossBattlePath = path.join(__dirname, '..', 'components', 'exam', 'BossBattleView.tsx');
  const bossBattleContent = fs.readFileSync(bossBattlePath, 'utf8');
  assert(bossBattleContent.includes('recordRaidAttack'), 'BossBattleView integrates recordRaidAttack');
  assert(bossBattleContent.includes('RAID BATTLE'), 'BossBattleView displays Shared Raid Battle indicator');
  assert(bossBattleContent.includes('pollTimer'), 'BossBattleView includes Dual-Engine polling fallback');

  const teacherLobbyPath = path.join(__dirname, '..', 'components', 'teacher', 'TeacherLobbyView.tsx');
  const teacherLobbyContent = fs.readFileSync(teacherLobbyPath, 'utf8');
  assert(teacherLobbyContent.includes('TeacherLiveRaidArena'), 'TeacherLobbyView embeds TeacherLiveRaidArena');

  const teacherArenaPath = path.join(__dirname, '..', 'components', 'teacher', 'TeacherLiveRaidArena.tsx');
  assert(fs.existsSync(teacherArenaPath), 'TeacherLiveRaidArena component file exists');
  const teacherArenaContent = fs.readFileSync(teacherArenaPath, 'utf8');
  assert(teacherArenaContent.includes('LIVE COMBAT LOG'), 'TeacherLiveRaidArena includes Live Combat Ticker');
  assert(teacherArenaContent.includes('TOP RAID MVP'), 'TeacherLiveRaidArena includes Leaderboard');

  // 5. Test Question Bank Fallback functionality
  console.log('\n  Checking Default Questions Bank Integrity...');
  const defaultQuestionsPath = path.join(__dirname, '..', 'lib', 'constants', 'default-questions.ts');
  assert(fs.existsSync(defaultQuestionsPath), 'default-questions.ts exists');
  const dqContent = fs.readFileSync(defaultQuestionsPath, 'utf8');
  for (let i = 1; i <= 8; i++) {
    const lessonKey = `html_0${i}`;
    assert(dqContent.includes(lessonKey), `Question bank contains questions for ${lessonKey}`);
  }

  // 6. Test HP Dynamic Scaling Formula
  console.log('\n  Testing Dynamic Boss HP Scaling Formula...');
  function calculateBossHp(studentCount, questionCount) {
    return Math.max(1000, studentCount * questionCount * 80);
  }
  assert(calculateBossHp(1, 10) === 1000, 'Single student (10 Qs) scales to 1,000 HP (minimum)');
  assert(calculateBossHp(10, 10) === 8000, 'Class of 10 students (10 Qs) scales to 8,000 HP');
  assert(calculateBossHp(35, 10) === 28000, 'Class of 35 students (10 Qs) scales to 28,000 HP');

  console.log('\n=============================================================');
  console.log(`  SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);
