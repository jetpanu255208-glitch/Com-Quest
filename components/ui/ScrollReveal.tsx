'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Delay in milliseconds before starting the reveal transition */
  delay?: number;
  /** Vertical offset in pixels (default: 16px for a subtle, refined glide) */
  distance?: number;
  /** Whether to apply a subtle scale-in effect (0.97 -> 1) */
  scale?: boolean;
  /** When true, reapplies animation if element leaves and re-enters viewport */
  repeat?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  distance = 16,
  scale = false,
  repeat = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (!repeat) {
              observer.unobserve(el);
            }
          } else if (repeat) {
            setIsVisible(false);
          }
        }
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -15px 0px',
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [repeat]);

  const cappedDelay = delay > 0 ? Math.min(delay, 250) : 0;

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? 'translate3d(0, 0, 0) scale(1)'
          : `translate3d(0, ${distance}px, 0)${scale ? ' scale(0.97)' : ''}`,
        transitionProperty: 'opacity, transform',
        transitionDuration: '400ms',
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        transitionDelay: cappedDelay > 0 ? `${cappedDelay}ms` : undefined,
        willChange: isVisible ? 'auto' : 'opacity, transform',
      }}
      className={className}
    >
      {children}
    </div>
  );
};


