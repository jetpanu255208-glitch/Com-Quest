'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Delay in milliseconds before starting the reveal transition */
  delay?: number;
  /** Vertical offset in pixels (default: 18px for a subtle, refined glide) */
  distance?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  distance = 14,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -12px 0px',
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  const cappedDelay = delay > 0 ? Math.min(delay, 180) : 0;

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? 'translate3d(0, 0, 0)'
          : `translate3d(0, ${distance}px, 0)`,
        transitionProperty: 'opacity, transform',
        transitionDuration: '380ms',
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

