'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface LogoutButtonProps {
  className?: string;
  variant?: 'cyan' | 'amber';
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
    variant === 'amber'
      ? 'border-amber-500/40 text-amber-300 hover:bg-amber-950/50 hover:text-amber-200 hover:border-amber-400'
      : 'border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/50 hover:text-cyan-200 hover:border-cyan-400';

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-md border text-xs font-cyber tracking-wider
        bg-slate-900/80 transition-all duration-200 select-none
        active:scale-95 disabled:opacity-50 cursor-pointer
        ${styleClasses}
        ${className}
      `}
      aria-label="ออกจากระบบ"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <LogOut className="w-3.5 h-3.5" />
      )}
      <span>{loading ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ (Log Out)'}</span>
    </button>
  );
};
