import { createBrowserClient } from '@supabase/ssr';
import { Database } from './types';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

  if (!isSupabaseConfigured() && typeof window !== 'undefined') {
    console.warn(
      '⚠️ [Supabase Warning]: Missing or unconfigured NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return Boolean(
    url &&
    key &&
    url.trim() !== '' &&
    key.trim() !== '' &&
    !url.includes('placeholder') &&
    !key.includes('placeholder') &&
    !url.includes('your-project')
  );
}
