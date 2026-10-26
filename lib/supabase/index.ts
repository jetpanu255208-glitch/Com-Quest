/**
 * Supabase client exports for COM QUEST
 * 
 * - For Client Components: import { createClient } from '@/lib/supabase/client';
 * - For Server Components / Actions: import { createClient } from '@/lib/supabase/server';
 * - For Connection Check: import { checkSupabaseConnection } from '@/lib/supabase/check-connection';
 */

export * from './client';
export * from './check-connection';
export type { Database } from './types';
