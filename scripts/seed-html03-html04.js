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

  // 1. Update lessons html_03 and html_04 to published and quiz_enabled
  console.log('Updating lessons table for html_03 and html_04...');
  const { data: updatedLessons, error: lessonErr } = await supabase
    .from('lessons')
    .update({
      is_published: true,
      quiz_enabled: true,
    })
    .in('id', ['html_03', 'html_04'])
    .select();

  console.log('Updated lessons result:', { updatedLessons, lessonErr });

  // 2. Import default questions
  const defaultQuestionsPath = path.resolve(__dirname, '..', 'lib', 'constants', 'default-questions.ts');
  // Read and parse or import questions
  const content = fs.readFileSync(defaultQuestionsPath, 'utf8');

  // We can load them via node script or evaluate them
  const html03Qs = [
    {
      lesson_id: 'html_03',
      question_number: 1,
      question_text: 'แท็ก <b> และ <strong> แสดงผลเป็นตัวหนาเหมือนกัน แต่มีความแตกต่างกันในด้านใดตามหลักการของ HTML?',
      option_a: '<b> เป็นแท็กเดี่ยว ส่วน <strong> เป็นแท็กคู่',
      option_b: '<b> เน้นความสวยงามทั่วไป ส่วน <strong> สื่อความหมายว่าเนื้อหามีความสำคัญสูง (Semantic Importance) และช่วยเรื่อง Accessibility',
      option_c: '<strong> ตัวอักษรใหญ่กว่า <b> เสมอในทุกเบราว์เซอร์',
      option_d: '<b> ใช้ได้เฉพาะกับหัวข้อเรื่อง ส่วน <strong> ใช้ได้เฉพาะในย่อหน้า',
      correct_option: 'B',
      explanation: 'สไลด์ระบุว่า <b> เน้นตัวหนาเพื่อความสวยงามและการมองเห็นทั่วไปโดยไม่เพิ่มความสำคัญต่อ Screen Reader หรือ SEO ส่วน <strong> เน้นตัวหนาพร้อมสื่อว่าเนื้อหามีความสำคัญสูง (Semantic Importance) ช่วยเรื่อง Accessibility'
    },
    {
      lesson_id: 'html_03',
      question_number: 2,
      question_text: 'หากต้องการแจ้งเตือนข้อความฉุกเฉิน เช่น "คำเตือน: อันตราย!" เพื่อให้โปรแกรมอ่านหน้าจอ (Screen Reader) เข้าใจว่ามีความสำคัญสูง ควรเลือกใช้แท็กใด?',
      option_a: '<b>',
      option_b: '<i>',
      option_c: '<strong>',
      option_d: '<mark>',
      correct_option: 'C',
      explanation: 'แท็ก <strong> เหมาะสำหรับข้อความเตือนสำคัญ (เช่น คำเตือน: อันตราย!) เพราะสื่อความหมายทาง Semantic ว่าเป็นเนื้อหาที่มีความสำคัญสูง'
    },
    {
      lesson_id: 'html_03',
      question_number: 3,
      question_text: 'แท็ก <i> และ <em> ให้ผลลัพธ์การแสดงผลตัวอักษรบนเว็บเบราว์เซอร์ในลักษณะใดเหมือนกัน?',
      option_a: 'ข้อความขีดเส้นใต้',
      option_b: 'ข้อความตัวเอียง',
      option_c: 'ข้อความตัวหนา',
      option_d: 'ข้อความมีแถบสีไฮไลต์',
      correct_option: 'B',
      explanation: 'ทั้งแท็ก <i> และ <em> แสดงผลลัพธ์เป็นข้อความตัวเอียงบนเว็บเบราว์เซอร์ โดย <i> เน้นด้าน Visual ส่วน <em> เน้นด้านความหมาย (Semantic)'
    },
    {
      lesson_id: 'html_03',
      question_number: 4,
      question_text: 'ตามเนื้อหาในสไลด์ แท็ก <i> (Italic) เหมาะสำหรับนำไปใช้งานในกรณีใดมากที่สุด?',
      option_a: 'คำเตือนเรื่องความปลอดภัย',
      option_b: 'ศัพท์ทางวิทยาศาสตร์ คำทับศัพท์ภาษาต่างประเทศ หรือชื่อเฉพาะเพื่อแยกข้อความ',
      option_c: 'การแสดงราคาโปรโมชันใหม่',
      option_d: 'การขึ้นบรรทัดใหม่โดยไม่เว้นระยะห่าง',
      correct_option: 'B',
      explanation: 'สไลด์ระบุว่าแท็ก <i> ใช้กับศัพท์ทางวิทยาศาสตร์ คำทับศัพท์ภาษาต่างประเทศ หรือชื่อเฉพาะเพื่อแยกข้อความ เช่น ภาษา <i>HTML</i> คืออะไร'
    },
    {
      lesson_id: 'html_03',
      question_number: 5,
      question_text: 'แท็ก <em> ย่อมาจากคำว่าอะไร และมีผลอย่างไรต่อโปรแกรมอ่านหน้าจอ (Screen Reader)?',
      option_a: 'Empty ช่วยแสดงกล่องข้อความว่าง',
      option_b: 'Element ช่วยกำหนดขอบเขตของเอกสาร',
      option_c: 'Emphasized ช่วยเน้นย้ำน้ำหนักเสียงพูดตรงคำนั้นๆ',
      option_d: 'Email ช่วยเปิดโปรแกรมส่งอีเมล',
      correct_option: 'C',
      explanation: 'แท็ก <em> ย่อมาจาก Emphasized แปลว่าการเน้นย้ำน้ำหนักเสียง ทำให้เครื่องอ่านหน้าจอเน้นเสียงพูดตรงคำนั้นๆ เช่น เรา <em>ต้อง</em> ตั้งใจเรียน'
    },
    {
      lesson_id: 'html_03',
      question_number: 6,
      question_text: 'ข้อควรระวังสำคัญที่สุดในการใช้งานแท็ก <u> (Underline) เพื่อขีดเส้นใต้ข้อความคือข้อใด?',
      option_a: 'จะทำให้ตัวอักษรเปลี่ยนเป็นสีแดงอัตโนมัติ',
      option_b: 'ควรระวังไม่ให้ผู้ใช้สับสนเข้าใจผิดว่าเป็นลิงก์ (Hyperlink)',
      option_c: 'ไม่สามารถใช้งานร่วมกับแท็กอื่นในย่อหน้าได้',
      option_d: 'เบราว์เซอร์จะไม่แสดงผลหากไม่มีการเขียนคำสั่ง CSS',
      correct_option: 'B',
      explanation: 'สไลด์ระบุข้อควรระวังว่า การขีดเส้นใต้ด้วยแท็ก <u> ควรระวังไม่ให้สับสนกับลิงก์ เพราะบนหน้าเว็บลิงก์มักมีขีดเส้นใต้เป็นมาตรฐาน'
    },
    {
      lesson_id: 'html_03',
      question_number: 7,
      question_text: 'แท็ก <ins> (Inserted Text) มีบทบาทและหน้าที่สำคัญอย่างไรในเอกสาร HTML?',
      option_a: 'ใช้สำหรับแทรกรูปภาพจากภายนอก',
      option_b: 'แสดงข้อความที่ถูกเพิ่มเข้ามาใหม่ มักใช้คู่กับแท็ก <del> เพื่อแสดงการแก้ไขเอกสาร เช่น ราคาพิเศษ',
      option_c: 'ใช้สั่งให้ตัวอักษรกะพริบเพื่อเรียกร้องความสนใจ',
      option_d: 'ใช้ขยายขนาดหัวข้อให้ใหญ่ขึ้น',
      correct_option: 'B',
      explanation: 'แท็ก <ins> แสดงข้อความที่ถูกเพิ่มเข้ามาใหม่ มักใช้คู่กับแท็ก <del> เพื่อแสดงการแก้ไขเอกสาร เช่น ราคาพิเศษ <ins>199</ins> บาท'
    },
    {
      lesson_id: 'html_03',
      question_number: 8,
      question_text: 'แท็ก <mark> ให้ผลลัพธ์การแสดงผลข้อความในรูปแบบใดบนเว็บเบราว์เซอร์?',
      option_a: 'ขีดเส้นทับข้อความตรงกลาง',
      option_b: 'ทำให้ตัวอักษรเอียงและเป็นตัวหนาพร้อมกัน',
      option_c: 'สร้างแถบสีเน้นข้อความประหนึ่งการใช้ปากกาไฮไลต์',
      option_d: 'ซ่อนข้อความไว้เพื่อรอการคลิก',
      correct_option: 'C',
      explanation: 'สไลด์อธิบายว่าแท็ก <mark> ทำหน้าที่สร้างแถบสีเน้นข้อความประหนึ่งการใช้ปากกาไฮไลต์บนเว็บเบราว์เซอร์'
    },
    {
      lesson_id: 'html_03',
      question_number: 9,
      question_text: 'กรณีการใช้งานใดที่สไลด์แนะนำว่าเหมาะสมอย่างยิ่งสำหรับการใช้แท็ก <mark>?',
      option_a: 'การแสดงคำค้นหา (Search Result) หรือประเด็นสำคัญ เช่น อย่าลืมส่งงาน <mark>ภายในวันศุกร์</mark> นี้',
      option_b: 'การเขียนโค้ดภาษา JavaScript',
      option_c: 'การสร้างปุ่มกดเข้าสู่ระบบ',
      option_d: 'การสร้างตารางข้อมูลตัวเลข',
      correct_option: 'A',
      explanation: 'สไลด์ระบุว่าแท็ก <mark> เหมาะกับการแสดงคำค้นหา (Search Result) หรือประเด็นสำคัญ เช่น อย่าลืมส่งงาน <mark>ภายในวันศุกร์</mark> นี้'
    },
    {
      lesson_id: 'html_03',
      question_number: 10,
      question_text: 'จากตารางสรุปเปรียบเทียบในสไลด์ ข้อใดจับคู่ "Visual Tag (เน้นการแสดงผล)" และ "Semantic Tag (เน้นความหมาย)" ได้ถูกต้องทุกคู่?',
      option_a: 'ตัวหนา: <b> คู่กับ <strong>, ตัวเอียง: <i> คู่กับ <em>, ขีดเส้นใต้: <u> คู่กับ <ins>',
      option_b: 'ตัวหนา: <strong> คู่กับ <b>, ตัวเอียง: <mark> คู่กับ <i>, ขีดเส้นใต้: <ins> คู่กับ <u>',
      option_c: 'ตัวหนา: <i> คู่กับ <em>, ตัวเอียง: <b> คู่กับ <strong>, ขีดเส้นใต้: <mark> คู่กับ <u>',
      option_d: 'ตัวหนา: <u> คู่กับ <ins>, ตัวเอียง: <b> คู่กับ <strong>, ขีดเส้นใต้: <i> คู่กับ <em>',
      correct_option: 'A',
      explanation: 'ตารางสรุปในสไลด์ระบุ: ตัวหนา (<b> / <strong>), ตัวเอียง (<i> / <em>), ขีดเส้นใต้ (<u> / <ins>), และไฮไลต์ (- / <mark>)'
    }
  ];

  const html04Qs = [
    {
      lesson_id: 'html_04',
      question_number: 1,
      question_text: 'ตัวอักษร "a" ในแท็ก <a> ย่อมาจากคำศัพท์ภาษาอังกฤษในข้อใด?',
      option_a: 'Application',
      option_b: 'Anchor',
      option_c: 'Address',
      option_d: 'Action',
      correct_option: 'B',
      explanation: 'แท็ก <a> มาจากคำว่า Anchor (สมอเรือ) ใช้สำหรับสร้างจุดเชื่อมโยง (Hyperlink) ไปยังเป้าหมายปลายทาง'
    },
    {
      lesson_id: 'html_04',
      question_number: 2,
      question_text: 'แอตทริบิวต์ (Attribute) ใดที่จำเป็นต้องระบุในแท็ก <a> เพื่อกำหนดปลายทางของลิงก์?',
      option_a: 'src',
      option_b: 'alt',
      option_c: 'href',
      option_d: 'target',
      correct_option: 'C',
      explanation: 'Attribute href (Hypertext Reference) เป็นคุณสมบัติสำคัญที่สุดสำหรับระบุ URL หรือที่อยู่ปลายทางที่ต้องการเชื่อมโยงไป'
    },
    {
      lesson_id: 'html_04',
      question_number: 3,
      question_text: 'หากแท็ก <a> ไม่มีแอตทริบิวต์ href จะเกิดผลลัพธ์อย่างไรกับข้อความ?',
      option_a: 'ข้อความจะไม่ทำหน้าที่เป็นลิงก์ (คลิกเชื่อมโยงไม่ได้)',
      option_b: 'ข้อความจะถูกลบออกจากหน้าจอทันที',
      option_c: 'ข้อความจะกลายเป็นปุ่มสีฟ้าโดยอัตโนมัติ',
      option_d: 'เบราว์เซอร์จะหยุดทำงานและแจ้งเตือน Fatal Error',
      correct_option: 'A',
      explanation: 'สไลด์ระบุข้อควรรู้เกี่ยวกับแท็ก <a> ว่า: หากไม่มีคุณสมบัติ href ข้อความจะไม่ทำหน้าที่เป็นลิงก์'
    },
    {
      lesson_id: 'html_04',
      question_number: 4,
      question_text: 'แท็ก <a> จัดเป็นประเภทองค์ประกอบ (Element) รูปแบบใดในภาษา HTML?',
      option_a: 'Block Element (ขึ้นบรรทัดใหม่เสมอ)',
      option_b: 'Inline Element (วางต่อกันในบรรทัดเดียวกันได้โดยไม่ขึ้นบรรทัดใหม่)',
      option_c: 'Hidden Element (ไม่แสดงผลบนหน้าจอ)',
      option_d: 'Table Element (แสดงเป็นตารางข้อมูล)',
      correct_option: 'B',
      explanation: 'สไลด์ระบุว่าแท็ก <a> เป็น Inline Element ซึ่งสามารถวางต่อกันในบรรทัดเดียวกันได้โดยไม่ตัดขึ้นบรรทัดใหม่'
    },
    {
      lesson_id: 'html_04',
      question_number: 5,
      question_text: 'หากต้องการให้ลิงก์เปิดหน้าเว็บเป้าหมายใน "แท็บใหม่หรือหน้าต่างใหม่" โดยไม่ปิดหน้าเดิม ต้องกำหนดค่าแอตทริบิวต์อย่างไร?',
      option_a: 'target="_blank"',
      option_b: 'target="_self"',
      option_c: 'window="new"',
      option_d: 'tab="open"',
      correct_option: 'A',
      explanation: 'เพิ่ม Attribute target="_blank" เพื่อให้เบราว์เซอร์เปิดลิงก์ในแท็บหรือหน้าต่างใหม่ โดยยังคงเปิดหน้าเว็บเดิมทิ้งไว้'
    },
    {
      lesson_id: 'html_04',
      question_number: 6,
      question_text: 'การเชื่อมโยงไปยังเว็บไซต์ภายนอก (External Link) เช่น Google ต้องระบุ URL ในลักษณะใด?',
      option_a: 'Relative URL โดยระบุเฉพาะชื่อโดเมน',
      option_b: 'Absolute URL ที่ระบุที่อยู่เต็มและต้องใส่โปรโตคอล เช่น https:// เสมอ',
      option_c: 'ระบุเฉพาะชื่อไฟล์ เช่น google.html',
      option_d: 'ใช้เครื่องหมาย # ตามด้วยชื่อเว็บไซต์',
      correct_option: 'B',
      explanation: 'สไลด์ระบุว่า การเชื่อมโยงภายนอกต้องใช้ Absolute URL ระบุที่อยู่เว็บไซต์แบบเต็ม และต้องใส่โปรโตคอล เช่น https:// เสมอ เพื่อพาผู้ใช้ไปยังโดเมนอื่น'
    },
    {
      lesson_id: 'html_04',
      question_number: 7,
      question_text: 'การเชื่อมโยงหน้าเว็บภายในเว็บไซต์เดียวกัน (Internal Link) ในโฟลเดอร์เดียวกัน ควรเขียนโค้ดตามข้อใด?',
      option_a: '<a href="about.html">เกี่ยวกับเรา</a>',
      option_b: '<a href="https://localhost/about.html">เกี่ยวกับเรา</a>',
      option_c: '<a href="mailto:about.html">เกี่ยวกับเรา</a>',
      option_d: '<a target="about.html">เกี่ยวกับเรา</a>',
      correct_option: 'A',
      explanation: 'การเชื่อมโยงภายในที่อยู่ในโฟลเดอร์เดียวกัน ให้ใช้ Relative URL อ้างอิงชื่อไฟล์ได้โดยตรง เช่น <a href="about.html">เกี่ยวกับเรา</a>'
    },
    {
      lesson_id: 'html_04',
      question_number: 8,
      question_text: 'หากต้องการเชื่อมโยงไฟล์โดย "ย้อนกลับไปยังโฟลเดอร์หลัก (Parent Folder)" สัญลักษณ์เส้นทางใดที่สไลด์ระบุให้ใช้งาน?',
      option_a: '//',
      option_b: './',
      option_c: '../',
      option_d: '**',
      correct_option: 'C',
      explanation: 'สไลด์ระบุว่า: หากไฟล์อยู่ในโฟลเดอร์ย่อยให้ระบุชื่อโฟลเดอร์ หรือใช้ ../ เมื่อต้องการย้อนกลับไปยังโฟลเดอร์หลัก'
    },
    {
      lesson_id: 'html_04',
      question_number: 9,
      question_text: 'หากต้องการทำให้ "รูปภาพสามารถคลิกเพื่อเป็นลิงก์ได้" (Image Link) ต้องเขียนโค้ดตามโครงสร้างในข้อใด?',
      option_a: '<img src="logo.png" href="index.html">',
      option_b: '<a href="index.html"><img src="logo.png" alt="หน้าแรก"></a>',
      option_c: '<link href="index.html"><img src="logo.png"></link>',
      option_d: '<image-link url="index.html">logo.png</image-link>',
      correct_option: 'B',
      explanation: 'สไลด์สอนการทำ Image Link โดยการวางแท็ก <img> ครอบไว้ภายในแท็ก <a> เช่น <a href="index.html"><img src="logo.png" alt="หน้าแรก"></a> เพื่อให้รูปภาพคลิกได้'
    },
    {
      lesson_id: 'html_04',
      question_number: 10,
      question_text: 'คำสั่งใดที่ใช้ระบุในแอตทริบิวต์ href เมื่อต้องการสร้างลิงก์สำหรับส่งอีเมล เพื่อเปิดโปรแกรม Mail ทันที?',
      option_a: 'sendto:',
      option_b: 'email:',
      option_c: 'mailto:',
      option_d: 'message:',
      correct_option: 'C',
      explanation: 'ใช้คำสั่ง mailto: ในแอตทริบิวต์ href เช่น <a href="mailto:admin@example.com">ส่งอีเมลหาเรา</a> เพื่อเปิดโปรแกรมรับส่งอีเมลของผู้ใช้ทันที'
    }
  ];

  console.log('Upserting 10 questions for html_03...');
  const { data: q3Data, error: q3Err } = await supabase
    .from('quiz_questions')
    .upsert(html03Qs, { onConflict: 'lesson_id,question_number' })
    .select();
  console.log('html_03 questions upsert result:', { count: q3Data?.length, q3Err });

  console.log('Upserting 10 questions for html_04...');
  const { data: q4Data, error: q4Err } = await supabase
    .from('quiz_questions')
    .upsert(html04Qs, { onConflict: 'lesson_id,question_number' })
    .select();
  console.log('html_04 questions upsert result:', { count: q4Data?.length, q4Err });

  console.log('Finished seeding Lesson 3 and Lesson 4 into Supabase!');
}

seed().catch(console.error);
