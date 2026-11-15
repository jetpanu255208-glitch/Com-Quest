import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#060913]/80 backdrop-blur-md animate-fadeIn select-none">
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-cyan-950 z-50 overflow-hidden">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
      </div>

      {/* Cyber Spinner */}
      <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-slate-950/90 border border-cyan-500/40 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
        <div className="w-10 h-10 rounded-xl border-2 border-cyan-500/30 border-t-cyan-400 animate-spin shadow-[0_0_15px_rgba(0,240,255,0.3)]" />
        <span className="font-mono text-[11px] tracking-widest text-cyan-300 uppercase">
          กำลังโหลดข้อมูล...
        </span>
      </div>
    </div>
  );
}

