'use client';

import React, { useEffect, useRef } from 'react';

interface DigitalSpaceCanvasProps {
  className?: string;
  particleCount?: number;
  showFloorGrid?: boolean;
}

export const DigitalSpaceCanvas: React.FC<DigitalSpaceCanvasProps> = React.memo(
  ({ className = '', particleCount = 45, showFloorGrid = true }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animationFrameId: number;
      let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
      let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

      const handleResize = () => {
        if (!canvas) return;
        width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
        height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      };

      window.addEventListener('resize', handleResize);

      // Check prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Particle generator
      const particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.2 + 0.8,
        speedY: Math.random() * 0.9 + 0.35,
        streakLength: Math.random() * 12 + 4,
        opacity: Math.random() * 0.7 + 0.25,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
      }));

      let isPaused = false;
      const handleVisibilityChange = () => {
        isPaused = document.hidden;
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      const render = () => {
        if (!isPaused && ctx) {
          ctx.clearRect(0, 0, width, height);

          // Draw particles floating upward
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            if (!prefersReducedMotion) {
              p.y -= p.speedY;
              p.twinklePhase += p.twinkleSpeed;

              // Reset when floating off the top
              if (p.y < -20) {
                p.y = height + 10;
                p.x = Math.random() * width;
              }
            }

            const currentOpacity = Math.max(
              0.1,
              Math.min(1, p.opacity + Math.sin(p.twinklePhase) * 0.25)
            );

            // Draw streak tail
            const grad = ctx.createLinearGradient(p.x, p.y + p.streakLength, p.x, p.y);
            grad.addColorStop(0, `rgba(255, 255, 255, 0)`);
            grad.addColorStop(1, `rgba(255, 255, 255, ${currentOpacity})`);

            ctx.beginPath();
            ctx.strokeStyle = grad;
            ctx.lineWidth = p.size * 0.8;
            ctx.moveTo(p.x, p.y + p.streakLength);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();

            // Draw bright head dot
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity * 1.2})`;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
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
    }, [particleCount]);

    return (
      <div className={`absolute inset-0 pointer-events-none overflow-hidden bg-black ${className}`}>
        {/* Base Digital Grid perspective image layer if available */}
        <div
          className="absolute inset-0 bg-cover bg-bottom opacity-60 mix-blend-screen pointer-events-none"
          style={{ backgroundImage: "url('/images/digital-grid-bg.jpg')" }}
        />

        {/* Dynamic 3D Perspective CSS floor grid */}
        {showFloorGrid && <div className="digital-grid-floor" />}

        {/* Ambient horizon gradient light */}
        <div className="absolute inset-x-0 bottom-1/4 h-32 bg-gradient-to-t from-cyan-500/15 via-transparent to-transparent pointer-events-none blur-xl" />

        {/* Rising Particles Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
    );
  }
);

DigitalSpaceCanvas.displayName = 'DigitalSpaceCanvas';
