const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Read default-questions.ts
const questionsContent = fs.readFileSync(path.join(__dirname, '..', 'lib', 'constants', 'default-questions.ts'), 'utf8');

async function sync() {
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: '68219100010@comquest.ac.th',
    password: 'Password123!'
  });
  if (authErr) {
    console.error('Teacher sign-in error:', authErr);
    return;
  }
  console.log('Teacher signed in!');

  // For each lesson 1 to 8, extract questions
  for (let i = 1; i <= 8; i++) {
    const lessonId = `html_0${i}`;
    const varName = `DEFAULT_HTML0${i}_QUESTIONS`;
    const startIdx = questionsContent.indexOf(`export const ${varName}`);
    if (startIdx === -1) continue;
    const nextVarName = i < 8 ? `export const DEFAULT_HTML0${i+1}_QUESTIONS` : 'export function getDefaultQuestions';
    const endIdx = questionsContent.indexOf(nextVarName, startIdx);
    const block = questionsContent.substring(startIdx, endIdx !== -1 ? endIdx : undefined);

    const qRegex = /{\s*lesson_id:\s*['"`](.*?)['"`],\s*question_number:\s*(\d+),\s*question_text:\s*['"`]([\s\S]*?)['"`],\s*option_a:\s*['"`]([\s\S]*?)['"`],\s*option_b:\s*['"`]([\s\S]*?)['"`],\s*option_c:\s*['"`]([\s\S]*?)['"`],\s*option_d:\s*['"`]([\s\S]*?)['"`],\s*correct_option:\s*['"`]([A-D])['"`],\s*explanation:\s*['"`]([\s\S]*?)['"`],?\s*}/g;

    const list = [];
    let m;
    while ((m = qRegex.exec(block)) !== null) {
      list.push({
        lesson_id: m[1],
        question_number: parseInt(m[2]),
        question_text: m[3].trim(),
        option_a: m[4].trim(),
        option_b: m[5].trim(),
        option_c: m[6].trim(),
        option_d: m[7].trim(),
        correct_option: m[8],
        explanation: m[9].trim(),
      });
    }

    console.log(`Syncing ${list.length} questions for ${lessonId}...`);
    const { data, error } = await supabase
      .from('quiz_questions')
      .upsert(list, { onConflict: 'lesson_id,question_number' })
      .select();

    if (error) {
      console.error(`Error syncing ${lessonId}:`, error);
    } else {
      console.log(`✓ ${lessonId} synced successfully (${data?.length} rows)!`);
    }
  }
}

sync().catch(console.error);
