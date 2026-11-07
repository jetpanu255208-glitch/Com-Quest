'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface LogoutButtonProps {
  className?: string;
  variant?: 'cyan' | 'amber' | 'red';
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  className = '',
  variant = 'cyan',
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const styleClasses =
    variant === 'red'
      ? 'border-rose-500/60 text-rose-300 bg-rose-950/70 hover:bg-rose-900 hover:text-white hover:border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
      : variant === 'amber'
      ? 'border-amber-500/40 text-amber-300 hover:bg-amber-950/50 hover:text-amber-200 hover:border-amber-400'
      : 'border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/50 hover:text-cyan-200 hover:border-cyan-400';

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`
        inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md border text-xs font-cyber tracking-wider
        bg-slate-900/80 transition-all duration-200 select-none
        active:scale-95 disabled:opacity-50 cursor-pointer
        ${styleClasses}
        ${className}
      `}
      aria-label="ออกจากระบบ"
      title="ออกจากระบบ"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : (
        <LogOut className="w-3.5 h-3.5 shrink-0" />
      )}
      <span className="hidden sm:inline">
        {loading ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ (Log Out)'}
      </span>
      <span className="sm:hidden text-[11px] font-thai">
        {loading ? '...' : 'ออกจากระบบ'}
      </span>
    </button>
  );
};
