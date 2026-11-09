'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function MobileRedirectToLogin() {
  const router = useRouter();

  useEffect(() => {
    // If screen width is mobile (< 768px), redirect directly to /login
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      router.replace('/login');
    }

    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        router.replace('/login');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [router]);

  return (
    <div className="md:hidden flex flex-col items-center justify-center min-h-screen bg-[#060913] text-slate-100 p-4">
      <div className="w-8 h-8 border-2 border-[#00CFEF] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

