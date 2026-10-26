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

const HTML07_QUESTIONS = [
  {
    lesson_id: 'html_07',
    question_number: 1,
    question_text: 'แอตทริบิวต์ action ในแท็ก <form> มีหน้าที่สำคัญอย่างไรตามสไลด์?',
    option_a: 'กำหนดสีพื้นหลังของแบบฟอร์ม',
    option_b: 'กำหนด URL หรือไฟล์เซิร์ฟเวอร์ปลายทางที่จะรับข้อมูลไปประมวลผล',
    option_c: 'ซ่อนแบบฟอร์มไม่ให้ผู้ใช้มองเห็น',
    option_d: 'บังคับให้ผู้ใช้กรอกข้อมูลภายใน 1 นาที',
    correct_option: 'B',
    explanation: 'สไลด์ระบุว่าแอตทริบิวต์ action ทำหน้าที่กำหนด URL หรือไฟล์เซิร์ฟเวอร์ปลายทางที่จะรับข้อมูลไปประมวลผล เช่น action="/save-data.php"',
  },
  {
    lesson_id: 'html_07',
    question_number: 2,
    question_text: 'การส่งข้อมูลด้วย method="POST" มีความแตกต่างจาก method="GET" อย่างไรตามที่ระบุในสไลด์?',
    option_a: 'POST ส่งข้อมูลต่อท้าย URL ทำให้มองเห็นข้อมูลได้ชัดเจน',
    option_b: 'POST ส่งข้อมูลอย่างปลอดภัยผ่าน Body เหมาะกับรหัสผ่านและข้อมูลสำคัญ',
    option_c: 'POST ใช้ได้เฉพาะกับการค้นหาข้อมูลทั่วไปเท่านั้น',
    option_d: 'POST ไม่สามารถส่งข้อมูลภาษาไทยได้',
    correct_option: 'B',
    explanation: 'สไลด์ระบุว่า method="POST" ส่งข้อมูลอย่างปลอดภัยผ่าน Request Body เหมาะกับรหัสผ่านและข้อมูลสำคัญ ส่วน method="GET" ส่งข้อมูลต่อท้าย URL',
  },
  {
    lesson_id: 'html_07',
    question_number: 3,
    question_text: 'หากต้องการสร้างช่องกรอกรหัสผ่านที่ซ่อนตัวอักษรด้วยจุดวงกลมเพื่อความปลอดภัย ต้องกำหนด type เป็นค่าใด?',
    option_a: 'type="text"',
    option_b: 'type="hidden"',
    option_c: 'type="password"',
    option_d: 'type="secret"',
    correct_option: 'C',
    explanation: 'สไลด์ระบุว่า type="password" ใช้สำหรับรหัสผ่าน โดยจะซ่อนตัวอักษรด้วยจุดวงกลมเพื่อความปลอดภัยของผู้ใช้',
  },
  {
    lesson_id: 'html_07',
    question_number: 4,
    question_text: 'ประโยชน์ที่สำคัญที่สุดของการใช้แท็ก <label> คู่กับช่องกรอกข้อมูลคือข้อใดตามสไลด์?',
    option_a: 'ช่วยเพิ่ม UX เมื่อผู้ใช้คลิกที่ข้อความ Label จะเป็นการโฟกัสช่องกรอกข้อมูลทันที',
    option_b: 'เปลี่ยนฟอนต์ของแบบฟอร์มเป็นตัวหนาอัตโนมัติ',
    option_c: 'แปลงข้อความเป็นภาษาอังกฤษทันที',
    option_d: 'ลบข้อมูลในช่องกรอกเมื่อพิมพ์เสร็จ',
    correct_option: 'A',
    explanation: 'สไลด์หัวข้อ Accessibility & Multiline ระบุว่า <label> ช่วยเพิ่ม UX เมื่อผู้ใช้คลิกที่ข้อความ Label จะเป็นการโฟกัสช่องกรอกข้อมูลทันที',
  },
  {
    lesson_id: 'html_07',
    question_number: 5,
    question_text: 'หากต้องการให้ผู้ใช้กรอกข้อความยาวหลายบรรทัด เช่น ที่อยู่ หรือข้อเสนอแนะ ควรเลือกใช้แท็กใดตามสไลด์?',
    option_a: '<input type="text">',
    option_b: '<textarea>',
    option_c: '<select>',
    option_d: '<multiline>',
    correct_option: 'B',
    explanation: 'สไลด์ระบุว่าแท็ก <textarea> รองรับการพิมพ์ข้อความยาวหลายบรรทัด เช่น ที่อยู่ หรือข้อเสนอแนะ พร้อมกำหนด rows และ cols ได้',
  },
  {
    lesson_id: 'html_07',
    question_number: 6,
    question_text: 'เพื่อให้ตัวเลือกแบบ Radio Button (type="radio") ทำงานเป็นกลุ่มเดียวกันและเลือกได้เพียง 1 ข้อ ต้องตั้งค่าอย่างไร?',
    option_a: 'ตั้งค่าแอตทริบิวต์ id ให้ตรงกันทุกตัวเลือก',
    option_b: 'ตั้งค่าแอตทริบิวต์ name ให้เหมือนกันเพื่อจัดกลุ่มตัวเลือก',
    option_c: 'ใส่แอตทริบิวต์ multiple ในทุกตัวเลือก',
    option_d: 'ต้องใช้แท็ก <ol> ครอบปุ่ม Radio เสมอ',
    correct_option: 'B',
    explanation: 'สไลด์หัวข้อ Selection Inputs ระบุชัดเจนว่า สำหรับ type="radio" ต้องตั้งค่าแอตทริบิวต์ name ให้เหมือนกันเพื่อจัดกลุ่มตัวเลือก',
  },
  {
    lesson_id: 'html_07',
    question_number: 7,
    question_text: 'ข้อใดคือความแตกต่างหลักระหว่าง type="radio" และ type="checkbox" ตามที่สไลด์สรุปไว้?',
    option_a: 'Radio ใช้พิมพ์ข้อความ ส่วน Checkbox ใช้เลือกไฟล์',
    option_b: 'type="radio" เลือกได้ 1 อย่าง ส่วน type="checkbox" เลือกได้หลายอย่างพร้อมกัน',
    option_c: 'Checkbox ไม่สามารถส่งค่า value ไปยังเซิร์ฟเวอร์ได้',
    option_d: 'ทั้งสองประเภททำงานเหมือนกันทุกประการ',
    correct_option: 'B',
    explanation: 'สไลด์เปรียบเทียบว่า type="radio" (เลือกได้ 1 อย่าง) ส่วน type="checkbox" (ผู้ใช้สามารถติ๊กเลือกได้มากกว่าหนึ่งตัวเลือกพร้อมกัน)',
  },
  {
    lesson_id: 'html_07',
    question_number: 8,
    question_text: 'ในรายการแบบดึงลง (<select>) หากต้องการกำหนดให้ตัวเลือกใดเป็นตัวเลือกเริ่มต้น ต้องใส่ Attribute ใดใน <option>?',
    option_a: 'checked',
    option_b: 'default',
    option_c: 'selected',
    option_d: 'active',
    correct_option: 'C',
    explanation: 'สไลด์ระบุว่าสามารถใช้แอตทริบิวต์ selected ในแท็ก <option> เพื่อกำหนดตัวเลือกเริ่มต้นใน Dropdown Menu ได้',
  },
  {
    lesson_id: 'html_07',
    question_number: 9,
    question_text: 'ตัวรับข้อมูลพิเศษใน HTML5 ข้อใดที่ใช้สำหรับเปิดปฏิทินให้ผู้ใช้เลือกวันที่ได้อย่างสะดวก?',
    option_a: 'type="time"',
    option_b: 'type="date"',
    option_c: 'type="calendar"',
    option_d: 'type="month"',
    correct_option: 'B',
    explanation: 'สไลด์หัวข้อ HTML5 Controls ระบุว่า type="date" ทำหน้าที่แสดงปฏิทินให้เลือกวันที่อย่างสะดวก',
  },
  {
    lesson_id: 'html_07',
    question_number: 10,
    question_text: 'หากต้องการบังคับว่าช่องกรอกข้อมูลนี้ต้องกรอก ห้ามเว้นว่างเด็ดขาด ต้องใส่ Attribute ใดตามสไลด์?',
    option_a: 'placeholder',
    option_b: 'readonly',
    option_c: 'required',
    option_d: 'disabled',
    correct_option: 'C',
    explanation: 'สไลด์หัวข้อ Validation ระบุว่า required คือแอตทริบิวต์บังคับว่าต้องกรอก ห้ามเว้นว่างเด็ดขาดก่อนกดส่งฟอร์ม',
  },
];

