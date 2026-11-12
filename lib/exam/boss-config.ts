/**
 * Com Quest - Boss Battle Configuration Helper
 * Single source of truth for Boss assets, HP, and damage scaling based on exam question count.
 */

export interface BossConfig {
  id: 'mimic' | 'virus_knight' | 'mecha_dragon';
  name: string;
  thaiName: string;
  image: string;
  maxHp: number;
  damagePerHit: number;
  passingScore: number;
  passingDamage: number;
  glowColor: string;
}

export function getBossConfigForExam(
  totalQuestions: number = 10,
  passingScore?: number,
  bossName?: string | null
): BossConfig {
  const nameUpper = (bossName || '').toUpperCase();

  // Preset 1: <= 8 Questions (Default: 5 Questions, 8 Minutes, Pass 3)
  if (
    nameUpper.includes('MIMIC') ||
    nameUpper.includes('CHEST') ||
    nameUpper.includes('หีบ') ||
    totalQuestions <= 8
  ) {
    const pass = passingScore !== undefined ? passingScore : Math.min(3, Math.ceil(totalQuestions * 0.6));
    return {
      id: 'mimic',
      name: bossName || 'CHEST MIMIC (Lv.50)',
      thaiName: 'ปีศาจหีบสมบัติ',
      image: '/images/boss/mimic-chest-boss.png',
      maxHp: 500,
      damagePerHit: 100,
      passingScore: pass,
      passingDamage: pass * 100,
      glowColor: 'rgba(239, 68, 68, 0.45)', // Red glow
    };
  }

  // Preset 3: > 15 Questions (Default: 20 Questions, 30 Minutes, Pass 12)
  if (
    nameUpper.includes('MECHA') ||
    nameUpper.includes('DRAGON') ||
    nameUpper.includes('มังกร') ||
    totalQuestions > 15
  ) {
    const pass = passingScore !== undefined ? passingScore : 12;
    return {
      id: 'mecha_dragon',
      name: bossName || 'MECHA DRAGON (Lv.99)',
      thaiName: 'มังกรสามหัวจักรกล',
      image: '/images/boss/mecha-dragon-boss.png',
      maxHp: 20000,
      damagePerHit: 1000,
      passingScore: pass,
      passingDamage: pass * 1000,
      glowColor: 'rgba(239, 68, 68, 0.5)', // Cyber red/crimson glow
    };
  }

  // Preset 2: 9-15 Questions (Default: 10 Questions, 15 Minutes, Pass 6)
  const pass = passingScore !== undefined ? passingScore : 6;
  return {
    id: 'virus_knight',
    name: bossName || 'VIRUS CYBER KNIGHT (Lv.75)',
    thaiName: 'เกราะอัศวินติดไวรัส',
    image: '/images/boss/virus-knight-boss.png',
    maxHp: 1000,
    damagePerHit: 100,
    passingScore: pass,
    passingDamage: pass * 100,
    glowColor: 'rgba(34, 197, 94, 0.5)', // Neon green / virus flame glow
  };
}

