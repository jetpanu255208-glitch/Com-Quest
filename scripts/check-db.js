const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function check() {
  console.log('Connecting to Supabase:', url);
  const { data: lp, error: lpError } = await supabase.from('lesson_progress').select('*').limit(3);
  console.log('lesson_progress sample:', lp);
  if (lpError) console.error('lpError:', lpError);

  const { data: qa, error: qaError } = await supabase.from('quiz_attempts').select('*').limit(3);
  console.log('quiz_attempts sample:', qa);
  if (qaError) console.error('qaError:', qaError);
}

check().catch(console.error);
