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

  // 1. Update lessons html_05 and html_06 to published and quiz_enabled
  console.log('Updating lessons table for html_05 and html_06...');
  const { data: update05, error: err05 } = await supabase
    .from('lessons')
    .update({
      title: 'การแทรกรูปภาพและสื่อในเว็บ',
      description: 'การแสดงผลรูปภาพด้วยแท็ก img กำหนด src, alt และขนาดภาพ พร้อมการฝังวิดีโอ',
      is_published: true,
      quiz_enabled: true,
    })
    .eq('id', 'html_05')
    .select();

  const { data: update06, error: err06 } = await supabase
    .from('lessons')
    .update({
      title: 'รายการและตารางข้อมูลในเว็บ',
      description: 'การสร้างรายการแบบมีและไม่มีลำดับ ul/ol และการสร้างตารางข้อมูล table, tr, th, td',
      is_published: true,
      quiz_enabled: true,
    })
    .eq('id', 'html_06')
    .select();

  console.log('Updated lessons result:', { update05, err05, update06, err06 });

  // 2. Upsert questions for html_05
  const questions05 = [
    {
      lesson_id: 'html_05',
      question_number: 1,
      question_text: 'แท็ก <img> ในภาษา HTML มีลักษณะโครงสร้างแบบใดตามที่สไลด์ระบุ?',
      option_a: 'Container Element ที่ต้องมีแท็กปิด </img> เสมอ',
      option_b: 'Void Element (แท็กเดี่ยว) ไม่ต้องมีแท็กปิด </img>',
      option_c: 'Block Element ที่ต้องขึ้นต้นบรรทัดใหม่เสมอ',
      option_d: 'Semantic Tag ที่ใช้สำหรับจัดหมวดหมู่ข้อความหัวเรื่อง',
      correct_option: 'B',
      explanation: 'สไลด์ระบุชัดเจนว่า <img> เป็น Void Element (แท็กเดี่ยว) ไม่ต้องมีแท็กปิด </img> และจัดเป็น Inline-Block Element ที่ปรับขนาดกว้าง-ยาวได้',
    },
    {
      lesson_id: 'html_05',
      question_number: 2,
      question_text: 'Attribute ใดในแท็ก <img> ที่จำเป็นต้องระบุเสมอเพื่อกำหนดแหล่งที่มาหรือที่อยู่ของไฟล์ภาพ?',
      option_a: 'href',
      option_b: 'link',
      option_c: 'src (Source Path)',
      option_d: 'path',
      correct_option: 'C',
      explanation: 'Attribute src (Source Path) เป็นคุณสมบัติจำเป็นที่ต้องระบุ เพื่อบอกเบราว์เซอร์ว่าไฟล์ภาพอยู่ที่ใด หากไม่มีภาพจะไม่แสดงผล',
    },
    {
      lesson_id: 'html_05',
      question_number: 3,
      question_text: 'การเขียนโค้ด <img src="images/logo.png"> เป็นการระบุเส้นทางไฟล์แบบใดในสไลด์?',
      option_a: 'Relative Path (เส้นทางอ้างอิงจากตำแหน่งของไฟล์ HTML ปัจจุบัน)',
      option_b: 'Absolute Path (เส้นทางเต็มรูปแบบด้วย URL)',
      option_c: 'Global Network Path',
      option_d: 'Database Reference Path',
      correct_option: 'A',
      explanation: 'Relative Path (เส้นทางอ้างอิง) อ้างอิงจากโฟลเดอร์ของไฟล์ HTML ปัจจุบัน เหมาะสำหรับไฟล์ภาพที่เก็บอยู่ภายในเว็บไซต์เดียวกัน',
    },
    {
      lesson_id: 'html_05',
      question_number: 4,
      question_text: 'ข้อใดคือประโยชน์ของ Attribute alt (Alternative Text) ตามที่สไลด์อธิบาย?',
      option_a: 'ช่วย Screen Reader อ่านอธิบายภาพแก่ผู้พิการทางสายตา ส่งผลดีต่อ SEO และแสดงข้อความแทนที่เมื่อภาพเสีย',
      option_b: 'เปลี่ยนภาพนิ่งให้เป็นภาพเคลื่อนไหวอัตโนมัติ',
      option_c: 'บีบอัดขนาดไฟล์ภาพให้เล็กลงทันที',
      option_d: 'กำหนดเอฟเฟกต์สีและฟิลเตอร์ของรูปภาพ',
      correct_option: 'A',
      explanation: 'สไลด์หัวข้อ Accessibility & SEO ระบุว่า alt ช่วยให้ Screen Reader อ่านให้ผู้พิการทางสายตาฟังได้ ช่วย Search Engine จัดอันดับเว็บ (SEO) และแสดงแทนเมื่อภาพโหลดไม่สำเร็จหรือลิงก์เสีย',
    },
    {
      lesson_id: 'html_05',
      question_number: 5,
      question_text: 'ข้อควรระวังสำคัญเมื่อกำหนดขนาดรูปภาพด้วย width และ height พร้อมกันคืออะไร?',
      option_a: 'จะทำให้ภาพหายไปจากหน้าจอทันที',
      option_b: 'การระบุ width และ height ไม่สัมพันธ์กันอาจทำให้ภาพเบี้ยวผิดสัดส่วน (Distorted Aspect Ratio)',
      option_c: 'ทำให้เบราว์เซอร์ไม่สามารถโหลดวิดีโอได้',
      option_d: 'ทำให้ไม่สามารถใส่ Attribute alt ได้อีกต่อไป',
      correct_option: 'B',
      explanation: 'สไลด์ระบุข้อควรระวัง: การระบุทั้ง width และ height แบบไม่สัมพันธ์กันอาจทำให้ภาพเบี้ยว (Distorted Aspect Ratio) จึงควรใช้หน่วยที่รักษาสัดส่วนภาพ',
    },
    {
      lesson_id: 'html_05',
      question_number: 6,
      question_text: 'หากต้องการใช้ภาพโลโก้หรือกราฟิกที่รองรับพื้นหลังโปร่งใส (Alpha Transparency) ควรเลือกใช้ไฟล์ภาพฟอร์แมตใดตามสไลด์?',
      option_a: 'JPEG / JPG',
      option_b: 'PNG',
      option_c: 'MP3',
      option_d: 'TXT',
      correct_option: 'B',
      explanation: 'สไลด์ File Formats ระบุว่าไฟล์ PNG เหมาะสำหรับโลโก้และกราฟิก คมชัดสูง และรองรับพื้นหลังโปร่งใส (Alpha Transparency)',
    },
    {
      lesson_id: 'html_05',
      question_number: 7,
      question_text: 'จุดเด่นของไฟล์ภาพเวกเตอร์ชนิด SVG ตามที่ระบุในสไลด์คืออะไร?',
      option_a: 'ย่อขยายขนาดแล้วภาพไม่แตก คมชัดทุกขนาดหน้าจอ',
      option_b: 'เป็นไฟล์เสียงคุณภาพสูงสำหรับเปิดเพลงบนเว็บ',
      option_c: 'ใช้ได้เฉพาะรูปภาพขาวดำเท่านั้น',
      option_d: 'มีขนาดไฟล์ใหญ่กว่าวิดีโอเสมอ',
      correct_option: 'A',
      explanation: 'สไลด์ระบุว่า SVG เป็นภาพเวกเตอร์ มีจุดเด่นคือย่อขยายไม่แตก เหมาะสำหรับกราฟิกและไอคอนในเว็บสมัยใหม่',
    },
    {
      lesson_id: 'html_05',
      question_number: 8,
      question_text: 'หากต้องการฝังวิดีโอด้วยแท็ก <video> และให้แสดงปุ่มควบคุมการเล่น หยุด และปรับเสียง ต้องใส่ Attribute ใด?',
      option_a: 'controls',
      option_b: 'buttons',
      option_c: 'display',
      option_d: 'player',
      correct_option: 'A',
      explanation: 'สไลด์ระบุว่าแท็ก <video> ต้องใส่ Attribute controls เพื่อแสดงปุ่มควบคุม เล่น/หยุด และปรับระดับเสียง',
    },
    {
      lesson_id: 'html_05',
      question_number: 9,
      question_text: 'หากต้องการให้วิดีโอเล่นอัตโนมัติ (autoplay) ในเบราว์เซอร์ส่วนใหญ่ จำเป็นต้องระบุคุณสมบัติใดควบคู่กันตามสไลด์?',
      option_a: 'muted (ต้องปิดเสียงด้วย)',
      option_b: 'target="_blank"',
      option_c: 'download',
      option_d: 'disabled',
      correct_option: 'A',
      explanation: 'สไลด์ระบุว่า autoplay & muted จะทำให้วิดีโอเล่นอัตโนมัติได้โดยต้องปิดเสียง (muted) เบราว์เซอร์จึงจะอนุญาตให้เล่นอัตโนมัติ',
    },
    {
      lesson_id: 'html_05',
      question_number: 10,
      question_text: 'ตามแนวทางปฏิบัติที่ดี (Best Practices) การใส่ loading="lazy" ในแท็ก <img> มีประโยชน์อย่างไร?',
      option_a: 'ทำให้ภาพเบลอเพื่อความปลอดภัย',
      option_b: 'โหลดภาพเฉพาะเมื่อผู้ใช้เลื่อนหน้าจอมาเห็น ช่วยให้หน้าเว็บโหลดเร็วขึ้น',
      option_c: 'เปลี่ยนภาพเป็นไฟล์ SVG อัตโนมัติ',
      option_d: 'บังคับให้ดาวน์โหลดภาพลงเครื่องผู้ใช้ทันที',
      correct_option: 'B',
      explanation: 'สไลด์ Best Practices ระบุว่า "ใช้ Lazy Loading: ใส่ loading=\\"lazy\\" เพื่อโหลดภาพเฉพาะเมื่อผู้ใช้เลื่อนมาเห็น เพื่อให้เว็บโหลดได้รวดเร็ว"',
    },
  ];

  console.log('Upserting 10 questions for html_05...');
  const { data: upsert05, error: qErr05 } = await supabase
    .from('quiz_questions')
    .upsert(questions05, { onConflict: 'lesson_id,question_number' })
    .select();
  console.log('html_05 questions upsert result:', { count: upsert05?.length, error: qErr05 });

  // 3. Upsert questions for html_06
  const questions06 = [
    {
      lesson_id: 'html_06',
      question_number: 1,
      question_text: 'แท็ก <ul> ย่อมาจากคำว่าอะไร และมีวัตถุประสงค์เพื่ออะไรตามสไลด์?',
      option_a: 'Underline Line ใช้สำหรับขีดเส้นใต้หัวข้อ',
      option_b: 'Unordered List ใช้สร้างรายการแบบไม่มีลำดับ (ไม่เน้นลำดับก่อน-หลัง)',
      option_c: 'Universal Link ใช้สร้างลิงก์รวมหน้าเว็บ',
      option_d: 'Unified Layout ใช้จัดเลย์เอาต์หน้าจอ',
      correct_option: 'B',
      explanation: 'สไลด์ระบุว่า <ul> ย่อมาจาก Unordered List ใช้แสดงรายการที่ไม่เน้นลำดับก่อน-หลัง',
    },
    {
      lesson_id: 'html_06',
      question_number: 2,
      question_text: 'สัญลักษณ์เริ่มต้น (Bullet) ของรายการที่สร้างด้วยแท็ก <ul> บนเว็บเบราว์เซอร์จะแสดงผลเป็นแบบใดโดยอัตโนมัติ?',
      option_a: 'ตัวเลขอารบิก 1, 2, 3',
      option_b: 'จุดวงกลมสีดำ (Disc)',
      option_c: 'เครื่องหมายถูกสีเขียว',
      option_d: 'ตัวอักษรโรมัน I, II, III',
      correct_option: 'B',
      explanation: 'สไลด์ระบุว่าสัญลักษณ์เริ่มต้น Bullet จะแสดงผลลัพธ์เป็นจุดวงกลมสีดำ (Disc) หน้าแต่ละหัวข้อโดยอัตโนมัติ',
    },
    {
      lesson_id: 'html_06',
      question_number: 3,
      question_text: 'แท็ก <li> ย่อมาจากคำว่าอะไร และทำหน้าที่ใดในรายการ?',
      option_a: 'Line Item ใช้ขีดเส้นแบ่งรายการ',
      option_b: 'List Item ใช้ครอบแต่ละข้อความหรือหัวข้อย่อยในรายการ',
      option_c: 'Link Image ใช้ใส่ภาพในลิงก์',
      option_d: 'Level Indicator ใช้บอกระดับความยาก',
      correct_option: 'B',
      explanation: 'สไลด์ระบุว่า <li> ย่อมาจาก List Item ใช้ครอบแต่ละข้อความในรายการ ทั้งใน <ul> และ <ol>',
    },
    {
      lesson_id: 'html_06',
      question_number: 4,
      question_text: 'หากต้องการสร้างรายการที่มีลำดับขั้นตอน 1, 2, 3 ชัดเจน ต้องใช้แท็กครอบใดตามที่สไลด์สอน?',
      option_a: '<ol> (Ordered List)',
      option_b: '<ul> (Unordered List)',
      option_c: '<dl> (Description List)',
      option_d: '<table> (Table)',
      correct_option: 'A',
      explanation: 'สไลด์ระบุว่า <ol> ย่อมาจาก Ordered List ใช้สร้างรายการแบบมีลำดับ แสดงลำดับด้วยตัวเลขหรือตัวอักษรอย่างเป็นขั้นตอน',
    },
    {
      lesson_id: 'html_06',
      question_number: 5,
      question_text: 'หากต้องการให้รายการ <ol> เริ่มนับที่ลำดับหมายเลข 5 ต้องกำหนดแอตทริบิวต์ใดตามสไลด์?',
      option_a: 'begin="5"',
      option_b: 'count="5"',
      option_c: 'start="5"',
      option_d: 'number="5"',
      correct_option: 'C',
      explanation: 'สไลด์ระบุคุณสมบัติ start="5" เพื่อกำหนดให้เริ่มนับที่ลำดับ 5',
    },
    {
      lesson_id: 'html_06',
      question_number: 6,
      question_text: 'การสร้างรายการซ้อนรายการ (Nested Lists) มีรูปแบบการเขียนที่ถูกต้องอย่างไรตามสไลด์?',
      option_a: 'แทรกแท็ก <ul> หรือ <ol> ซ้อนไว้ภายในแท็ก <li> ของรายการหลัก',
      option_b: 'ซ้อนแท็ก <body> ซ้ำกันในหน้าเว็บ',
      option_c: 'ใส่เครื่องหมายดอกจัน * ซ้อนกัน 2 ตัว',
      option_d: 'ใช้แท็ก <nested> ครอบรายการทั้งหมด',
      correct_option: 'A',
      explanation: 'สไลด์หัวข้อ Hierarchy ระบุว่า การซ้อนแท็กทำได้โดยแทรกแท็ก <ul> หรือ <ol> ซ้อนไว้ภายในแท็ก <li> ของรายการหลัก เบราว์เซอร์จะเยื้องย่อหน้า (Indentation) ให้อัตโนมัติ',
    },
    {
      lesson_id: 'html_06',
      question_number: 7,
      question_text: 'ในโครงสร้างตาราง HTML แท็ก <tr> ย่อมาจากคำว่าอะไร และทำหน้าที่ใด?',
      option_a: 'Table Row ทำหน้าที่สร้างแถวของตารางในแนวนอน',
      option_b: 'Table Record ทำหน้าที่ลบข้อมูลในตาราง',
      option_c: 'Table Range ทำหน้าที่กำหนดขนาดตาราง',
      option_d: 'Table Rule ทำหน้าที่ใส่เส้นคั่นตาราง',
      correct_option: 'A',
      explanation: 'สไลด์ระบุว่า <tr> ย่อมาจาก Table Row ทำหน้าที่สร้างแถวของตารางในแนวนอน',
    },
    {
      lesson_id: 'html_06',
      question_number: 8,
      question_text: 'แท็ก <th> (Table Header) มีความแตกต่างจาก <td> (Table Data) อย่างไรในการแสดงผลเริ่มต้น?',
      option_a: 'ตัวอักษรใน <th> จะเป็นตัวเอียงและมีขนาดเล็กกว่า',
      option_b: 'ตัวอักษรใน <th> จะเป็นตัวหนาและจัดกึ่งกลาง (Bold & Center) โดยอัตโนมัติ',
      option_c: 'ช่อง <th> จะไม่แสดงเส้นขอบตาราง',
      option_d: 'ช่อง <th> ใช้สำหรับใส่ลิงก์เท่านั้น ไม่สามารถใส่ข้อความได้',
      correct_option: 'B',
      explanation: 'สไลด์ระบุว่า <th> (Table Header) คือช่องหัวข้อของตาราง ตัวอักษรจะเป็นตัวหนาและจัดกึ่งกลางโดยอัตโนมัติ',
    },
    {
      lesson_id: 'html_06',
      question_number: 9,
      question_text: 'หากต้องการรวมช่องตาราง 2 คอลัมน์เข้าด้วยกันในแนวนอน ต้องใช้ Attribute ใดตามสไลด์?',
      option_a: 'rowspan="2"',
      option_b: 'colspan="2" (Column Span)',
      option_c: 'cellspan="2"',
      option_d: 'merge="horizontal"',
      correct_option: 'B',
      explanation: 'สไลด์หัวข้อ Advanced Merging ระบุว่า colspan (Column Span) รวมช่องในแนวนอน เช่น <td colspan="2">ผสาน 2 คอลัมน์</td>',
    },
    {
      lesson_id: 'html_06',
      question_number: 10,
      question_text: 'แท็ก <thead>, <tbody> และ <tfoot> ถูกนำมาใช้ในการสร้างตารางเพื่อจุดประสงค์ใดตามสไลด์?',
      option_a: 'เป็นองค์ประกอบตารางเชิงความหมาย (Semantic Table) แบ่งส่วนหัว เนื้อหาหลัก และส่วนสรุปท้ายตารางอย่างเป็นระบบ',
      option_b: 'บังคับให้ตารางเปิดในแท็บใหม่เสมอ',
      option_c: 'ใช้แทนแท็ก <img> เพื่อแสดงภาพในตาราง',
      option_d: 'ใช้สำหรับใส่ฟอนต์ตัวพิมพ์ดีดในตารางเท่านั้น',
      correct_option: 'A',
      explanation: 'สไลด์ระบุว่า <thead> <tbody> <tfoot> คือองค์ประกอบตารางเชิงความหมาย (Semantic Table) เพื่อแบ่งส่วนหัว ส่วนเนื้อหาตาราง และส่วนท้ายตารางอย่างมีโครงสร้างชัดเจน',
    },
  ];

  console.log('Upserting 10 questions for html_06...');
  const { data: upsert06, error: qErr06 } = await supabase
    .from('quiz_questions')
    .upsert(questions06, { onConflict: 'lesson_id,question_number' })
    .select();
  console.log('html_06 questions upsert result:', { count: upsert06?.length, error: qErr06 });

  console.log('All seeding tasks for Lesson 5 and Lesson 6 completed successfully!');
}

seed().catch(console.error);
