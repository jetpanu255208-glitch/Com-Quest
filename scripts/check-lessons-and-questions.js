const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
  const { data: lessons, error: lErr } = await supabase.from('lessons').select('id, lesson_number, title, is_published, quiz_enabled').order('lesson_number');
  console.log('Lessons in DB:', lessons);
  if (lErr) console.error('Lesson err:', lErr);

  const { data: questions, error: qErr } = await supabase.from('quiz_questions').select('lesson_id, question_number');
  const countByLesson = {};
  for (const q of (questions || [])) {
    countByLesson[q.lesson_id] = (countByLesson[q.lesson_id] || 0) + 1;
  }
  console.log('Quiz questions count by lesson:', countByLesson);
  if (qErr) console.error('Question err:', qErr);
}

check().catch(console.error);
