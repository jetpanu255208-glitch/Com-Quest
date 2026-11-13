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
  auraColor: 'red' | 'orange' | 'gold';
  auraFilter: string;
}

export function getQuizBossConfig(lessonNumber: number = 1): QuizBossConfig {
  // Lesson 4: HTML Tables & Lists
  if (lessonNumber === 4) {
    return {
      lessonId: 'html_04',
      lessonNumber: 4,
      bossName: 'เดอะ แจ็คพ็อต',
      bossTitle: 'BOSS LV.77 • เจ้าแห่งเครื่องสล็อตคาสิโน',
      bossImage: '/images/boss/jackpot-casino-boss.png',
      arenaBackground: '/images/boss/casino-hall-arena.jpg',
      maxHp: 10000,
      damagePerHit: 1000,
      passingScore: 7,
      passingDamage: 7000,
      auraColor: 'gold',
      auraFilter: 'drop-shadow(0 0 18px rgba(234, 179, 8, 0.85)) drop-shadow(0 0 35px rgba(245, 158, 11, 0.5))',
    };
  }

  // Lesson 3: HTML Attributes & Links
  if (lessonNumber === 3) {
    return {
      lessonId: 'html_03',
      lessonNumber: 3,
      bossName: 'ไวรัสร้าย เมกิโด',
      bossTitle: 'BOSS LV.50 • สิ่งมีชีวิตเมกะไบต์กลืนกินข้อมูล',
      bossImage: '/images/boss/virus-megiddo-boss.png',
      arenaBackground: '/images/boss/dark-waterfront-arena.jpg',
      maxHp: 1000,
      damagePerHit: 100,
      passingScore: 5,
      passingDamage: 500,
      auraColor: 'red',
      auraFilter: 'drop-shadow(0 0 18px rgba(239, 68, 68, 0.85)) drop-shadow(0 0 35px rgba(220, 38, 38, 0.45))',
    };
  }

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

