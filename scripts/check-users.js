const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sejvbxjoophjkglzfoew.supabase.co';
const supabaseKey = 'sb_publishable_74Dml6iT5_D6KyciRtON5w_CqTi4KDO';

// We also check if we can query via supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('Querying profiles...');
  // Since RLS is enabled, unauthenticated query might return empty.
  // Let's see if we can signIn with an admin or query directly.
}

