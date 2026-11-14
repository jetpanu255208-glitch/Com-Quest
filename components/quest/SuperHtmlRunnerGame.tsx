'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PixelCharacter } from '@/components/character/PixelCharacter';
import {
  CharacterConfig,
  DEFAULT_CHARACTER_CONFIG,
} from '@/lib/supabase/types';
import {
  playHitSound,
  playHurtSound,
  playClearSound,
  playOverSound,
  playSelectSound,
  isSoundMuted,
  setSoundMuted,
  stopAllSounds,
} from '@/lib/sound/sound-manager';
import {
  Heart,
  Trophy,
  Flag,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  ArrowRight,
  Lock,
  CheckCircle2,
  Gamepad2,
  Star,
  Zap,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  HelpCircle,
  LogOut,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  BookOpen,
  User,
} from 'lucide-react';

// ============================================================================
// MARIO-STYLE STAGE & QUESTION DATA (5 STAGES AFTER 8 LESSONS)
// ============================================================================
export interface RunnerQuestion {
  id: string;
  meaningPrompt: string;
  hint: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
}

export interface RunnerStage {
  stageNumber: number;
  worldCode: string;
  title: string;
  subtitle: string;
  skyGradient: string;
  groundColor: string;
  groundTopColor: string;
  pipeColor: string;
  accentColor: string;
  questions: RunnerQuestion[];
}

