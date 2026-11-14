'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { PixelCharacter } from '@/components/character/PixelCharacter';
import { CharacterConfig, DEFAULT_CHARACTER_CONFIG } from '@/lib/supabase/types';
import {
  playHitSound,
  playHurtSound,
  playClearSound,
  playOverSound,
  playSelectSound,
  playComboSound,
  playMissionClearSound,
} from '@/lib/sound/sound-manager';
import {
  Heart,
  Trophy,
  Sparkles,
  Play,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Lock,
  Unlock,
  Star,
  Flag,
  Gamepad2,
  CheckCircle2,
  XCircle,
  Zap,
  Crown,
} from 'lucide-react';

// ============================================================================
// GAME DATA: 5 MARIO-STYLE WORLDS (25 HTML TAG CHALLENGES TOTAL)
// ============================================================================
export interface TagChallenge {
  id: string;
  clue: string; // โจทย์บอกความหมายของแท็ก
  hint: string;
  options: [string, string, string]; // 3 บล็อกลอยฟ้าให้กระโดดโหม่ง
  correctIndex: 0 | 1 | 2;
}

export interface RunnerStage {
  stageNumber: number;
  worldCode: string;
  title: string;
  subtitle: string;
  theme: 'overworld' | 'underground' | 'sky' | 'castle' | 'final';
  skyGradient: string;
  groundColor: string;
  groundTopColor: string;
  pipeColor: string;
  challenges: TagChallenge[];
}