const HTML08_QUESTIONS = [
  {
    lesson_id: 'html_08',
    question_number: 1,
    question_text: 'ความหมายที่แท้จริงของ Semantic HTML5 ตามที่สไลด์อธิบายคือข้อใด?',
    option_a: 'แท็กที่มีการใส่เอฟเฟกต์แอนิเมชันในตัว',
    option_b: 'แท็กที่มีความหมายในตัวเอง สื่อสารบทบาทของเนื้อหาแก่ทั้งนักพัฒนาและเบราว์เซอร์อย่างแม่นยำ',
    option_c: 'ภาษาโปรแกรมชนิดใหม่ที่มาแทนที่ JavaScript',
    option_d: 'การใช้แท็ก <div> ซ้อนกันหลายชั้นเพื่อจัดหน้าจอ',
    correct_option: 'B',
    explanation: 'สไลด์ระบุว่า Semantic HTML5 คือ Meaningful Structure "แท็กที่มีความหมายในตัวเอง สื่อสารบทบาทของเนื้อหาแก่ทั้งนักพัฒนาและ Browser ได้อย่างแม่นยำ"',
  },
  {
    lesson_id: 'html_08',
    question_number: 2,
    question_text: 'การเปลี่ยนมาใช้ Semantic HTML5 ช่วยแก้ปัญหาแบบเดิมของหน้าเว็บที่เรียกว่าอะไรในสไลด์?',
    option_a: 'Div-Soup (ลดการใช้ <div class="..."> ที่ซ้ำซ้อนและไร้ความหมาย)',
    option_b: 'Table-Lock',
    option_c: 'CSS-Overflow',
    option_d: 'Broken-Link',
    correct_option: 'A',
    explanation: 'สไลด์ระบุว่า Semantic HTML5 เข้ามา "แทนที่ Div-Soup แบบเดิม ช่วยลดการใช้ <div class=\\"...\\"> ที่ซ้ำซ้อนและไร้ความหมาย"',
  },
  {
    lesson_id: 'html_08',
    question_number: 3,
    question_text: 'การจัดโครงสร้างหน้าเว็บด้วย Semantic Tags ส่งผลดีต่อสิ่งใดมากที่สุดตามสไลด์?',
    option_a: 'ช่วย Search Engine (SEO) ให้บอทเข้าใจโครงสร้าง และช่วย Screen Reader สำหรับผู้พิการทางสายตา',
    option_b: 'เพิ่มความเร็วการดาวน์โหลดไฟล์บนเครื่องผู้ใช้',
    option_c: 'เปลี่ยนหน้าเว็บเป็นแอปพลิเคชันมือถืออัตโนมัติ',
    option_d: 'ป้องกันการคัดลอกข้อความในเว็บไซต์',
    correct_option: 'A',
    explanation: 'สไลด์ระบุว่า Semantic Tags ช่วย Search Engine เข้าใจโครงสร้างเว็บเพื่อจัดอันดับ SEO และช่วย Screen Reader อ่านให้ผู้พิการทางสายตาได้อย่างถูกต้องตามมาตรฐาน Accessibility',
  },
  {
    lesson_id: 'html_08',
    question_number: 4,
    question_text: 'โค้ดแบบเดิมที่เขียน <div id="header">...</div> ควรแทนที่ด้วยแท็ก Semantic ข้อใดตามตัวอย่างในสไลด์?',
    option_a: '<head>',
    option_b: '<header>',
    option_c: '<top>',
    option_d: '<banner>',
    correct_option: 'B',
    explanation: 'สไลด์เปรียบเทียบ Non-Semantic vs Semantic แสดงชัดเจนว่า <div id="header"> ถูกแทนที่ด้วยแท็ก <header>',
  },
  {
    lesson_id: 'html_08',
    question_number: 5,
    question_text: 'แท็ก <header> มีบทบาทหน้าที่อย่างไร และมีข้อห้ามในการซ้อนแท็กอย่างไรตามสไลด์?',
    option_a: 'ใช้บรรจุโลโก้ ชื่อเว็บไซต์ หรือเมนูนำทางหลัก และห้ามซ้อนภายใน <footer> หรือ <address>',
    option_b: 'ใช้ได้เฉพาะส่วนท้ายของเอกสารเท่านั้น',
    option_c: 'ห้ามมีตัวหนังสือหรือรูปภาพอยู่ภายในแท็ก',
    option_d: 'ต้องมีได้เพียง 1 แท็กต่อทั้งเว็บไซต์เท่านั้น',
    correct_option: 'A',
    explanation: 'สไลด์ระบุว่า <header> ใช้บรรจุเกริ่นนำ โลโก้ ชื่อเว็บไซต์ ค้นหา หรือเมนูนำทางหลัก สามารถใช้ในบทความได้ และห้ามซ้อนภายใน <footer> หรือ <address>',
  },
  {
    lesson_id: 'html_08',
    question_number: 6,
    question_text: 'แท็ก <nav> ถูกออกแบบมาเพื่อใช้บรรจุเนื้อหาประเภทใดตามสไลด์?',
    option_a: 'รูปภาพแกลเลอรีและวิดีโอทั้งหมด',
    option_b: 'รวมกลุ่มลิงก์เชื่อมโยงหลักที่ใช้สำหรับนำทางในเว็บไซต์ เช่น เมนูหลัก หรือเมนูสารบัญ',
    option_c: 'ช่องกรอกแบบฟอร์มเข้าสู่ระบบ',
    option_d: 'ข้อความลิขสิทธิ์และนโยบายความเป็นส่วนตัว',
    correct_option: 'B',
    explanation: 'สไลด์ระบุว่าบทบาทของ <nav> คือรวมกลุ่มลิงก์เชื่อมโยงหลักที่ใช้สำหรับนำทางในเว็บไซต์ เช่น เมนูหลัก สารบัญ หรือลิงก์แบ่งหน้า',
  },
  {
    lesson_id: 'html_08',
    question_number: 7,
    question_text: 'ข้อใดคือข้อกำหนดสำคัญที่สุดของแท็ก <main> ในการจัดวางโครงสร้างหน้าเว็บตามสไลด์?',
    option_a: 'มีได้เพียง 1 แท็กต่อ 1 หน้ากระดาษเท่านั้น (Unique Content ห้ามซ้ำกับหน้าอื่น)',
    option_b: 'ต้องมีอย่างน้อย 3 แท็กในแต่ละหน้า',
    option_c: 'ต้องวางอยู่นอกแท็ก <body> เสมอ',
    option_d: 'ห้ามใส่แท็กหัวเรื่อง h1-h6 ภายใน <main>',
    correct_option: 'A',
    explanation: 'สไลด์ระบุว่าแท็ก <main> คือพื้นที่เนื้อหาหลัก "มีได้เพียง 1 แท็กต่อ 1 หน้ากระดาษเท่านั้น (Unique Content)"',
  },
  {
    lesson_id: 'html_08',
    question_number: 8,
    question_text: 'หากต้องการสร้างส่วนของบทความข่าวหรือเนื้อหาที่สมบูรณ์ในตัวเอง สามารถนำไปเผยแพร่ซ้ำได้ ควรเลือกใช้แท็กใด?',
    option_a: '<article>',
    option_b: '<aside>',
    option_c: '<nav>',
    option_d: '<span>',
    correct_option: 'A',
    explanation: 'สไลด์ระบุว่า <article> คือเนื้อหาที่สมบูรณ์ในตัวเอง สามารถนำไปเผยแพร่ซ้ำได้ เช่น บทความข่าว หรือโพสต์บล็อก',
  },
  {
    lesson_id: 'html_08',
    question_number: 9,
    question_text: 'แท็ก <aside> เหมาะสำหรับบรรจุเนื้อหาประเภทใดตามที่ระบุในสไลด์?',
    option_a: 'หัวเรื่องใหญ่สุดของเว็บไซต์',
    option_b: 'เนื้อหาเสริม แถบข้าง (Sidebar) หรือลิงก์ที่เกี่ยวข้องแต่ไม่ใช่เนื้อหาหลัก',
    option_c: 'วิดีโอหลักประจำหน้าเว็บ',
    option_d: 'ช่องกรอกรหัสผ่านเข้าสู่ระบบ',
    correct_option: 'B',
    explanation: 'สไลด์ระบุว่า <aside> ใช้สำหรับเนื้อหาเสริม แถบข้าง หรือลิงก์ที่เกี่ยวข้องแต่ไม่ใช่เนื้อหาหลัก',
  },
  {
    lesson_id: 'html_08',
    question_number: 10,
    question_text: 'ข้อมูลประเภทใดที่ควรจัดวางไว้ภายในแท็ก <footer> ตามที่สไลด์สอน?',
    option_a: 'ข้อมูลสรุปท้ายหน้า เช่น ลิขสิทธิ์ (Copyright), นโยบายความเป็นส่วนตัว และข้อมูลการติดต่อ',
    option_b: 'เมนูนำทางหลักด้านบนสุดของเว็บ',
    option_c: 'หัวเรื่อง h1 หลักประจำหน้าเว็บ',
    option_d: 'โลโก้แบรนด์หลักของเว็บไซต์',
    correct_option: 'A',
    explanation: 'สไลด์ระบุว่า <footer> ใช้แสดงข้อมูลสรุปท้ายหน้า เช่น ข้อมูลลิขสิทธิ์ (Copyright), ข้อตกลงความเป็นส่วนตัว, ลิงก์นโยบายเว็บไซต์ และข้อมูลการติดต่อ',
  },
];

