'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CharacterConfig, DEFAULT_CHARACTER_CONFIG } from '@/lib/supabase/types';
import { getPixelCharacterPixels } from '@/components/character/PixelCharacter';
import {
  Shield,
  Zap,
  RotateCcw,
  Gamepad2,
  LogOut,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Flame,
  Trophy,
  Heart,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Crown,
  AlertTriangle,
  HelpCircle,
  X,
  Check,
} from 'lucide-react';
import {
  playLaserShootSound,
  playHeavyLaserSound,
  playShieldSound,
  playBossAlertSound,
  playHitSound,
  playHurtSound,
  playExplosionSound,
  playSelectSound,
  playClearSound,
  playOverSound,
  playPopSound,
  playMarioCorrectSound,
  playMarioWinSound,
  isSoundMuted,
  setSoundMuted,
  stopAllSounds,
} from '@/lib/sound/sound-manager';

// ============================================================================
// CONSTANTS & GAME SPECIFICATIONS
// ============================================================================
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const GROUND_Y = 440;
const PLAYER_Y = 405;
const PLAYER_MIN_X = 130;
const PLAYER_MAX_X = 390;
const BASE_X = 20;
const BASE_WIDTH = 90;
const BASE_HEIGHT = 220;
const BASE_CRASH_LINE = 110;

// Shoot cooldown in ms
const SHOOT_COOLDOWN_MS = 190;
const BASE_SHIELD_DURATION_SEC = 5.0;
const BASE_SHIELD_COOLDOWN_SEC = 15.0;

export type MonsterType = 'white' | 'green' | 'red' | 'boss';

