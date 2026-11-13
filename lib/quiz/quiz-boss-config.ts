/**
 * Com Quest - Lesson Quiz Boss Battle Configurations
 * Single source of truth for Boss data, HP, damage scaling, and arena assets per lesson.
 */

export interface QuizBossConfig {
  lessonId: string;
  lessonNumber: number;
  bossName: string;
  bossTitle: string;
  bossImage: string;
  arenaBackground: string;
  maxHp: number;
  damagePerHit: number;
  passingScore: number;
  passingDamage: number;
  auraColor: 'red' | 'orange';
  auraFilter: string;
}

export function getQuizBossConfig(lessonNumber: number = 1): QuizBossConfig {
  // Lesson 2: HTML Tags & Elements
  if (lessonNumber === 2) {
    return {
      lessonId: 'html_02',
      lessonNumber: 2,
      bossName: 'แมลงสาบมัลแวร์',
      bossTitle: 'BOSS LV.25 • แมลงจักรกลสายพันธุ์มัลแวร์',
      bossImage: '/images/boss/malware-roach-boss.png',
      arenaBackground: '/images/boss/cyber-city-arena.jpg',
      maxHp: 500,
      damagePerHit: 50,
      passingScore: 6,
      passingDamage: 300,
      auraColor: 'orange',
      auraFilter: 'drop-shadow(0 0 16px rgba(249, 115, 22, 0.8)) drop-shadow(0 0 35px rgba(234, 88, 12, 0.45))',
    };
  }

  // Lesson 1: HTML Basic Syntax (Default)
  return {
    lessonId: 'html_01',
    lessonNumber: 1,
    bossName: 'ปีศาจหีบโค้ด',
    bossTitle: 'BOSS LV.10 • ผู้พิทักษ์หีบสมบัติโค้ด',
    bossImage: '/images/boss/mimic-chest-boss.png',
    arenaBackground: '/images/boss/pixel-forest-arena.jpg',
    maxHp: 100,
    damagePerHit: 10,
    passingScore: 5,
    passingDamage: 50,
    auraColor: 'red',
    auraFilter: 'drop-shadow(0 0 16px rgba(239, 68, 68, 0.75)) drop-shadow(0 0 30px rgba(220, 38, 38, 0.35))',
  };
}

