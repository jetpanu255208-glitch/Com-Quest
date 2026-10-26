'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface GoogleAuthButtonProps {
  label?: string;
  onError?: (error: string) => void;
  className?: string;
  redirectToPath?: string;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  label = 'เข้าสู่ระบบด้วย Google',
  onError,
  className = '',
  redirectToPath = '/auth/callback',
}) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      if (!isSupabaseConfigured()) {
        const errorMsg =
          'ยังไม่ได้ตั้งค่า Supabase URL และ Anon Key ในไฟล์ .env กรุณาตั้งค่าก่อนใช้งาน Google OAuth';
        if (onError) onError(errorMsg);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      const redirectUrl = `${origin}${redirectToPath}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        if (onError) onError(error.message);
        setLoading(false);
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google';
      if (onError) onError(errMessage);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className={`
        w-full relative flex items-center justify-center gap-3 px-4 py-2.5
        bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white
        border border-slate-700/80 hover:border-slate-500
        rounded-md text-sm font-medium font-thai
        transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]
        disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
      ) : (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
          />
          <path
            fill="#FBBC05"
            d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.2-1.9.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z"
          />
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
};
