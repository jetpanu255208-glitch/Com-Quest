'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getLessonMission } from '@/lib/constants/missions';
import { getLessonBlockConfig } from '@/lib/constants/mission-blocks';
import { Lesson } from '@/lib/supabase/types';
import { BlockCodingWorkspace } from '@/components/mission/BlockCodingWorkspace';
import {
  Code2,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Laptop,
  Lightbulb,
  Copy,
  Check,
  Swords,
  Eye,
  Info,
  AlertTriangle,
  Puzzle,
  Keyboard,
} from 'lucide-react';

import { recordMissionPassed } from '@/app/actions/student-mission';
import {
  playMissionClearSound,
  playHurtSound,
  playSelectSound,
} from '@/lib/sound/sound-manager';

interface CodingMissionPlayerProps {
  lesson: Lesson;
}

const DEMO_PHOTO_SVG_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0284c7"/>
        <stop offset="60%" stop-color="#38bdf8"/>
        <stop offset="100%" stop-color="#bae6fd"/>
      </linearGradient>
    </defs>
    <rect width="600" height="360" rx="16" fill="url(#sky)"/>
    <circle cx="480" cy="85" r="42" fill="#fde047"/>
    <polygon points="40,320 190,130 340,320" fill="#0f766e"/>
    <polygon points="210,320 380,105 550,320" fill="#115e59"/>
    <polygon points="380,105 430,175 330,175" fill="#f8fafc"/>
    <rect y="290" width="600" height="70" fill="#10b981"/>
    <text x="24" y="335" font-family="sans-serif" font-size="18" font-weight="bold" fill="#ffffff">photo.jpg • Com Quest Nature Gallery</text>
  </svg>`
)}`;