export const RUNNER_STAGES: RunnerStage[] = [
  {
    stageNumber: 1,
    worldCode: 'WORLD 1-1',
    title: 'ทุ่งหญ้าโครงสร้างพื้นฐาน HTML',
    subtitle: 'กระโดดโหม่งบล็อกแท็กโครงสร้างหลักและหัวข้อหน้าเว็บ',
    theme: 'overworld',
    skyGradient: 'from-[#0284c7] via-[#38bdf8] to-[#bae6fd]',
    groundColor: '#92400e',
    groundTopColor: '#16a34a',
    pipeColor: '#15803d',
    challenges: [
      {
        id: 'w1-1',
        clue: 'แท็กใดคือ "รากฐานสูงสุด (Root Element)" ที่ครอบคลุมโค้ดทั้งหมดของหน้าเว็บ HTML?',
        hint: 'ครอบทั้ง <head> และ <body>',
        options: ['<head>', '<html>', '<body>'],
        correctIndex: 1,
      },
      {
        id: 'w1-2',
        clue: 'แท็กใดใช้เก็บ "เนื้อหาทั้งหมดที่แสดงผลบนหน้าจอ" เช่น ข้อความ รูปภาพ และปุ่มต่างๆ?',
        hint: 'ส่วนลำตัวของหน้าเว็บ',
        options: ['<body>', '<meta>', '<title>'],
        correctIndex: 0,
      },
      {
        id: 'w1-3',
        clue: 'แท็กใดใช้สร้าง "หัวข้อเรื่องขนาดใหญ่และสำคัญที่สุด" บนหน้าเว็บ?',
        hint: 'Heading ระดับที่ 1',
        options: ['<h6>', '<p>', '<h1>'],
        correctIndex: 2,
      },
      {
        id: 'w1-4',
        clue: 'แท็กใดใช้กำหนด "ชื่อหน้าเว็บที่แสดงบนแท็บของเบราว์เซอร์ (Browser Tab)"?',
        hint: 'อยู่ภายในส่วน <head>',
        options: ['<header>', '<title>', '<h1>'],
        correctIndex: 1,
      },
      {
        id: 'w1-5',
        clue: 'แท็กใดใช้สำหรับสร้าง "ย่อหน้าข้อความทั่วไป (Paragraph)"?',
        hint: 'ย่อมาจากคำว่า Paragraph',
        options: ['<p>', '<br>', '<hr>'],
        correctIndex: 0,
      },
    ],
  },
  {
    stageNumber: 2,
    worldCode: 'WORLD 1-2',
    title: 'ถ้ำคริสตัลการจัดรูปแบบข้อความ & รายการ',
    subtitle: 'เลือกแท็กเน้นข้อความ ขึ้นบรรทัดใหม่ และสร้างรายการ',
    theme: 'underground',
    skyGradient: 'from-[#090d16] via-[#1e1b4b] to-[#312e81]',
    groundColor: '#1e293b',
    groundTopColor: '#06b6d4',
    pipeColor: '#0284c7',
    challenges: [
      {
        id: 'w2-1',
        clue: 'แท็กใดใช้เน้นข้อความให้เป็น "ตัวหนา" และสื่อถึงความสำคัญมาก (Strong Importance)?',
        hint: 'แสดงผลตัวหนาแบบมีความหมายเชิงโครงสร้าง',
        options: ['<em>', '<strong>', '<u>'],
        correctIndex: 1,
      },
      {
        id: 'w2-2',
        clue: 'แท็กใดใช้ "ไฮไลต์แถบสีเหลือง" ทับข้อความสำคัญเหมือนปากกาเน้นข้อความ?',
        hint: 'ย่อมาจากคำว่า Mark',
        options: ['<mark>', '<span>', '<i>'],
        correctIndex: 0,
      },
      {
        id: 'w2-3',
        clue: 'แท็กเดี่ยวใดใช้สั่ง "ขึ้นบรรทัดใหม่ (Line Break)" ทันทีโดยไม่สร้างย่อหน้าใหม่?',
        hint: 'ย่อมาจาก Break',
        options: ['<hr>', '<p>', '<br>'],
        correctIndex: 2,
      },
      {
        id: 'w2-4',
        clue: 'แท็กใดใช้สร้าง "รายการแบบมีลำดับตัวเลข 1, 2, 3 (Ordered List)"?',
        hint: 'O = Ordered, L = List',
        options: ['<ul>', '<ol>', '<li>'],
        correctIndex: 1,
      },
      {
        id: 'w2-5',
        clue: 'แท็กใดใช้ระบุ "ข้อมูลแต่ละข้อย่อย (List Item)" ที่อยู่ข้างใน <ul> หรือ <ol>?',
        hint: 'L = List, I = Item',
        options: ['<li>', '<dl>', '<dd>'],
        correctIndex: 0,
      },
    ],
  },
  {
    stageNumber: 3,
    worldCode: 'WORLD 1-3',
    title: 'สะพานลอยฟ้าลิงก์ & รูปภาพมัลติมีเดีย',
    subtitle: 'ตะลุยด่านการเชื่อมโยงเว็บไซต์และการแสดงผลรูปภาพ',
    theme: 'sky',
    skyGradient: 'from-[#0f172a] via-[#0369a1] to-[#38bdf8]',
    groundColor: '#475569',
    groundTopColor: '#f59e0b',
    pipeColor: '#d97706',
    challenges: [
      {
        id: 'w3-1',
        clue: 'แท็กใดใช้สร้าง "ลิงก์เชื่อมโยง (Hyperlink)" เพื่อคลิกไปหน้าเว็บอื่น?',
        hint: 'ย่อมาจากคำว่า Anchor',
        options: ['<link>', '<a>', '<url>'],
        correctIndex: 1,
      },
      {
        id: 'w3-2',
        clue: 'Attribute ใดในแท็ก <a> ใช้ระบุ "URL ปลายทาง" ที่ต้องการให้ลิงก์เปิดไป?',
        hint: 'Hypertext Reference',
        options: ['href', 'src', 'target'],
        correctIndex: 0,
      },
      {
        id: 'w3-3',
        clue: 'แท็กเดี่ยวใดใช้สำหรับ "แทรกรูปภาพ" ลงบนหน้าเว็บไซต์?',
        hint: 'ย่อมาจากคำว่า Image',
        options: ['<pic>', '<figure>', '<img>'],
        correctIndex: 2,
      },
      {
        id: 'w3-4',
        clue: 'Attribute ใดใน <img> ใช้ระบุ "ที่อยู่ไฟล์รูปภาพ (Source)" ที่ต้องการนำมาแสดง?',
        hint: 'ย่อมาจากคำว่า Source',
        options: ['alt', 'src', 'href'],
        correctIndex: 1,
      },
      {
        id: 'w3-5',
        clue: 'Attribute ใดใน <img> ใช้แสดง "ข้อความอธิบายรูปภาพทดแทน" เมื่อรูปโหลดไม่ขึ้น?',
        hint: 'ย่อมาจาก Alternate Text',
        options: ['alt', 'title', 'width'],
        correctIndex: 0,
      },
    ],
  },
  {
    stageNumber: 4,
    worldCode: 'WORLD 1-4',
    title: 'ปราสาทกลไกตาราง & แบบฟอร์มรับข้อมูล',
    subtitle: 'กระโดดเลือกแท็กตารางข้อมูลและฟอร์มรับค่าจากผู้ใช้',
    theme: 'castle',
    skyGradient: 'from-[#18181b] via-[#3f1d2e] to-[#7f1d1d]',
    groundColor: '#27272a',
    groundTopColor: '#ef4444',
    pipeColor: '#b91c1c',
    challenges: [
      {
        id: 'w4-1',
        clue: 'แท็กใดใช้สร้าง "แถวแนวนอนในตาราง (Table Row)"?',
        hint: 'T = Table, R = Row',
        options: ['<td>', '<tr>', '<th>'],
        correctIndex: 1,
      },
      {
        id: 'w4-2',
        clue: 'แท็กใดใช้สร้าง "ช่องเซลล์หัวตาราง (Table Header)" ที่แสดงเป็นตัวหนากึ่งกลาง?',
        hint: 'T = Table, H = Header',
        options: ['<th>', '<td>', '<thead>'],
        correctIndex: 0,
      },
      {
        id: 'w4-3',
        clue: 'แท็กใดใช้สร้าง "ช่องเซลล์ข้อมูลปกติในตาราง (Table Data)"?',
        hint: 'T = Table, D = Data',
        options: ['<tr>', '<table>', '<td>'],
        correctIndex: 2,
      },
      {
        id: 'w4-4',
        clue: 'แท็กใดใช้ครอบ "แบบฟอร์มรับข้อมูลจากผู้ใช้งาน" เพื่อส่งไปยังเซิร์ฟเวอร์?',
        hint: 'ตรงตัวกับคำว่าแบบฟอร์มในภาษาอังกฤษ',
        options: ['<input>', '<form>', '<fieldset>'],
        correctIndex: 1,
      },
      {
        id: 'w4-5',
        clue: 'แท็กใดใช้สร้าง "ช่องกรอกข้อมูล" เช่น ช่องพิมพ์ข้อความ ช่องรหัสผ่าน หรือตัวเลือก?',
        hint: 'ใช้คู่กับ Attribute type="text" หรือ type="password"',
        options: ['<input>', '<label>', '<button>'],
        correctIndex: 0,
      },
    ],
  },
  {
    stageNumber: 5,
    worldCode: 'WORLD 1-5',
    title: 'ปราสาทบอสใหญ่: โครงสร้าง Semantic HTML5',
    subtitle: 'ด่านสุดท้าย! พิชิตแท็กโครงสร้างเว็บยุคใหม่ครบสมบูรณ์',
    theme: 'final',
    skyGradient: 'from-[#090d16] via-[#3b0764] to-[#701a75]',
    groundColor: '#1e1b4b',
    groundTopColor: '#f59e0b',
    pipeColor: '#a855f7',
    challenges: [
      {
        id: 'w5-1',
        clue: 'แท็ก Semantic ใดใช้เป็น "ส่วนหัวของหน้าเว็บหรือบทความ" มักเก็บโลโก้และชื่อเว็บ?',
        hint: 'อยู่ด้านบนสุดของหน้าเว็บ (ใน <body>)',
        options: ['<head>', '<header>', '<top>'],
        correctIndex: 1,
      },
      {
        id: 'w5-2',
        clue: 'แท็ก Semantic ใดใช้ครอบ "แถบเมนูนำทางหลักของเว็บไซต์ (Navigation Links)"?',
        hint: 'ย่อมาจากคำว่า Navigation',
        options: ['<nav>', '<menu>', '<ul>'],
        correctIndex: 0,
      },
      {
        id: 'w5-3',
        clue: 'แท็ก Semantic ใดใช้ระบุ "เนื้อหาหลักที่สำคัญที่สุดของหน้าเว็บนั้น (Main Content)"?',
        hint: 'ควรมีเพียง 1 จุดหลักต่อหน้าเว็บ',
        options: ['<body>', '<section>', '<main>'],
        correctIndex: 2,
      },
      {
        id: 'w5-4',
        clue: 'แท็ก Semantic ใดใช้แบ่ง "หมวดหมู่หรือส่วนย่อยของเนื้อหาที่มีหัวข้อชัดเจน"?',
        hint: 'แปลว่า ส่วน หรือ หมวดหมู่',
        options: ['<div>', '<section>', '<span>'],
        correctIndex: 1,
      },
      {
        id: 'w5-5',
        clue: 'แท็ก Semantic ใดใช้เป็น "ส่วนท้ายสุดของหน้าเว็บ" มักเก็บข้อมูลลิขสิทธิ์และช่องทางติดต่อ?',
        hint: 'อยู่ด้านล่างสุดของหน้าเว็บ',
        options: ['<footer>', '<bottom>', '<end>'],
        correctIndex: 0,
      },
    ],
  },
];

