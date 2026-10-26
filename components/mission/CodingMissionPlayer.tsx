'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LessonMission, getLessonMission } from '@/lib/constants/missions';
import { Lesson } from '@/lib/supabase/types';
import {
  Code2,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Laptop,
  Lightbulb,
  Copy,
  Check,
  BookOpen,
  Swords,
  Eye,
  Info,
} from 'lucide-react';

import { recordMissionPassed } from '@/app/actions/student-mission';

interface CodingMissionPlayerProps {
  lesson: Lesson;
}

export function CodingMissionPlayer({ lesson }: CodingMissionPlayerProps) {
  const router = useRouter();
  const mission = getLessonMission(lesson.id);

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

  // State
  const [code, setCode] = useState(mission.initialCode || '');
  const [executedCode, setExecutedCode] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [runSuccess, setRunSuccess] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [copiedSolution, setCopiedSolution] = useState(false);
  const [hasShownSuccessCelebration, setHasShownSuccessCelebration] = useState(false);

  // Evaluate criteria in real time
  const criteriaResults = useMemo(() => {
    return mission.criteria.map((c) => ({
      ...c,
      passed: c.check(code),
    }));
  }, [code, mission.criteria]);

  const allPassed = criteriaResults.every((c) => c.passed);
  const isMissionCompleted = allPassed && hasRun && runSuccess;

  // Trigger one-time celebration when student runs code and all criteria pass
  useEffect(() => {
    if (isMissionCompleted && !hasShownSuccessCelebration) {
      setHasShownSuccessCelebration(true);
    }
  }, [isMissionCompleted, hasShownSuccessCelebration]);

  // Run code action
  const handleRunCode = () => {
    setHasRun(true);
    if (allPassed) {
      setExecutedCode(code);
      setRunSuccess(true);
      setRunError(null);
      try {
        document.cookie = `mission_passed_${lesson.id}=true; path=/; max-age=31536000; SameSite=Lax`;
        localStorage.setItem(`mission_passed_${lesson.id}`, 'true');
      } catch (err) {
        // ignore
      }
      // Persist to Supabase database immediately
      recordMissionPassed({ lessonId: lesson.id }).catch((err) => {
        console.warn('recordMissionPassed error:', err);
      });
    } else {
      setExecutedCode(null);
      setRunSuccess(false);
      setRunError('โค้ดยังไม่ตรงตามเงื่อนไขที่โจทย์กำหนด กรุณาตรวจสอบ Checklist ด้านบนและแก้ไขก่อนกดรันใหม่');
    }
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

  // Construct iframe preview document from executedCode only
  const previewHtml = useMemo(() => {
    if (!executedCode || !runSuccess) return '';
    return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 20px;
      padding: 0;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.6;
    }
    h1 { color: #0284c7; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    h2 { color: #0369a1; margin-top: 16px; margin-bottom: 6px; }
    h3 { color: #075985; }
    p { margin-top: 6px; margin-bottom: 12px; font-size: 16px; }
  </style>
</head>
<body>
  ${executedCode}
</body>
</html>`;
  }, [executedCode, runSuccess]);

  // Line numbers calculation
  const lineCount = useMemo(() => {
    return Math.max(code.split('\n').length, 12);
  }, [code]);

  // Copy solution action
  const handleCopySolution = () => {
    navigator.clipboard.writeText(mission.solutionCode);
    setCopiedSolution(true);
    setTimeout(() => setCopiedSolution(false), 2500);
  };

  // Apply solution to editor
  const handleApplySolution = () => {
    setCode(mission.solutionCode);
    setShowSolution(false);
  };

  // Reset code action
  const handleResetCode = () => {
    if (confirm('ต้องการรีเซ็ตโค้ดกลับเป็นหน้าว่างหรือไม่?')) {
      setCode('');
      setExecutedCode(null);
      setHasRun(false);
      setRunSuccess(false);
      setRunError(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* MISSION BRIEFING CARD */}
      <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-cyan-500/40 relative overflow-hidden shadow-[0_0_25px_rgba(0,240,255,0.12)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-4 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 uppercase">
                เควสต์ปฏิบัติการ &bull; บทที่ {lesson.lesson_number}
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>CODING PLAYGROUND</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Solution Button */}
              <button
                type="button"
                onClick={() => setShowSolution(true)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/50 text-amber-300 hover:text-amber-200 text-xs font-thai font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)] cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>ดูเฉลยภารกิจ (Solution)</span>
              </button>

              <button
                type="button"
                onClick={handleResetCode}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-thai flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ต</span>
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-cyber font-bold text-white text-glow-cyan">
              {mission.title}
            </h1>
            <p className="text-xs sm:text-sm font-thai text-slate-300 mt-1">
              {mission.objective}
            </p>
          </div>

          {/* Real-time Checklist Criteria */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-xs font-cyber font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>เงื่อนไขการผ่านภารกิจ (Mission Checklist):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {criteriaResults.map((c) => (
                <div
                  key={c.id}
                  className={`p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                    c.passed
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400'
                  }`}
                >
                  {c.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <div
                      className={`text-xs font-thai font-bold ${
                        c.passed ? 'text-emerald-300' : 'text-slate-300'
                      }`}
                    >
                      {c.label}
                    </div>
                    <div className="text-[11px] font-thai text-slate-400 leading-tight">
                      {c.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CENTER-STAGE SPLIT SCREEN WORKSPACE (2 SIDES) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT COLUMN: CODE EDITOR */}
        <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col overflow-hidden bg-slate-950/90 shadow-lg">
          {/* Editor Header with Run Code button */}
          <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <span className="text-xs font-mono font-bold text-cyan-300 ml-2 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>index.html (ช่องพิมพ์โค้ด)</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunCode}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-cyber font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:scale-[1.03] transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Code (รันโค้ด)</span>
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
                // Reset execution state when code is edited so output is only from running
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
            <span>ช่องแรก: หน้าพิมพ์โค้ดเปล่า</span>
            <span>{code.length} ตัวอักษร</span>
          </div>
        </div>

        {/* RIGHT COLUMN: CODE OUTPUT PREVIEW (Only on Run Code when criteria met) */}
        <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col overflow-hidden bg-white shadow-lg">
          {/* Faux Browser Chrome Header */}
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-cyber font-bold text-slate-200">
                ผลลัพธ์ของโค้ด (CODE OUTPUT)
              </span>
            </div>

            {/* URL Address Bar */}
            <div className="flex-1 max-w-sm px-3 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 truncate flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isMissionCompleted ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>http://localhost/student.html</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Rendered Live Iframe or Empty/Pending States */}
          {!hasRun ? (
            /* State 1: Before running code */
            <div className="flex-1 min-h-[380px] bg-[#060913] flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-base font-cyber font-bold text-white">
                  รอการรันโค้ด (Click Run Code)
                </h3>
                <p className="text-xs font-thai text-slate-400 leading-relaxed">
                  ช่องที่สองนี้จะแสดงผลลัพธ์ของโค้ดได้ <strong>ก็ต่อเมื่อนักเรียนเขียนโค้ดตามโจทย์และกดปุ่ม &quot;Run code&quot;</strong> เท่านั้น
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunCode}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-cyber font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>กดปุ่ม Run Code</span>
              </button>
            </div>
          ) : !runSuccess ? (
            /* State 2: Ran code but requirements not yet met */
            <div className="flex-1 min-h-[380px] bg-[#0c0812] flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-500/60 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse">
                <XCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-base font-cyber font-bold text-rose-300">
                  โค้ดยังไม่ตรงตามโจทย์ที่กำหนด
                </h3>
                <p className="text-xs font-thai text-slate-300 leading-relaxed">
                  ระบบจะไม่แสดงผลลัพธ์จนกว่าจะเขียนโค้ดตรงตามเงื่อนไขของโจทย์ครบทุกข้อ กรุณาตรวจสอบ Checklist ด้านบนและพิมพ์แก้ไขก่อนกด Run code ใหม่
                </p>
              </div>
              <div className="text-left bg-slate-950/80 border border-rose-500/30 p-3 rounded-xl w-full max-w-sm space-y-1.5 text-xs font-thai text-rose-200">
                <div className="font-bold text-rose-300 flex items-center gap-1.5 text-[11px]">
                  <span>เงื่อนไขที่ยังต้องแก้ไข:</span>
                </div>
                {criteriaResults.filter(c => !c.passed).map(c => (
                  <div key={c.id} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleRunCode}
                className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-200 hover:text-emerald-300 font-cyber font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>แก้ไขแล้ว ลองรันใหม่อีกครั้ง</span>
              </button>
            </div>
          ) : (
            /* State 3: Code passed criteria and ran successfully! Show actual output */
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
                <span>ช่องที่สอง: แสดงผลหลังกด Run Code</span>
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

      {/* BOTTOM ACTION / UNLOCK QUIZ BAR */}
      <div
        className={`glass-panel rounded-2xl p-6 border transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-5 ${
          isMissionCompleted
            ? 'border-emerald-500/60 bg-emerald-950/20 shadow-[0_0_30px_rgba(16,185,129,0.25)] animate-in fade-in'
            : 'border-slate-800 bg-slate-950/60'
        }`}
      >
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            {isMissionCompleted ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-base sm:text-lg font-cyber font-bold text-white text-glow-cyan">
                  ภารกิจสำเร็จครบถ้วน! รันโค้ดและปลดล็อกแบบทดสอบแล้ว
                </span>
              </>
            ) : allPassed ? (
              <>
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="text-base sm:text-lg font-cyber font-bold text-amber-300">
                  เงื่อนไขครบแล้ว! กรุณากดปุ่ม &quot;Run Code&quot; เพื่อแสดงผลลัพธ์
                </span>
              </>
            ) : (
              <>
                <Info className="w-5 h-5 text-amber-400" />
                <span className="text-base sm:text-lg font-cyber font-bold text-white">
                  อยู่ระหว่างการปฏิบัติภารกิจ
                </span>
              </>
            )}
          </div>

          <p className="text-xs sm:text-sm font-thai text-slate-300">
            {isMissionCompleted
              ? 'คุณเขียน HTML แสดงชื่อและรหัสประจำตัว 11 หลักถูกต้องตามโจทย์ และรันแสดงผลเรียบร้อย สามารถกดเข้าสู่หน้าแบบทดสอบท้ายบท 10 ข้อได้เลย!'
              : allPassed
              ? 'โค้ดของคุณตรงตามเงื่อนไขครบแล้ว กดปุ่ม Run Code เพื่อแสดงผลลัพธ์และปลดล็อกปุ่มทำแบบทดสอบ'
              : 'กรุณาเขียนโค้ดตามเงื่อนไขให้ครบทั้ง 3 ข้อ แล้วกดปุ่ม Run code หากสงสัยสามารถกดปุ่ม "ดูเฉลยภารกิจ" เพื่อพิมพ์ตามได้'}
          </p>
        </div>

        <div className="shrink-0 w-full sm:w-auto">
          {isMissionCompleted ? (
            <Link
              href={`/quiz/${lesson.id}`}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-cyber font-bold text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:shadow-[0_0_35px_rgba(16,185,129,0.7)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Swords className="w-5 h-5" />
              <span>เข้าสู่แบบทดสอบหลังบท 10 ข้อ</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : allPassed ? (
            <button
              type="button"
              onClick={handleRunCode}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-cyber font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>กด Run Code เพื่อปลดล็อก</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowSolution(true)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500/60 text-slate-300 hover:text-amber-300 font-cyber font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>ดูเฉลยเพื่อพิมพ์ตาม</span>
            </button>
          )}
        </div>
      </div>

      {/* SOLUTION MODAL POPUP */}
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
                    เฉลยภารกิจเขียนโค้ด (Solution Guide)
                  </h3>
                  <p className="text-xs font-thai text-slate-400">
                    ดูตัวอย่างโค้ดและพิมพ์ตามลงในช่องแก้ไขฝั่งซ้าย
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
              <p className="leading-relaxed text-slate-300">
                {mission.solutionExplanation}
              </p>
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
                <span>นำโค้ดไปใส่ใน Editor ทันที</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
