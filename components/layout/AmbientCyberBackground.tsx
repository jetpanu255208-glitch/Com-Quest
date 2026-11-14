'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Global Ambient Cyber Background for Com Quest
 * Provides a clean, atmospheric, non-intrusive animated background across all pages:
 * 1. Slow-breathing aurora light orbs (theme-aware for Dark/Light & Cyan/Pink)
 * 2. Radially-masked architectural cyber grid + subtle 3D horizon floor at the bottom edge
 * 3. Gentle, low-opacity floating pixel stardust particles that never distract from reading
 */
export function AmbientCyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 24 subtle pixel stardust motes (sparse and calm so the screen never looks cluttered)
    const particleCount = 24;
    const particles = Array.from({ length: particleCount }, (_, idx) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: idx % 4 === 0 ? 3 : 2, // crisp pixel squares
      speedY: Math.random() * 0.32 + 0.12,
      speedX: (Math.random() - 0.5) * 0.15,
      baseOpacity: Math.random() * 0.25 + 0.1,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: Math.random() * 0.018 + 0.006,
      isAccent: idx % 3 !== 0,
    }));

    let isPaused = false;
    const handleVisibilityChange = () => {
      isPaused = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (!isPaused && ctx) {
        ctx.clearRect(0, 0, width, height);

        const isLight = document.documentElement.classList.contains('light');
        const isPink = document.documentElement.classList.contains('theme-pink');

        // Choose calm, theme-harmonized particle colors
        const primaryRgb = isPink
          ? isLight
            ? '225, 29, 120'
            : '255, 75, 165'
          : isLight
          ? '2, 132, 199'
          : '56, 189, 248';

        const secondaryRgb = isPink
          ? isLight
            ? '244, 63, 94'
            : '251, 191, 36'
          : isLight
          ? '14, 165, 233'
          : '165, 243, 252';

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          if (!prefersReducedMotion) {
            p.y -= p.speedY;
            p.x += p.speedX;
            p.phase += p.phaseSpeed;

            if (p.y < -10) {
              p.y = height + 10;
              p.x = Math.random() * width;
            }
            if (p.x < -10) p.x = width + 10;
            if (p.x > width + 10) p.x = -10;
          }

          const twinkle = Math.sin(p.phase) * 0.12;
          const maxCap = isLight ? 0.28 : 0.42;
          const alpha = Math.max(0.05, Math.min(maxCap, p.baseOpacity + twinkle));
          const rgb = p.isAccent ? primaryRgb : secondaryRgb;

          // Crisp pixel square mote with soft outer halo
          ctx.fillStyle = `rgba(${rgb}, ${alpha * 0.35})`;
          ctx.fillRect(
            Math.round(p.x) - 2,
            Math.round(p.y) - 2,
            p.size + 4,
            p.size + 4
          );

          ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {/* 1. Slow-Breathing Ambient Aurora Orbs */}
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="ambient-orb ambient-orb-3" />

      {/* 2. Architectural Cyber Grid with Radial Fade Mask */}
      <div className="ambient-cyber-grid" />

      {/* 3. Subtle 3D Perspective Horizon Floor at Bottom Edge */}
      <div className="ambient-horizon-plane" />

      {/* 4. Minimal Corner HUD Crosshairs (Margins Only) */}
      <div className="hidden lg:block absolute top-24 left-7 text-[11px] font-mono text-[var(--neon-accent)] opacity-20 tracking-widest">
        + SYS.GRID // 01
      </div>
      <div className="hidden lg:block absolute top-24 right-7 text-[11px] font-mono text-[var(--neon-accent)] opacity-20 tracking-widest">
        COM.QUEST // +
      </div>
      <div className="hidden lg:block absolute bottom-10 left-7 text-[11px] font-mono text-[var(--neon-accent)] opacity-15">
        ◇ ────────
      </div>
      <div className="hidden lg:block absolute bottom-10 right-7 text-[11px] font-mono text-[var(--neon-accent)] opacity-15">
        ──────── ◇
      </div>

      {/* 5. Gentle Pixel Stardust Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