export interface MonsterSpec {
  id: number;
  type: MonsterType;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  speed: number;
  baseDamage: number;
  hitFlashTimer: number;
  animFrame: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  radius: number;
  damage: number;
  isExplosive: boolean;
  vx: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

export interface DamagePopup {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

interface WaveConfig {
  white: number;
  green: number;
  red: number;
  hasBoss?: boolean;
  spawnIntervalMs: number;
}

const STAGE_WAVES: Record<number, WaveConfig[]> = {
  1: [
    { white: 5, green: 0, red: 0, spawnIntervalMs: 1300 },
    { white: 8, green: 0, red: 0, spawnIntervalMs: 1100 },
    { white: 6, green: 3, red: 0, spawnIntervalMs: 950 },
  ],
  2: [
    { white: 6, green: 3, red: 0, spawnIntervalMs: 1100 },
    { white: 7, green: 4, red: 0, spawnIntervalMs: 950 },
    { white: 8, green: 6, red: 0, spawnIntervalMs: 850 },
  ],
  3: [
    { white: 6, green: 4, red: 0, spawnIntervalMs: 1000 },
    { white: 7, green: 5, red: 0, spawnIntervalMs: 900 },
    { white: 6, green: 4, red: 1, spawnIntervalMs: 950 },
  ],
  4: [
    { white: 6, green: 4, red: 1, spawnIntervalMs: 950 },
    { white: 7, green: 5, red: 2, spawnIntervalMs: 850 },
    { white: 8, green: 6, red: 3, spawnIntervalMs: 800 },
  ],
  5: [
    { white: 0, green: 0, red: 0, hasBoss: true, spawnIntervalMs: 1000 },
  ],
};

interface PcShootingGameProps {
  characterConfig?: CharacterConfig | null;
  playerName?: string;
  onBackToMenu?: () => void;
}

export const PcShootingGame: React.FC<PcShootingGameProps> = ({
  characterConfig,
  playerName = 'Defender',
  onBackToMenu,
}) => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Profile Avatar Sync (uses props or latest localStorage cached avatar)
  const [activeCharConfig, setActiveCharConfig] = useState<CharacterConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('com_quest_character_config');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return characterConfig || DEFAULT_CHARACTER_CONFIG;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('com_quest_character_config');
        if (cached) {
          setActiveCharConfig(JSON.parse(cached));
          return;
        }
      } catch {}
    }
    if (characterConfig) {
      setActiveCharConfig(characterConfig);
    }
  }, [characterConfig]);

  // Preloaded Monster Images
  const monsterImagesRef = useRef<{
    white: HTMLImageElement | null;
    green: HTMLImageElement | null;
    red: HTMLImageElement | null;
    boss: HTMLImageElement | null;
  }>({
    white: null,
    green: null,
    red: null,
    boss: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadImg = (src: string) => {
      const img = new Image();
      img.src = src;
      return img;
    };
    monsterImagesRef.current = {
      white: loadImg('/images/shooting/virus-white.png'),
      green: loadImg('/images/shooting/virus-green.png'),
      red: loadImg('/images/shooting/virus-red.png'),
      boss: loadImg('/images/shooting/virus-boss.png'),
    };
  }, []);

  // Sound & Fullscreen
  const [muted, setMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPortraitMobile, setIsPortraitMobile] = useState<boolean>(false);

  // Persistent Game State: Player Damage starts at 20 per hit!
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [currentWave, setCurrentWave] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [weaponDamage, setWeaponDamage] = useState<number>(20);
  const [baseCurrentHp, setBaseCurrentHp] = useState<number>(200);
  const [baseMaxHp, setBaseMaxHp] = useState<number>(200);

  // Abilities
  const [unlockedBaseShield, setUnlockedBaseShield] = useState<boolean>(false);
  const [unlockedExplosiveBullet, setUnlockedExplosiveBullet] = useState<boolean>(false);
  const [explosiveBulletUsed, setExplosiveBulletUsed] = useState<boolean>(false);
  const [stage1UpgradeChoice, setStage1UpgradeChoice] = useState<'damage' | 'hp' | null>(null);

  // Shield Timers
  const [shieldActiveTimer, setShieldActiveTimer] = useState<number>(0);
  const [shieldCooldownTimer, setShieldCooldownTimer] = useState<number>(0);

  // Modals & UI States
  const [gameModal, setGameModal] = useState<
    | null
    | 'stage1-upgrade'
    | 'stage2-upgrade'
    | 'stage3-ability'
    | 'stage4-prompt'
    | 'boss-intro'
    | 'game-over'
    | 'victory'
    | 'paused'
    | 'tutorial'
  >(null);

  const [waveBanner, setWaveBanner] = useState<string | null>('STAGE 1 • WAVE 1');
  // Golden Boss Max HP is 200
  const [bossHp, setBossHp] = useState<number>(200);

  // Live mutable game state in Ref to power the 60 FPS requestAnimationFrame loop without React re-render lag
  const stateRef = useRef({
    playerX: 220,
    playerVx: 0,
    playerFacing: 'right' as 'left' | 'right',
    isMovingLeft: false,
    isMovingRight: false,
    isShooting: false,
    lastShootTime: 0,
    bullets: [] as Bullet[],
    monsters: [] as MonsterSpec[],
    particles: [] as Particle[],
    damagePopups: [] as DamagePopup[],
    nextEntityId: 1,
    screenShake: 0,
    baseFlash: 0,
    shieldVisualRadius: 0,
    shieldAlpha: 0,
    // Spawner State
    spawnQueue: [] as MonsterType[],
    lastSpawnTime: 0,
    spawnInterval: 1200,
    waveTotalEnemies: 0,
    waveDefeatedEnemies: 0,
    isWaveEnding: false,
    isGameActive: true,
  });

  // Keep React state in sync with Ref for HUD
  const [remainingEnemies, setRemainingEnemies] = useState<number>(5);

  // Initialize Sound and viewport
  useEffect(() => {
    setMuted(isSoundMuted());
    const checkViewport = () => {
      setIsPortraitMobile(window.innerHeight > window.innerWidth);
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    document.addEventListener('fullscreenchange', checkViewport);
    return () => {
      window.removeEventListener('resize', checkViewport);
      document.removeEventListener('fullscreenchange', checkViewport);
      stopAllSounds();
    };
  }, []);

  // Check first-time tutorial
  useEffect(() => {
    try {
      const seen = localStorage.getItem('com_quest_pc_shooting_tutorial_seen');
      if (!seen) {
        setGameModal('tutorial');
      }
    } catch {}
  }, []);

  const closeTutorial = () => {
    playSelectSound();
    try {
      localStorage.setItem('com_quest_pc_shooting_tutorial_seen', 'true');
    } catch {}
    setGameModal(null);
  };

  const toggleFullscreen = async () => {
    playSelectSound();
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {}
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
    if (!next) playSelectSound();
  };

  // ============================================================================
  // WAVE INITIALIZATION & PROGRESSION
  // ============================================================================
  const startWave = useCallback((stageNum: number, waveNum: number) => {
    const wavesForStage = STAGE_WAVES[stageNum] || STAGE_WAVES[1];
    const waveCfg = wavesForStage[waveNum - 1] || wavesForStage[0];

    const queue: MonsterType[] = [];
    if (waveCfg.hasBoss) {
      queue.push('boss');
    } else {
      for (let i = 0; i < waveCfg.white; i++) queue.push('white');
      for (let i = 0; i < waveCfg.green; i++) queue.push('green');
      for (let i = 0; i < waveCfg.red; i++) queue.push('red');
      // Shuffle queue for varied monster encounter
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
    }

    const total = queue.length;
    stateRef.current.spawnQueue = queue;
    stateRef.current.waveTotalEnemies = total;
    stateRef.current.waveDefeatedEnemies = 0;
    stateRef.current.spawnInterval = waveCfg.spawnIntervalMs;
    stateRef.current.lastSpawnTime = performance.now();
    stateRef.current.isWaveEnding = false;
    stateRef.current.isGameActive = true;

    setRemainingEnemies(total);

    if (waveCfg.hasBoss) {
      setBossHp(200);
      setWaveBanner('STAGE 5 • FINAL BOSS: GOLDEN VIRUS LORD!');
      setGameModal('boss-intro');
      playBossAlertSound();
      setTimeout(() => {
        setGameModal(null);
        setWaveBanner(null);
      }, 2500);
    } else {
      setWaveBanner(`STAGE ${stageNum} • WAVE ${waveNum}`);
      playPopSound();
      setTimeout(() => {
        setWaveBanner(null);
      }, 1800);
    }
  }, []);

  // Initialize Stage 1 Wave 1 on mount
  useEffect(() => {
    startWave(1, 1);
  }, [startWave]);

  // Shield timer countdown
  useEffect(() => {
    if (shieldActiveTimer <= 0 && shieldCooldownTimer <= 0) return;
    const interval = setInterval(() => {
      if (shieldActiveTimer > 0) {
        setShieldActiveTimer((prev) => Math.max(0, parseFloat((prev - 0.1).toFixed(1))));
      }
      if (shieldCooldownTimer > 0) {
        setShieldCooldownTimer((prev) => Math.max(0, parseFloat((prev - 0.1).toFixed(1))));
      }
    }, 100);
    return () => clearInterval(interval);
  }, [shieldActiveTimer, shieldCooldownTimer]);

  // ============================================================================
  // ABILITY ACTIVATIONS
  // ============================================================================
  const activateBaseShield = useCallback(() => {
    if (!unlockedBaseShield) return;
    if (shieldActiveTimer > 0 || shieldCooldownTimer > 0) return;
    playShieldSound();
    setShieldActiveTimer(BASE_SHIELD_DURATION_SEC);
    setShieldCooldownTimer(BASE_SHIELD_COOLDOWN_SEC);
    stateRef.current.shieldAlpha = 1.0;
  }, [unlockedBaseShield, shieldActiveTimer, shieldCooldownTimer]);

  const fireExplosiveBullet = useCallback(() => {
    if (!unlockedExplosiveBullet || explosiveBulletUsed) return;
    playHeavyLaserSound();
    setExplosiveBulletUsed(true);

    const s = stateRef.current;
    s.bullets.push({
      id: s.nextEntityId++,
      x: s.playerX + 35,
      y: PLAYER_Y - 26,
      radius: 12,
      damage: 30,
      isExplosive: true,
      vx: 11,
    });
  }, [unlockedExplosiveBullet, explosiveBulletUsed]);

  // ============================================================================
  // INPUT CONTROLS (DESKTOP & TOUCH)
  // ============================================================================
  const shootNormalBullet = useCallback(() => {
    const s = stateRef.current;
    const now = performance.now();
    if (now - s.lastShootTime < SHOOT_COOLDOWN_MS) return;
    s.lastShootTime = now;

    playLaserShootSound();
    s.bullets.push({
      id: s.nextEntityId++,
      x: s.playerX + 34,
      y: PLAYER_Y - 25,
      radius: 4,
      damage: weaponDamage,
      isExplosive: false,
      vx: 14,
    });
  }, [weaponDamage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat && (e.key === 'q' || e.key === 'Q' || e.key === 'f' || e.key === 'F')) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setGameModal((prev) => (prev === 'paused' ? null : 'paused'));
        return;
      }

      if (gameModal) return;

      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        stateRef.current.isMovingLeft = true;
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        stateRef.current.isMovingRight = true;
      } else if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
        e.preventDefault();
        stateRef.current.isShooting = true;
        shootNormalBullet();
      } else if (e.key === 'q' || e.key === 'Q') {
        activateBaseShield();
      } else if (e.key === 'f' || e.key === 'F' || e.key === '2') {
        fireExplosiveBullet();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        stateRef.current.isMovingLeft = false;
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        stateRef.current.isMovingRight = false;
      } else if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
        stateRef.current.isShooting = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameModal, shootNormalBullet, activateBaseShield, fireExplosiveBullet]);

  // Touch Handlers for Mobile Buttons
  const handleTouchLeftStart = () => {
    stateRef.current.isMovingLeft = true;
  };
  const handleTouchLeftEnd = () => {
    stateRef.current.isMovingLeft = false;
  };
  const handleTouchRightStart = () => {
    stateRef.current.isMovingRight = true;
  };
  const handleTouchRightEnd = () => {
    stateRef.current.isMovingRight = false;
  };
  const handleTouchShootStart = () => {
    stateRef.current.isShooting = true;
    shootNormalBullet();
  };
  const handleTouchShootEnd = () => {
    stateRef.current.isShooting = false;
  };

  // ============================================================================
  // MONSTER SPAWNING HELPER (EXACT HEALTH & PROPORTIONS)
  // ============================================================================
  const spawnMonster = (type: MonsterType) => {
    const s = stateRef.current;
    let width = 56;
    let height = 54;
    let hp = 100;
    let speed = 1.35;
    let baseDamage = 10;
    let spawnY = GROUND_Y - 27;

    if (type === 'white') {
      width = 56;
      height = 54;
      hp = 100; // White Virus HP: 100
      speed = 1.35;
      baseDamage = 10;
      spawnY = GROUND_Y - 27;
    } else if (type === 'green') {
      width = 62;
      height = 52;
      hp = 100; // Green Virus HP: 100
      speed = 2.45;
      baseDamage = 15;
      spawnY = GROUND_Y - 26;
    } else if (type === 'red') {
      width = 80;
      height = 74;
      hp = 150; // Red Virus HP: 150 (Updated per user specification!)
      speed = 0.72;
      baseDamage = 50;
      spawnY = GROUND_Y - 37;
    } else if (type === 'boss') {
      width = 120;
      height = 130;
      hp = 200; // Golden Boss HP: 200 (Updated per user specification!)
      speed = 0.58;
      baseDamage = 20;
      spawnY = GROUND_Y - 65;
    }

    s.monsters.push({
      id: s.nextEntityId++,
      type,
      x: CANVAS_WIDTH + 40,
      y: spawnY,
      width,
      height,
      hp,
      maxHp: hp,
      speed,
      baseDamage,
      hitFlashTimer: 0,
      animFrame: Math.random() * 10,
    });
  };

  // ============================================================================
  // 60 FPS MAIN GAME LOOP (CANVAS)
  // ============================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const gameLoop = (timestamp: number) => {
      const isPaused = Boolean(gameModal);
      const s = stateRef.current;

      if (!isPaused && s.isGameActive) {
        // 1. Player Movement & Continuous Auto-Shoot
        if (s.isMovingLeft) {
          s.playerX = Math.max(PLAYER_MIN_X, s.playerX - 4.5);
          s.playerFacing = 'left';
        }
        if (s.isMovingRight) {
          s.playerX = Math.min(PLAYER_MAX_X, s.playerX + 4.5);
          s.playerFacing = 'right';
        }
        if (s.isShooting) {
          shootNormalBullet();
        }

        // 2. Monster Spawning from Queue
        if (s.spawnQueue.length > 0 && timestamp - s.lastSpawnTime >= s.spawnInterval) {
          const nextType = s.spawnQueue.shift();
          if (nextType) {
            spawnMonster(nextType);
            s.lastSpawnTime = timestamp;
          }
        }

        // 3. Bullets update & collision
        for (let bIdx = s.bullets.length - 1; bIdx >= 0; bIdx--) {
          const b = s.bullets[bIdx];
          b.x += b.vx;

          let hitMonster: MonsterSpec | null = null;
          // Check collision against monsters
          for (const m of s.monsters) {
            if (
              b.x + b.radius >= m.x - m.width / 2 &&
              b.x - b.radius <= m.x + m.width / 2 &&
              b.y >= m.y - m.height &&
              b.y <= m.y
            ) {
              hitMonster = m;
              break;
            }
          }

          if (hitMonster) {
            if (b.isExplosive) {
              // AOE Blast
              playExplosionSound();
              s.screenShake = 14;
              for (let p = 0; p < 25; p++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = 2 + Math.random() * 6;
                s.particles.push({
                  x: b.x,
                  y: b.y,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd,
                  size: 3 + Math.random() * 4,
                  color: p % 2 === 0 ? '#f97316' : '#ef4444',
                  alpha: 1,
                  decay: 0.035,
                });
              }

              // Damage all monsters within radius 125px
              for (const m of s.monsters) {
                const dist = Math.hypot(m.x - b.x, m.y - m.height / 2 - b.y);
                if (dist <= 125) {
                  m.hp -= b.damage;
                  m.hitFlashTimer = 6;
                  s.damagePopups.push({
                    id: s.nextEntityId++,
                    x: m.x,
                    y: m.y - m.height - 10,
                    text: `-${b.damage} AOE!`,
                    color: '#fbbf24',
                    alpha: 1,
                    vy: -1.8,
                  });
                }
              }
            } else {
              // Normal Bullet Direct Hit (Exactly 20 damage initially!)
              playHitSound();
              hitMonster.hp -= b.damage;
              hitMonster.hitFlashTimer = 5;

              // Sparks
              for (let p = 0; p < 4; p++) {
                s.particles.push({
                  x: b.x,
                  y: b.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  size: 2 + Math.random() * 2,
                  color: '#00CFEF',
                  alpha: 1,
                  decay: 0.07,
                });
              }

              s.damagePopups.push({
                id: s.nextEntityId++,
                x: hitMonster.x,
                y: hitMonster.y - hitMonster.height - 8,
                text: `-${b.damage}`,
                color: '#38bdf8',
                alpha: 1,
                vy: -1.4,
              });
            }

            s.bullets.splice(bIdx, 1);
            continue;
          }

          // Offscreen
          if (b.x > CANVAS_WIDTH + 50) {
            s.bullets.splice(bIdx, 1);
          }
        }

        // 4. Monsters update & base collision
        const isShieldActive = shieldActiveTimer > 0;

        for (let mIdx = s.monsters.length - 1; mIdx >= 0; mIdx--) {
          const m = s.monsters[mIdx];
          m.x -= m.speed;
          m.animFrame += 0.15;
          if (m.hitFlashTimer > 0) m.hitFlashTimer--;

          // Monster Defeated
          if (m.hp <= 0) {
            playPopSound();
            setScore((prev) => prev + (m.type === 'boss' ? 500 : m.type === 'red' ? 50 : 20));
            s.waveDefeatedEnemies++;
            setRemainingEnemies(Math.max(0, s.waveTotalEnemies - s.waveDefeatedEnemies));

            // Explosion Particles
            const particleCount = m.type === 'boss' ? 45 : 16;
            for (let p = 0; p < particleCount; p++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = 1.5 + Math.random() * 5;
              s.particles.push({
                x: m.x,
                y: m.y - m.height / 2,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                size: 2.5 + Math.random() * 3,
                color:
                  m.type === 'white'
                    ? '#e2e8f0'
                    : m.type === 'green'
                    ? '#22c55e'
                    : m.type === 'red'
                    ? '#ef4444'
                    : '#fbbf24',
                alpha: 1,
                decay: 0.03,
              });
            }

            if (m.type === 'boss') {
              setBossHp(0);
              playMarioWinSound();
              s.isGameActive = false;
              setTimeout(() => {
                setGameModal('victory');
              }, 800);
            }

            s.monsters.splice(mIdx, 1);
            continue;
          }

          // Monster reached computer base crash line
          if (m.x <= BASE_CRASH_LINE) {
            if (isShieldActive) {
              // SHIELD BLOCKS DAMAGE!
              playShieldSound();
              s.screenShake = 4;
              s.damagePopups.push({
                id: s.nextEntityId++,
                x: BASE_CRASH_LINE + 15,
                y: m.y - 10,
                text: 'SHIELD DEFLECTED!',
                color: '#34d399',
                alpha: 1,
                vy: -1.5,
              });
              for (let p = 0; p < 8; p++) {
                s.particles.push({
                  x: BASE_CRASH_LINE,
                  y: m.y - 20,
                  vx: 2 + Math.random() * 4,
                  vy: (Math.random() - 0.5) * 4,
                  size: 3,
                  color: '#34d399',
                  alpha: 1,
                  decay: 0.05,
                });
              }
            } else {
              // BASE TAKES DAMAGE!
              playHurtSound();
              s.screenShake = 10;
              s.baseFlash = 8;
              setBaseCurrentHp((prev) => {
                const nextHp = Math.max(0, prev - m.baseDamage);
                if (nextHp <= 0) {
                  playOverSound();
                  s.isGameActive = false;
                  setTimeout(() => {
                    setGameModal('game-over');
                  }, 400);
                }
                return nextHp;
              });

              s.damagePopups.push({
                id: s.nextEntityId++,
                x: BASE_X + BASE_WIDTH / 2,
                y: 220,
                text: `-${m.baseDamage} BASE HP!`,
                color: '#ef4444',
                alpha: 1,
                vy: -1.6,
              });
            }

            // Monster disintegrates on crashing into base
            s.waveDefeatedEnemies++;
            setRemainingEnemies(Math.max(0, s.waveTotalEnemies - s.waveDefeatedEnemies));
            s.monsters.splice(mIdx, 1);
          }
        }

        // Update Boss HP in HUD if boss is alive
        const bossMonster = s.monsters.find((m) => m.type === 'boss');
        if (bossMonster) {
          setBossHp(Math.max(0, bossMonster.hp));
        }

        // 5. Particles & Damage Popups update
        for (let pIdx = s.particles.length - 1; pIdx >= 0; pIdx--) {
          const p = s.particles[pIdx];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;
          if (p.alpha <= 0) s.particles.splice(pIdx, 1);
        }

        for (let dIdx = s.damagePopups.length - 1; dIdx >= 0; dIdx--) {
          const d = s.damagePopups[dIdx];
          d.y += d.vy;
          d.alpha -= 0.025;
          if (d.alpha <= 0) s.damagePopups.splice(dIdx, 1);
        }

        if (s.screenShake > 0) s.screenShake -= 0.8;
        if (s.baseFlash > 0) s.baseFlash--;

        // 6. Wave Clear Check
        if (
          !s.isWaveEnding &&
          s.spawnQueue.length === 0 &&
          s.monsters.length === 0 &&
          s.waveDefeatedEnemies >= s.waveTotalEnemies &&
          s.isGameActive
        ) {
          s.isWaveEnding = true;
          handleWaveClear();
        }
      }

      // ========================================================================
      // CANVAS RENDERING (PIXEL ART STYLE)
      // ========================================================================
      ctx.save();
      ctx.imageSmoothingEnabled = false;

      // Handle screen shake
      if (s.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * s.screenShake;
        const shakeY = (Math.random() - 0.5) * s.screenShake;
        ctx.translate(shakeX, shakeY);
      }

      // 1. Background (Dark Cyberpunk Grid & Skyline)
      ctx.fillStyle = '#050914';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Cyber grid lines
      ctx.strokeStyle = 'rgba(0, 207, 239, 0.07)';
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_WIDTH; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // City silhouette in background
      ctx.fillStyle = '#081026';
      const buildingData = [
        [40, 240, 70],
        [120, 290, 60],
        [190, 210, 80],
        [280, 270, 70],
        [360, 230, 90],
        [460, 260, 65],
        [540, 220, 85],
        [640, 280, 60],
        [710, 200, 90],
        [810, 250, 70],
        [890, 230, 80],
      ];
      buildingData.forEach(([bx, bh, bw]) => {
        ctx.fillRect(bx, GROUND_Y - bh, bw, bh);
        ctx.fillStyle = 'rgba(0, 207, 239, 0.18)';
        for (let wy = GROUND_Y - bh + 15; wy < GROUND_Y - 20; wy += 25) {
          ctx.fillRect(bx + 10, wy, 6, 8);
          ctx.fillRect(bx + bw - 16, wy, 6, 8);
        }
        ctx.fillStyle = '#081026';
      });

      // Ground (Circuit Board Line)
      ctx.fillStyle = '#0b1329';
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
      // Top neon strip of ground
      ctx.fillStyle = '#00CFEF';
      ctx.fillRect(0, GROUND_Y - 3, CANVAS_WIDTH, 3);
      // Circuit lines on ground
      ctx.strokeStyle = 'rgba(0, 207, 239, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y + 16);
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y + 16);
      ctx.moveTo(60, GROUND_Y + 36);
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y + 36);
      ctx.stroke();

      // 2. COMPUTER BASE (Pixel Art PC Case)
      drawComputerBase(ctx, s.baseFlash > 0, shieldActiveTimer > 0);

      // 3. BASE SHIELD EFFECT
      if (shieldActiveTimer > 0) {
        drawShieldEffect(ctx, BASE_CRASH_LINE, GROUND_Y);
      }

      // 4. BULLETS
      s.bullets.forEach((b) => {
        if (b.isExplosive) {
          ctx.fillStyle = '#f97316';
          ctx.fillRect(b.x - 12, b.y - 6, 24, 12);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(b.x + 12, b.y - 3, 6, 6);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(b.x - 18, b.y - 4, 6, 8);
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(b.x - 8, b.y - 3, 16, 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(b.x - 4, b.y - 1.5, 10, 3);
        }
      });

      // 5. PLAYER CHARACTER (Profile Avatar with Laser Gun)
      drawPlayer(
        ctx,
        s.playerX,
        PLAYER_Y,
        s.playerFacing,
        activeCharConfig,
        s.isMovingLeft || s.isMovingRight,
        s.isShooting
      );

      // 6. MONSTERS (Transparent High-Res Pixel Art Sprites from Reference)
      s.monsters.forEach((m) => {
        drawMonster(ctx, m);
      });

      // 7. PARTICLES
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      });
      ctx.globalAlpha = 1.0;

      // 8. DAMAGE POPUPS
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      s.damagePopups.forEach((d) => {
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = Math.max(0, d.alpha);
        ctx.fillText(d.text, d.x + 1, d.y + 1);
        ctx.fillStyle = d.color;
        ctx.fillText(d.text, d.x, d.y);
      });
      ctx.globalAlpha = 1.0;

      ctx.restore();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameModal, shootNormalBullet, shieldActiveTimer, activeCharConfig]);

  // Wave Clear Handler
  const handleWaveClear = useCallback(() => {
    const wavesForStage = STAGE_WAVES[currentStage] || STAGE_WAVES[1];
    const isFinalWaveOfStage = currentWave >= wavesForStage.length;

    playMarioCorrectSound();

    if (isFinalWaveOfStage) {
      if (currentStage === 1) {
        setGameModal('stage1-upgrade');
      } else if (currentStage === 2) {
        setGameModal('stage2-upgrade');
      } else if (currentStage === 3) {
        setGameModal('stage3-ability');
      } else if (currentStage === 4) {
        setGameModal('stage4-prompt');
      } else if (currentStage === 5) {
        setGameModal('victory');
      }
    } else {
      const nextWaveNum = currentWave + 1;
      setCurrentWave(nextWaveNum);
      setTimeout(() => {
        startWave(currentStage, nextWaveNum);
      }, 1400);
    }
  }, [currentStage, currentWave, startWave]);

  // ============================================================================
  // UPGRADE SELECTION HANDLERS
  // ============================================================================
  const handleStage1Upgrade = (choice: 'damage' | 'hp') => {
    playClearSound();
    setStage1UpgradeChoice(choice);
    if (choice === 'damage') {
      setWeaponDamage(30); // 20 -> 30
    } else {
      setBaseMaxHp(250);
      setBaseCurrentHp((prev) => Math.min(250, prev + 50));
    }
    setGameModal(null);
    setCurrentStage(2);
    setCurrentWave(1);
    setTimeout(() => startWave(2, 1), 500);
  };

  const handleStage2Upgrade = (type: 'damage' | 'hp') => {
    playClearSound();
    if (stage1UpgradeChoice === 'damage') {
      if (type === 'damage') {
        setWeaponDamage(40); // 30 -> 40
      } else {
        setBaseMaxHp(250);
        setBaseCurrentHp((prev) => Math.min(250, prev + 50));
      }
    } else {
      // Stage 1 was Base HP
      if (type === 'damage') {
        setWeaponDamage(30); // 20 -> 30
      } else {
        setBaseMaxHp(270);
        setBaseCurrentHp((prev) => Math.min(270, prev + 20));
      }
    }
    setGameModal(null);
    setCurrentStage(3);
    setCurrentWave(1);
    setTimeout(() => startWave(3, 1), 500);
  };

  const handleStage3Ability = (ability: 'shield' | 'explosive') => {
    playClearSound();
    if (ability === 'shield') {
      setUnlockedBaseShield(true);
    } else {
      setUnlockedExplosiveBullet(true);
    }
    setExplosiveBulletUsed(false);
    setGameModal(null);
    setCurrentStage(4);
    setCurrentWave(1);
    setTimeout(() => startWave(4, 1), 500);
  };

  const handleStage4ProceedToBoss = () => {
    playSelectSound();
    setExplosiveBulletUsed(false);
    setGameModal(null);
    setCurrentStage(5);
    setCurrentWave(1);
    setTimeout(() => startWave(5, 1), 500);
  };

  const restartFullGame = () => {
    playSelectSound();
    setCurrentStage(1);
    setCurrentWave(1);
    setScore(0);
    setWeaponDamage(20);
    setBaseCurrentHp(200);
    setBaseMaxHp(200);
    setUnlockedBaseShield(false);
    setUnlockedExplosiveBullet(false);
    setExplosiveBulletUsed(false);
    setStage1UpgradeChoice(null);
    setShieldActiveTimer(0);
    setShieldCooldownTimer(0);
    setGameModal(null);
    stateRef.current.bullets = [];
    stateRef.current.monsters = [];
    stateRef.current.particles = [];
    stateRef.current.damagePopups = [];
    startWave(1, 1);
  };

  const handleExitToMenu = () => {
    playSelectSound();
    stopAllSounds();
    if (onBackToMenu) {
      onBackToMenu();
    } else {
      router.push('/subjects');
    }
  };

  // ============================================================================
  // PIXEL ART DRAWING SUBROUTINES
  // ============================================================================
  function drawComputerBase(ctx: CanvasRenderingContext2D, isFlashing: boolean, hasShield: boolean) {
    ctx.save();
    // Computer Chassis
    ctx.fillStyle = isFlashing ? '#ef4444' : '#0c1322';
    ctx.fillRect(BASE_X, GROUND_Y - BASE_HEIGHT, BASE_WIDTH, BASE_HEIGHT);

    // Border
    ctx.strokeStyle = isFlashing ? '#ffffff' : hasShield ? '#34d399' : '#00CFEF';
    ctx.lineWidth = 3;
    ctx.strokeRect(BASE_X, GROUND_Y - BASE_HEIGHT, BASE_WIDTH, BASE_HEIGHT);

    // Tempered Glass Inner Panel
    ctx.fillStyle = '#060a14';
    ctx.fillRect(BASE_X + 10, GROUND_Y - BASE_HEIGHT + 14, BASE_WIDTH - 20, BASE_HEIGHT - 30);

    // Dual Glowing RGB Fans
    const time = performance.now() * 0.006;
    [GROUND_Y - BASE_HEIGHT + 60, GROUND_Y - BASE_HEIGHT + 130].forEach((fanY) => {
      ctx.save();
      ctx.translate(BASE_X + BASE_WIDTH / 2, fanY);
      ctx.rotate(time);
      ctx.strokeStyle = hasShield ? '#34d399' : '#00CFEF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = hasShield ? 'rgba(52, 211, 153, 0.4)' : 'rgba(0, 207, 239, 0.4)';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillRect(-3, -22, 6, 20);
      }
      ctx.restore();
    });

    // Motherboard Status LEDs
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(BASE_X + 18, GROUND_Y - 40, 6, 6);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(BASE_X + 30, GROUND_Y - 40, 6, 6);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(BASE_X + 42, GROUND_Y - 40, 6, 6);

    // PC Label Tag
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('CORE BASE', BASE_X + BASE_WIDTH / 2, GROUND_Y - BASE_HEIGHT + 24);

    ctx.restore();
  }

  function drawShieldEffect(ctx: CanvasRenderingContext2D, crashX: number, groundY: number) {
    ctx.save();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(crashX, groundY - BASE_HEIGHT - 20);
    ctx.quadraticCurveTo(crashX + 30, groundY - BASE_HEIGHT / 2, crashX, groundY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(52, 211, 153, 0.12)';
    ctx.beginPath();
    ctx.moveTo(BASE_X + BASE_WIDTH, groundY - BASE_HEIGHT);
    ctx.lineTo(crashX, groundY - BASE_HEIGHT - 20);
    ctx.quadraticCurveTo(crashX + 30, groundY - BASE_HEIGHT / 2, crashX, groundY);
    ctx.lineTo(BASE_X + BASE_WIDTH, groundY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // Draw Player Character using the Profile Avatar (PixelCharacter)
  function drawPlayer(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    facing: 'left' | 'right',
    config?: CharacterConfig | null,
    isMoving: boolean = false,
    isShooting: boolean = false
  ) {
    ctx.save();
    const bob = isMoving ? Math.abs(Math.sin(performance.now() * 0.015)) * 3 : 0;
    ctx.translate(px, py - bob);

    if (facing === 'left') {
      ctx.scale(-1, 1);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, bob + 2, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Render exact Profile Avatar via getPixelCharacterPixels
    const activeConfig = config || DEFAULT_CHARACTER_CONFIG;
    const pixels = getPixelCharacterPixels(activeConfig);
    const pixelScale = 2.4; // 18x22 grid * 2.4 => 43.2x52.8 px

    const offsetX = -9 * pixelScale;
    const offsetY = -22 * pixelScale;

    pixels.forEach((p) => {
      ctx.fillStyle = p.fill;
      ctx.fillRect(
        offsetX + p.x * pixelScale,
        offsetY + p.y * pixelScale,
        (p.w || 1) * pixelScale,
        (p.h || 1) * pixelScale
      );
    });

    // Cyber Laser Cannon in forward hand
    ctx.fillStyle = '#334155';
    ctx.fillRect(8, -26, 18, 7);
    ctx.fillStyle = '#00CFEF';
    ctx.fillRect(24, -28, 5, 11);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(12, -24, 10, 3);

    // Muzzle flash when shooting
    if (isShooting) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(31, -22, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00CFEF';
      ctx.beginPath();
      ctx.arc(31, -22, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw Monster using the Attached Transparent Sprites
  function drawMonster(ctx: CanvasRenderingContext2D, m: MonsterSpec) {
    ctx.save();
    ctx.translate(m.x, m.y);

    const isFlashing = m.hitFlashTimer > 0;
    const animOffset = Math.sin(m.animFrame) * 3;

    // Mini Health Bar above monster
    const hpPct = Math.max(0, m.hp / m.maxHp);
    const barWidth = Math.max(42, m.width);
    ctx.fillStyle = '#000000';
    ctx.fillRect(-barWidth / 2, -m.height - 18 + animOffset, barWidth, 6);
    ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(-barWidth / 2 + 1, -m.height - 17 + animOffset, (barWidth - 2) * hpPct, 4);

    // Numeric HP indicator
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.max(0, m.hp)}`, 0, -m.height - 21 + animOffset);

    // Draw Transparent Monster Sprite
    const img = monsterImagesRef.current[m.type];
    if (img && img.complete && img.naturalWidth > 0) {
      if (isFlashing) {
        ctx.filter = 'brightness(2.2) contrast(1.2)';
      }
      ctx.drawImage(
        img,
        -m.width / 2,
        -m.height + animOffset,
        m.width,
        m.height
      );
      ctx.filter = 'none';
    } else {
      // Fallback if image still loading
      ctx.fillStyle = m.type === 'white' ? '#e2e8f0' : m.type === 'green' ? '#22c55e' : m.type === 'red' ? '#ef4444' : '#eab308';
      ctx.fillRect(-m.width / 2, -m.height + animOffset, m.width, m.height);
    }

    ctx.restore();
  }

  // ============================================================================
  // COMPONENT RENDER (RESPONSIVE + TOUCH CONTROLS)
  // ============================================================================
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-screen h-[100dvh] flex flex-col bg-[#050914] text-white select-none overflow-hidden touch-none"
    >
      {/* 1. TOP HEADER HUD */}
      <header className="h-13 sm:h-14 px-3 sm:px-6 bg-[#080e1e] border-b border-slate-800 flex items-center justify-between shrink-0 z-30">
        {/* Left: Stage & Wave */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleExitToMenu}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="กลับสู่หน้าเลือกเกม"
          >
            <Gamepad2 className="w-4 h-4 text-amber-400" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/50 text-[11px] sm:text-xs font-mono font-bold text-cyan-300">
                STAGE {currentStage}/5
              </span>
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                WAVE {currentWave}/{currentStage === 5 ? 1 : 3}
              </span>
            </div>
            <div className="text-[10px] font-thai text-slate-400 hidden md:block">
              ปกป้องฐานคอมพิวเตอร์จากเหล่าไวรัส!
            </div>
          </div>
        </div>

        {/* Center: Computer Base HP Health Bar */}
        <div className="flex items-center gap-2 max-w-xs sm:max-w-sm w-full mx-2 sm:mx-4">
          <Shield
            className={`w-4 h-4 shrink-0 transition-colors ${
              shieldActiveTimer > 0 ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'
            }`}
          />
          <div className="flex-1">
            <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-mono mb-0.5">
              <span className="text-slate-300 font-bold">BASE HP</span>
              <span
                className={`font-bold ${
                  baseCurrentHp <= 50
                    ? 'text-rose-400'
                    : baseCurrentHp <= 100
                    ? 'text-amber-400'
                    : 'text-emerald-300'
                }`}
              >
                {baseCurrentHp}/{baseMaxHp}
              </span>
            </div>
            <div className="w-full h-2.5 sm:h-3 rounded-full bg-slate-950 border border-slate-700 overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  shieldActiveTimer > 0
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                    : baseCurrentHp <= 50
                    ? 'bg-rose-500'
                    : baseCurrentHp <= 100
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.max(0, (baseCurrentHp / baseMaxHp) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Score + Sound + Tutorial + Pause */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-amber-500/40 text-xs font-mono font-bold text-amber-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{score}</span>
          </div>

          <button
            type="button"
            onClick={() => setGameModal('tutorial')}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="คู่มือวิธีการเล่น"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            title={muted ? 'เปิดเสียง' : 'ปิดเสียง'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            type="button"
            onClick={() => setGameModal('paused')}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-thai font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-[0_0_12px_rgba(225,29,72,0.4)]"
          >
            <Pause className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">พักเกม</span>
          </button>
        </div>
      </header>

      {/* 2. GAME CANVAS ARENA */}
      <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
        {/* Boss HP Bar in Stage 5 (Golden Boss: 200 HP) */}
        {currentStage === 5 && (
          <div className="absolute top-3 inset-x-4 max-w-md mx-auto z-20 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-amber-300 font-cyber font-bold text-xs tracking-wider mb-1">
              <Crown className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>GOLDEN VIRUS LORD • FINAL BOSS</span>
              <span className="font-mono text-white text-[11px]">({bossHp}/200 HP)</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-950 border-2 border-amber-400/80 overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 transition-all duration-150"
                style={{ width: `${Math.max(0, (bossHp / 200) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Wave Banner Notification */}
        {waveBanner && (
          <div className="absolute top-1/4 inset-x-0 z-20 flex justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
            <div className="px-6 py-2.5 rounded-2xl bg-slate-950/90 border-2 border-cyan-400 text-cyan-300 font-cyber font-bold text-base sm:text-xl shadow-[0_0_30px_rgba(0,207,239,0.5)]">
              {waveBanner}
            </div>
          </div>
        )}

        {/* 60 FPS Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full max-h-[100%] object-contain"
        />
      </div>

      {/* 3. MOBILE & DESKTOP CONTROLS FOOTER */}
      <footer className="w-full bg-[#070c1a] border-t-2 border-slate-800/90 px-3 py-2 sm:py-3 z-30 select-none shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Left D-Pad: Walk Left / Walk Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onMouseDown={handleTouchLeftStart}
              onMouseUp={handleTouchLeftEnd}
              onTouchStart={handleTouchLeftStart}
              onTouchEnd={handleTouchLeftEnd}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border-2 border-slate-700 active:translate-y-1 shadow-[0_4px_0_#1e293b] flex items-center justify-center cursor-pointer touch-manipulation"
              title="เดินซ้าย (A / ←)"
            >
              <div className="w-0 h-0 border-y-[10px] border-y-transparent border-r-[16px] border-r-cyan-400 drop-shadow-[0_0_6px_rgba(0,207,239,0.7)]" />
            </button>

            <button
              type="button"
              onMouseDown={handleTouchRightStart}
              onMouseUp={handleTouchRightEnd}
              onTouchStart={handleTouchRightStart}
              onTouchEnd={handleTouchRightEnd}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border-2 border-slate-700 active:translate-y-1 shadow-[0_4px_0_#1e293b] flex items-center justify-center cursor-pointer touch-manipulation"
              title="เดินขวา (D / →)"
            >
              <div className="w-0 h-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-cyan-400 drop-shadow-[0_0_6px_rgba(0,207,239,0.7)]" />
            </button>
          </div>

          {/* Center Info: Weapon & Remaining Wave Enemies */}
          <div className="hidden sm:flex flex-col items-center text-center">
            <div className="text-[11px] font-mono text-cyan-300">
              DAMAGE: <strong className="text-white">{weaponDamage}</strong> PTS / HIT
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              ศัตรูในเวฟนี้: {remainingEnemies} ตัว
            </div>
          </div>

          {/* Right Action Buttons: Shield + Explosive + SHOOT */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Ability 1: Base Shield (Q) */}
            {unlockedBaseShield && (
              <button
                type="button"
                onClick={activateBaseShield}
                disabled={shieldActiveTimer > 0 || shieldCooldownTimer > 0}
                className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  shieldActiveTimer > 0
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)] animate-pulse'
                    : shieldCooldownTimer > 0
                    ? 'bg-slate-900 border-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                }`}
                title="เปิดโล่ป้องกันฐาน (Q)"
              >
                <Shield className="w-4 h-4 mb-0.5" />
                <span className="text-[9px] font-mono font-bold">
                  {shieldActiveTimer > 0
                    ? `${shieldActiveTimer}s`
                    : shieldCooldownTimer > 0
                    ? `${Math.ceil(shieldCooldownTimer)}s`
                    : 'Q โล่'}
                </span>
              </button>
            )}

            {/* Ability 2: Explosive Bullet (F / 2) */}
            {unlockedExplosiveBullet && (
              <button
                type="button"
                onClick={fireExplosiveBullet}
                disabled={explosiveBulletUsed}
                className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  explosiveBulletUsed
                    ? 'bg-slate-900 border-slate-700 text-slate-600 cursor-not-allowed line-through'
                    : 'bg-amber-950/80 border-amber-500/80 text-amber-300 hover:scale-105 active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                }`}
                title="กระสุนระเบิด 30 DMG (F / 2)"
              >
                <Flame className="w-4 h-4 mb-0.5 text-amber-400" />
                <span className="text-[9px] font-mono font-bold">
                  {explosiveBulletUsed ? 'ใช้แล้ว' : 'F ระเบิด'}
                </span>
              </button>
            )}

            {/* Primary Shoot Button (E / Space / Touch) */}
            <button
              type="button"
              onMouseDown={handleTouchShootStart}
              onMouseUp={handleTouchShootEnd}
              onTouchStart={handleTouchShootStart}
              onTouchEnd={handleTouchShootEnd}
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600 active:translate-y-1 shadow-[0_6px_0_#0369a1,0_0_20px_rgba(0,207,239,0.6)] border-3 border-cyan-200 flex flex-col items-center justify-center cursor-pointer touch-manipulation"
              title="ยิงกระสุน 20 DMG (E / Space / คลิกเมาส์)"
            >
              <Zap className="w-5 h-5 text-slate-950 fill-slate-950 mb-0.5" />
              <span className="font-thai font-black text-slate-950 text-xs sm:text-sm tracking-wider">
                ยิง! (E)
              </span>
            </button>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          4. MODALS & POPUPS
          ===================================================================== */}

      {/* MODAL: STAGE 1 CLEAR UPGRADE */}
      {gameModal === 'stage1-upgrade' && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full rounded-2xl bg-[#0f172a] border-2 border-cyan-400 p-5 sm:p-6 text-center space-y-4 shadow-[0_0_40px_rgba(0,207,239,0.35)]">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>STAGE 1 COMPLETE!</span>
            </div>
            <h3 className="text-xl font-cyber font-bold text-white">เลือกอัพเกรด (เลือกได้ 1 อย่าง)</h3>
            <p className="text-xs font-thai text-slate-300">
              คุณผ่านด่านที่ 1 แล้ว! กรุณาเลือกอัพเกรดเพื่อรับมือกับไวรัสในด่านถัดไป
            </p>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleStage1Upgrade('damage')}
                className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-cyan-400/80 hover:border-cyan-300 text-left transition-all cursor-pointer group shadow-[0_0_15px_rgba(0,207,239,0.2)]"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-cyber font-bold text-cyan-300 text-sm">
                    1. Weapon Damage (พลังโจมตี)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold">
                    20 → 30 DMG
                  </span>
                </div>
                <p className="text-xs font-thai text-slate-400">
                  เพิ่มพลังทำลายของกระสุนปกติจาก 20 เป็น 30 จัดการไวรัสได้ไวยิ่งขึ้น
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleStage1Upgrade('hp')}
                className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-emerald-400/80 hover:border-emerald-300 text-left transition-all cursor-pointer group shadow-[0_0_15px_rgba(52,211,153,0.2)]"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-cyber font-bold text-emerald-300 text-sm">
                    2. Base HP (พลังชีวิตฐาน)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
                    200 → 250 HP
                  </span>
                </div>
                <p className="text-xs font-thai text-slate-400">
                  เพิ่มพลังชีวิตสูงสุดของฐานคอมพิวเตอร์เป็น 250 และฟื้นฟูพลังชีวิตทันที
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STAGE 2 CLEAR UPGRADE */}
      {gameModal === 'stage2-upgrade' && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full rounded-2xl bg-[#0f172a] border-2 border-cyan-400 p-5 sm:p-6 text-center space-y-4 shadow-[0_0_40px_rgba(0,207,239,0.35)]">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>STAGE 2 COMPLETE!</span>
            </div>
            <h3 className="text-xl font-cyber font-bold text-white">เลือกอัพเกรดขั้นที่ 2</h3>
            <p className="text-xs font-thai text-slate-300">
              อัพเกรดจะอิงตามตัวเลือกที่คุณเลือกไว้ในด่านที่ 1
            </p>

            <div className="grid grid-cols-1 gap-3 pt-2">
              {stage1UpgradeChoice === 'damage' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleStage2Upgrade('damage')}
                    className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-cyan-400 hover:border-cyan-300 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-cyber font-bold text-cyan-300 text-sm">
                        1. Weapon Damage (พลังโจมตี)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold">
                        30 → 40 DMG
                      </span>
                    </div>
                    <p className="text-xs font-thai text-slate-400">
                      ยกระดับความเสียหายขึ้นสู่ 40 DMG ยิงทะลวงไวรัสได้ในพริบตา
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStage2Upgrade('hp')}
                    className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-emerald-400 hover:border-emerald-300 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-cyber font-bold text-emerald-300 text-sm">
                        2. Base HP (พลังชีวิตฐาน)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
                        200 → 250 HP
                      </span>
                    </div>
                    <p className="text-xs font-thai text-slate-400">
                      เสริมเกราะฐานเป็น 250 HP และฟื้นฟูพลังชีวิตฐาน
                    </p>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleStage2Upgrade('damage')}
                    className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-cyan-400 hover:border-cyan-300 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-cyber font-bold text-cyan-300 text-sm">
                        1. Weapon Damage (พลังโจมตี)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold">
                        20 → 30 DMG
                      </span>
                    </div>
                    <p className="text-xs font-thai text-slate-400">
                      เพิ่มพลังทำลายของกระสุนขึ้นเป็น 30 DMG
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStage2Upgrade('hp')}
                    className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-emerald-400 hover:border-emerald-300 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-cyber font-bold text-emerald-300 text-sm">
                        2. Base HP (พลังชีวิตฐาน)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
                        250 → 270 HP
                      </span>
                    </div>
                    <p className="text-xs font-thai text-slate-400">
                      ขยายขีดสุดพลังชีวิตฐานเป็น 270 HP อึดทนทานสูงสุด
                    </p>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STAGE 3 CLEAR SPECIAL ABILITY */}
      {gameModal === 'stage3-ability' && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full rounded-2xl bg-[#0f172a] border-2 border-amber-400 p-5 sm:p-6 text-center space-y-4 shadow-[0_0_40px_rgba(245,158,11,0.35)]">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-mono font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>SPECIAL ABILITY UNLOCKED!</span>
            </div>
            <h3 className="text-xl font-cyber font-bold text-white">เลือกสกิลพิเศษ (เลือกได้ 1 สกิล)</h3>
            <p className="text-xs font-thai text-slate-300">
              สกิลนี้จะติดตัวคุณไปใช้ในด่านที่ 4 และด่านต่อสู้บอส (ด่าน 5)!
            </p>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleStage3Ability('shield')}
                className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-emerald-400 hover:border-emerald-300 text-left transition-all cursor-pointer group shadow-[0_0_15px_rgba(52,211,153,0.25)]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span className="font-cyber font-bold text-emerald-300 text-sm">
                    Option 1: Base Shield (โล่ป้องกันฐาน)
                  </span>
                </div>
                <p className="text-xs font-thai text-slate-300 leading-relaxed">
                  กดปุ่ม <span className="font-mono text-white font-bold">[Q]</span> หรือปุ่มสัมผัส เพื่อเปิดเกราะป้องกันฐานคอมพิวเตอร์เป็นเวลา <strong>5 วินาที</strong> ป้องกันความเสียหายทุกชนิด!
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleStage3Ability('explosive')}
                className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-amber-400 hover:border-amber-300 text-left transition-all cursor-pointer group shadow-[0_0_15px_rgba(245,158,11,0.25)]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <span className="font-cyber font-bold text-amber-300 text-sm">
                    Option 2: Explosive Bullet (กระสุนระเบิด)
                  </span>
                </div>
                <p className="text-xs font-thai text-slate-300 leading-relaxed">
                  กดปุ่ม <span className="font-mono text-white font-bold">[F]</span> หรือปุ่มสัมผัส ยิงขีปนาวุธระเบิดสร้างความเสียหาย <strong>30 DMG</strong> แบบวงกว้าง ใช้ได้ด่านละ 1 ครั้ง!
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STAGE 4 COMPLETE PROMPT */}
      {gameModal === 'stage4-prompt' && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full rounded-2xl bg-[#0f172a] border-2 border-rose-500 p-5 sm:p-6 text-center space-y-4 shadow-[0_0_40px_rgba(244,63,94,0.35)]">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg sm:text-xl font-thai font-bold text-white leading-relaxed">
              &ldquo;โทษทีนะด่านนี้ไม่มีอัพเกรด เตรียมใจสู้บอสหรือยังล่ะ?&rdquo;
            </h3>

            <p className="text-xs font-thai text-slate-300">
              ด่านที่ 5 คือการเผชิญหน้ากับ Golden Virus Lord (Boss HP: 200)!
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleExitToMenu}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-thai font-bold text-sm cursor-pointer transition-all"
              >
                ยอมแพ้
              </button>

              <button
                type="button"
                onClick={handleStage4ProceedToBoss}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-thai font-extrabold text-sm shadow-[0_0_20px_rgba(244,63,94,0.45)] cursor-pointer transition-all active:scale-95"
              >
                สู้บอสเลย!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GAME OVER */}
      {gameModal === 'game-over' && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full rounded-2xl bg-[#0f172a] border-2 border-rose-500 p-6 text-center space-y-4 shadow-[0_0_50px_rgba(244,63,94,0.4)]">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-2xl font-cyber font-bold text-rose-400">BASE DESTROYED!</h3>
            <p className="text-sm font-thai text-slate-300">
              ฐานคอมพิวเตอร์ถูกไวรัสเจาะทำลาย! คุณทำคะแนนได้{' '}
              <strong className="text-cyan-300 font-mono">{score} PTS</strong>
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={restartFullGame}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-thai font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.35)]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>เล่นใหม่อีกครั้ง (Restart Game)</span>
              </button>

              <button
                type="button"
                onClick={handleExitToMenu}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-thai font-bold text-sm cursor-pointer"
              >
                กลับสู่หน้าเลือกเกม
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VICTORY SCREEN */}
      {gameModal === 'victory' && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in duration-300">
          <div className="max-w-md w-full rounded-2xl bg-[#0f172a] border-2 border-amber-400 p-6 text-center space-y-4 shadow-[0_0_60px_rgba(245,158,11,0.5)]">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 animate-bounce">
              <Crown className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-cyber font-bold text-amber-300">VICTORY CLEAR!</h3>
            <p className="text-sm font-thai text-slate-200">
              ยินดีด้วย! คุณได้ปกป้องฐานคอมพิวเตอร์และปราบ <strong>Golden Virus Lord (200 HP)</strong> สำเร็จครบทั้ง 5 ด่าน!
            </p>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 space-y-1 font-mono text-xs">
              <div className="flex justify-between text-slate-300">
                <span>FINAL SCORE:</span>
                <span className="text-amber-300 font-bold">{score} PTS</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>BASE HP REMAINING:</span>
                <span className="text-emerald-300 font-bold">
                  {baseCurrentHp}/{baseMaxHp}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>WEAPON FINAL DAMAGE:</span>
                <span className="text-cyan-300 font-bold">{weaponDamage} DMG</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={restartFullGame}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-thai font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.45)]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>เล่นอีกครั้ง (Play Again)</span>
              </button>

              <button
                type="button"
                onClick={handleExitToMenu}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-thai font-bold text-sm cursor-pointer"
              >
                กลับสู่หน้าเลือกเกม
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PAUSE MENU */}
      {gameModal === 'paused' && (
        <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full rounded-2xl bg-[#0f172a] border-2 border-cyan-400 p-5 sm:p-6 text-center space-y-4 shadow-[0_0_40px_rgba(0,207,239,0.3)]">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-mono font-bold">
              <Pause className="w-3.5 h-3.5" />
              <span>GAME PAUSED • พักเกมชั่วคราว</span>
            </div>

            <h3 className="text-lg font-cyber font-bold text-white">PC SHOOTING</h3>
            <p className="text-xs font-thai text-slate-300">
              STAGE {currentStage}/5 • WAVE {currentWave} • คะแนน {score} PTS
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setGameModal(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-thai font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.35)]"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>เล่นเกมต่อ (Resume)</span>
              </button>

              <button
                type="button"
                onClick={() => setGameModal('tutorial')}
                className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-300 font-thai font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
                <span>คู่มือวิธีการเล่น (How to Play)</span>
              </button>

              <button
                type="button"
                onClick={restartFullGame}
                className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-thai font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>เริ่มเล่นด่าน 1 ใหม่ (Restart)</span>
              </button>

              <button
                type="button"
                onClick={handleExitToMenu}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-thai font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.3)]"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>กลับสู่หน้าเลือกเกม (Game Select)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TUTORIAL POPUP */}
      {gameModal === 'tutorial' && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="max-w-lg w-full rounded-2xl bg-[#0f172a] border-2 border-cyan-400 p-4 sm:p-6 text-white space-y-4 shadow-[0_0_40px_rgba(0,207,239,0.4)] max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shrink-0">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-cyber font-bold text-cyan-300">
                    คู่มือการเล่น PC SHOOTING
                  </h3>
                  <p className="text-[11px] font-thai text-slate-400">
                    ปกป้องฐานคอมพิวเตอร์จากเหล่าไวรัส!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeTutorial}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-thai text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 space-y-1">
                <span className="font-bold text-amber-300 text-xs">เป้าหมายของเกม:</span>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  ไวรัสจะเดินมาจากขวาเข้าหาเคสคอมพิวเตอร์ (ฐาน) ทางซ้าย หากไวรัสชนฐานจะทำให้ HP ฐานลดลง คุณต้องควบคุมตัวละครเดินยิงสกัดไวรัสให้หมดทุกเวฟ (กระสุนเริ่มต้นนัดละ 20 DMG) เอาชีวิตรอดครบ 5 ด่าน และปราบ Golden Virus Boss (200 HP)!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 space-y-1">
                  <span className="font-bold text-cyan-300 text-xs">การควบคุมบนคอม (Keyboard):</span>
                  <ul className="text-[11px] space-y-0.5 text-slate-300">
                    <li>• <span className="font-mono text-cyan-200 font-bold">[A] [D]</span> หรือ <span className="font-mono text-cyan-200 font-bold">[←] [→]</span>: เดินซ้าย/ขวา</li>
                    <li>• <span className="font-mono text-emerald-300 font-bold">[E]</span> หรือ <span className="font-mono text-emerald-300 font-bold">[Space]</span> หรือ คลิกเมาส์: ยิงกระสุน 20 DMG</li>
                    <li>• <span className="font-mono text-emerald-300 font-bold">[Q]</span>: เปิดโล่ป้องกันฐาน (เมื่อปลดล็อก)</li>
                    <li>• <span className="font-mono text-amber-300 font-bold">[F]</span>: ยิงกระสุนระเบิด 30 DMG (เมื่อปลดล็อก)</li>
                  </ul>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 space-y-1">
                  <span className="font-bold text-cyan-300 text-xs">การควบคุมบนมือถือ (Touch):</span>
                  <ul className="text-[11px] space-y-0.5 text-slate-300">
                    <li>• ปุ่ม <span className="text-cyan-300 font-bold">[◀] [▶]</span> ซ้ายล่าง: เดินซ้าย/ขวา (กดค้างได้)</li>
                    <li>• ปุ่มกลม <span className="text-cyan-300 font-bold">[ยิง! (E)]</span> ขวาล่าง: ยิงกระสุนรัว</li>
                    <li>• ปุ่ม <span className="text-emerald-300 font-bold">[Q โล่]</span> และ <span className="text-amber-300 font-bold">[F ระเบิด]</span> อยู่ข้างปุ่มยิง</li>
                  </ul>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 space-y-1">
                <span className="font-bold text-rose-300 text-xs">ประเภทของไวรัส & ค่า HP:</span>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div>• <strong className="text-slate-100">White Virus</strong>: HP 100, Base DMG 10</div>
                  <div>• <strong className="text-emerald-400">Green Virus</strong>: HP 100, Base DMG 15 (วิ่งไว)</div>
                  <div>• <strong className="text-rose-400">Red Virus</strong>: HP 150, Base DMG 50 (ตัวหนา ดาเมจสูง)</div>
                  <div>• <strong className="text-amber-400">Golden Boss</strong>: HP 200, บอสใหญ่ประจำด่าน 5</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={closeTutorial}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-thai font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,207,239,0.4)]"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>เข้าใจแล้ว เริ่มลุยเลย!</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
