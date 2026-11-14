'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * SmartLoadingGuard
 * - NEVER unmounts page content on normal clicks.
 * - Normal link/button clicks transition smoothly with ZERO loading screen.
 * - Shows loading overlay ONLY when:
 *   1) The user triggers an actual browser reload / hard navigation (beforeunload), OR
 *   2) A route transition genuinely stalls/hangs for > 2500ms.
 */
export const SmartLoadingGuard: React.FC = () => {
  const pathname = usePathname();
  const [showOverlay, setShowOverlay] = useState(false);
  const hangTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyClearTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (hangTimerRef.current) {
      clearTimeout(hangTimerRef.current);
      hangTimerRef.current = null;
    }
    if (safetyClearTimerRef.current) {
      clearTimeout(safetyClearTimerRef.current);
      safetyClearTimerRef.current = null;
    }
  };

  // Whenever the route pathname changes, immediately hide any loading indicator
  useEffect(() => {
    clearTimers();
    setShowOverlay(false);
  }, [pathname]);

  useEffect(() => {
    // 1. Show loading screen ONLY on actual page reload / refresh (F5 / Cmd+R / full unload)
    const handleBeforeUnload = () => {
      clearTimers();
      hangTimerRef.current = setTimeout(() => {
        setShowOverlay(true);
      }, 120);
    };

    // 2. Detect internal link clicks that genuinely hang (> 2500ms)
    const handleDocumentClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const targetAttr = anchor.getAttribute('target');
      if (
        !href ||
        targetAttr === '_blank' ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:')
      ) {
        return;
      }

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        // If clicking a link to the exact same pathname & search, no route transition occurs
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return;
        }

        clearTimers();
        // Only show loading screen if navigation is genuinely stuck for more than 2.5 seconds!
        hangTimerRef.current = setTimeout(() => {
          setShowOverlay(true);
          // Safety auto-hide after 8 seconds so UI can never get stuck
          safetyClearTimerRef.current = setTimeout(() => {
            setShowOverlay(false);
          }, 8000);
        }, 2500);
      } catch {
        // Ignore invalid URLs
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      clearTimers();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, []);

  if (!showOverlay) return null;

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
};