async function seed() {
  const teacherEmail = '68219100010@comquest.ac.th';
  const teacherPassword = 'Password123!';

  console.log('Authenticating as teacher...');
  const { data: authData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: teacherEmail,
    password: teacherPassword,
  });

  if (signInErr || !authData?.session) {
    console.error('Sign-in failed:', signInErr?.message);
    return;
  }
  console.log('✓ Teacher signed in successfully! User ID:', authData.user.id);

  // 1. Update lessons table for html_07 and html_08
  console.log('Updating lessons table for html_07 and html_08...');
  const { data: update07, error: err07 } = await supabase
    .from('lessons')
    .update({
      title: 'ฟอร์มและการรับข้อมูลผู้ใช้',
      description: 'การสร้างแบบฟอร์ม form, input ข้อความ ปุ่มกด และตัวเลือกต่าง ๆ',
      is_published: true,
      quiz_enabled: true,
    })
    .eq('id', 'html_07')
    .select();

  const { data: update08, error: err08 } = await supabase
    .from('lessons')
    .update({
      title: 'Semantic HTML5 และโครงร่างเว็บ',
      description: 'การจัดโครงสร้างหน้าเว็บด้วย semantic tags: header, nav, main, footer',
      is_published: true,
      quiz_enabled: true,
    })
    .eq('id', 'html_08')
    .select();

  console.log('html_07 lesson update result:', { data: update07, error: err07 });
  console.log('html_08 lesson update result:', { data: update08, error: err08 });

  // 2. Upsert quiz questions for html_07
  console.log('Upserting 10 questions for html_07...');
  for (const q of HTML07_QUESTIONS) {
    const { error: qErr } = await supabase
      .from('quiz_questions')
      .upsert(q, { onConflict: 'lesson_id,question_number' });
    if (qErr) {
      console.error(`Error inserting html_07 Q${q.question_number}:`, qErr.message);
    } else {
      console.log(`✓ html_07 Q${q.question_number} upserted`);
    }
  }

  // 3. Upsert quiz questions for html_08
  console.log('Upserting 10 questions for html_08...');
  for (const q of HTML08_QUESTIONS) {
    const { error: qErr } = await supabase
      .from('quiz_questions')
      .upsert(q, { onConflict: 'lesson_id,question_number' });
    if (qErr) {
      console.error(`Error inserting html_08 Q${q.question_number}:`, qErr.message);
    } else {
      console.log(`✓ html_08 Q${q.question_number} upserted`);
    }
  }

  // Verify total questions in DB
  const { data: count07 } = await supabase
    .from('quiz_questions')
    .select('id, question_number')
    .eq('lesson_id', 'html_07');
  const { data: count08 } = await supabase
    .from('quiz_questions')
    .select('id, question_number')
    .eq('lesson_id', 'html_08');

  console.log(`Verified DB Questions: html_07 has ${count07?.length} questions, html_08 has ${count08?.length} questions`);
}

seed().catch(console.error);
