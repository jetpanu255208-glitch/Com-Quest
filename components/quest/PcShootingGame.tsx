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
  playReloadSound,
  playTickSound,
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
const PLAYER_Y = 440; // Grounded on the floor
const PLAYER_MIN_X = 130;
const PLAYER_MAX_X = 390;
const BASE_X = 20;
const BASE_WIDTH = 115;
const BASE_HEIGHT = 200;
const BASE_CRASH_LINE = 140;

// Ammo & Weapon Specs
const MAX_AMMO = 35;
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
    { white: 5, green: 0, red: 0, spawnIntervalMs: 1200 },
    { white: 8, green: 0, red: 0, spawnIntervalMs: 1000 },
    { white: 6, green: 3, red: 0, spawnIntervalMs: 850 },
  ],
  2: [
    { white: 7, green: 4, red: 0, spawnIntervalMs: 900 },
    { white: 8, green: 5, red: 0, spawnIntervalMs: 800 },
    { white: 9, green: 6, red: 1, spawnIntervalMs: 700 },
  ],
  3: [
    // Later stage: Monsters spawn in rapid swarms / clusters!
    { white: 10, green: 6, red: 1, spawnIntervalMs: 650 },
    { white: 12, green: 8, red: 2, spawnIntervalMs: 550 },
    { white: 14, green: 10, red: 3, spawnIntervalMs: 480 },
  ],
  4: [
    // Heavy horde clusters!
    { white: 12, green: 10, red: 3, spawnIntervalMs: 450 },
    { white: 14, green: 12, red: 4, spawnIntervalMs: 400 },
    { white: 16, green: 14, red: 5, spawnIntervalMs: 350 },
  ],
  5: [
    // Golden Virus Lord: 800 HP & instant base destroy
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
  const arenaRef = useRef<HTMLDivElement | null>(null);

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
  // Golden Boss Max HP is 800 (Updated per user specification!)
  const [bossHp, setBossHp] = useState<number>(800);
  // Ammo System: 35 bullets, reloaded at base with [R]
  const [ammo, setAmmo] = useState<number>(MAX_AMMO);
  const [isNearBase, setIsNearBase] = useState<boolean>(true);

  // Live mutable game state in Ref to power the 60 FPS requestAnimationFrame loop without React re-render lag
  const stateRef = useRef({
    currentStage: 1,
    currentWave: 1,
    ammo: MAX_AMMO,
    maxAmmo: MAX_AMMO,
    isNearBase: true,
    viewWidth: 960,
    viewHeight: 540,
    dpr: 1,
    groundY: 440,
    playerY: 440,
    baseCrashLine: 140,
    playerMinX: 155,
    playerMaxX: 420,
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
    // Animated Factory Ambient Elements
    vatBubbles: [
      { x: 14, y: 75, r: 2.8, vy: 0.9 },
      { x: 30, y: 110, r: 4.2, vy: 1.2 },
      { x: 48, y: 45, r: 2.5, vy: 0.8 },
      { x: 62, y: 95, r: 3.8, vy: 1.3 },
      { x: 74, y: 60, r: 3.2, vy: 1.0 },
    ],
    dustMotes: [
      { x: 0.48, y: 0.25, vx: 0.0003, vy: 0.0006, alpha: 0.5 },
      { x: 0.52, y: 0.45, vx: -0.0002, vy: 0.0005, alpha: 0.4 },
      { x: 0.55, y: 0.35, vx: 0.0002, vy: 0.0007, alpha: 0.6 },
      { x: 0.50, y: 0.60, vx: -0.0003, vy: 0.0004, alpha: 0.5 },
    ],
    // Animated Moving Factory Conveyor Packages
    conveyorCrates: [
      { xPct: 0.06, w: 28, h: 22, type: 0 },
      { xPct: 0.28, w: 34, h: 26, type: 1 },
      { xPct: 0.50, w: 24, h: 20, type: 2 },
      { xPct: 0.72, w: 36, h: 25, type: 1 },
      { xPct: 0.91, w: 30, h: 22, type: 0 },
    ],
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

  // Dynamic Canvas Resize Observer to ensure 100% full screen with zero black bars
  useEffect(() => {
    const updateSize = () => {
      const arena = arenaRef.current;
      const canvas = canvasRef.current;
      if (!arena || !canvas) return;

      const rect = arena.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(240, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const scale = Math.max(0.72, Math.min(1.35, h / 540));
      const groundY = Math.round(h - 90 * scale);
      const playerY = groundY; // Player firmly planted on the ground!
      const baseWidth = Math.round(115 * scale); // Workstation width matching reference
      const baseCrashLine = 20 + baseWidth + 10;
      const playerMinX = baseCrashLine + 15;
      const playerMaxX = Math.max(playerMinX + 130, Math.min(baseCrashLine + 320, w * 0.44));

      stateRef.current.viewWidth = w;
      stateRef.current.viewHeight = h;
      stateRef.current.dpr = dpr;
      stateRef.current.groundY = groundY;
      stateRef.current.playerY = playerY;
      stateRef.current.baseCrashLine = baseCrashLine;
      stateRef.current.playerMinX = playerMinX;
      stateRef.current.playerMaxX = playerMaxX;

      // Keep player inside valid range
      stateRef.current.playerX = Math.max(
        playerMinX,
        Math.min(playerMaxX, stateRef.current.playerX)
      );
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateSize) : null;
    if (arenaRef.current && ro) {
      ro.observe(arenaRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      ro?.disconnect();
    };
  }, []);

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
    stateRef.current.currentStage = stageNum;
    stateRef.current.currentWave = waveNum;
    stateRef.current.spawnQueue = queue;
    stateRef.current.waveTotalEnemies = total;
    stateRef.current.waveDefeatedEnemies = 0;
    stateRef.current.spawnInterval = waveCfg.spawnIntervalMs;
    stateRef.current.lastSpawnTime = performance.now();
    stateRef.current.isWaveEnding = false;
    stateRef.current.isGameActive = true;

    setCurrentStage(stageNum);
    setCurrentWave(waveNum);
    setRemainingEnemies(total);

    if (waveCfg.hasBoss) {
      setBossHp(800);
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

    // Replenish ammo to full at wave start
    stateRef.current.ammo = MAX_AMMO;
    setAmmo(MAX_AMMO);
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
  // ABILITY ACTIVATIONS & RELOAD MECHANIC
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
    const playerY = s.playerY || PLAYER_Y;
    s.bullets.push({
      id: s.nextEntityId++,
      x: s.playerX + 35,
      y: playerY - 26,
      radius: 14,
      damage: 90, // Boosted to 90 DMG per user specification!
      isExplosive: true,
      vx: 11,
    });
  }, [unlockedExplosiveBullet, explosiveBulletUsed]);

  // Reload Ammo at Base Mechanic (Press R / Touch Button)
  const reloadAmmo = useCallback(() => {
    const s = stateRef.current;
    if (s.isNearBase) {
      if (s.ammo >= MAX_AMMO) return;
      s.ammo = MAX_AMMO;
      setAmmo(MAX_AMMO);
      playReloadSound();
      s.damagePopups.push({
        id: s.nextEntityId++,
        x: s.playerX,
        y: (s.playerY || 440) - 55,
        text: 'RELOADED! 35/35',
        color: '#10b981',
        alpha: 1,
        vy: -1.6,
      });
    } else {
      playTickSound(true);
      s.damagePopups.push({
        id: s.nextEntityId++,
        x: s.playerX,
        y: (s.playerY || 440) - 55,
        text: 'เดินกลับไปที่ฐานเพื่อเติมกระสุน!',
        color: '#f87171',
        alpha: 1,
        vy: -1.4,
      });
    }
  }, []);

  // ============================================================================
  // INPUT CONTROLS (DESKTOP & TOUCH)
  // ============================================================================
  const shootNormalBullet = useCallback(() => {
    const s = stateRef.current;
    const now = performance.now();
    if (now - s.lastShootTime < SHOOT_COOLDOWN_MS) return;
    s.lastShootTime = now;

    // Check ammo: 35 rounds maximum
    if (s.ammo <= 0) {
      playTickSound(true);
      s.damagePopups.push({
        id: s.nextEntityId++,
        x: s.playerX,
        y: (s.playerY || 440) - 55,
        text: 'กระสุนหมด! กด [R] ที่ฐาน',
        color: '#fbbf24',
        alpha: 1,
        vy: -1.4,
      });
      return;
    }

    s.ammo--;
    setAmmo(s.ammo);

    playLaserShootSound();
    const playerY = s.playerY || PLAYER_Y;
    s.bullets.push({
      id: s.nextEntityId++,
      x: s.playerX + 34,
      y: playerY - 26,
      radius: 4,
      damage: weaponDamage,
      isExplosive: false,
      vx: 14,
    });
  }, [weaponDamage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat && (e.key === 'q' || e.key === 'Q' || e.key === 'f' || e.key === 'F' || e.key === 'r' || e.key === 'R')) return;
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
      } else if (e.key === 'r' || e.key === 'R') {
        reloadAmmo();
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
  }, [gameModal, shootNormalBullet, activateBaseShield, fireExplosiveBullet, reloadAmmo]);

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
  // MONSTER SPAWNING HELPER (EXACT HEALTH & GROUNDED FEET)
  // ============================================================================
  const spawnMonster = (type: MonsterType) => {
    const s = stateRef.current;
    const groundY = s.groundY || GROUND_Y;
    const spawnX = (s.viewWidth || CANVAS_WIDTH) + 40;

    let width = 68;
    let height = 66;
    let hp = 100;
    let speed = 1.35;
    let baseDamage = 10;
    // Ground feet firmly at groundY (sprites are drawn from -height to 0)
    const spawnY = groundY;

    if (type === 'white') {
      width = 68;
      height = 66;
      hp = 100; // White Virus HP: 100
      speed = 1.35;
      baseDamage = 10;
    } else if (type === 'green') {
      width = 76;
      height = 64;
      hp = 100; // Green Virus HP: 100
      speed = 2.45;
      baseDamage = 15;
    } else if (type === 'red') {
      // User request: ตัวแดง ให้ตัวใหญ่ขึ้นอีกนิด และให้มีเลือดสัก 500
      width = 118;
      height = 108;
      hp = 500;
      speed = 0.70;
      baseDamage = 50;
    } else if (type === 'boss') {
      // User request: บอสเหลืองเลือด 800 ตีฐานแบบทีเดียวแตก ยิงโดนติดพื้น
      width = 150;
      height = 160;
      hp = 800;
      speed = 0.55;
      baseDamage = 9999;
    }

    s.monsters.push({
      id: s.nextEntityId++,
      type,
      x: spawnX,
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

  // Wave Clear Handler with live Ref State (Permanent fix for Wave 2 -> Wave 3 progression)
  const handleWaveClear = useCallback(() => {
    const currStage = stateRef.current.currentStage;
    const currWave = stateRef.current.currentWave;
    const wavesForStage = STAGE_WAVES[currStage] || STAGE_WAVES[1];
    const isFinalWaveOfStage = currWave >= wavesForStage.length;

    playMarioCorrectSound();

    if (isFinalWaveOfStage) {
      if (currStage === 1) {
        setGameModal('stage1-upgrade');
      } else if (currStage === 2) {
        setGameModal('stage2-upgrade');
      } else if (currStage === 3) {
        setGameModal('stage3-ability');
      } else if (currStage === 4) {
        setGameModal('stage4-prompt');
      } else if (currStage === 5) {
        setGameModal('victory');
      }
    } else {
      const nextWaveNum = currWave + 1;
      stateRef.current.currentWave = nextWaveNum;
      setCurrentWave(nextWaveNum);
      setTimeout(() => {
        startWave(currStage, nextWaveNum);
      }, 1400);
    }
  }, [startWave]);

  const handleWaveClearRef = useRef(handleWaveClear);
  handleWaveClearRef.current = handleWaveClear;

  // ============================================================================
  // 60 FPS MAIN GAME LOOP (CANVAS DYNAMIC RESIZE)
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
      const w = s.viewWidth || 960;
      const h = s.viewHeight || 540;
      const dpr = s.dpr || 1;
      const groundY = s.groundY || 440;
      const playerY = s.playerY || 405;
      const scale = Math.max(0.72, Math.min(1.35, h / 540));
      const baseCrashLine = s.baseCrashLine || 120;
      const playerMinX = s.playerMinX || 135;
      const playerMaxX = s.playerMaxX || 400;

      if (!isPaused && s.isGameActive) {
        // Track whether player is near base to reload
        const nearBase = s.playerX <= baseCrashLine + 65;
        if (s.isNearBase !== nearBase) {
          s.isNearBase = nearBase;
          setIsNearBase(nearBase);
        }

        // Animate moving conveyor crates in background
        s.conveyorCrates.forEach((c) => {
          c.xPct += 0.0006;
          if (c.xPct > 1.05) c.xPct = -0.05;
        });

        // 1. Player Movement & Continuous Auto-Shoot
        if (s.isMovingLeft) {
          s.playerX = Math.max(playerMinX, s.playerX - 4.5);
          s.playerFacing = 'left';
        }
        if (s.isMovingRight) {
          s.playerX = Math.min(playerMaxX, s.playerX + 4.5);
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
              // AOE Blast (90 DMG, radius 160)
              playExplosionSound();
              s.screenShake = 16;
              for (let p = 0; p < 30; p++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = 2 + Math.random() * 7;
                s.particles.push({
                  x: b.x,
                  y: b.y,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd,
                  size: 3 + Math.random() * 5,
                  color: p % 3 === 0 ? '#fbbf24' : p % 3 === 1 ? '#f97316' : '#ef4444',
                  alpha: 1,
                  decay: 0.03,
                });
              }

              // Damage all monsters within radius 160px
              for (const m of s.monsters) {
                const dist = Math.hypot(m.x - b.x, m.y - m.height / 2 - b.y);
                if (dist <= 160) {
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
              // Normal Bullet Direct Hit
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
          if (b.x > w + 60) {
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
          if (m.x <= baseCrashLine) {
            if (isShieldActive) {
              // SHIELD BLOCKS DAMAGE!
              playShieldSound();
              s.screenShake = 4;
              s.damagePopups.push({
                id: s.nextEntityId++,
                x: baseCrashLine + 15,
                y: m.y - 10,
                text: 'SHIELD DEFLECTED!',
                color: '#34d399',
                alpha: 1,
                vy: -1.5,
              });
              for (let p = 0; p < 8; p++) {
                s.particles.push({
                  x: baseCrashLine,
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
              s.screenShake = m.type === 'boss' ? 24 : 10;
              s.baseFlash = m.type === 'boss' ? 14 : 8;
              setBaseCurrentHp((prev) => {
                // Boss destroys base in 1 hit per user spec!
                const damageTaken = m.type === 'boss' ? prev : m.baseDamage;
                const nextHp = Math.max(0, prev - damageTaken);
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
                x: 20 + (115 * scale) / 2,
                y: groundY - 140 * scale,
                text: m.type === 'boss' ? 'CRITICAL HIT! BASE CRUSHED!' : `-${m.baseDamage} BASE HP!`,
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

        // 6. Wave Clear Check (Always reads true live wave from Ref)
        if (
          !s.isWaveEnding &&
          s.spawnQueue.length === 0 &&
          s.monsters.length === 0 &&
          s.waveDefeatedEnemies >= s.waveTotalEnemies &&
          s.isGameActive
        ) {
          s.isWaveEnding = true;
          handleWaveClearRef.current();
        }
      }

      // ========================================================================
      // CANVAS RENDERING (100% SCREEN FILL & BESPOKE FACTORY PIXEL ART)
      // ========================================================================
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;

      // Handle screen shake
      if (s.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * s.screenShake;
        const shakeY = (Math.random() - 0.5) * s.screenShake;
        ctx.translate(shakeX, shakeY);
      }

      // 1. FACTORY BACKGROUND (Bespoke Pixel Art Scene Inspired by Reference)
      drawFactoryBackground(ctx, w, h, groundY, scale, timestamp * 0.001);

      // 2. COMPUTER BASE (High-Tech Gaming Battlestation)
      drawComputerBase(ctx, s.baseFlash > 0, shieldActiveTimer > 0, groundY, scale);

      // 3. BASE SHIELD EFFECT
      if (shieldActiveTimer > 0) {
        drawShieldEffect(ctx, baseCrashLine, groundY, scale);
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
        playerY,
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
    stateRef.current.currentStage = 2;
    stateRef.current.currentWave = 1;
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
    stateRef.current.currentStage = 3;
    stateRef.current.currentWave = 1;
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
    stateRef.current.currentStage = 4;
    stateRef.current.currentWave = 1;
    setCurrentStage(4);
    setCurrentWave(1);
    setTimeout(() => startWave(4, 1), 500);
  };

  const handleStage4ProceedToBoss = () => {
    playSelectSound();
    setExplosiveBulletUsed(false);
    setGameModal(null);
    stateRef.current.currentStage = 5;
    stateRef.current.currentWave = 1;
    setCurrentStage(5);
    setCurrentWave(1);
    setTimeout(() => startWave(5, 1), 500);
  };

  const restartFullGame = () => {
    playSelectSound();
    stateRef.current.currentStage = 1;
    stateRef.current.currentWave = 1;
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
  // Draw Factory Background inspired by reference image
  function drawFactoryBackground(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    groundY: number,
    scale: number,
    time: number
  ) {
    ctx.save();

    // 1. Base Wall (Atmospheric Industrial Gradient)
    const wallGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    wallGrad.addColorStop(0, '#0c1520');
    wallGrad.addColorStop(0.7, '#141e2b');
    wallGrad.addColorStop(1, '#182433');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, w, groundY);

    // 2. Industrial Wall Panels & Rivets
    const panelW = Math.round(96 * scale);
    const panelH = Math.round(80 * scale);
    ctx.strokeStyle = '#090f17';
    ctx.lineWidth = 2;
    for (let px = 0; px < w; px += panelW) {
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, groundY);
      ctx.stroke();
    }
    for (let py = Math.round(36 * scale); py < groundY; py += panelH) {
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();

      // Subtle horizontal highlight seam
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.moveTo(0, py + 1);
      ctx.lineTo(w, py + 1);
      ctx.stroke();
      ctx.strokeStyle = '#090f17';
    }

    // Rivet dots on seams
    ctx.fillStyle = '#080d14';
    for (let px = 0; px < w; px += panelW) {
      for (let py = Math.round(36 * scale); py < groundY; py += panelH) {
        ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
      }
    }

    // 3. Ceiling I-Beam and Hanging Cables
    const beamH = Math.round(34 * scale);
    ctx.fillStyle = '#111b27';
    ctx.fillRect(0, 0, w, beamH);
    ctx.fillStyle = '#19283a';
    ctx.fillRect(0, beamH - Math.round(5 * scale), w, Math.round(5 * scale));

    // Diagonal truss struts along the ceiling
    ctx.strokeStyle = '#182536';
    ctx.lineWidth = 3;
    for (let tx = 0; tx < w; tx += Math.round(70 * scale)) {
      ctx.beginPath();
      ctx.moveTo(tx, 0);
      ctx.lineTo(tx + Math.round(35 * scale), beamH - 5);
      ctx.lineTo(tx + Math.round(70 * scale), 0);
      ctx.stroke();
    }

    // Hanging drooping cables
    ctx.strokeStyle = '#070b10';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, beamH);
    ctx.bezierCurveTo(w * 0.25, beamH + 28 * scale, w * 0.45, beamH + 32 * scale, w * 0.7, beamH + 12 * scale);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w * 0.35, beamH);
    ctx.bezierCurveTo(w * 0.55, beamH + 42 * scale, w * 0.75, beamH + 38 * scale, w, beamH + 18 * scale);
    ctx.stroke();

    // 4. Center Metal Blast Door / Elevator
    const elevatorX = Math.round(w * (w > 640 ? 0.52 : 0.56));
    const doorW = Math.round(112 * scale);
    const doorH = Math.round(185 * scale);
    const doorY = groundY - doorH;

    // Elevator Outer Frame
    ctx.fillStyle = '#172230';
    ctx.fillRect(elevatorX - doorW / 2 - 8 * scale, doorY - 14 * scale, doorW + 16 * scale, doorH + 14 * scale);
    ctx.strokeStyle = '#0d151f';
    ctx.lineWidth = 3;
    ctx.strokeRect(elevatorX - doorW / 2 - 8 * scale, doorY - 14 * scale, doorW + 16 * scale, doorH + 14 * scale);

    // Hazard Stripes on Lintel
    ctx.save();
    ctx.beginPath();
    ctx.rect(elevatorX - doorW / 2 - 6 * scale, doorY - 12 * scale, doorW + 12 * scale, 10 * scale);
    ctx.clip();
    ctx.fillStyle = '#0f1722';
    ctx.fillRect(elevatorX - doorW / 2 - 6 * scale, doorY - 12 * scale, doorW + 12 * scale, 10 * scale);
    ctx.fillStyle = '#eab308';
    for (let sx = -doorW; sx < doorW * 2; sx += 12 * scale) {
      ctx.beginPath();
      ctx.moveTo(elevatorX + sx, doorY - 12 * scale);
      ctx.lineTo(elevatorX + sx + 7 * scale, doorY - 12 * scale);
      ctx.lineTo(elevatorX + sx - 3 * scale, doorY - 2 * scale);
      ctx.lineTo(elevatorX + sx - 10 * scale, doorY - 2 * scale);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Elevator Floor Indicator Display Box
    const indW = Math.round(84 * scale);
    const indH = Math.round(11 * scale);
    const indY = doorY - 26 * scale;
    ctx.fillStyle = '#0a0f16';
    ctx.fillRect(elevatorX - indW / 2, indY, indW, indH);
    ctx.strokeStyle = '#223246';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(elevatorX - indW / 2, indY, indW, indH);

    // LED indicators: 1 emergency blinking red LED, 6 amber LEDs
    const ledCount = 7;
    const ledW = (indW - 14 * scale) / ledCount;
    for (let i = 0; i < ledCount; i++) {
      const lx = elevatorX - indW / 2 + 7 * scale + i * ledW;
      if (i === 3) {
        // Blinking Red Emergency Indicator
        ctx.fillStyle = Math.sin(time * 6) > 0 ? '#ef4444' : '#7f1d1d';
      } else {
        ctx.fillStyle = i < 3 ? '#eab308' : '#78350f';
      }
      ctx.fillRect(lx + 1, indY + 2.5 * scale, ledW - 2, indH - 5 * scale);
    }

    // Dual Sliding Steel Doors
    const doorInnerY = doorY + 1 * scale;
    const doorInnerH = doorH - 1 * scale;
    // Left Door
    ctx.fillStyle = '#223144';
    ctx.fillRect(elevatorX - doorW / 2, doorInnerY, doorW / 2 - 1, doorInnerH);
    // Right Door
    ctx.fillStyle = '#1e2d3e';
    ctx.fillRect(elevatorX + 1, doorInnerY, doorW / 2 - 1, doorInnerH);
    // Center Split Seam
    ctx.fillStyle = '#090e16';
    ctx.fillRect(elevatorX - 1, doorInnerY, 2, doorInnerH);

    // Door Metallic Sheen & Bevel Lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(elevatorX - doorW / 2 + 6 * scale, doorInnerY, 8 * scale, doorInnerH);
    ctx.fillRect(elevatorX + 10 * scale, doorInnerY, 8 * scale, doorInnerH);

    // Wall Louvers / Air Grates beside the elevator
    const ventW = Math.round(22 * scale);
    const ventH = Math.round(44 * scale);
    const ventLeftX = elevatorX - doorW / 2 - 38 * scale;
    const ventRightX = elevatorX + doorW / 2 + 16 * scale;
    [ventLeftX, ventRightX].forEach((vx) => {
      ctx.fillStyle = '#0c131c';
      ctx.fillRect(vx, doorY + 30 * scale, ventW, ventH);
      ctx.fillStyle = '#060a0f';
      for (let vy = doorY + 34 * scale; vy < doorY + 28 * scale + ventH; vy += 5 * scale) {
        ctx.fillRect(vx + 2, vy, ventW - 4, 2 * scale);
      }
    });

    // 5. Overhead Fluorescent Spotlight Lamp & Beam
    const lampW = Math.round(68 * scale);
    const lampH = Math.round(12 * scale);
    const lampY = beamH;
    ctx.fillStyle = '#243447';
    ctx.fillRect(elevatorX - lampW / 2, lampY, lampW, lampH);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(elevatorX - lampW / 2 + 4 * scale, lampY + lampH - 2, lampW - 8 * scale, 3);

    // Conical Spotlight Beam
    const beamGrad = ctx.createLinearGradient(elevatorX, lampY + lampH, elevatorX, groundY);
    beamGrad.addColorStop(0, 'rgba(255, 252, 210, 0.22)');
    beamGrad.addColorStop(0.35, 'rgba(255, 250, 190, 0.10)');
    beamGrad.addColorStop(1, 'rgba(255, 250, 190, 0.01)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(elevatorX - lampW / 2 + 6 * scale, lampY + lampH);
    ctx.lineTo(elevatorX + lampW / 2 - 6 * scale, lampY + lampH);
    ctx.lineTo(elevatorX + doorW * 1.05, groundY);
    ctx.lineTo(elevatorX - doorW * 1.05, groundY);
    ctx.closePath();
    ctx.fill();

    // Floating ambient dust motes in spotlight
    stateRef.current.dustMotes.forEach((m) => {
      m.y += m.vy;
      m.x += m.vx;
      if (m.y > 0.85) m.y = 0.15;
      if (m.x < 0.44 || m.x > 0.60) m.vx = -m.vx;
      ctx.fillStyle = `rgba(254, 240, 138, ${m.alpha * 0.7})`;
      ctx.fillRect(elevatorX + (m.x - 0.52) * doorW * 2, m.y * groundY, 2.5, 2.5);
    });

    // 6. Giant Chemical / Incubation Vat on Left
    const vatX = Math.max(130, Math.round(w * 0.19));
    const vatW = Math.round(84 * scale);
    const vatH = Math.round(130 * scale);
    const vatY = groundY - Math.round(180 * scale);

    // Heavy Industrial Support Legs
    ctx.fillStyle = '#0f1722';
    ctx.fillRect(vatX - vatW / 2 + 6 * scale, vatY + vatH, 12 * scale, groundY - (vatY + vatH));
    ctx.fillRect(vatX + vatW / 2 - 18 * scale, vatY + vatH, 12 * scale, groundY - (vatY + vatH));

    // Outer Vat Metal Housing
    ctx.fillStyle = '#172433';
    ctx.fillRect(vatX - vatW / 2 - 4 * scale, vatY - 6 * scale, vatW + 8 * scale, vatH + 12 * scale);
    ctx.strokeStyle = '#090f17';
    ctx.lineWidth = 3;
    ctx.strokeRect(vatX - vatW / 2 - 4 * scale, vatY - 6 * scale, vatW + 8 * scale, vatH + 12 * scale);

    // Cylindrical Glass Viewport
    ctx.fillStyle = '#051b14';
    ctx.fillRect(vatX - vatW / 2 + 4 * scale, vatY + 4 * scale, vatW - 8 * scale, vatH - 8 * scale);

    // Glowing Toxic Green Liquid with Wavy Surface
    const liquidH = vatH * 0.76;
    const liquidY = vatY + vatH - liquidH - 4 * scale;
    const liquidGrad = ctx.createLinearGradient(vatX, liquidY, vatX, vatY + vatH);
    liquidGrad.addColorStop(0, '#4ade80');
    liquidGrad.addColorStop(0.3, '#22c55e');
    liquidGrad.addColorStop(1, '#15803d');
    ctx.fillStyle = liquidGrad;
    ctx.fillRect(vatX - vatW / 2 + 4 * scale, liquidY, vatW - 8 * scale, liquidH);

    // Surface Meniscus Line
    ctx.fillStyle = '#86efac';
    ctx.fillRect(vatX - vatW / 2 + 4 * scale, liquidY - 2, vatW - 8 * scale, 3);

    // Animated Rising Toxic Bubbles
    stateRef.current.vatBubbles.forEach((b) => {
      b.y -= b.vy;
      if (b.y < 10) b.y = vatH * 0.7;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(vatX - vatW / 2 + 8 * scale + b.x * (scale * 0.9), liquidY + b.y * scale, b.r * scale, 0, Math.PI * 2);
      ctx.fill();
    });

    // Glass Reflection Highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(vatX - vatW / 2 + 10 * scale, vatY + 6 * scale);
    ctx.lineTo(vatX - vatW / 2 + 24 * scale, vatY + 6 * scale);
    ctx.lineTo(vatX - vatW / 2 + 8 * scale, vatY + vatH - 12 * scale);
    ctx.lineTo(vatX - vatW / 2 + 2 * scale, vatY + vatH - 12 * scale);
    ctx.closePath();
    ctx.fill();

    // Rusty Outflow Conduits & Pipes
    ctx.fillStyle = '#78350f';
    ctx.fillRect(vatX + vatW / 2 + 4 * scale, vatY + vatH - 32 * scale, 24 * scale, 12 * scale);
    ctx.fillRect(vatX + vatW / 2 + 20 * scale, vatY + vatH - 32 * scale, 8 * scale, groundY - (vatY + vatH - 32 * scale));

    // 7. Radioactive Waste Barrels on Floor
    // Upright Barrel near Vat
    const barrelX = vatX + vatW / 2 + 36 * scale;
    const barrelW = Math.round(28 * scale);
    const barrelH = Math.round(44 * scale);
    ctx.fillStyle = '#1b382b';
    ctx.fillRect(barrelX, groundY - barrelH, barrelW, barrelH);
    ctx.fillStyle = '#0f241c';
    ctx.fillRect(barrelX, groundY - barrelH + 12 * scale, barrelW, 4 * scale);
    ctx.fillRect(barrelX, groundY - barrelH + 28 * scale, barrelW, 4 * scale);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(barrelX + barrelW / 2 - 3 * scale, groundY - barrelH + 18 * scale, 6 * scale, 6 * scale);

    // Knocked-over Barrel leaking Toxic Sludge on Right of Elevator
    const leakBarrelX = elevatorX + doorW / 2 + 30 * scale;
    const leakBarrelW = Math.round(42 * scale);
    const leakBarrelH = Math.round(26 * scale);
    ctx.fillStyle = '#1b382b';
    ctx.fillRect(leakBarrelX, groundY - leakBarrelH, leakBarrelW, leakBarrelH);
    ctx.fillStyle = '#0f241c';
    ctx.fillRect(leakBarrelX + 10 * scale, groundY - leakBarrelH, 4 * scale, leakBarrelH);
    ctx.fillRect(leakBarrelX + 26 * scale, groundY - leakBarrelH, 4 * scale, leakBarrelH);

    // Spilling Glowing Toxic Green Sludge Puddle
    ctx.fillStyle = 'rgba(34, 197, 94, 0.85)';
    ctx.beginPath();
    ctx.ellipse(leakBarrelX + leakBarrelW + 8 * scale, groundY + 2, 22 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.ellipse(leakBarrelX + leakBarrelW + 7 * scale, groundY + 1, 12 * scale, 3 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 8. Right Scaffolding Lattice Framework
    const scaffX = w - Math.round(36 * scale);
    ctx.fillStyle = '#172230';
    ctx.fillRect(scaffX, 0, 8 * scale, groundY);
    ctx.fillRect(w - 10 * scale, 0, 8 * scale, groundY);
    ctx.strokeStyle = '#101a24';
    ctx.lineWidth = 2.5;
    for (let sy = beamH; sy < groundY; sy += Math.round(40 * scale)) {
      ctx.beginPath();
      ctx.moveTo(scaffX, sy);
      ctx.lineTo(w - 2 * scale, sy + Math.round(40 * scale));
      ctx.moveTo(w - 2 * scale, sy);
      ctx.lineTo(scaffX, sy + Math.round(40 * scale));
      ctx.stroke();
    }

    // 9. Industrial Conveyor Belt with Moving Cargo Packages (Living Factory)
    const beltY = groundY - Math.round(110 * scale);
    const beltH = Math.round(14 * scale);

    // Support pillars down to the floor
    [w * 0.36, w * 0.78].forEach((px) => {
      ctx.fillStyle = '#15212f';
      ctx.fillRect(px - 5 * scale, beltY + beltH, 10 * scale, groundY - (beltY + beltH));
      ctx.strokeStyle = '#0a1017';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px - 5 * scale, beltY + beltH, 10 * scale, groundY - (beltY + beltH));
    });

    // Conveyor structural frame
    ctx.fillStyle = '#1b2839';
    ctx.fillRect(0, beltY, w, beltH);
    ctx.strokeStyle = '#0e1722';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, beltY, w, beltH);

    // Hazard caution pattern on bottom edge of conveyor
    ctx.fillStyle = '#eab308';
    for (let bx = 0; bx < w; bx += 24 * scale) {
      ctx.fillRect(bx, beltY + beltH - 3, 12 * scale, 3);
    }

    // Rotating rollers
    for (let rx = 10 * scale; rx < w; rx += 28 * scale) {
      ctx.fillStyle = '#0f1722';
      ctx.beginPath();
      ctx.arc(rx, beltY + beltH / 2, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const rAngle = time * 4;
      ctx.moveTo(rx - Math.cos(rAngle) * 3.5 * scale, beltY + beltH / 2 - Math.sin(rAngle) * 3.5 * scale);
      ctx.lineTo(rx + Math.cos(rAngle) * 3.5 * scale, beltY + beltH / 2 + Math.sin(rAngle) * 3.5 * scale);
      ctx.stroke();
    }

    // Moving Cargo Packages on the conveyor
    stateRef.current.conveyorCrates.forEach((c) => {
      const cx = c.xPct * w;
      const cw = c.w * scale;
      const ch = c.h * scale;
      const cy = beltY - ch;

      if (c.type === 0) {
        // Cardboard Parcel Box with Tape & Shipping Label
        ctx.fillStyle = '#b45309';
        ctx.fillRect(cx, cy, cw, ch);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx, cy, cw, ch);
        // Packaging tape
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(cx + cw * 0.35, cy, cw * 0.3, ch);
        // White shipping barcode label
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx + 3 * scale, cy + 4 * scale, 10 * scale, 7 * scale);
        ctx.fillStyle = '#000000';
        ctx.fillRect(cx + 4 * scale, cy + 5 * scale, 2 * scale, 5 * scale);
        ctx.fillRect(cx + 8 * scale, cy + 5 * scale, 2 * scale, 5 * scale);
      } else if (c.type === 1) {
        // High-Tech Steel Crate with Glowing Blue Trim
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx, cy, cw, ch);
        ctx.strokeStyle = '#00CFEF';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx, cy, cw, ch);
        // Cyan LED line
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(cx + 3 * scale, cy + ch / 2 - 1, cw - 6 * scale, 2);
        // Hazard corners
        ctx.fillStyle = '#eab308';
        ctx.fillRect(cx, cy, 3 * scale, 3 * scale);
        ctx.fillRect(cx + cw - 3 * scale, cy, 3 * scale, 3 * scale);
      } else {
        // Toxic / Biohazard Red Crate
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(cx, cy, cw, ch);
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx, cy, cw, ch);
        // Yellow caution icon
        ctx.fillStyle = '#facc15';
        ctx.fillRect(cx + cw / 2 - 3 * scale, cy + ch / 2 - 3 * scale, 6 * scale, 6 * scale);
      }
    });

    // 10. Factory Floor (Industrial Steel Deck Plates)
    const floorGrad = ctx.createLinearGradient(0, groundY, 0, h);
    floorGrad.addColorStop(0, '#101824');
    floorGrad.addColorStop(0.3, '#0c131d');
    floorGrad.addColorStop(1, '#070b11');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, groundY, w, h - groundY);

    // Hazard Caution Stripes on Floor Edge
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, groundY - 3, w, 6);
    ctx.clip();
    ctx.fillStyle = '#0f1722';
    ctx.fillRect(0, groundY - 3, w, 6);
    ctx.fillStyle = '#eab308';
    for (let hx = 0; hx < w + 20; hx += 16) {
      ctx.beginPath();
      ctx.moveTo(hx, groundY - 3);
      ctx.lineTo(hx + 8, groundY - 3);
      ctx.lineTo(hx + 2, groundY + 3);
      ctx.lineTo(hx - 6, groundY + 3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Floor Seam Lines & Rivets
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 22 * scale);
    ctx.lineTo(w, groundY + 22 * scale);
    ctx.moveTo(0, groundY + 50 * scale);
    ctx.lineTo(w, groundY + 50 * scale);
    ctx.stroke();

    ctx.restore();
  }

  // Draw Computer Base: Bespoke Retro PC Battlestation matching reference image (CRT Monitor, Tower PC, Keyboard, Mouse)
  function drawComputerBase(
    ctx: CanvasRenderingContext2D,
    isFlashing: boolean,
    hasShield: boolean,
    groundY: number,
    scale: number
  ) {
    ctx.save();
    const time = performance.now() * 0.005;
    const baseW = Math.round(115 * scale);
    const baseX = 20;

    // 1. Desk Surface
    const deskH = Math.round(10 * scale);
    const deskY = groundY - deskH;
    ctx.fillStyle = isFlashing ? '#ef4444' : '#1e293b';
    ctx.fillRect(baseX - 2 * scale, deskY, baseW + 6 * scale, deskH);
    ctx.strokeStyle = isFlashing ? '#ffffff' : '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(baseX - 2 * scale, deskY, baseW + 6 * scale, deskH);

    // 2. CRT Monitor (Left Side of Workstation)
    const monW = Math.round(72 * scale);
    const monH = Math.round(62 * scale);
    const monX = baseX + Math.round(4 * scale);
    const standH = Math.round(14 * scale);
    const monY = deskY - standH - monH;

    // Monitor Stand Foot & Neck
    ctx.fillStyle = isFlashing ? '#ef4444' : '#64748b';
    ctx.fillRect(monX + monW / 2 - 14 * scale, deskY - 4 * scale, 28 * scale, 4 * scale);
    ctx.fillStyle = isFlashing ? '#ef4444' : '#94a3b8';
    ctx.fillRect(monX + monW / 2 - 6 * scale, deskY - standH, 12 * scale, standH);

    // Outer Bezel (Retro Off-White / Beige Grey)
    ctx.fillStyle = isFlashing ? '#ef4444' : '#cbd5e1';
    ctx.fillRect(monX, monY, monW, monH);
    ctx.strokeStyle = isFlashing ? '#ffffff' : hasShield ? '#34d399' : '#1e293b';
    ctx.lineWidth = 3;
    ctx.strokeRect(monX, monY, monW, monH);

    // CRT Screen Area (Dark Phosphor Glass with Scanlines)
    const scrX = monX + 6 * scale;
    const scrY = monY + 6 * scale;
    const scrW = monW - 12 * scale;
    const scrH = monH - 18 * scale;
    ctx.fillStyle = '#020617';
    ctx.fillRect(scrX, scrY, scrW, scrH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(scrX, scrY, scrW, scrH);

    // CRT Phosphor Display Text
    ctx.font = `bold ${Math.max(7, Math.round(8 * scale))}px monospace`;
    ctx.fillStyle = '#22c55e';
    ctx.fillText('SYS: ONLINE', scrX + 4 * scale, scrY + 12 * scale);
    ctx.fillText(`AMMO: ${stateRef.current.ammo}/35`, scrX + 4 * scale, scrY + 22 * scale);
    ctx.fillText(`HP: ${baseCurrentHp}`, scrX + 4 * scale, scrY + 32 * scale);

    // Scanline CRT raster overlay
    ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
    for (let sy = scrY; sy < scrY + scrH; sy += 3 * scale) {
      ctx.fillRect(scrX, sy, scrW, 1.5);
    }

    // Monitor Bezel Bottom Details: Vent Slots & Red Power LED
    ctx.fillStyle = '#475569';
    ctx.fillRect(monX + 8 * scale, monY + monH - 7 * scale, 14 * scale, 3 * scale);
    ctx.fillRect(monX + 26 * scale, monY + monH - 7 * scale, 14 * scale, 3 * scale);

    // Power Indicator LED
    ctx.fillStyle = isFlashing ? '#ffffff' : '#ef4444';
    ctx.fillRect(monX + monW - 10 * scale, monY + monH - 8 * scale, 4 * scale, 4 * scale);

    // 3. Desktop Tower PC (Right Side of Workstation)
    const towerW = Math.round(34 * scale);
    const towerH = Math.round(92 * scale);
    const towerX = baseX + Math.round(78 * scale);
    const towerY = deskY - towerH;

    // Tower Casing
    ctx.fillStyle = isFlashing ? '#ef4444' : '#cbd5e1';
    ctx.fillRect(towerX, towerY, towerW, towerH);
    ctx.strokeStyle = isFlashing ? '#ffffff' : hasShield ? '#34d399' : '#1e293b';
    ctx.lineWidth = 3;
    ctx.strokeRect(towerX, towerY, towerW, towerH);

    // CD-ROM Bay on Top
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(towerX + 4 * scale, towerY + 8 * scale, towerW - 8 * scale, 9 * scale);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(towerX + 6 * scale, towerY + 13 * scale, 3 * scale, 2 * scale);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(towerX + towerW - 10 * scale, towerY + 13 * scale, 4 * scale, 2 * scale);

    // 3.5" Floppy Disk Drive Slits
    [24 * scale, 31 * scale, 38 * scale].forEach((slitY) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(towerX + 4 * scale, towerY + slitY, towerW - 8 * scale, 3 * scale);
    });

    // Power & Reset Buttons Panel
    ctx.fillStyle = '#334155';
    ctx.fillRect(towerX + 8 * scale, towerY + 48 * scale, 10 * scale, 10 * scale);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(towerX + 11 * scale, towerY + 51 * scale, 4 * scale, 4 * scale);

    // Reset button
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(towerX + 24 * scale, towerY + 53 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Drive Activity Status LEDs (Blinking HDD indicator)
    ctx.fillStyle = Math.sin(time * 8) > 0 ? '#ef4444' : '#7f1d1d';
    ctx.fillRect(towerX + 8 * scale, towerY + 64 * scale, 3 * scale, 3 * scale);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(towerX + 14 * scale, towerY + 64 * scale, 3 * scale, 3 * scale);

    // Lower Intake Vent Slits
    ctx.fillStyle = '#334155';
    for (let vy = towerY + 72 * scale; vy < towerY + towerH - 6 * scale; vy += 4 * scale) {
      ctx.fillRect(towerX + 6 * scale, vy, towerW - 12 * scale, 2 * scale);
    }

    // 4. Retro Keyboard & Mouse on Desk Platform
    const kbX = monX;
    const kbY = deskY - 14 * scale;
    const kbW = monW - 6 * scale;
    const kbH = 12 * scale;

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(kbX, kbY, kbW, kbH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(kbX, kbY, kbW, kbH);

    // Pixel Keycaps Matrix (White/Light Grey Keys)
    ctx.fillStyle = '#f8fafc';
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 8; col++) {
        const kx = kbX + 3 * scale + col * (7 * scale);
        const ky = kbY + 2 * scale + row * (4.5 * scale);
        ctx.fillRect(kx, ky, 5.5 * scale, 3.5 * scale);
      }
    }

    // Retro Mouse
    const mouseX = towerX - 4 * scale;
    const mouseY = deskY - 12 * scale;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(mouseX, mouseY, 9 * scale, 11 * scale);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(mouseX, mouseY, 9 * scale, 11 * scale);
    // Mouse button divider
    ctx.fillStyle = '#334155';
    ctx.fillRect(mouseX + 4 * scale, mouseY, 1, 5 * scale);
    // Mouse cable curving to the tower
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mouseX + 4.5 * scale, mouseY);
    ctx.quadraticCurveTo(mouseX + 10 * scale, deskY - 20 * scale, towerX, deskY - 16 * scale);
    ctx.stroke();

    // 5. Floating Hologram Reload Indicator when player is near base
    if (stateRef.current.isNearBase) {
      const isAmmoFull = stateRef.current.ammo >= MAX_AMMO;
      const pulse = 1 + Math.sin(time * 6) * 0.08;
      ctx.save();
      ctx.translate(baseX + baseW / 2, monY - 16 * scale);
      ctx.scale(pulse, pulse);

      ctx.fillStyle = isAmmoFull ? 'rgba(16, 185, 129, 0.9)' : 'rgba(0, 207, 239, 0.9)';
      ctx.font = `bold ${Math.max(9, Math.round(10 * scale))}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(
        isAmmoFull ? '✓ กระสุนเต็ม (35/35)' : `⚡ [R] เติมกระสุน (${stateRef.current.ammo}/35)`,
        0,
        0
      );
      ctx.restore();
    }

    ctx.restore();
  }

  // Draw Shield Effect
  function drawShieldEffect(
    ctx: CanvasRenderingContext2D,
    crashX: number,
    groundY: number,
    scale: number
  ) {
    ctx.save();
    const baseH = Math.round(160 * scale);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 18;

    ctx.beginPath();
    ctx.moveTo(crashX, groundY - baseH - 24 * scale);
    ctx.quadraticCurveTo(crashX + 35 * scale, groundY - baseH / 2, crashX, groundY);
    ctx.stroke();

    // Energy Scan Grid Lines
    ctx.fillStyle = 'rgba(52, 211, 153, 0.15)';
    ctx.beginPath();
    ctx.moveTo(20 + 115 * scale, groundY - baseH);
    ctx.lineTo(crashX, groundY - baseH - 24 * scale);
    ctx.quadraticCurveTo(crashX + 35 * scale, groundY - baseH / 2, crashX, groundY);
    ctx.lineTo(20 + 115 * scale, groundY);
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

    // Floating Ammo Reload prompt above player when near base and low ammo
    if (stateRef.current.isNearBase && stateRef.current.ammo <= 12) {
      ctx.save();
      if (facing === 'left') ctx.scale(-1, 1);
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = stateRef.current.ammo === 0 ? '#ef4444' : '#34d399';
      ctx.fillText(stateRef.current.ammo === 0 ? '⚠️ [R] เติมกระสุน!' : '[R] เติมกระสุน', 0, -62);
      ctx.restore();
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

        {/* Center: Computer Base HP Health Bar & Ammo Counter */}
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

          {/* HUD AMMO DISPLAY */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-900 border border-slate-700 font-mono shrink-0">
            <span className="text-[10px] text-slate-400">AMMO</span>
            <span
              className={`text-xs font-bold ${
                ammo <= 5
                  ? 'text-rose-400 animate-pulse'
                  : ammo <= 12
                  ? 'text-amber-400'
                  : 'text-cyan-300'
              }`}
            >
              {ammo}/{MAX_AMMO}
            </span>
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

      {/* 2. GAME CANVAS ARENA (100% Screen Fill, Zero Letterbox Black Bars) */}
      <div
        ref={arenaRef}
        className="relative flex-1 w-full bg-[#0c1520] flex items-center justify-center overflow-hidden"
      >
        {/* Subtle Orientation Hint for Mobile Portrait */}
        {isPortraitMobile && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-85 animate-pulse">
            <span className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-cyan-400/50 text-[10px] font-thai text-cyan-300 shadow backdrop-blur-sm">
              📱 แนะนำหมุนหน้าจอแนวนอนเพื่อมุมมองกว้างเต็มตา
            </span>
          </div>
        )}

        {/* Boss HP Bar in Stage 5 (Golden Boss: 800 HP) */}
        {currentStage === 5 && (
          <div className="absolute top-3 inset-x-4 max-w-md mx-auto z-20 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-amber-300 font-cyber font-bold text-xs tracking-wider mb-1">
              <Crown className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>GOLDEN VIRUS LORD • FINAL BOSS</span>
              <span className="font-mono text-white text-[11px]">({bossHp}/800 HP)</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-950 border-2 border-amber-400/80 overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 transition-all duration-150"
                style={{ width: `${Math.max(0, (bossHp / 800) * 100)}%` }}
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

        {/* 60 FPS Canvas - fills 100% of the arena without letterboxing */}
        <canvas
          ref={canvasRef}
          className="w-full h-full block touch-none cursor-crosshair select-none"
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

          {/* Right Action Buttons: Reload + Shield + Explosive + SHOOT */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Ability 0: Reload Ammo at Base (R) */}
            <button
              type="button"
              onClick={reloadAmmo}
              className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                isNearBase
                  ? ammo >= MAX_AMMO
                    ? 'bg-slate-900 border-slate-700 text-slate-500'
                    : 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)] animate-pulse'
                  : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={isNearBase ? 'เติมกระสุนให้เต็ม (R)' : 'ต้องเดินกลับไปใกล้ฐานเพื่อเติมกระสุน'}
            >
              <RotateCcw className="w-4 h-4 mb-0.5" />
              <span className="text-[9px] font-mono font-bold">
                {ammo >= MAX_AMMO ? 'เต็ม' : 'R เติม'}
              </span>
            </button>

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
                title="กระสุนระเบิด 90 DMG (F / 2)"
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
              className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full active:translate-y-1 border-3 flex flex-col items-center justify-center cursor-pointer touch-manipulation transition-all ${
                ammo <= 0
                  ? 'bg-gradient-to-b from-rose-600 to-rose-900 border-rose-400 shadow-[0_6px_0_#881337,0_0_20px_rgba(244,63,94,0.6)] animate-pulse'
                  : 'bg-gradient-to-b from-cyan-400 to-blue-600 border-cyan-200 shadow-[0_6px_0_#0369a1,0_0_20px_rgba(0,207,239,0.6)]'
              }`}
              title="ยิงกระสุน (E / Space / คลิกเมาส์)"
            >
              <Zap className="w-5 h-5 text-slate-950 fill-slate-950 mb-0.5" />
              <span className="font-thai font-black text-slate-950 text-xs sm:text-sm tracking-wider">
                {ammo <= 0 ? 'หมด! (R)' : `ยิง (${ammo})`}
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
                  กดปุ่ม <span className="font-mono text-white font-bold">[F]</span> หรือปุ่มสัมผัส ยิงขีปนาวุธระเบิดสร้างความเสียหาย <strong>90 DMG</strong> แบบวงกว้าง (AOE) โดนศัตรูโดยรอบ ใช้ได้ด่านละ 1 ครั้ง!
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
              ด่านที่ 5 คือการเผชิญหน้ากับ Golden Virus Lord (Boss HP: 800)! ระวังอย่าให้ชนฐานเด็ดขาด!
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
              ยินดีด้วย! คุณได้ปกป้องฐานคอมพิวเตอร์และปราบ <strong>Golden Virus Lord (800 HP)</strong> สำเร็จครบทั้ง 5 ด่าน!
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
                  ไวรัสจะเดินมาจากขวาเข้าหาเคสคอมพิวเตอร์ (ฐาน) ทางซ้าย หากไวรัสชนฐานจะทำให้ HP ฐานลดลง คุณต้องควบคุมตัวละครเดินยิงสกัดไวรัสให้หมดทุกเวฟ (กระสุนเริ่มต้นนัดละ 20 DMG) มีกระสุน 35 นัด เมื่อหมดต้องเดินกลับไปเติมที่ฐาน! เอาชีวิตรอดครบ 5 ด่าน และปราบ Golden Virus Boss (800 HP)!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 space-y-1">
                  <span className="font-bold text-cyan-300 text-xs">การควบคุมบนคอม (Keyboard):</span>
                  <ul className="text-[11px] space-y-0.5 text-slate-300">
                    <li>• <span className="font-mono text-cyan-200 font-bold">[A] [D]</span> หรือ <span className="font-mono text-cyan-200 font-bold">[←] [→]</span>: เดินซ้าย/ขวา</li>
                    <li>• <span className="font-mono text-emerald-300 font-bold">[E]</span> หรือ <span className="font-mono text-emerald-300 font-bold">[Space]</span> หรือ คลิกเมาส์: ยิงกระสุน 20 DMG</li>
                    <li>• <span className="font-mono text-cyan-300 font-bold">[R]</span>: เติมกระสุนให้เต็ม 35 นัด (ต้องอยู่ใกล้ฐาน)</li>
                    <li>• <span className="font-mono text-emerald-300 font-bold">[Q]</span>: เปิดโล่ป้องกันฐาน (เมื่อปลดล็อก)</li>
                    <li>• <span className="font-mono text-amber-300 font-bold">[F]</span>: ยิงกระสุนระเบิด 90 DMG AOE (เมื่อปลดล็อก)</li>
                  </ul>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 space-y-1">
                  <span className="font-bold text-cyan-300 text-xs">การควบคุมบนมือถือ (Touch):</span>
                  <ul className="text-[11px] space-y-0.5 text-slate-300">
                    <li>• ปุ่ม <span className="text-cyan-300 font-bold">[◀] [▶]</span> ซ้ายล่าง: เดินซ้าย/ขวา (กดค้างได้)</li>
                    <li>• ปุ่มกลม <span className="text-cyan-300 font-bold">[ยิง! (E)]</span> ขวาล่าง: แสดงจำนวนกระสุนคงเหลือ</li>
                    <li>• ปุ่ม <span className="text-emerald-400 font-bold">[R เติม]</span>: เติมกระสุน 35 นัดเมื่อเดินไปใกล้ฐาน</li>
                    <li>• ปุ่ม <span className="text-emerald-300 font-bold">[Q โล่]</span> และ <span className="text-amber-300 font-bold">[F ระเบิด]</span> อยู่ข้างปุ่มยิง</li>
                  </ul>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 space-y-1">
                <span className="font-bold text-rose-300 text-xs">ประเภทของไวรัส & ค่า HP:</span>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div>• <strong className="text-slate-100">White Virus</strong>: HP 100, Base DMG 10</div>
                  <div>• <strong className="text-emerald-400">Green Virus</strong>: HP 100, Base DMG 15 (วิ่งไว)</div>
                  <div>• <strong className="text-rose-400">Red Virus</strong>: HP 500, Base DMG 50 (ตัวใหญ่ เลือดหนา)</div>
                  <div>• <strong className="text-amber-400">Golden Boss</strong>: HP 800, บอสใหญ่ด่าน 5 ชนฐานทีเดียวแตก!</div>
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
