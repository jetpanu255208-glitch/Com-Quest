import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

/**
 * Server-only Supabase client with Service Role privileges.
 * Used exclusively for administrative operations like deleting auth users.
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the client!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