// Block horizontal positions (% across the stage)
const BLOCK_POSITIONS_X = [24, 50, 76] as const;

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
  characterConfig = DEFAULT_CHARACTER_CONFIG,
  playerName = 'นักเรียน',
}) => {
  const isAllLessonsCleared = completedLessonsCount >= totalLessonsCount || isTeacher;

  // Allow student/teacher to unlock practice mode if they haven't finished all 8 lessons yet
  const [practiceUnlocked, setPracticeUnlocked] = useState<boolean>(isAllLessonsCleared);

  // Stage progression state (persisted in localStorage)
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(0);
  const [clearedStages, setClearedStages] = useState<Record<number, number>>({}); // stageNumber -> stars (1..3)
  const [totalScore, setTotalScore] = useState<number>(0);

  // Active Stage Gameplay State
  const currentStage = RUNNER_STAGES[selectedStageIdx] || RUNNER_STAGES[0];
  const [questionIdx, setQuestionIdx] = useState<number>(0);
  const currentChallenge = currentStage.challenges[questionIdx] || currentStage.challenges[0];

  // 3 Hearts (Lives) State
  const MAX_HEARTS = 3;
  const [hearts, setHearts] = useState<number>(MAX_HEARTS);

  // Character Position & Jump State
  // laneIndex: 0 (left block, 24%), 1 (middle block, 50%), 2 (right block, 76%)
  const [selectedLane, setSelectedLane] = useState<0 | 1 | 2>(1);
  const [playerXPercent, setPlayerXPercent] = useState<number>(BLOCK_POSITIONS_X[1]);
  const [isJumping, setIsJumping] = useState<boolean>(false);
  const [isRunningNext, setIsRunningNext] = useState<boolean>(false);
  const [facingDir, setFacingDir] = useState<'left' | 'right'>('right');

  // Block hit states for current challenge
  const [disabledBlocks, setDisabledBlocks] = useState<number[]>([]);
  const [hitCorrectBlock, setHitCorrectBlock] = useState<number | null>(null);
  const [bouncingBlock, setBouncingBlock] = useState<number | null>(null);
  const [floatingFeedback, setFloatingFeedback] = useState<{
    id: number;
    lane: number;
    text: string;
    isCorrect: boolean;
  } | null>(null);

  // Stage End States
  const [stageState, setStageState] = useState<'playing' | 'stage-clear' | 'game-over' | 'all-clear'>('playing');
  const [screenShake, setScreenShake] = useState<boolean>(false);

  const isBusyRef = useRef<boolean>(false);

  // Load saved progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('com_quest_runner_cleared');
      if (saved) {
        setClearedStages(JSON.parse(saved));
      }
      const savedScore = localStorage.getItem('com_quest_runner_score');
      if (savedScore) {
        setTotalScore(parseInt(savedScore, 10) || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (isAllLessonsCleared) {
      setPracticeUnlocked(true);
    }
  }, [isAllLessonsCleared]);

  // Reset stage when switching stage
  const startStage = useCallback((stageIndex: number) => {
    playSelectSound();
    isBusyRef.current = false;
    setSelectedStageIdx(stageIndex);
    setQuestionIdx(0);
    setHearts(MAX_HEARTS);
    setSelectedLane(1);
    setPlayerXPercent(BLOCK_POSITIONS_X[1]);
    setIsJumping(false);
    setIsRunningNext(false);
    setDisabledBlocks([]);
    setHitCorrectBlock(null);
    setBouncingBlock(null);
    setFloatingFeedback(null);
    setStageState('playing');
  }, []);

  // Move character to a specific lane (0, 1, 2)
  const moveToLane = useCallback(
    (targetLane: 0 | 1 | 2) => {
      if (isBusyRef.current || stageState !== 'playing') return;
      playSelectSound();
      setFacingDir(targetLane < selectedLane ? 'left' : 'right');
      setSelectedLane(targetLane);
      setPlayerXPercent(BLOCK_POSITIONS_X[targetLane]);
    },
    [selectedLane, stageState]
  );

  // Jump and headbutt the block in `targetLane`
  const triggerJumpAndHitBlock = useCallback(
    (targetLane: 0 | 1 | 2) => {
      if (isBusyRef.current || stageState !== 'playing') return;
      if (disabledBlocks.includes(targetLane)) return;

      isBusyRef.current = true;
      setFacingDir(targetLane < selectedLane ? 'left' : 'right');
      setSelectedLane(targetLane);

      const needWalk = playerXPercent !== BLOCK_POSITIONS_X[targetLane];
      setPlayerXPercent(BLOCK_POSITIONS_X[targetLane]);

      // Wait briefly if walking to that block, then JUMP!
      setTimeout(
        () => {
          setIsJumping(true);
          setBouncingBlock(targetLane);

          const isCorrect = targetLane === currentChallenge.correctIndex;

          if (isCorrect) {
            // CORRECT TAG BLOCK HIT!
            playHitSound();
            playComboSound(hearts);
            setHitCorrectBlock(targetLane);
            setTotalScore((prev) => {
              const next = prev + 100 * hearts;
              try {
                localStorage.setItem('com_quest_runner_score', String(next));
              } catch {}
              return next;
            });
            setFloatingFeedback({
              id: Date.now(),
              lane: targetLane,
              text: `+${100 * hearts} PTS! ถูกต้อง!`,
              isCorrect: true,
            });

            // Land from jump, then sprint right through the checkpoint pipe!
            setTimeout(() => {
              setIsJumping(false);
              setBouncingBlock(null);
              setFacingDir('right');
              setIsRunningNext(true);
              setPlayerXPercent(92); // Run across stage past pipe!

              setTimeout(() => {
                // Advance to next challenge or stage clear!
                if (questionIdx + 1 < currentStage.challenges.length) {
                  setQuestionIdx((prev) => prev + 1);
                  setDisabledBlocks([]);
                  setHitCorrectBlock(null);
                  setFloatingFeedback(null);
                  setIsRunningNext(false);
                  setSelectedLane(1);
                  setPlayerXPercent(BLOCK_POSITIONS_X[1]);
                  isBusyRef.current = false;
                } else {
                  // STAGE CLEARED!
                  playMissionClearSound();
                  playClearSound();
                  const earnedStars = Math.max(1, hearts);
                  setClearedStages((prev) => {
                    const updated = {
                      ...prev,
                      [currentStage.stageNumber]: Math.max(
                        prev[currentStage.stageNumber] || 0,
                        earnedStars
                      ),
                    };
                    try {
                      localStorage.setItem('com_quest_runner_cleared', JSON.stringify(updated));
                    } catch {}
                    return updated;
                  });
                  setIsRunningNext(false);
                  setStageState(
                    selectedStageIdx === RUNNER_STAGES.length - 1 ? 'all-clear' : 'stage-clear'
                  );
                  isBusyRef.current = false;
                }
              }, 550);
            }, 340);
          } else {
            // WRONG TAG BLOCK HIT! (-1 HEART)
            playHurtSound();
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), 450);

            setDisabledBlocks((prev) => [...prev, targetLane]);
            setFloatingFeedback({
              id: Date.now(),
              lane: targetLane,
              text: 'ผิด! -1 ♥',
              isCorrect: false,
            });

            const nextHearts = Math.max(0, hearts - 1);
            setHearts(nextHearts);

            setTimeout(() => {
              setIsJumping(false);
              setBouncingBlock(null);

              if (nextHearts <= 0) {
                playOverSound();
                setStageState('game-over');
              }
              isBusyRef.current = false;
            }, 380);
          }
        },
        needWalk ? 180 : 20
      );
    },
    [
      stageState,
      disabledBlocks,
      selectedLane,
      playerXPercent,
      currentChallenge.correctIndex,
      hearts,
      questionIdx,
      currentStage.challenges.length,
      currentStage.stageNumber,
      selectedStageIdx,
    ]
  );

  // Keyboard controls: Left/Right arrows or A/D to move, Space/Up/W/Enter to Jump, or 1/2/3 to jump at block 1/2/3
  useEffect(() => {
    if (!practiceUnlocked || stageState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const prevLane = Math.max(0, selectedLane - 1) as 0 | 1 | 2;
        moveToLane(prevLane);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const nextLane = Math.min(2, selectedLane + 1) as 0 | 1 | 2;
        moveToLane(nextLane);
      } else if (
        e.key === ' ' ||
        e.key === 'ArrowUp' ||
        e.key.toLowerCase() === 'w' ||
        e.key === 'Enter'
      ) {
        e.preventDefault();
        triggerJumpAndHitBlock(selectedLane);
      } else if (e.key === '1') {
        e.preventDefault();
        triggerJumpAndHitBlock(0);
      } else if (e.key === '2') {
        e.preventDefault();
        triggerJumpAndHitBlock(1);
      } else if (e.key === '3') {
        e.preventDefault();
        triggerJumpAndHitBlock(2);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [practiceUnlocked, stageState, selectedLane, moveToLane, triggerJumpAndHitBlock]);

  const totalClearedStagesCount = Object.keys(clearedStages).length;

  return (
    <div className="w-full space-y-4 select-none">
      {/* ====================================================================
          1. TOP HEADER & 8-LESSON UNLOCK STATUS BANNER
          ==================================================================== */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-cyan-500/40 shadow-[0_0_25px_rgba(0,240,255,0.12)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-400 text-slate-950 flex items-center gap-1 shadow-[0_0_12px_rgba(251,191,36,0.5)]">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>SPECIAL BONUS GAME</span>
            </span>
            {isAllLessonsCleared ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                <Unlock className="w-3 h-3" />
                <span>ปลดล็อกสมบูรณ์ (เรียนครบ 8/8 บทแล้ว!)</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                <span>ความคืบหน้าบทเรียน: {completedLessonsCount} / {totalLessonsCount} บท</span>
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-cyber font-bold text-white text-glow-cyan flex items-center gap-2">
            <span>SUPER HTML TAG RUNNER</span>
            <span className="text-xs sm:text-sm font-thai font-semibold text-amber-300">
              (ศึกกระโดดโหม่งบล็อกแท็ก HTML 5 ด่าน)
            </span>
          </h1>
          <p className="text-xs sm:text-sm font-thai text-slate-300">
            อ่านความหมายของแท็ก HTML ด้านบน แล้วบังคับตัวละครวิ่งไปกระโดดโหม่งบล็อก <strong className="text-amber-300">[ ? ]</strong> ที่ถูกต้องเพื่อวิ่งผ่านท่อไปยังด่านต่อไป! (มีหัวใจ 3 ดวง ♥♥♥ ต่อด่าน)
          </p>
        </div>

        {/* Right: World Stage Selector Pills (World 1-1 to 1-5) */}
        <div className="flex flex-wrap items-center gap-2">
          {RUNNER_STAGES.map((st, idx) => {
            const isSelected = idx === selectedStageIdx;
            const stars = clearedStages[st.stageNumber] || 0;
            const isUnlockedStage =
              idx === 0 || Boolean(clearedStages[RUNNER_STAGES[idx - 1].stageNumber]) || isAllLessonsCleared || practiceUnlocked;

            return (
              <button
                key={st.stageNumber}
                type="button"
                onClick={() => {
                  if (isUnlockedStage) {
                    startStage(idx);
                  }
                }}
                className={`px-3 py-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center min-w-[78px] ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-slate-950 border-yellow-200 font-black shadow-[0_0_18px_rgba(251,191,36,0.6)] scale-105'
                    : stars > 0
                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200 hover:border-emerald-400'
                    : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-cyan-400'
                }`}
              >
                <span className="text-[10px] font-mono font-bold uppercase leading-none">
                  ด่าน 1-{st.stageNumber}
                </span>
                <div className="flex items-center gap-0.5 mt-1">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${
                        s <= stars
                          ? isSelected
                            ? 'text-slate-950 fill-slate-950'
                            : 'text-amber-400 fill-amber-400'
                          : isSelected
                          ? 'text-slate-950/30'
                          : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          2. LOCKED / PRACTICE PROMPT IF < 8 LESSONS COMPLETED
          ==================================================================== */}
      {!practiceUnlocked ? (
        <div className="glass-panel rounded-2xl p-8 sm:p-10 border-2 border-amber-400/60 text-center space-y-6 bg-slate-950/90 shadow-[0_0_35px_rgba(245,158,11,0.2)]">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-950/80 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)]">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <span className="px-3 py-1 rounded-full bg-amber-950 border border-amber-500/50 text-amber-300 font-mono text-xs font-bold uppercase">
              SPECIAL ENDGAME QUEST • โหมดเกมพิเศษหลังเรียนจบ 8 บท
            </span>
            <h2 className="text-2xl sm:text-3xl font-cyber font-bold text-white">
              เคลียร์บทเรียนให้ครบ 8 บทเพื่อปลดล็อกเกมพิเศษ!
            </h2>
            <p className="text-sm font-thai text-slate-300 leading-relaxed">
              ตอนนี้คุณเคลียร์ไปแล้ว <strong className="text-cyan-300">{completedLessonsCount} / {totalLessonsCount} บทเรียน</strong> เมื่อเรียนครบทั้ง 8 บทจะปลดล็อกเกมตะลุยด่านสไตล์มาริโอ้เพื่อชิงถ้วยรางวัล Grand Master!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/subjects"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-cyber font-bold text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-2"
            >
              <span>ไปลุยบทเรียนต่อ ({completedLessonsCount}/8)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => {
                playSelectSound();
                setPracticeUnlocked(true);
              }}
              className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-cyber font-bold text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(251,191,36,0.5)] flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>เข้าเล่นโหมดทดลองเล่นทันที (Demo / Practice Mode)</span>
            </button>
          </div>
        </div>
      ) : (
        /* ====================================================================
           3. MAIN MARIO-STYLE 2D PLATFORMER STAGE CANVAS
           ==================================================================== */
        <div
          className={`relative w-full rounded-2xl overflow-hidden border-2 border-cyan-500/50 shadow-[0_12px_40px_rgba(0,0,0,0.75)] transition-transform ${
            screenShake ? 'animate-shake border-rose-500' : ''
          }`}
        >
          {/* SKY / ENVIRONMENT STAGE */}
          <div
            className={`relative w-full min-h-[490px] sm:min-h-[530px] bg-gradient-to-b ${currentStage.skyGradient} flex flex-col justify-between overflow-hidden`}
          >
            {/* Decorative Retro Pixel Clouds & Stars in Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-14 left-[8%] w-24 h-8 rounded-full bg-white/25 blur-[1px]" />
              <div className="absolute top-10 left-[11%] w-14 h-8 rounded-full bg-white/30 blur-[1px]" />
              <div className="absolute top-20 right-[14%] w-28 h-9 rounded-full bg-white/20 blur-[1px]" />
              <div className="absolute top-14 right-[18%] w-16 h-9 rounded-full bg-white/25 blur-[1px]" />
            </div>

            {/* ----------------------------------------------------------------
                TOP ARCADE HUD BAR (3 HEARTS ♥♥♥ | WORLD 1-X | CHECKPOINT | SCORE)
                ---------------------------------------------------------------- */}
            <div className="relative z-20 m-3 sm:m-4 px-4 py-2.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-white/15 shadow-lg flex flex-wrap items-center justify-between gap-3">
              {/* Left: 3 Hearts Status (โอกาสผิดได้ 3 ครั้ง) */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/85 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                  <span className="text-[11px] font-thai font-bold text-rose-200 mr-1">
                    หัวใจ (โอกาส):
                  </span>
                  {Array.from({ length: MAX_HEARTS }).map((_, idx) => {
                    const isAlive = idx < hearts;
                    return (
                      <Heart
                        key={idx}
                        className={`w-5 h-5 transition-all duration-300 ${
                          isAlive
                            ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_#f43f5e] scale-100'
                            : 'text-slate-700 fill-slate-800 scale-75 opacity-40'
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="hidden sm:flex flex-col">
                  <span className="text-[10px] font-mono text-amber-400 font-bold">
                    {currentStage.worldCode}
                  </span>
                  <span className="text-xs font-thai font-bold text-white">
                    {currentStage.title}
                  </span>
                </div>
              </div>

              {/* Center: Checkpoint Progress (ด่านย่อย 1..5 ในแต่ละ World) */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700">
                <Flag className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                {currentStage.challenges.map((ch, idx) => (
                  <div
                    key={ch.id}
                    className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center border transition-all ${
                      idx < questionIdx
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-black'
                        : idx === questionIdx
                        ? 'bg-amber-400 text-slate-950 border-yellow-200 font-black scale-110 shadow-[0_0_10px_#fbbf24]'
                        : 'bg-slate-950 text-slate-500 border-slate-800'
                    }`}
                  >
                    {idx < questionIdx ? '✓' : idx + 1}
                  </div>
                ))}
              </div>

              {/* Right: Score & Cleared Worlds */}
              <div className="flex items-center gap-2.5 font-mono text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-bold flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>SCORE: {totalScore.toLocaleString()}</span>
                </div>
                <button
                  type="button"
                  onClick={() => startStage(selectedStageIdx)}
                  title="เริ่มด่านนี้ใหม่"
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ----------------------------------------------------------------
                QUESTION CLUE BANNER (โจทย์บอกความหมายของแท็ก HTML)
                ---------------------------------------------------------------- */}
            <div className="relative z-20 mx-3 sm:mx-8 px-4 sm:px-6 py-3.5 rounded-2xl bg-slate-950/92 border-2 border-amber-400/90 shadow-[0_8px_30px_rgba(0,0,0,0.65)] text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-amber-300 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  ด่าน {currentStage.worldCode} &bull; จุดเช็คพอยต์ที่ {questionIdx + 1} /{' '}
                  {currentStage.challenges.length}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-cyan-300 font-thai">คำใบ้: {currentChallenge.hint}</span>
              </div>

              <h2 className="text-base sm:text-xl lg:text-2xl font-thai font-bold text-white leading-snug">
                {currentChallenge.clue}
              </h2>

              <p className="text-[11px] sm:text-xs font-thai text-slate-400">
                💡 คลิกที่บล็อกคำตอบ <strong className="text-amber-300">[ ? ]</strong> ด้านล่าง หรือกดปุ่ม{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">◀</kbd>{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">▶</kbd>{' '}
                แล้วกด{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[10px]">Spacebar</kbd>{' '}
                เพื่อกระโดดโหม่งบล็อกที่ถูกต้อง!
              </p>
            </div>

            {/* ----------------------------------------------------------------
                MARIO PLATFORMER ACTION STAGE (3 FLOATING [?] BLOCKS + CHARACTER + PIPE)
                ---------------------------------------------------------------- */}
            <div className="relative flex-1 w-full min-h-[260px] sm:min-h-[290px]">
              {/* 3 FLOATING MARIO QUESTION BLOCKS IN THE SKY */}
              {([0, 1, 2] as const).map((laneIdx) => {
                const tagText = currentChallenge.options[laneIdx];
                const leftPos = BLOCK_POSITIONS_X[laneIdx];
                const isDisabled = disabledBlocks.includes(laneIdx);
                const isCorrectHit = hitCorrectBlock === laneIdx;
                const isBouncing = bouncingBlock === laneIdx;
                const isPlayerUnder = selectedLane === laneIdx;

                return (
                  <div
                    key={laneIdx}
                    style={{ left: `${leftPos}%` }}
                    className="absolute top-6 sm:top-8 -translate-x-1/2 z-20 flex flex-col items-center"
                  >
                    {/* Floating Coin / Damage Popover above block */}
                    {floatingFeedback && floatingFeedback.lane === laneIdx && (
                      <div
                        key={floatingFeedback.id}
                        className={`mb-2 px-3 py-1 rounded-full font-mono text-xs sm:text-sm font-black whitespace-nowrap animate-bounce shadow-lg ${
                          floatingFeedback.isCorrect
                            ? 'bg-amber-300 text-slate-950 border-2 border-white shadow-[0_0_20px_#fde047]'
                            : 'bg-rose-600 text-white border-2 border-rose-300 shadow-[0_0_20px_#f43f5e]'
                        }`}
                      >
                        {floatingFeedback.isCorrect ? '🪙 ' : '💥 '}
                        {floatingFeedback.text}
                      </div>
                    )}

                    {/* THE MARIO [ ? ] TAG BLOCK */}
                    <button
                      type="button"
                      disabled={isDisabled || stageState !== 'playing'}
                      onClick={() => triggerJumpAndHitBlock(laneIdx)}
                      className={`group relative px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border-4 font-mono text-base sm:text-xl font-black transition-all duration-150 cursor-pointer select-none flex flex-col items-center gap-1 min-w-[105px] sm:min-w-[140px] ${
                        isBouncing ? '-translate-y-5 scale-110' : 'hover:-translate-y-1'
                      } ${
                        isCorrectHit
                          ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 border-emerald-200 text-slate-950 shadow-[0_6px_0_#065f46,0_0_30px_#10b981]'
                          : isDisabled
                          ? 'bg-slate-800 border-slate-600 text-rose-400 opacity-60 line-through shadow-[0_4px_0_#1e293b] cursor-not-allowed'
                          : isPlayerUnder
                          ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500 border-yellow-100 text-slate-950 shadow-[0_6px_0_#92400e,0_0_28px_rgba(251,191,36,0.85)] ring-4 ring-white/60'
                          : 'bg-gradient-to-b from-amber-400 to-orange-500 border-amber-200 text-slate-950 shadow-[0_6px_0_#92400e]'
                      }`}
                    >
                      {/* Corner rivets like Mario Question Block */}
                      <span className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-amber-900/60" />
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-900/60" />
                      <span className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-amber-900/60" />
                      <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-900/60" />

                      <span className="text-[10px] font-pixel uppercase tracking-widest opacity-75">
                        {isCorrectHit ? '★ CLEAR ★' : isDisabled ? '✕ WRONG' : `[ ? บล็อก ${laneIdx + 1} ]`}
                      </span>
                      <span className="tracking-wide drop-shadow-sm">{tagText}</span>
                    </button>

                    {/* Target Arrow Indicator when player stands underneath */}
                    {isPlayerUnder && !isDisabled && !isCorrectHit && (
                      <div className="mt-1.5 text-xs font-pixel text-amber-300 animate-bounce drop-shadow">
                        ▲ กระโดดโหม่ง!
                      </div>
                    )}
                  </div>
                );
              })}

              {/* RIGHT-SIDE MARIO WARP PIPE & CHECKPOINT FLAG */}
              <div className="absolute right-4 sm:right-8 bottom-0 z-10 flex items-end gap-3 pointer-events-none">
                {/* Goal Flagpole on Final Question of Stage */}
                {questionIdx === currentStage.challenges.length - 1 && (
                  <div className="flex flex-col items-center mr-2">
                    <div className="w-4 h-4 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
                    <div className="relative w-1.5 h-36 bg-slate-200">
                      <div className="absolute top-2 left-1.5 px-2 py-1 bg-emerald-500 text-slate-950 font-pixel text-[9px] rounded-r shadow">
                        GOAL
                      </div>
                    </div>
                  </div>
                )}

                {/* Classic Green Mario Warp Pipe */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-16 sm:w-20 h-6 rounded-md border-2 border-black/60 shadow-inner"
                    style={{ backgroundColor: currentStage.pipeColor }}
                  />
                  <div
                    className="w-14 sm:w-16 h-14 sm:h-16 border-x-2 border-black/60"
                    style={{ backgroundColor: currentStage.pipeColor }}
                  />
                </div>
              </div>

              {/* THE PLAYER CHARACTER SPRITE (WALKS & JUMPS TO HIT BLOCKS!) */}
              <div
                style={{
                  left: `${playerXPercent}%`,
                  transform: `translateX(-50%) ${
                    isJumping ? 'translateY(-95px) scale(1.08)' : 'translateY(0px)'
                  } ${facingDir === 'left' ? 'scaleX(-1)' : 'scaleX(1)'}`,
                }}
                className={`absolute bottom-0 z-30 transition-all ${
                  isRunningNext ? 'duration-500 ease-in' : 'duration-200 ease-out'
                }`}
              >
                <div className="flex flex-col items-center">
                  {isJumping && (
                    <span className="mb-1 px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-pixel text-[9px] shadow">
                      JUMP!
                    </span>
                  )}
                  <PixelCharacter
                    config={characterConfig}
                    size={82}
                    animate={true}
                    className="drop-shadow-[0_6px_12px_rgba(0,0,0,0.7)]"
                  />
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------------------
                MARIO BRICK GROUND FLOOR + ON-SCREEN GAMEPAD CONTROLS
                ---------------------------------------------------------------- */}
            <div className="relative z-20">
              {/* Top Grass / Neon Strip */}
              <div
                className="w-full h-3 border-t-2 border-black/40"
                style={{ backgroundColor: currentStage.groundTopColor }}
              />

              {/* Brick Ground Bar + Interactive Controls */}
              <div
                className="w-full px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-t border-black/40"
                style={{
                  backgroundColor: currentStage.groundColor,
                  backgroundImage:
                    'repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 2px, transparent 2px, transparent 36px)',
                }}
              >
                {/* Left: On-Screen D-Pad (Move Left / Right) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveToLane(Math.max(0, selectedLane - 1) as 0 | 1 | 2)}
                    className="px-3.5 py-2 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-white/20 text-white font-cyber font-bold text-xs flex items-center gap-1 shadow cursor-pointer active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4 text-cyan-400" />
                    <span>เดินซ้าย (◀)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => moveToLane(Math.min(2, selectedLane + 1) as 0 | 1 | 2)}
                    className="px-3.5 py-2 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-white/20 text-white font-cyber font-bold text-xs flex items-center gap-1 shadow cursor-pointer active:scale-95"
                  >
                    <span>เดินขวา (▶)</span>
                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>

                {/* Center: Player Status */}
                <div className="hidden md:flex items-center gap-2 text-xs font-thai text-white/90 bg-black/35 px-3.5 py-1.5 rounded-full">
                  <span>ผู้เล่น: <strong>{playerName}</strong></span>
                  <span>•</span>
                  <span>กำลังยืนใต้บล็อกที่ {selectedLane + 1} ({currentChallenge.options[selectedLane]})</span>
                </div>

                {/* Right: Giant JUMP Button */}
                <button
                  type="button"
                  onClick={() => triggerJumpAndHitBlock(selectedLane)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 text-slate-950 font-cyber font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(251,191,36,0.7)] flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>กระโดดโหม่งบล็อก! (SPACE / JUMP)</span>
                </button>
              </div>
            </div>

            {/* ================================================================
                OVERLAYS: STAGE CLEAR / ALL CLEAR / GAME OVER (0 HEARTS)
                ================================================================ */}
            {stageState !== 'playing' && (
              <div className="absolute inset-0 z-40 bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
                {stageState === 'game-over' ? (
                  <div className="glass-panel max-w-md w-full rounded-2xl p-6 sm:p-8 border-2 border-rose-500 text-center space-y-5 bg-slate-950/95 shadow-[0_0_40px_rgba(244,63,94,0.45)]">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-950 border border-rose-500 flex items-center justify-center text-rose-400">
                      <XCircle className="w-9 h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <span className="font-pixel text-xs text-rose-400 uppercase tracking-widest">
                        OUT OF HEARTS (0 / 3 ♥)
                      </span>
                      <h3 className="text-2xl font-cyber font-bold text-white">
                        หัวใจหมดครบ 3 ดวงแล้ว!
                      </h3>
                      <p className="text-xs sm:text-sm font-thai text-slate-300">
                        ไม่เป็นไรนะ! ลองทบทวนความหมายของแท็ก HTML แล้วกดเริ่มด่าน {currentStage.worldCode} ใหม่อีกครั้ง
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startStage(selectedStageIdx)}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-cyber font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.5)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>เล่นด่าน {currentStage.worldCode} ใหม่อีกครั้ง (รับ ♥♥♥)</span>
                    </button>
                  </div>
                ) : (
                  <div className="glass-panel max-w-md w-full rounded-2xl p-6 sm:p-8 border-2 border-amber-400 text-center space-y-5 bg-slate-950/95 shadow-[0_0_50px_rgba(251,191,36,0.5)]">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center shadow-[0_0_25px_#fbbf24]">
                      {stageState === 'all-clear' ? (
                        <Crown className="w-9 h-9" />
                      ) : (
                        <Trophy className="w-9 h-9" />
                      )}
                    </div>

                    <div className="space-y-2">
                      <span className="px-3 py-1 rounded-full bg-amber-950 border border-amber-400 text-amber-300 font-pixel text-xs uppercase">
                        {stageState === 'all-clear' ? 'ALL 5 WORLDS CLEARED!' : `${currentStage.worldCode} CLEAR!`}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-cyber font-bold text-white">
                        {stageState === 'all-clear'
                          ? 'สุดยอด! คุณพิชิตครบทั้ง 5 ด่านของ Super HTML Runner แล้ว!'
                          : `ผ่านด่าน ${currentStage.title} สำเร็จ!`}
                      </h3>

                      {/* Stars Earned based on remaining hearts */}
                      <div className="flex items-center justify-center gap-2 py-1">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`w-7 h-7 ${
                              s <= hearts
                                ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_#fbbf24]'
                                : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>

                      <p className="text-xs font-thai text-slate-300">
                        หัวใจคงเหลือ {hearts}/3 ดวง &bull; คะแนนสะสมรวม {totalScore.toLocaleString()} PTS
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => startStage(selectedStageIdx)}
                        className="py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 font-cyber font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>เล่นด่านนี้อีกครั้ง</span>
                      </button>

                      {selectedStageIdx + 1 < RUNNER_STAGES.length ? (
                        <button
                          type="button"
                          onClick={() => startStage(selectedStageIdx + 1)}
                          className="py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-cyber font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer"
                        >
                          <span>ไปลุยด่าน 1-{selectedStageIdx + 2} ต่อ!</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startStage(0)}
                          className="py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-cyber font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(251,191,36,0.5)] cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>เล่นใหม่ตั้งแต่ด่าน 1-1</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