export const SUPER_HTML_STAGES: RunnerStage[] = [
  {
    stageNumber: 1,
    worldCode: 'WORLD 1-1',
    title: 'ทุ่งหญ้าโครงสร้างพื้นฐาน HTML',
    subtitle: 'กระโดดโหม่งบล็อกแท็กโครงสร้างหลักและหัวข้อหน้าเว็บ',
    skyGradient: 'from-[#1a3a6e] via-[#2563eb] to-[#38bdf8]',
    groundColor: '#7c2d12',
    groundTopColor: '#22c55e',
    pipeColor: '#16a34a',
    accentColor: '#38bdf8',
    questions: [
      {
        id: 's1_q1',
        meaningPrompt: 'แท็กใดคือ "รากฐานสูงสุด (Root Element)" ที่ครอบคลุมโค้ดทั้งหมดของหน้าเว็บ HTML?',
        hint: 'เป็นแท็กเปิด-ปิดตัวแรกและตัวสุดท้ายของเอกสารเว็บ',
        options: ['<html>', '<head>', '<body>'],
        correctIndex: 0,
      },
      {
        id: 's1_q2',
        meaningPrompt: 'แท็กใดใช้เก็บ "เนื้อหาทั้งหมดที่แสดงผลบนหน้าจอเว็บ" เช่น ข้อความ รูปภาพ และปุ่มกด?',
        hint: 'แปลว่า "ส่วนลำตัว" ของหน้าเว็บ',
        options: ['<meta>', '<body>', '<title>'],
        correctIndex: 1,
      },
      {
        id: 's1_q3',
        meaningPrompt: 'แท็กใดใช้สร้าง "หัวข้อหลักที่มีขนาดใหญ่และสำคัญที่สุด" บนหน้าเว็บ?',
        hint: 'Heading ระดับที่ 1 (ตัวเลขยิ่งน้อย ขนาดยิ่งใหญ่)',
        options: ['<h6>', '<header>', '<h1>'],
        correctIndex: 2,
      },
      {
        id: 's1_q4',
        meaningPrompt: 'แท็กใดใช้กำหนด "ชื่อหน้าเว็บที่แสดงบนแท็บของเบราว์เซอร์ (Browser Tab)"?',
        hint: 'อยู่ภายใน <head> แปลว่า ชื่อเรื่อง',
        options: ['<title>', '<name>', '<tab>'],
        correctIndex: 0,
      },
      {
        id: 's1_q5',
        meaningPrompt: 'แท็กใดใช้สำหรับสร้าง "ย่อหน้าข้อความทั่วไป (Paragraph)"?',
        hint: 'ย่อมาจากคำว่า Paragraph',
        options: ['<text>', '<p>', '<pre>'],
        correctIndex: 1,
      },
    ],
  },
  {
    stageNumber: 2,
    worldCode: 'WORLD 1-2',
    title: 'ถ้ำคริสตัลการจัดรูปแบบข้อความ & รายการ',
    subtitle: 'กระโดดเลือกแท็กเน้นข้อความ ขึ้นบรรทัดใหม่ และสร้างรายการ',
    skyGradient: 'from-[#0f172a] via-[#1e1b4b] to-[#312e81]',
    groundColor: '#334155',
    groundTopColor: '#06b6d4',
    pipeColor: '#0891b2',
    accentColor: '#22d3ee',
    questions: [
      {
        id: 's2_q1',
        meaningPrompt: 'แท็กใดใช้เน้นข้อความให้เป็น "ตัวหนามีความสำคัญสูง (Strong Importance)"?',
        hint: 'แปลว่า แข็งแรง / เน้นความสำคัญ',
        options: ['<strong>', '<italic>', '<small>'],
        correctIndex: 0,
      },
      {
        id: 's2_q2',
        meaningPrompt: 'แท็กใดใช้ "ไฮไลท์พื้นหลังข้อความสีเหลือง" เหมือนปากกาเน้นข้อความ?',
        hint: 'แปลว่า ทำเครื่องหมาย / มาร์คข้อความ',
        options: ['<color>', '<mark>', '<u>'],
        correctIndex: 1,
      },
      {
        id: 's2_q3',
        meaningPrompt: 'แท็กเดี่ยว (Empty Tag) ใดใช้สั่ง "ขึ้นบรรทัดใหม่ (Line Break)" ทันทีโดยไม่ต้องมีแท็กปิด?',
        hint: 'ย่อมาจากคำว่า Break',
        options: ['<lb>', '<hr>', '<br>'],
        correctIndex: 2,
      },
      {
        id: 's2_q4',
        meaningPrompt: 'แท็กใดใช้สร้าง "รายการแบบเรียงลำดับตัวเลข 1, 2, 3 (Ordered List)"?',
        hint: 'ย่อมาจาก Ordered List',
        options: ['<ol>', '<ul>', '<dl>'],
        correctIndex: 0,
      },
      {
        id: 's2_q5',
        meaningPrompt: 'แท็กใดใช้กำหนด "แต่ละข้อย่อยภายในรายการ (List Item)" ทั้งใน <ul> และ <ol>?',
        hint: 'ย่อมาจาก List Item',
        options: ['<item>', '<li>', '<list>'],
        correctIndex: 1,
      },
    ],
  },
  {
    stageNumber: 3,
    worldCode: 'WORLD 1-3',
    title: 'สะพานลอยฟ้าลิงก์ & รูปภาพมัลติมีเดีย',
    subtitle: 'กระโดดโหม่งแท็กเชื่อมโยงลิงก์และแสดงผลรูปภาพบนหน้าเว็บ',
    skyGradient: 'from-[#3b0764] via-[#6d28d9] to-[#f472b6]',
    groundColor: '#4c1d95',
    groundTopColor: '#f59e0b',
    pipeColor: '#d97706',
    accentColor: '#fbbf24',
    questions: [
      {
        id: 's3_q1',
        meaningPrompt: 'แท็กใดใช้สร้าง "ลิงก์เชื่อมโยง (Hyperlink)" เพื่อคลิกไปยังหน้าเว็บอื่น?',
        hint: 'ย่อมาจากคำว่า Anchor',
        options: ['<a>', '<link>', '<url>'],
        correctIndex: 0,
      },
      {
        id: 's3_q2',
        meaningPrompt: 'Attribute ใดในแท็ก <a> ใช้ระบุ "URL ปลายทาง" ที่ต้องการให้ลิงก์เปิดไป?',
        hint: 'ย่อมาจาก Hypertext Reference',
        options: ['src="..."', 'href="..."', 'url="..."'],
        correctIndex: 1,
      },
      {
        id: 's3_q3',
        meaningPrompt: 'แท็กใดใช้สำหรับ "แทรกรูปภาพ (Image)" ลงในหน้าเว็บ?',
        hint: 'ย่อมาจากคำว่า Image',
        options: ['<pic>', '<photo>', '<img>'],
        correctIndex: 2,
      },
      {
        id: 's3_q4',
        meaningPrompt: 'Attribute ใดของแท็ก <img> ใช้ระบุ "ที่อยู่ไฟล์รูปภาพ (Source)"?',
        hint: 'ย่อมาจากคำว่า Source',
        options: ['src="..."', 'href="..."', 'path="..."'],
        correctIndex: 0,
      },
      {
        id: 's3_q5',
        meaningPrompt: 'Attribute ใดของ <img> ใช้แสดง "ข้อความอธิบายรูปภาพสำรอง" เมื่อโหลดรูปไม่ขึ้น?',
        hint: 'ย่อมาจาก Alternate Text',
        options: ['title="..."', 'alt="..."', 'desc="..."'],
        correctIndex: 1,
      },
    ],
  },
  {
    stageNumber: 4,
    worldCode: 'WORLD 1-4',
    title: 'ปราสาทกลไกตาราง & แบบฟอร์มรับข้อมูล',
    subtitle: 'ฝ่าด่านแท็กสร้างตารางข้อมูลและช่องกรอกแบบฟอร์มผู้ใช้งาน',
    skyGradient: 'from-[#18181b] via-[#3f1d2e] to-[#7f1d1d]',
    groundColor: '#27272a',
    groundTopColor: '#ef4444',
    pipeColor: '#dc2626',
    accentColor: '#f87171',
    questions: [
      {
        id: 's4_q1',
        meaningPrompt: 'ในตาราง <table> แท็กใดใช้สำหรับสร้าง "แถวแนวนอนของตาราง (Table Row)"?',
        hint: 'ย่อมาจาก Table Row',
        options: ['<tr>', '<td>', '<th>'],
        correctIndex: 0,
      },
      {
        id: 's4_q2',
        meaningPrompt: 'แท็กใดใช้สร้าง "เซลล์หัวตาราง (Table Header)" ที่ข้อความจะเป็นตัวหนาอยู่กึ่งกลาง?',
        hint: 'ย่อมาจาก Table Header',
        options: ['<thead>', '<th>', '<td>'],
        correctIndex: 1,
      },
      {
        id: 's4_q3',
        meaningPrompt: 'แท็กใดใช้สร้าง "เซลล์ข้อมูลปกติในตาราง (Table Data)"?',
        hint: 'ย่อมาจาก Table Data',
        options: ['<tc>', '<row>', '<td>'],
        correctIndex: 2,
      },
      {
        id: 's4_q4',
        meaningPrompt: 'แท็กใดใช้ครอบ "แบบฟอร์มรับข้อมูลจากผู้ใช้" เพื่อส่งไปยังเซิร์ฟเวอร์?',
        hint: 'ตรงตัวกับคำว่าแบบฟอร์มในภาษาอังกฤษ',
        options: ['<form>', '<input>', '<submit>'],
        correctIndex: 0,
      },
      {
        id: 's4_q5',
        meaningPrompt: 'แท็กใดใช้สร้าง "ช่องกรอกข้อมูล" เช่น ช่องพิมพ์ข้อความ รหัสผ่าน หรือปุ่มติ๊กถูก?',
        hint: 'แปลว่า การป้อนข้อมูลเข้า',
        options: ['<textbox>', '<input>', '<field>'],
        correctIndex: 1,
      },
    ],
  },
  {
    stageNumber: 5,
    worldCode: 'WORLD 1-5',
    title: 'ปราสาทบอสใหญ่: โครงสร้าง Semantic HTML5',
    subtitle: 'ด่านสุดท้าย! กระโดดเลือกแท็กโครงสร้างความหมาย HTML5 ยุคใหม่',
    skyGradient: 'from-[#090d16] via-[#1e1b4b] to-[#4c1d95]',
    groundColor: '#1e1b4b',
    groundTopColor: '#facc15',
    pipeColor: '#eab308',
    accentColor: '#fde047',
    questions: [
      {
        id: 's5_q1',
        meaningPrompt: 'แท็ก Semantic ใดใช้แทน "ส่วนหัวของหน้าเว็บหรือส่วนหัวของบทความ" (มักมีโลโก้และชื่อเว็บ)?',
        hint: 'หมายถึง ส่วนหัวด้านบนของหน้าเว็บ',
        options: ['<header>', '<head>', '<top>'],
        correctIndex: 0,
      },
      {
        id: 's5_q2',
        meaningPrompt: 'แท็ก Semantic ใดใช้ครอบกลุ่มของ "แถบเมนูนำทาง (Navigation Bar)" ของเว็บไซต์?',
        hint: 'ย่อมาจากคำว่า Navigation',
        options: ['<menu>', '<nav>', '<links>'],
        correctIndex: 1,
      },
      {
        id: 's5_q3',
        meaningPrompt: 'แท็ก Semantic ใดใช้ครอบ "เนื้อหาหลักใจกลางสำคัญ (Main Content)" ของหน้าเว็บนั้น?',
        hint: 'แปลว่า หลัก / สำคัญที่สุด',
        options: ['<center>', '<core>', '<main>'],
        correctIndex: 2,
      },
      {
        id: 's5_q4',
        meaningPrompt: 'แท็ก Semantic ใดใช้แบ่ง "หมวดหมู่หรือส่วนของเนื้อหา (Section)" ที่เกี่ยวข้องกัน?',
        hint: 'แปลว่า ส่วน / หมวดหมู่ย่อย',
        options: ['<section>', '<part>', '<group>'],
        correctIndex: 0,
      },
      {
        id: 's5_q5',
        meaningPrompt: 'แท็ก Semantic ใดใช้สร้าง "ส่วนท้ายสุดของหน้าเว็บ (Footer)" เช่น ลิขสิทธิ์และข้อมูลติดต่อ?',
        hint: 'อยู่ด้านล่างสุดของหน้าเว็บ',
        options: ['<bottom>', '<footer>', '<end>'],
        correctIndex: 1,
      },
    ],
  },
];