export function CodingMissionPlayer({ lesson }: CodingMissionPlayerProps) {
  const router = useRouter();
  const mission = getLessonMission(lesson.id);
  const blockConfig = getLessonBlockConfig(lesson.id);

  // Mode Toggle State: 'block' (default gamified LEGO SPIKE mode) | 'text' (raw HTML editor)
  const [editorMode, setEditorMode] = useState<'block' | 'text'>('block');
  const [assembleTrigger, setAssembleTrigger] = useState<number>(0);

  // State
  const [code, setCode] = useState(mission?.initialCode || '');
  const [executedCode, setExecutedCode] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [runSuccess, setRunSuccess] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [copiedSolution, setCopiedSolution] = useState(false);
  const [hasShownSuccessCelebration, setHasShownSuccessCelebration] = useState(false);
  const [quizWarning, setQuizWarning] = useState<string | null>(null);
  const missionSavedRef = React.useRef(false);

  // Evaluate criteria in real time
  const criteriaResults = useMemo(() => {
    if (!mission) return [];
    return mission.criteria.map((c) => ({
      ...c,
      passed: c.check(code),
    }));
  }, [code, mission]);

  const allPassed = criteriaResults.length > 0 && criteriaResults.every((c) => c.passed);
  const isMissionCompleted = allPassed && hasRun && runSuccess;

  // Trigger one-time celebration when student runs code and all criteria pass
  useEffect(() => {
    if (isMissionCompleted && !hasShownSuccessCelebration) {
      setHasShownSuccessCelebration(true);
    }
  }, [isMissionCompleted, hasShownSuccessCelebration]);

  // Construct iframe preview document from executedCode only
  const previewHtml = useMemo(() => {
    if (!executedCode || !runSuccess) return '';
    // Replace relative demo photo.jpg with rich embedded SVG so Lesson 5 renders a vibrant picture
    const hydratedHtml = executedCode.replace(
      /src=["']photo\.jpg["']/gi,
      `src="${DEMO_PHOTO_SVG_DATA_URI}"`
    );

    return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 18px;
      padding: 0;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.6;
    }
    h1 { color: #0284c7; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; font-size: 22px; }
    h2 { color: #0369a1; margin-top: 12px; margin-bottom: 6px; font-size: 19px; }
    h3 { color: #075985; margin-top: 10px; margin-bottom: 6px; font-size: 17px; }
    p { margin-top: 6px; margin-bottom: 10px; font-size: 15px; }
    mark { background-color: #fef08a; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
    a { color: #0284c7; font-weight: 600; text-decoration: underline; }
    img { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 14px; }
    th, td { border: 1px solid #94a3b8; padding: 8px 12px; text-align: left; }
    th { background-color: #e0f2fe; color: #0369a1; font-weight: bold; }
    form { background: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; border-radius: 12px; display: flex; flex-direction: column; gap: 10px; max-width: 340px; }
    label { font-weight: 600; font-size: 13px; color: #334155; }
    input { padding: 7px 10px; border: 1px solid #94a3b8; border-radius: 6px; font-size: 14px; }
    button { background: #0284c7; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: bold; cursor: pointer; }
    header { background: #0f172a; color: #38bdf8; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; }
    header h1 { color: #38bdf8; border: none; margin: 0; padding: 0; font-size: 18px; }
    nav { background: #e0f2fe; padding: 8px 12px; border-radius: 8px; margin-bottom: 10px; display: flex; gap: 12px; }
    main { padding: 10px 12px; background: #f8fafc; border: 1px dashed #94a3b8; border-radius: 8px; margin-bottom: 10px; }
    footer { font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; }
  </style>
</head>
<body>
  ${hydratedHtml}
</body>
</html>`;
  }, [executedCode, runSuccess]);

  // Line numbers calculation
  const lineCount = useMemo(() => {
    return Math.max(code.split('\n').length, 12);
  }, [code]);

  if (!mission) {
    return (
      <div className="glass-panel p-8 rounded-xl text-center space-y-4">
        <p className="text-white">ไม่พบภารกิจสำหรับบทเรียนนี้</p>
        <Link
          href={`/quiz/${lesson.id}`}
          className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs"
        >
          ไปทำแบบทดสอบ
        </Link>
      </div>
    );
  }

  // Handle click on Enter Quiz button
  const handleEnterQuiz = async () => {
    if (!isMissionCompleted && !allPassed) {
      setQuizWarning('ต่อบล็อกหรือเขียนโค้ดให้ครบเงื่อนไข แล้วกดปุ่ม ▶ Play (Run Code) ก่อนนะ!');
      setTimeout(() => setQuizWarning(null), 4000);
      return;
    }

    // Ensure mission state is marked as executed & saved before navigating
    setQuizWarning(null);
    setHasRun(true);
    setRunSuccess(true);
    setExecutedCode(code);

    try {
      document.cookie = `mission_passed_${lesson.id}=true; path=/; max-age=31536000; SameSite=Lax`;
      localStorage.setItem(`mission_passed_${lesson.id}`, 'true');
      if (!missionSavedRef.current) {
        missionSavedRef.current = true;
        await recordMissionPassed({ lessonId: lesson.id });
      }
    } catch (err) {
      console.warn('recordMissionPassed on enter quiz error:', err);
    }

    router.push(`/quiz/${lesson.id}`);
  };

  // Run code action (supports optional overrideHtml from BlockCodingWorkspace)
  const handleRunCode = (overrideHtml?: string) => {
    const targetHtml = typeof overrideHtml === 'string' ? overrideHtml : code;
    if (typeof overrideHtml === 'string' && overrideHtml !== code) {
      setCode(targetHtml);
    }

    const passedAllNow = mission.criteria.every((c) => c.check(targetHtml));
    setHasRun(true);
    setQuizWarning(null);

    if (passedAllNow) {
      setExecutedCode(targetHtml);
      setRunSuccess(true);
      setRunError(null);
      playMissionClearSound();
      try {
        document.cookie = `mission_passed_${lesson.id}=true; path=/; max-age=31536000; SameSite=Lax`;
        localStorage.setItem(`mission_passed_${lesson.id}`, 'true');
      } catch {
        // ignore
      }
      // Persist to Supabase database immediately (once)
      if (!missionSavedRef.current) {
        missionSavedRef.current = true;
        recordMissionPassed({ lessonId: lesson.id }).catch((err) => {
          missionSavedRef.current = false;
          console.warn('recordMissionPassed error:', err);
        });
      }
    } else {
      setExecutedCode(null);
      setRunSuccess(false);
      playHurtSound();
      setRunError(
        'โค้ดยังไม่ตรงตามเงื่อนไขที่โจทย์กำหนด กรุณาตรวจสอบ Checklist ด้านบนและแก้ไขก่อนกดรันใหม่'
      );
    }
  };

  const handleStopCode = () => {
    setHasRun(false);
    setRunSuccess(false);
    setExecutedCode(null);
    setRunError(null);
  };

  // Handle Tab key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Copy solution action
  const handleCopySolution = () => {
    navigator.clipboard.writeText(mission.solutionCode);
    setCopiedSolution(true);
    setTimeout(() => setCopiedSolution(false), 2500);
  };

  // Apply solution to editor or block canvas
  const handleApplySolution = () => {
    setCode(mission.solutionCode);
    setAssembleTrigger((prev) => prev + 1);
    setShowSolution(false);
  };

  // Reset code action
  const handleResetCode = () => {
    if (confirm('ต้องการรีเซ็ตโค้ดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      setCode('');
      setExecutedCode(null);
      setHasRun(false);
      setRunSuccess(false);
      setRunError(null);
    }
  };

  const handleBlockCodeChange = (newHtml: string) => {
    if (newHtml === code) return;
    setCode(newHtml);
    if (hasRun) {
      setHasRun(false);
      setRunSuccess(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* ====================================================================
          MISSION BRIEFING CARD + GAMIFIED MODE TOGGLE SWITCHER
          ==================================================================== */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-cyan-500/40 relative overflow-hidden shadow-[0_0_25px_rgba(0,240,255,0.12)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 uppercase">
                เควสต์ปฏิบัติการ &bull; บทที่ {lesson.lesson_number}
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>GAMIFIED CODING LAB</span>
              </span>
            </div>

            {/* GAMIFIED MODE TOGGLE SWITCH (BLOCK BUILDER VS TEXT EDITOR) */}
            <div className="flex flex-wrap items-center gap-2">
              {blockConfig && (
                <div className="p-1 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      playSelectSound();
                      setEditorMode('block');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-thai font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      editorMode === 'block'
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Puzzle className="w-3.5 h-3.5" />
                    <span>โหมดมินิเกมต่อบล็อก</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSelectSound();
                      setEditorMode('text');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-thai font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      editorMode === 'text'
                        ? 'bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span>โหมดพิมพ์โค้ดเอง</span>
                  </button>
                </div>
              )}

              {/* Solution Button */}
              <button
                type="button"
                onClick={() => {
                  playSelectSound();
                  setShowSolution(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/50 text-amber-300 hover:text-amber-200 text-xs font-thai font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)] cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>ดูเฉลยภารกิจ (Solution)</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div>
              <h1 className="text-lg sm:text-xl font-cyber font-bold text-white text-glow-cyan">
                {mission.title}
              </h1>
              <p className="text-xs font-thai text-slate-300 mt-0.5">
                {mission.objective}
              </p>
            </div>

            {/* Compact Checklist Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {criteriaResults.map((c) => (
                <span
                  key={c.id}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-thai font-bold border flex items-center gap-1 transition-all ${
                    c.passed
                      ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                      : 'bg-slate-900/80 border-slate-700 text-slate-400'
                  }`}
                >
                  {c.passed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <span>{c.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          MODE 1: LEGO SPIKE-STYLE BLOCK CODING MINI-GAME (DEFAULT)
          ==================================================================== */}
      {editorMode === 'block' && blockConfig ? (
        <BlockCodingWorkspace
          lessonNumber={lesson.lesson_number}
          blockConfig={blockConfig}
          criteriaResults={criteriaResults}
          allPassed={allPassed}
          hasRun={hasRun}
          runSuccess={runSuccess}
          previewHtml={previewHtml}
          onCodeChange={handleBlockCodeChange}
          onRunCode={handleRunCode}
          onStopCode={handleStopCode}
          onShowSolutionModal={() => setShowSolution(true)}
          externalAssembleTrigger={assembleTrigger}
        />
      ) : (
        /* ==================================================================
           MODE 2: CLASSIC SPLIT-SCREEN TEXT CODE EDITOR
           ================================================================== */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* LEFT COLUMN: CODE EDITOR */}
          <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col overflow-hidden bg-slate-950/90 shadow-lg">
            {/* Editor Header with Run Code button */}
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <span className="text-[11px] sm:text-xs font-mono font-bold text-cyan-300 ml-1 sm:ml-2 flex items-center gap-1 sm:gap-1.5 truncate">
                  <Code2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>
                    index.html <span className="hidden sm:inline">(โหมดพิมพ์โค้ดเอง)</span>
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetCode}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-thai flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ล้างโค้ด</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunCode()}
                  className="px-3 sm:px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-cyber font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:scale-[1.03] transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>
                    Run Code <span className="hidden sm:inline">(รันโค้ด)</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Editor Body with Line Numbers */}
            <div className="relative flex-1 flex min-h-[380px] font-mono text-xs sm:text-sm bg-[#050811]">
              {/* Line numbers gutter */}
              <div className="select-none py-4 px-3 text-right text-slate-600 bg-slate-950/80 border-r border-slate-800/80 w-12 shrink-0 font-mono text-xs leading-6">
                {Array.from({ length: lineCount }).map((_, idx) => (
                  <div key={idx}>{idx + 1}</div>
                ))}
              </div>

              {/* Code Textarea */}
              <textarea
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (hasRun) {
                    setHasRun(false);
                    setRunSuccess(false);
                  }
                }}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                placeholder="<!-- พิมพ์โค้ด HTML ของคุณตามโจทย์ภารกิจที่นี่ -->"
                className="flex-1 p-4 bg-transparent text-cyan-100 placeholder:text-slate-600 outline-none resize-none font-mono text-xs sm:text-sm leading-6 selection:bg-cyan-500/30 w-full"
              />
            </div>

            {/* Editor Status Bar */}
            <div className="px-4 py-2 bg-slate-900/70 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>โหมดพิมพ์โค้ด HTML (ซิงค์กับโหมดต่อบล็อก)</span>
              <span>{code.length} ตัวอักษร</span>
            </div>
          </div>

          {/* RIGHT COLUMN: CODE OUTPUT PREVIEW */}
          <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col overflow-hidden bg-white shadow-lg">
            {/* Faux Browser Chrome Header */}
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-cyber font-bold text-slate-200">
                  ผลลัพธ์ของโค้ด (CODE OUTPUT)
                </span>
              </div>

              <div className="flex-1 max-w-sm px-3 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 truncate flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isMissionCompleted ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span>http://localhost/student.html</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {!hasRun ? (
              <div className="flex-1 min-h-[380px] bg-[#060913] flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-base font-cyber font-bold text-white">
                    รอการรันโค้ด (Click Run Code)
                  </h3>
                  <p className="text-xs font-thai text-slate-400 leading-relaxed">
                    เมื่อพิมพ์โค้ดตามโจทย์แล้ว กดปุ่ม <strong>&quot;Run Code&quot;</strong> เพื่อดูผลลัพธ์
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRunCode()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-cyber font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer btn-neon-hover"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>กดปุ่ม Run Code</span>
                </button>
              </div>
            ) : !runSuccess ? (
              <div className="flex-1 min-h-[380px] bg-[#0c0812] flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-500/60 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse">
                  <XCircle className="w-8 h-8" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="text-base font-cyber font-bold text-rose-300">
                    โค้ดยังไม่ตรงตามโจทย์ที่กำหนด
                  </h3>
                  <p className="text-xs font-thai text-slate-300 leading-relaxed">
                    {runError}
                  </p>
                </div>
                <div className="text-left bg-slate-950/80 border border-rose-500/30 p-3 rounded-xl w-full max-w-sm space-y-1.5 text-xs font-thai text-rose-200">
                  <div className="font-bold text-rose-300 flex items-center gap-1.5 text-[11px]">
                    <span>เงื่อนไขที่ยังต้องแก้ไข:</span>
                  </div>
                  {criteriaResults
                    .filter((c) => !c.passed)
                    .map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-1.5 text-[11px] text-slate-300"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                        <span>{c.label}</span>
                      </div>
                    ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleRunCode()}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-200 hover:text-emerald-300 font-cyber font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer btn-neon-hover"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>แก้ไขแล้ว ลองรันใหม่อีกครั้ง</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 min-h-[380px] bg-white relative">
                <iframe
                  srcDoc={previewHtml}
                  title="HTML Mission Live Preview"
                  sandbox="allow-scripts"
                  className="w-full h-full min-h-[380px] border-0 bg-white"
                />
              </div>
            )}

            {/* Browser Bottom Status */}
            <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] font-thai text-slate-400">
              <span>
                {isMissionCompleted ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>เขียนโค้ดตรงตามโจทย์ & รันแสดงผลสำเร็จ</span>
                  </span>
                ) : hasRun ? (
                  <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>ยังไม่ตรงตามเงื่อนไข</span>
                  </span>
                ) : (
                  <span>แสดงผลหลังกด Run Code</span>
                )}
              </span>
              <span className="font-mono text-xs font-semibold">
                {isMissionCompleted ? (
                  <span className="text-emerald-400">200 OK</span>
                ) : (
                  <span className="text-slate-500">READY</span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          BOTTOM ACTION / UNLOCK QUIZ BAR
          ==================================================================== */}
      <div className="space-y-3">
        {quizWarning && (
          <div className="p-3.5 rounded-xl bg-rose-950/90 border-2 border-rose-500 text-rose-200 text-xs sm:text-sm font-thai flex items-center justify-between gap-3 shadow-[0_0_25px_rgba(244,63,94,0.4)] animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
              <span className="font-bold">{quizWarning}</span>
            </div>
            <span className="text-[11px] text-rose-300 font-mono hidden sm:inline">
              (ต่อบล็อกให้ครบแล้วกดปุ่ม ▶ Play มุมขวาล่างให้สำเร็จ)
            </span>
          </div>
        )}

        <div
          className={`glass-panel rounded-2xl p-5 sm:p-6 border transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-5 ${
            isMissionCompleted
              ? 'border-emerald-500/60 bg-emerald-950/20 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
              : 'border-slate-800 bg-slate-950/60'
          }`}
        >
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              {isMissionCompleted ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-base sm:text-lg font-cyber font-bold text-white text-glow-cyan">
                    ภารกิจสำเร็จครบถ้วน! แสดงผลหน้าเว็บสำเร็จแล้ว
                  </span>
                </>
              ) : allPassed ? (
                <>
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span className="text-base sm:text-lg font-cyber font-bold text-amber-300">
                    บล็อกโค้ดครบตามเงื่อนไขแล้ว! กดปุ่ม ▶ Play เพื่อแสดงผลลัพธ์
                  </span>
                </>
              ) : (
                <>
                  <Info className="w-5 h-5 text-amber-400" />
                  <span className="text-base sm:text-lg font-cyber font-bold text-white">
                    อยู่ระหว่างการทำมินิเกมต่อบล็อกโค้ด HTML
                  </span>
                </>
              )}
            </div>

            <p className="text-xs sm:text-sm font-thai text-slate-300">
              {isMissionCompleted
                ? 'คุณต่อบล็อก HTML ตรงตามโจทย์และรันแสดงผลเรียบร้อยแล้ว สามารถกดปุ่มเข้าสู่หน้าแบบทดสอบท้ายบท 10 ข้อด้านขวาได้เลย!'
                : allPassed
                ? 'บล็อกโค้ดของคุณครบทุกเงื่อนไขแล้ว กดปุ่ม ▶ Play สีเขียวเพื่อแสดงผลลัพธ์และปลดล็อกแบบทดสอบ'
                : 'เลือกลากบล็อกคำสั่ง HTML จากคลังฝั่งซ้ายมาวางต่อกันตามขั้นตอน แล้วกดปุ่ม ▶ Play เพื่อรันโปรแกรม'}
            </p>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleEnterQuiz}
              className={`w-full sm:w-auto px-8 py-4 rounded-xl font-cyber font-bold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                isMissionCompleted
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:shadow-[0_0_35px_rgba(16,185,129,0.7)] hover:scale-[1.02] btn-neon-hover'
                  : 'bg-slate-900 border border-slate-700 hover:border-rose-500/80 text-slate-300 hover:text-white hover:bg-slate-850 shadow-sm'
              }`}
            >
              <Swords
                className={`w-5 h-5 ${isMissionCompleted ? 'text-slate-950' : 'text-amber-400'}`}
              />
              <span>เข้าสู่แบบทดสอบท้ายบท</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          SOLUTION MODAL POPUP
          ==================================================================== */}
      {showSolution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="glass-panel max-w-xl w-full rounded-2xl p-6 sm:p-7 border-2 border-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.3)] bg-slate-950/95 space-y-5 animate-modal-pop relative">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-500 flex items-center justify-center text-amber-400">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-cyber font-bold text-white">
                    เฉลยภารกิจ & โค้ด HTML (Solution Guide)
                  </h3>
                  <p className="text-xs font-thai text-slate-400">
                    สามารถกดปุ่มด้านล่างเพื่อต่อบล็อกเฉลยลงบนกระดานอัตโนมัติได้ทันที
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSolution(false)}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Solution Code Snippet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>โค้ด HTML ตัวอย่างที่ถูกต้อง:</span>
                <button
                  type="button"
                  onClick={handleCopySolution}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 hover:border-amber-400 text-amber-300 text-xs transition-colors cursor-pointer"
                >
                  {copiedSolution ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>คัดลอกแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกโค้ด</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#050811] border border-amber-500/40 font-mono text-xs sm:text-sm text-cyan-200 overflow-x-auto shadow-inner">
                <pre>{mission.solutionCode}</pre>
              </div>
            </div>

            {/* Explanation Note */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-thai text-slate-300 space-y-1.5">
              <strong className="text-amber-400 font-semibold flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                <span>คำอธิบายเฉลย:</span>
              </strong>
              <p className="leading-relaxed text-slate-300">{mission.solutionExplanation}</p>
            </div>

            {/* Action Buttons in Modal */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSolution(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-thai font-semibold hover:border-slate-500 cursor-pointer"
              >
                ปิดหน้าต่างเฉลย
              </button>

              <button
                type="button"
                onClick={handleApplySolution}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-cyber font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>ต่อบล็อกเฉลย / ใส่โค้ดทันที</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
