const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env.local');
const lines = fs.readFileSync(envPath, 'utf8').split('\n');
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const equalsIdx = trimmed.indexOf('=');
  if (equalsIdx !== -1) {
    const key = trimmed.slice(0, equalsIdx).trim();
    const val = trimmed.slice(equalsIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testTeacher() {
  const teacherEmail = '68219100010@comquest.ac.th';
  const teacherPassword = 'Password123!';

  let { data: authData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: teacherEmail,
    password: teacherPassword,
  });

  if (signInErr) {
    console.log('Signing up teacher account...');
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: teacherEmail,
      password: teacherPassword,
      options: {
        data: {
          username: 'ChetphanuTeacher',
          first_name: 'เจตภานุ',
          last_name: 'ครูผู้สอน',
        },
      },
    });
    authData = signUpData;
  }

  if (!authData || !authData.session) {
    console.error('Teacher sign-in failed');
    return;
  }

  // Ensure role is admin
  try {
    await supabase.rpc('promote_to_teacher', { p_email: teacherEmail });
  } catch (e) {
    // pass
  }

  const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const sessionStr = JSON.stringify(authData.session);
  const cookieVal = encodeURIComponent(sessionStr);
  const cookieHeader = `${cookieName}=${cookieVal}; path=/`;

  const targets = [
    'http://localhost:3000/teacher/lessons',
    'http://localhost:3000/teacher/lessons/html_02',
  ];

  for (const url of targets) {
    const res = await fetch(url, {
      headers: {
        Cookie: cookieHeader,
      },
    });
    console.log(`[TEACHER STATUS ${res.status}] ${url}`);
    const text = await res.text();
    console.log(`   Page content preview length: ${text.length} chars. Title match: ${text.includes('หัวเรื่องและย่อหน้าข้อความ') ? 'YES' : 'NO'}`);
  }
}

testTeacher().catch(console.error);
