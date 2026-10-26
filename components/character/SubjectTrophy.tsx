'use client';

import { Lock, CheckCircle2, Sparkles, Crown, BookOpen, ArrowRight } from 'lucide-react';

/* ==============================================================================
   1. LESSON COIN CARD (เหรียญประจำ 8 บทเรียน)
   ============================================================================== */
interface LessonCoinCardProps {
  lessonId: string;
  lessonNumber: number;
  title: string;
  description: string;
  isCompleted: boolean;
  quizStatus?: { score: number; passed: boolean } | null;
}

export const LessonCoinCard: React.FC<LessonCoinCardProps> = ({
  lessonId,
  lessonNumber,
  title,
  description,
  isCompleted,
  quizStatus,
}) => {
  // 16x16 Authentic Pixel Art Coin SVG
  const renderPixelCoin = (completed: boolean) => {
    const goldOuter = completed ? '#f59e0b' : '#334155';
    const goldMid = completed ? '#fbbf24' : '#475569';
    const goldHighlight = completed ? '#fef08a' : '#64748b';
    const starFill = completed ? '#ffffff' : '#1e293b';

    return (
      <svg
        viewBox="0 0 16 16"
        className="w-12 h-12"
        shapeRendering="crispEdges"
        style={{ imageRendering: 'pixelated' }}
        aria-hidden="true"
      >
        {/* Outer Coin Border */}
        <rect x="5" y="1" width="6" height="1" fill={goldOuter} />
        <rect x="3" y="2" width="2" height="1" fill={goldOuter} />
        <rect x="11" y="2" width="2" height="1" fill={goldOuter} />
        <rect x="2" y="3" width="1" height="2" fill={goldOuter} />
        <rect x="13" y="3" width="1" height="2" fill={goldOuter} />
        <rect x="1" y="5" width="1" height="6" fill={goldOuter} />
        <rect x="14" y="5" width="1" height="6" fill={goldOuter} />
        <rect x="2" y="11" width="1" height="2" fill={goldOuter} />
        <rect x="13" y="11" width="1" height="2" fill={goldOuter} />
        <rect x="3" y="13" width="2" height="1" fill={goldOuter} />
        <rect x="11" y="13" width="2" height="1" fill={goldOuter} />
        <rect x="5" y="14" width="6" height="1" fill={goldOuter} />

        {/* Inner Coin Fill */}
        <rect x="5" y="2" width="6" height="1" fill={goldMid} />
        <rect x="3" y="3" width="10" height="2" fill={goldMid} />
        <rect x="2" y="5" width="12" height="6" fill={goldMid} />
        <rect x="3" y="11" width="10" height="2" fill={goldMid} />
        <rect x="5" y="13" width="6" height="1" fill={goldMid} />

        {/* Shiny Highlight */}
        <rect x="4" y="3" width="4" height="1" fill={goldHighlight} />
        <rect x="3" y="4" width="2" height="3" fill={goldHighlight} />

        {/* Center Star / Coin Symbol */}
        <rect x="7" y="5" width="2" height="6" fill={starFill} />
        <rect x="5" y="7" width="6" height="2" fill={starFill} />
        <rect x="6" y="6" width="4" height="4" fill={starFill} />
      </svg>
    );
  };

  return (
    <div
      className={`
        relative rounded-xl p-4 sm:p-5 border transition-all duration-300
        flex flex-col justify-between overflow-hidden group
        ${
          isCompleted
            ? 'bg-slate-900/90 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.22)] hover:shadow-[0_0_30px_rgba(245,158,11,0.35)]'
            : 'bg-slate-950/60 border-slate-800/80 opacity-80 hover:opacity-95'
        }
      `}
    >
      {/* Top Header: Lesson Tag & Status */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span
          className={`
            px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase
            ${
              isCompleted
                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }
          `}
        >
          บทที่ {lessonNumber}
        </span>

        <div className="flex items-center gap-1.5 text-xs font-cyber">
          {isCompleted ? (
            <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ได้เหรียญแล้ว</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400 text-[11px]">
              <Lock className="w-3.5 h-3.5" />
              <span>ยังไม่ผ่าน</span>
            </span>
          )}
        </div>
      </div>

      {/* Center: Pixel Coin Graphic */}
      <div className="py-3 flex flex-col items-center justify-center relative">
        {isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 blur-xl animate-pulse" />
          </div>
        )}
        <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
          {renderPixelCoin(isCompleted)}
        </div>
        <div className="flex items-center gap-1 mt-2 text-[10px] font-mono font-bold">
          {isCompleted ? (
            <span className="text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              +100 LEVEL REWARD
            </span>
          ) : (
            <span className="text-slate-500">+100 LEVEL</span>
          )}
        </div>

        {/* Quiz score badge if available */}
        {quizStatus && (
          <div className="pt-1 flex items-center justify-center">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                quizStatus.passed
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-500/50'
              }`}
            >
              {quizStatus.passed ? (
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <Lock className="w-2.5 h-2.5 text-rose-400" />
              )}
              <span>คะแนนสอบ: {quizStatus.score}/10 {quizStatus.passed ? '(ผ่าน)' : '(ไม่ผ่าน)'}</span>
            </span>
          </div>
        )}
      </div>

      {/* Bottom Info & Action Links */}
      <div className="pt-3 border-t border-slate-800/80 text-center space-y-2">
        <div>
          <h4 className="text-xs sm:text-sm font-cyber font-bold tracking-wide text-white line-clamp-1">
            {title}
          </h4>
          <p className="text-[11px] font-thai text-slate-400 line-clamp-1">
            {description}
          </p>
        </div>

        {/* Action Button: Dynamic across all lessons (1, 2, 3.. 8) */}
        <div className="pt-2">
          {isCompleted ? (
            <a
              href={`/learn/${lessonId}?mode=review&from=profile`}
              className="w-full py-1.5 px-3 rounded-lg bg-cyan-950/80 border border-cyan-500/60 hover:bg-cyan-900/90 hover:border-cyan-400 text-cyan-300 hover:text-cyan-200 text-xs font-cyber tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.2)]"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>ทบทวนความรู้</span>
            </a>
          ) : (
            <a
              href={`/learn/${lessonId}`}
              className="w-full py-1.5 px-3 rounded-lg bg-slate-900/90 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-cyber tracking-wider transition-all flex items-center justify-center gap-1.5"
            >
              <span>เข้าเรียนรู้</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

/* ==============================================================================
   2. MASTER COURSE TROPHY (1 ถ้วยรางวัลใหญ่สำเร็จรายวิชา HTML เบื้องต้น)
   ============================================================================== */
interface MasterCourseTrophyProps {
  completedCoinsCount: number;
  totalCoinsRequired?: number;
}

export const MasterCourseTrophy: React.FC<MasterCourseTrophyProps> = ({
  completedCoinsCount,
  totalCoinsRequired = 8,
}) => {
  const isMasterUnlocked = completedCoinsCount >= totalCoinsRequired;

  // 24x24 Pixel Art Grand Master Trophy SVG
  const renderMasterTrophy = (unlocked: boolean) => {
    const goldOuter = unlocked ? '#b45309' : '#334155';
    const goldMid = unlocked ? '#f59e0b' : '#475569';
    const goldHigh = unlocked ? '#fde047' : '#64748b';
    const codeSymbol = unlocked ? '#00f0ff' : '#94a3b8';

    return (
      <svg
        viewBox="0 0 24 24"
        className="w-20 h-20 sm:w-24 sm:h-24"
        shapeRendering="crispEdges"
        style={{ imageRendering: 'pixelated' }}
        aria-hidden="true"
      >
        {/* Crown on Top when Unlocked */}
        {unlocked && (
          <>
            <rect x="8" y="1" width="8" height="1" fill="#fde047" />
            <rect x="7" y="2" width="2" height="1" fill="#f59e0b" />
            <rect x="11" y="2" width="2" height="1" fill="#f59e0b" />
            <rect x="15" y="2" width="2" height="1" fill="#f59e0b" />
            <rect x="9" y="3" width="6" height="1" fill="#fde047" />
          </>
        )}

        {/* Trophy Top Rim */}
        <rect x="5" y="4" width="14" height="2" fill={goldHigh} />

        {/* Handles */}
        <rect x="3" y="6" width="3" height="1" fill={goldMid} />
        <rect x="2" y="7" width="2" height="4" fill={goldMid} />
        <rect x="3" y="11" width="3" height="1" fill={goldMid} />

        <rect x="18" y="6" width="3" height="1" fill={goldMid} />
        <rect x="20" y="7" width="2" height="4" fill={goldMid} />
        <rect x="18" y="11" width="3" height="1" fill={goldMid} />

        {/* Trophy Main Cup */}
        <rect x="6" y="6" width="12" height="6" fill={goldMid} />
        <rect x="7" y="7" width="10" height="4" fill={goldHigh} />
        <rect x="8" y="12" width="8" height="2" fill={goldOuter} />

        {/* Stem */}
        <rect x="10" y="14" width="4" height="3" fill={goldMid} />

        {/* Pedestal Base */}
        <rect x="7" y="17" width="10" height="2" fill={goldOuter} />
        <rect x="5" y="19" width="14" height="3" fill={goldHigh} />
        <rect x="4" y="22" width="16" height="1" fill={goldOuter} />

        {/* HTML Symbol </> on Trophy */}
        <rect x="9" y="8" width="1" height="2" fill={codeSymbol} />
        <rect x="8" y="9" width="1" height="1" fill={codeSymbol} />
        <rect x="11" y="8" width="1" height="1" fill="#ffffff" />
        <rect x="12" y="9" width="1" height="1" fill="#ffffff" />
        <rect x="14" y="8" width="1" height="2" fill={codeSymbol} />
        <rect x="15" y="9" width="1" height="1" fill={codeSymbol} />
      </svg>
    );
  };

  return (
    <div
      className={`
        relative rounded-2xl p-6 sm:p-8 border transition-all duration-300 overflow-hidden
        flex flex-col lg:flex-row items-center justify-between gap-6
        ${
          isMasterUnlocked
            ? 'bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-blue-950/80 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/40'
            : 'bg-slate-950/80 border-slate-800'
        }
      `}
    >
      {/* Background Radiance when Unlocked */}
      {isMasterUnlocked && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl animate-pulse" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 rounded-full bg-cyan-500/15 blur-3xl" />
        </div>
      )}

      {/* Left: Trophy Graphic & Badges */}
      <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 text-center sm:text-left">
        <div className="relative">
          {renderMasterTrophy(isMasterUnlocked)}
          {isMasterUnlocked && (
            <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-amber-400 text-slate-950 shadow-lg">
              <Crown className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span
              className={`
                px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider
                ${
                  isMasterUnlocked
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }
              `}
            >
              {isMasterUnlocked ? 'MASTER OF HTML' : '1 COURSE TROPHY'}
            </span>

            <span className="text-xs font-mono text-cyan-400 font-bold">
              วิชาการเขียนภาษา HTML เบื้องต้น
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-cyber font-bold tracking-wide text-white">
            ถ้วยรางวัลใหญ่สำเร็จรายวิชา (HTML Basic Trophy)
          </h3>

          <p className="text-xs sm:text-sm font-thai text-slate-300 max-w-xl">
            {isMasterUnlocked
              ? '🎉 ยินดีด้วย! คุณสะสมเหรียญครบทั้ง 8 บทเรียนแล้ว รวมเป็น 1 ถ้วยรางวัลเกียรติยศสูงสุดสำเร็จรายวิชา พร้อมรับ 800 เลเวลเต็ม (MAX)!'
              : `สะสมเหรียญประจำบทเรียนให้ครบทั้ง 8 บทเรียน (ปัจจุบันได้ ${completedCoinsCount}/8 เหรียญ) เหรียญทั้งหมดจะหลอมรวมกลายเป็น 1 ถ้วยรางวัลใหญ่สำเร็จรายวิชา`}
          </p>
        </div>
      </div>

      {/* Right: Coin Progress Tracker */}
      <div className="flex flex-col items-center lg:items-end gap-3 shrink-0 relative z-10 w-full sm:w-auto">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/90 border border-amber-500/40 text-sm font-mono">
          <span className="text-slate-400">เหรียญสะสม:</span>
          <span className="text-amber-400 font-pixel font-bold text-base">
            {completedCoinsCount} / 8 เหรียญ
          </span>
        </div>

        <div className="w-full sm:w-48 bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isMasterUnlocked
                ? 'bg-gradient-to-r from-amber-400 to-amber-200 shadow-[0_0_12px_#fbbf24]'
                : 'bg-gradient-to-r from-amber-600 to-amber-400'
            }`}
            style={{ width: `${Math.min((completedCoinsCount / 8) * 100, 100)}%` }}
          />
        </div>

        <span className="text-[11px] font-mono text-slate-400">
          สถานะถ้วยรางวัล: {isMasterUnlocked ? '🏆 1 / 1 (ปลดล็อกแล้ว)' : '0 / 1 (ยังไม่สำเร็จ)'}
        </span>
      </div>
    </div>
  );
};

/* Backward compatible alias */
export const SubjectTrophy = LessonCoinCard;