// Lane horizontal positions (%) for the 3 floating [?] blocks
const LANE_POSITIONS = [22, 50, 78] as const;

interface SuperHtmlRunnerGameProps {
  completedLessonsCount: number;
  totalLessonsCount?: number;
  isTeacher?: boolean;
  characterConfig?: CharacterConfig | null;
  playerName?: string;
}

export const SuperHtmlRunnerGame: React.FC<SuperHtmlRunnerGameProps> = ({
  completedLessonsCount,
  totalLessonsCount = 8,
  isTeacher = false,
  characterConfig,
  playerName = 'Adventurer',
}) => {
  const router = useRouter();
  const gameContainerRef = useRef<HTMLDivElement | null>(null);

  const isUnlockedByProgress = completedLessonsCount >= totalLessonsCount || isTeacher;
  const [practiceUnlocked, setPracticeUnlocked] = useState(false);
  const canPlay = isUnlockedByProgress || practiceUnlocked;

  // Stage & Question State
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [unlockedStageIdx, setUnlockedStageIdx] = useState(0);
  const [stageStars, setStageStars] = useState<Record<number, number>>({});
  const [questionIdx, setQuestionIdx] = useState(0);

  // Player Status: 3 Hearts (3 chances per stage)
  const MAX_HEARTS = 3;
  const [hearts, setHearts] = useState<number>(MAX_HEARTS);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Mario Platformer Character Position & Animation State
  const [selectedLane, setSelectedLane] = useState<0 | 1 | 2>(1);
  const [playerX, setPlayerX] = useState<number>(LANE_POSITIONS[1]);
  const [isJumping, setIsJumping] = useState<boolean>(false);
  const [isRunningClear, setIsRunningClear] = useState<boolean>(false);
  const [isHurt, setIsHurt] = useState<boolean>(false);
  const [hitBlockIdx, setHitBlockIdx] = useState<number | null>(null);
  const [hitResult, setHitResult] = useState<'correct' | 'wrong' | null>(null);
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);
  const [coinBurstLane, setCoinBurstLane] = useState<number | null>(null);
  const [floatingBanner, setFloatingBanner] = useState<{
    text: string;
    type: 'correct' | 'wrong' | 'clear';
  } | null>(null);

  // Modals: 'playing' | 'stage-clear' | 'game-over' | 'all-clear'
  const [gameState, setGameState] = useState<
    'playing' | 'stage-clear' | 'game-over' | 'all-clear'
  >('playing');

  // Exit / Pause Menu Modal & Fullscreen State
  const [showExitMenu, setShowExitMenu] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [forceRotateLandscape, setForceRotateLandscape] = useState<boolean>(true);
  const [isPortraitMobile, setIsPortraitMobile] = useState<boolean>(false);

  // Sound state
  const [muted, setMuted] = useState<boolean>(false);
  const isAnimatingRef = useRef<boolean>(false);

  useEffect(() => {
    setMuted(isSoundMuted());
    if (isUnlockedByProgress && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('comquest_bonus_unlocked', 'true');
      } catch {}
    }
    return () => {
      stopAllSounds();
    };
  }, [isUnlockedByProgress]);

  // Detect portrait mobile & fullscreen state
  useEffect(() => {
    const checkViewport = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setIsPortraitMobile(h > w && w < 768);
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    document.addEventListener('fullscreenchange', checkViewport);

    // Attempt to lock orientation to landscape if supported
    try {
      const orientation = (screen as unknown as { orientation?: { lock?: (mode: string) => Promise<void> } }).orientation;
      if (orientation && typeof orientation.lock === 'function') {
        orientation.lock('landscape').catch(() => {});
      }
    } catch {}

    return () => {
      window.removeEventListener('resize', checkViewport);
      document.removeEventListener('fullscreenchange', checkViewport);
    };
  }, []);

  const toggleFullscreen = async () => {
    playSelectSound();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        try {
          const orientation = (screen as unknown as { orientation?: { lock?: (mode: string) => Promise<void> } }).orientation;
          if (orientation && typeof orientation.lock === 'function') {
            await orientation.lock('landscape').catch(() => {});
          }
        } catch {}
      } else {
        await document.exitFullscreen();
      }
    } catch {}
  };

  const handleExitGame = async (destination: '/subjects' | '/profile' = '/subjects') => {
    stopAllSounds();
    playSelectSound();
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
    } catch {}
    router.push(destination);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
    if (!next) playSelectSound();
  };

  const currentStage = SUPER_HTML_STAGES[currentStageIdx] || SUPER_HTML_STAGES[0];
  const currentQuestion =
    currentStage.questions[questionIdx] || currentStage.questions[0];

  // Reset position for a fresh question
  const resetQuestionState = useCallback(() => {
    setSelectedLane(1);
    setPlayerX(LANE_POSITIONS[1]);
    setIsJumping(false);
    setIsRunningClear(false);
    setIsHurt(false);
    setHitBlockIdx(null);
    setHitResult(null);
    setDisabledOptions([]);
    setCoinBurstLane(null);
    setFloatingBanner(null);
    setShowHint(false);
    isAnimatingRef.current = false;
  }, []);

  // Start / Restart a specific stage
  const startStage = useCallback(
    (stageIndex: number) => {
      playSelectSound();
      setCurrentStageIdx(stageIndex);
      setQuestionIdx(0);
      setHearts(MAX_HEARTS);
      setGameState('playing');
      setShowExitMenu(false);
      resetQuestionState();
    },
    [resetQuestionState]
  );

  // Move left/right between the 3 lanes
  const moveLane = useCallback(
    ( targetLane: 0 | 1 | 2 ) => {
      if (isAnimatingRef.current || gameState !== 'playing' || showExitMenu) return;
      playSelectSound();
      setSelectedLane(targetLane);
      setPlayerX(LANE_POSITIONS[targetLane]);
    },
    [gameState, showExitMenu]
  );

  // Jump up to hit the floating [?] block at `laneToHit`
  const triggerJumpHit = useCallback(
    (laneToHit: 0 | 1 | 2) => {
      if (isAnimatingRef.current || gameState !== 'playing' || showExitMenu) return;
      if (disabledOptions.includes(laneToHit)) return;

      isAnimatingRef.current = true;
      setSelectedLane(laneToHit);
      setPlayerX(LANE_POSITIONS[laneToHit]);

      setTimeout(() => {
        setIsJumping(true);
        setHitBlockIdx(laneToHit);

        const isCorrect = laneToHit === currentQuestion.correctIndex;

        if (isCorrect) {
          playHitSound();
          setHitResult('correct');
          setCoinBurstLane(laneToHit);
          const nextCombo = combo + 1;
          setCombo(nextCombo);
          const gainedPoints = 100 + (nextCombo > 1 ? (nextCombo - 1) * 25 : 0);
          setScore((prev) => prev + gainedPoints);
          setFloatingBanner({
            text: `ถูกต้อง! ${currentQuestion.options[laneToHit]} (+${gainedPoints} PTS) — วิ่งผ่านด่าน!`,
            type: 'correct',
          });

          setTimeout(() => {
            setIsJumping(false);
            setIsRunningClear(true);
            setPlayerX(94);
          }, 420);

          setTimeout(() => {
            if (questionIdx + 1 < currentStage.questions.length) {
              setQuestionIdx((prev) => prev + 1);
              resetQuestionState();
            } else {
              playClearSound();
              const earnedStars = hearts;
              setStageStars((prev) => ({
                ...prev,
                [currentStageIdx]: Math.max(prev[currentStageIdx] || 0, earnedStars),
              }));
              setScore((prev) => prev + hearts * 150);

              if (currentStageIdx + 1 < SUPER_HTML_STAGES.length) {
                setUnlockedStageIdx((prev) => Math.max(prev, currentStageIdx + 1));
                setGameState('stage-clear');
              } else {
                setGameState('all-clear');
              }
              isAnimatingRef.current = false;
            }
          }, 1200);
        } else {
          playHurtSound();
          setHitResult('wrong');
          setIsHurt(true);
          setCombo(0);
          setDisabledOptions((prev) => [...prev, laneToHit]);

          const remainingHearts = Math.max(0, hearts - 1);
          setHearts(remainingHearts);

          setFloatingBanner({
            text:
              remainingHearts > 0
                ? `ผิดบล็อก! ${currentQuestion.options[laneToHit]} ไม่ใช่คำตอบ (-1 ♥ เหลือโอกาส ${remainingHearts} ครั้ง)`
                : `หัวใจหมดแล้ว! (0/3 ♥) GAME OVER!`,
            type: 'wrong',
          });

          setTimeout(() => {
            setIsJumping(false);
            setHitBlockIdx(null);
            setHitResult(null);
          }, 450);

          setTimeout(() => {
            setIsHurt(false);
            if (remainingHearts <= 0) {
              playOverSound();
              setGameState('game-over');
            }
            isAnimatingRef.current = false;
          }, 720);
        }
      }, 110);
    },
    [
      combo,
      currentQuestion,
      currentStage.questions.length,
      currentStageIdx,
      disabledOptions,
      gameState,
      hearts,
      questionIdx,
      resetQuestionState,
      showExitMenu,
    ]
  );

  // Keyboard Controls (ArrowLeft/Right, A/D, Space/ArrowUp/W/Enter, 1/2/3, Escape)
  useEffect(() => {
    if (!canPlay) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setShowExitMenu((prev) => !prev);
        return;
      }

      if (gameState !== 'playing' || showExitMenu) return;
      if (isAnimatingRef.current) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        const nextLane = Math.max(0, selectedLane - 1) as 0 | 1 | 2;
        moveLane(nextLane);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        const nextLane = Math.min(2, selectedLane + 1) as 0 | 1 | 2;
        moveLane(nextLane);
      } else if (
        e.key === ' ' ||
        e.key === 'ArrowUp' ||
        e.key === 'w' ||
        e.key === 'W' ||
        e.key === 'Enter'
      ) {
        e.preventDefault();
        triggerJumpHit(selectedLane);
      } else if (e.key === '1') {
        e.preventDefault();
        triggerJumpHit(0);
      } else if (e.key === '2') {
        e.preventDefault();
        triggerJumpHit(1);
      } else if (e.key === '3') {
        e.preventDefault();
        triggerJumpHit(2);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canPlay, gameState, moveLane, selectedLane, showExitMenu, triggerJumpHit]);

  const charConfig = characterConfig || DEFAULT_CHARACTER_CONFIG;
  const totalStarsEarned = Object.values(stageStars).reduce((a, b) => a + b, 0);
  const maxTotalStars = SUPER_HTML_STAGES.length * 3;

  // Compute wrapper styles for Full-Screen Landscape Mode (auto-rotates on portrait mobile if enabled)
  const shouldRotate = isPortraitMobile && forceRotateLandscape;
  const fullscreenLandscapeStyle: React.CSSProperties = shouldRotate
    ? {
        position: 'fixed',
        top: '50%',
        left: '50%',
        width: '100vh',
        height: '100vw',
        transform: 'translate(-50%, -50%) rotate(90deg)',
        zIndex: 60,
      }
    : {
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 60,
      };

  // ============================================================================
  // LOCKED STATE (If student opens /quest directly before completing all 8 lessons)
  // ============================================================================
  if (!canPlay) {
    return (
      <div
        ref={gameContainerRef}
        style={fullscreenLandscapeStyle}
        className="bg-[#060B16] text-white flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none"
      >
        {/* Top bar with Exit button */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-cyber font-bold text-white">
                SUPER HTML TAG RUNNER • โหมดเกมพิเศษ
              </h1>
              <p className="text-[11px] font-thai text-slate-400">
                ปลดล็อกอัตโนมัติเมื่อเรียนและปราบบอสครบทั้ง 8 บทเรียน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleExitGame('/subjects')}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-thai font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(225,29,72,0.4)] cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากเกม</span>
          </button>
        </div>

        {/* Center Lock Notice */}
        <div className="my-auto max-w-xl mx-auto w-full rounded-2xl bg-[#101827] border-2 border-amber-500/40 p-5 sm:p-7 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-lg sm:text-2xl font-cyber font-bold text-white">
            ต้องเรียนจบครบ 8 บทเรียนก่อนจึงจะเปิดโหมดเกมพิเศษ!
          </h2>
          <p className="text-xs sm:text-sm font-thai text-slate-300">
            ตอนนี้คุณผ่านแล้ว{' '}
            <strong className="text-cyan-300 font-mono">
              {completedLessonsCount}/{totalLessonsCount} บทเรียน
            </strong>{' '}
            กลับไปพิชิตบทเรียนให้ครบ 8 บท หรือกดปุ่มทดลองเล่นด้านล่างเพื่อทดสอบระบบเกมได้เลยครับ
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleExitGame('/subjects')}
              className="px-5 py-2.5 rounded-xl bg-[#00CFEF] hover:bg-cyan-300 text-slate-950 font-thai font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>กลับไปเรียนต่อให้ครบ 8 บท</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSelectSound();
                setPracticeUnlocked(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-thai font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.35)]"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>เข้าสู่โหมดเกมเต็มหน้าจอทันที (ทดลองเล่น)</span>
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] font-mono text-slate-500">
          SUPER HTML TAG RUNNER • LANDSCAPE FULLSCREEN ARCADE MODE
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN FULL-SCREEN LANDSCAPE MARIO RUNNER GAME VIEWPORT
  // ============================================================================
  return (
    <div
      ref={gameContainerRef}
      style={fullscreenLandscapeStyle}
      className="bg-[#060B16] text-white flex flex-col justify-between overflow-hidden select-none"
    >
      {/* =====================================================================
          1. TOP LANDSCAPE ARCADE HUD BAR (Stage Tabs + Hearts + Score + Exit Menu)
          ===================================================================== */}
      <header className="h-12 sm:h-14 px-3 sm:px-5 bg-[#090F1E]/95 border-b border-slate-800/90 flex items-center justify-between gap-2 shrink-0 z-30">
        {/* LEFT: Game Title & 5 Stage Quick Tabs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/40 shrink-0">
            <Gamepad2 className="w-4 h-4 text-amber-400" />
            <span className="font-pixel text-[10px] sm:text-xs text-amber-300 tracking-wider hidden sm:inline">
              SUPER HTML
            </span>
          </div>

          {/* 5 Worlds Selector Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {SUPER_HTML_STAGES.map((st, idx) => {
              const isStageUnlocked = idx <= unlockedStageIdx;
              const isCurrent = idx === currentStageIdx;
              const stars = stageStars[idx] || 0;

              return (
                <button
                  key={st.worldCode}
                  type="button"
                  disabled={!isStageUnlocked}
                  onClick={() => isStageUnlocked && startStage(idx)}
                  title={`${st.worldCode}: ${st.title}`}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg border text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1 transition-all shrink-0 ${
                    isCurrent
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 border-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.45)] cursor-pointer'
                      : isStageUnlocked
                      ? 'bg-slate-900/90 border-slate-700 text-slate-200 hover:border-cyan-400 cursor-pointer'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {!isStageUnlocked && <Lock className="w-2.5 h-2.5" />}
                  <span>1-{st.stageNumber}</span>
                  {stars > 0 && (
                    <span className="hidden md:inline-flex items-center text-[9px]">
                      ★{stars}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CENTER: 3 HEARTS (♥♥♥) + CHECKPOINT + SCORE */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* 3 Hearts Status */}
          <div
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-rose-950/70 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
            title="โอกาสตอบผิดได้ 3 ครั้งต่อด่าน"
          >
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((heartNum) => {
                const isAlive = heartNum <= hearts;
                return (
                  <Heart
                    key={heartNum}
                    className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-all duration-300 ${
                      isAlive
                        ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)] scale-100'
                        : 'text-slate-700 fill-slate-800/50 scale-75 opacity-50'
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-rose-200">
              {hearts}/3
            </span>
          </div>

          {/* Checkpoint Progress */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-[11px] font-mono">
            <Flag className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">ด่านย่อย:</span>
            <span className="text-emerald-300 font-bold">
              {questionIdx + 1}/{currentStage.questions.length}
            </span>
          </div>

          {/* Score & Stars */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-amber-500/40 text-[11px] sm:text-xs font-mono">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 font-bold">{score}</span>
            <span className="hidden lg:inline text-slate-500">|</span>
            <span className="hidden lg:inline-flex items-center gap-0.5 text-amber-300">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {totalStarsEarned}/{maxTotalStars}
            </span>
          </div>
        </div>

        {/* RIGHT: Hint + Sound + Fullscreen + EXIT GAME MENU BUTTON */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              playSelectSound();
              setShowHint((prev) => !prev);
            }}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-thai font-bold flex items-center gap-1 transition-all cursor-pointer ${
              showHint
                ? 'bg-amber-400 text-slate-950 border-amber-200'
                : 'bg-slate-900 border-slate-700 text-amber-300 hover:border-amber-400'
            }`}
            title="ดูคำใบ้แท็ก"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">คำใบ้</span>
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            title={muted ? 'เปิดเสียงเกม' : 'ปิดเสียงเกม'}
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:flex p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 transition-colors cursor-pointer"
            title={isFullscreen ? 'ย่อขนาดหน้าจอ' : 'ขยายเต็มหน้าจอ (Fullscreen)'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {isPortraitMobile && (
            <button
              type="button"
              onClick={() => setForceRotateLandscape((prev) => !prev)}
              className="px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-[10px] font-thai text-cyan-300 cursor-pointer"
            >
              {forceRotateLandscape ? 'แนวตั้ง' : 'แนวนอน'}
            </button>
          )}

          {/* PROMINENT EXIT / PAUSE GAME MENU BUTTON */}
          <button
            type="button"
            onClick={() => {
              playSelectSound();
              setShowExitMenu(true);
            }}
            className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border border-rose-400/60 font-thai font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(225,29,72,0.4)] cursor-pointer active:scale-95 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากเกม</span>
          </button>
        </div>
      </header>

      {/* =====================================================================
          2. MAIN 2D SIDE-SCROLLING MARIO STAGE CANVAS (Fills Landscape Viewport)
          ===================================================================== */}
      <div
        className={`relative flex-1 w-full bg-gradient-to-b ${currentStage.skyGradient} overflow-hidden transition-all duration-500 ${
          isHurt ? 'animate-shake ring-4 ring-inset ring-rose-500' : ''
        }`}
      >
        {/* Pixel Grid Overlay */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Decorative Pixel Clouds */}
        <div className="absolute top-16 left-[6%] w-24 h-7 bg-white/15 rounded-full blur-[0.5px] pointer-events-none" />
        <div className="absolute top-24 left-[42%] w-32 h-8 bg-white/10 rounded-full blur-[0.5px] pointer-events-none" />
        <div className="absolute top-14 right-[10%] w-24 h-7 bg-white/15 rounded-full blur-[0.5px] pointer-events-none" />

        {/* =================================================================
            TOP OVERLAY IN SKY: QUESTION MEANING BANNER (โจทย์ความหมายแท็ก)
            ================================================================= */}
        <div className="relative z-20 max-w-4xl mx-auto px-3 sm:px-6 pt-2.5 sm:pt-3.5">
          <div className="rounded-2xl bg-[#090F1E]/90 backdrop-blur-md border-2 border-amber-400/70 px-4 py-2.5 sm:px-5 sm:py-3 shadow-[0_8px_30px_rgba(0,0,0,0.65)]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-pixel text-[10px] font-bold">
                  {currentStage.worldCode} • จุดตรวจ {questionIdx + 1}/{currentStage.questions.length}
                </span>
                <span className="text-[11px] font-thai text-amber-300 font-semibold hidden sm:inline">
                  {currentStage.title}
                </span>
              </div>

              {/* Checkpoint Dots */}
              <div className="flex items-center gap-1">
                {currentStage.questions.map((q, idx) => {
                  const done = idx < questionIdx;
                  const active = idx === questionIdx;
                  return (
                    <span
                      key={q.id}
                      className={`w-5 h-5 rounded-md font-mono text-[10px] font-bold flex items-center justify-center border ${
                        done
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                          : active
                          ? 'bg-amber-400 text-slate-950 border-amber-200 scale-105'
                          : 'bg-slate-900 border-slate-700 text-slate-500'
                      }`}
                    >
                      {done ? '✓' : idx + 1}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Question Text */}
            <p className="text-sm sm:text-base lg:text-lg font-thai font-bold text-white leading-snug">
              {currentQuestion.meaningPrompt}
            </p>

            {/* Optional Hint or Feedback */}
            {showHint && (
              <div className="mt-1.5 px-3 py-1 rounded-lg bg-amber-950/80 border border-amber-400/50 text-amber-200 text-xs font-thai">
                💡 <strong>คำใบ้:</strong> {currentQuestion.hint}
              </div>
            )}

            {floatingBanner && (
              <div
                className={`mt-1.5 px-3 py-1 rounded-lg text-xs font-thai font-bold flex items-center gap-1.5 border ${
                  floatingBanner.type === 'correct'
                    ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                    : 'bg-rose-950/90 border-rose-400 text-rose-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span>{floatingBanner.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* =================================================================
            3 FLOATING MARIO [ ? ] TAG BLOCKS IN THE SKY
            ================================================================= */}
        { LANE_POSITIONS.map((leftPct, idx) => {
          const laneIdx = idx as 0 | 1 | 2;
          const tagLabel = currentQuestion.options[laneIdx];
          const isSelected = selectedLane === laneIdx;
          const isBeingHit = hitBlockIdx === laneIdx;
          const isWrongDisabled = disabledOptions.includes(laneIdx);
          const isCorrectRevealed =
            hitBlockIdx === laneIdx && hitResult === 'correct';
          const showCoin = coinBurstLane === laneIdx;

          return (
            <div
              key={laneIdx}
              style={{ left: `${leftPct}%` }}
              className="absolute top-[42%] sm:top-[44%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
            >
              {/* Popping Coin Effect when hitting the right block */}
              {showCoin && (
                <div className="absolute -top-14 animate-bounce flex flex-col items-center pointer-events-none z-30">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 border-2 border-yellow-100 shadow-[0_0_20px_#facc15] flex items-center justify-center font-pixel text-xs text-slate-950 font-extrabold">
                    $
                  </div>
                  <span className="text-[10px] font-pixel text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] mt-0.5">
                    +PTS!
                  </span>
                </div>
              )}

              {/* Clickable Mario [?] Mystery Tag Block */}
              <button
                type="button"
                disabled={isWrongDisabled || gameState !== 'playing'}
                onClick={() => triggerJumpHit(laneIdx)}
                className={`group relative px-3.5 py-2.5 sm:px-6 sm:py-3.5 rounded-xl border-4 font-mono font-extrabold text-sm sm:text-lg lg:text-xl transition-all duration-200 cursor-pointer select-none shadow-[0_8px_0_rgba(0,0,0,0.45)] ${
                  isBeingHit ? '-translate-y-5 scale-110' : 'hover:-translate-y-1'
                } ${
                  isCorrectRevealed
                    ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 border-emerald-200 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.85)]'
                    : isWrongDisabled
                    ? 'bg-slate-800/90 border-rose-500/60 text-rose-400 opacity-60 line-through cursor-not-allowed'
                    : isSelected
                    ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500 border-yellow-100 text-slate-950 shadow-[0_0_25px_rgba(251,191,36,0.75)] scale-105'
                    : 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 border-amber-200 text-slate-950 hover:brightness-110'
                }`}
              >
                {/* 4 Corner Rivets like Super Mario Mystery Block */}
                <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-950/60" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-950/60" />
                <span className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-950/60" />
                <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-950/60" />

                {/* Top [ ? ] Badge */}
                <div className="text-[10px] font-pixel tracking-widest uppercase opacity-85 mb-0.5 flex items-center justify-center gap-1">
                  <span>[{laneIdx === 0 ? 'A' : laneIdx === 1 ? 'B' : 'C'}]</span>
                  <span>{isWrongDisabled ? '✕ ผิด' : isCorrectRevealed ? '★ ถูก!' : '? BLOCK'}</span>
                </div>

                {/* HTML Tag Text */}
                <div className="tracking-tight whitespace-nowrap">{tagLabel}</div>
              </button>

              {/* Target indicator arrow when player stands below this block */}
              {isSelected && !isWrongDisabled && (
                <div className="mt-1 flex flex-col items-center animate-bounce pointer-events-none">
                  <ArrowUp className="w-4 h-4 text-yellow-300 drop-shadow-[0_0_6px_rgba(250,204,21,0.9)]" />
                </div>
              )}
            </div>
          );
        })}

        {/* =================================================================
            BACKGROUND HILLS & MARIO WARP PIPE + GOAL FLAG ON THE RIGHT
            ================================================================= */}
        <div className="absolute bottom-12 sm:bottom-14 left-[5%] w-32 h-14 rounded-t-full bg-emerald-800/35 border-t-2 border-emerald-400/30 pointer-events-none" />
        <div className="absolute bottom-12 sm:bottom-14 left-[46%] w-44 h-18 rounded-t-full bg-emerald-900/30 border-t-2 border-emerald-400/20 pointer-events-none" />

        {/* Right Side: Checkpoint Flagpole & Green Mario Warp Pipe */}
        <div className="absolute bottom-12 sm:bottom-14 right-[4%] flex items-end gap-2 pointer-events-none z-10">
          {/* Checkpoint Flagpole */}
          <div className="hidden sm:flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-300 shadow-[0_0_8px_#fde047]" />
            <div className="relative w-1.5 h-24 bg-slate-200">
              <div
                className={`absolute left-1.5 w-9 h-6 bg-gradient-to-r from-amber-400 to-orange-500 clip-path-flag flex items-center justify-center text-[9px] font-pixel text-slate-950 font-bold transition-all duration-500 ${
                  isRunningClear ? 'top-1' : 'top-14'
                }`}
              >
                HTML
              </div>
            </div>
          </div>

          {/* Green Mario Warp Pipe */}
          <div className="flex flex-col items-center">
            <div
              className="w-14 sm:w-16 h-4 rounded-sm border-2 border-slate-950 shadow-md"
              style={{
                background: `linear-gradient(90deg, #4ade80 0%, ${currentStage.pipeColor} 50%, #14532d 100%)`,
              }}
            />
            <div
              className="w-12 sm:w-14 h-10 sm:h-12 border-x-2 border-slate-950"
              style={{
                background: `linear-gradient(90deg, #4ade80 0%, ${currentStage.pipeColor} 50%, #14532d 100%)`,
              }}
            />
          </div>
        </div>

        {/* =================================================================
            PLAYER CHARACTER (Walks between lanes, jumps to headbutt, runs through pipe)
            ================================================================= */}
        <div
          style={{ left: `${playerX}%` }}
          className={`absolute bottom-11 sm:bottom-13 -translate-x-1/2 z-20 transition-all ${
            isRunningClear
              ? 'duration-700 ease-in'
              : isJumping
              ? 'duration-200 -translate-y-16 sm:-translate-y-20 scale-110'
              : 'duration-300 translate-y-0'
          }`}
        >
          <div className="flex flex-col items-center">
            {/* Player Name & Jumping Status Pill */}
            <div className="mb-0.5 px-2 py-0.5 rounded-full bg-slate-950/90 border border-cyan-400/50 text-[9px] font-mono text-cyan-200 whitespace-nowrap shadow">
              {isJumping
                ? 'JUMP! ⚡'
                : isRunningClear
                ? 'CLEAR! 🏃💨'
                : isHurt
                ? 'OUCH! -1 ♥'
                : playerName}
            </div>

            {/* Pixel Character Sprite */}
            <div className={`${isHurt ? 'opacity-70 scale-90' : ''}`}>
              <PixelCharacter config={charConfig} size={68} animate={true} />
            </div>
          </div>
        </div>

        {/* =================================================================
            MARIO BRICK GROUND PLATFORM
            ================================================================= */}
        <div className="absolute bottom-0 inset-x-0 h-12 sm:h-14 z-10 flex flex-col">
          <div
            className="h-3 w-full border-y-2 border-slate-950"
            style={{ backgroundColor: currentStage.groundTopColor }}
          />
          <div
            className="flex-1 w-full"
            style={{
              backgroundColor: currentStage.groundColor,
              backgroundImage:
                'repeating-linear-gradient(90deg, rgba(0,0,0,0.32) 0px, rgba(0,0,0,0.32) 2px, transparent 2px, transparent 36px), repeating-linear-gradient(0deg, rgba(0,0,0,0.32) 0px, rgba(0,0,0,0.32) 2px, transparent 2px, transparent 18px)',
            }}
          />
        </div>

        {/* =================================================================
            MODAL 1: STAGE CLEAR OVERLAY (When finishing 5/5 checkpoints in a stage)
            ================================================================= */}
        {gameState === 'stage-clear' && (
          <div className="absolute inset-0 z-40 bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="max-w-md w-full rounded-2xl bg-[#101827] border-2 border-amber-400 p-5 sm:p-6 text-center space-y-4 shadow-[0_0_50px_rgba(245,158,11,0.4)]">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-pixel">
                <Trophy className="w-3.5 h-3.5" />
                <span>{currentStage.worldCode} CLEARED!</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-cyber font-bold text-white">
                ผ่านด่าน {currentStage.title} สำเร็จ!
              </h3>

              {/* Stars Earned based on Remaining Hearts */}
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3].map((starIdx) => (
                  <Star
                    key={starIdx}
                    className={`w-9 h-9 transition-all ${
                      starIdx <= hearts
                        ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-110'
                        : 'text-slate-700 fill-slate-800'
                    }`}
                  />
                ))}
              </div>

              <p className="text-xs sm:text-sm font-thai text-slate-300">
                หัวใจคงเหลือ <strong className="text-rose-400">{hearts}/3 ดวง</strong> • โบนัสหัวใจ{' '}
                <strong className="text-amber-300">+{hearts * 150} PTS</strong>
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => startStage(currentStageIdx)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-thai font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>เล่นด่านนี้ซ้ำ</span>
                </button>

                <button
                  type="button"
                  onClick={() => startStage(currentStageIdx + 1)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-thai font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer"
                >
                  <span>ลุยด่านถัดไป ({SUPER_HTML_STAGES[currentStageIdx + 1]?.worldCode})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            MODAL 2: GAME OVER OVERLAY (Lost all 3 hearts ♥♥♥)
            ================================================================= */}
        {gameState === 'game-over' && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="max-w-md w-full rounded-2xl bg-[#101827] border-2 border-rose-500 p-5 sm:p-6 text-center space-y-4 shadow-[0_0_50px_rgba(244,63,94,0.4)]">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 text-xs font-pixel">
                <span>OUT OF HEARTS (0/3 ♥)</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-cyber font-bold text-white">
                หัวใจหมดครบ 3 ดวงแล้ว!
              </h3>

              <p className="text-xs sm:text-sm font-thai text-slate-300 leading-relaxed">
                คุณใช้โอกาสตอบผิดครบ 3 ครั้งในด่าน{' '}
                <strong className="text-rose-300">{currentStage.worldCode}</strong> แล้ว
                กดเริ่มด่านนี้ใหม่เพื่อรับหัวใจ 3 ดวงเต็มและลองอีกครั้ง!
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => startStage(currentStageIdx)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-thai font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.4)] cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>เริ่มลุยด่านนี้อีกครั้ง (รับหัวใจ ♥♥♥ ใหม่)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExitGame('/subjects')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-thai font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ออกจากเกม</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            MODAL 3: ALL 5 STAGES CLEARED! GRAND CHAMPION OVERLAY
            ================================================================= */}
        {gameState === 'all-clear' && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="max-w-lg w-full rounded-2xl bg-gradient-to-b from-[#131c31] to-[#0b101d] border-2 border-amber-400 p-5 sm:p-7 text-center space-y-4 shadow-[0_0_60px_rgba(245,158,11,0.5)]">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-400/20 border-2 border-amber-300 flex items-center justify-center text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                <Trophy className="w-8 h-8" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-pixel">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ALL 5 WORLDS CLEARED!</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-cyber font-bold text-white">
                สุดยอดแชมเปี้ยน! พิชิตครบทั้ง 5 ด่านมาริโอ้ HTML!
              </h3>

              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto pt-1">
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/40">
                  <div className="text-[10px] font-thai text-slate-400">คะแนนรวมสูงสุด</div>
                  <div className="text-base font-pixel text-amber-300 mt-0.5">{score} PTS</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/40">
                  <div className="text-[10px] font-thai text-slate-400">ดาวสะสมรวม</div>
                  <div className="text-base font-pixel text-cyan-300 mt-0.5">
                    ★ {totalStarsEarned}/{maxTotalStars}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => startStage(0)}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-thai font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>เล่นใหม่ตั้งแต่ WORLD 1-1</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExitGame('/profile')}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-thai font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ออกจากเกมกลับหน้าโปรไฟล์</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            MODAL 4: PAUSE & EXIT GAME MENU MODAL (เมนูออกจากเกม)
            ================================================================= */}
        {showExitMenu && (
          <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="max-w-md w-full rounded-2xl bg-[#101827] border-2 border-cyan-400/60 p-5 sm:p-6 text-center space-y-4 shadow-[0_0_50px_rgba(0,207,239,0.3)]">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold">
                <Pause className="w-3.5 h-3.5" />
                <span>GAME PAUSED • เมนูเกมพิเศษ</span>
              </div>

              <h3 className="text-lg sm:text-xl font-cyber font-bold text-white">
                พักเกมชั่วคราว / ออกจากโหมดเกม
              </h3>
              <p className="text-xs font-thai text-slate-300">
                ด่านปัจจุบัน: <strong className="text-amber-300">{currentStage.worldCode}</strong> • คะแนนสะสม:{' '}
                <strong className="text-cyan-300">{score} PTS</strong> • หัวใจคงเหลือ:{' '}
                <strong className="text-rose-400">{hearts}/3 ดวง</strong>
              </p>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    playSelectSound();
                    setShowExitMenu(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-thai font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>กลับเข้าสู่เกมต่อ (Resume Game)</span>
                </button>

                <button
                  type="button"
                  onClick={() => startStage(currentStageIdx)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-thai font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>เริ่มด่านนี้ใหม่ ({currentStage.worldCode})</span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleExitGame('/subjects')}
                    className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-thai font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.35)]"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>ออกกลับหน้าวิชาเรียน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExitGame('/profile')}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-rose-500/50 text-rose-300 font-thai font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span>ออกกลับหน้าโปรไฟล์</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          3. BOTTOM LANDSCAPE GAMEPAD CONTROL BAR (Walk Left/Right + Quick Block Select + Jump)
          ===================================================================== */}
      <footer className="h-14 sm:h-16 px-3 sm:px-6 bg-[#090F1E] border-t border-slate-800 flex items-center justify-between gap-2 shrink-0 z-30">
        {/* Left D-Pad: Walk Left / Walk Right */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => moveLane(Math.max(0, selectedLane - 1) as 0 | 1 | 2)}
            disabled={selectedLane === 0 || gameState !== 'playing'}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-600 text-slate-200 font-thai font-semibold text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">เดินซ้าย (A / ←)</span>
          </button>

          <button
            type="button"
            onClick={() => moveLane(Math.min(2, selectedLane + 1) as 0 | 1 | 2)}
            disabled={selectedLane === 2 || gameState !== 'playing'}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-600 text-slate-200 font-thai font-semibold text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
          >
            <span className="hidden sm:inline">เดินขวา (D / →)</span>
            <ChevronRight className="w-4 h-4 text-cyan-400" />
          </button>
        </div>

        {/* Center: 3 Direct Tag Block Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {([0, 1, 2] as const).map((laneIdx) => {
            const isDisabled = disabledOptions.includes(laneIdx);
            const isActive = selectedLane === laneIdx;
            return (
              <button
                key={laneIdx}
                type="button"
                disabled={isDisabled || gameState !== 'playing'}
                onClick={() => triggerJumpHit(laneIdx)}
                className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                  isDisabled
                    ? 'bg-slate-900 border-rose-500/40 text-rose-400/50 line-through cursor-not-allowed'
                    : isActive
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,207,239,0.3)]'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <span className="text-amber-400 mr-1">
                  [{laneIdx === 0 ? 'A' : laneIdx === 1 ? 'B' : 'C'}]
                </span>
                <span>{currentQuestion.options[laneIdx]}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Big Arcade JUMP Button */}
        <button
          type="button"
          disabled={disabledOptions.includes(selectedLane) || gameState !== 'playing'}
          onClick={() => triggerJumpHit(selectedLane)}
          className="px-4 sm:px-6 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 disabled:opacity-40 text-slate-950 font-thai font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_20px_rgba(251,191,36,0.45)] cursor-pointer active:scale-95 transition-all"
        >
          <ArrowUp className="w-4 h-4 stroke-[3]" />
          <span>กระโดดโหม่ง! (SPACE)</span>
        </button>
      </footer>
    </div>
  );
};
