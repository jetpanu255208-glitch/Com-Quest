import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center cyber-grid relative overflow-hidden">
      {/* Instant Top Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-cyan-950 z-50 overflow-hidden">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
      </div>

      {/* Lightweight Cyber Spinner */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
        <span className="font-mono text-[11px] tracking-widest text-cyan-400/80 uppercase">
          LOADING...
        </span>
      </div>
    </div>
  );
}
