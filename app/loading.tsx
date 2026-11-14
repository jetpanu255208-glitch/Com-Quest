'use client';

import React, { useState, useEffect } from 'react';

/**
 * Intelligent Delayed Global Loading Screen
 * - If page transition is fast (< 280ms), does NOT show loading screen to avoid flicker.
 * - If page takes longer (> 280ms), smoothly fades in the cyber loading spinner.
 */
export default function GlobalLoading() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only reveal loading screen if loading takes more than 280ms
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 280);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    // Return empty placeholder while waiting to avoid flashing screen
    return <div className="fixed inset-0 pointer-events-none opacity-0" />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center cyber-grid relative overflow-hidden transition-opacity duration-300 animate-fadeIn select-none">
      {/* Instant Top Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-cyan-950 z-50 overflow-hidden">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
      </div>

      {/* Lightweight Cyber Spinner */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl border-2 border-cyan-500/30 border-t-cyan-400 animate-spin shadow-[0_0_15px_rgba(0,240,255,0.3)]" />
        <span className="font-mono text-[11px] tracking-widest text-cyan-400/80 uppercase">
          LOADING...
        </span>
      </div>
    </div>
  );
}
