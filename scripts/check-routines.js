const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sejvbxjoophjkglzfoew.supabase.co';
const supabaseKey = 'sb_publishable_74Dml6iT5_D6KyciRtON5w_CqTi4KDO';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: routines, error } = await supabase.rpc('get_routines');
  console.log('rpc get_routines:', { routines, error });
}

check();
