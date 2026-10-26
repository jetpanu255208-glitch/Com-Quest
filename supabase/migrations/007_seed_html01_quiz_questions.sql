-- ==============================================================================
-- COM QUEST: Insert 10 Questions for Lesson 1 (html_01)
-- คัดลอกคำสั่งด้านล่างนี้ไปวางและกด Run ใน Supabase SQL Editor เพื่อสร้างข้อสอบ 10 ข้อทันที
-- ==============================================================================

INSERT INTO public.quiz_questions (
    lesson_id, question_number, question_text, 
    option_a, option_b, option_c, option_d, 
    correct_option, explanation
)
VALUES
    (
        'html_01', 1, 
        'ตัวย่อของคำว่า HTML ย่อมาจากข้อความในข้อใด?',
        'Hyperlinks and Text Markup Language',
        'HyperText Markup Language',
        'Home Tool Markup Language',
        'High Tech Modern Language',
        'B',
        'HTML ย่อมาจาก HyperText Markup Language เป็นภาษามาตรฐานสากลที่ใช้ในการสร้างและกำหนดโครงสร้างของเว็บเพจ'
    ),
    (
        'html_01', 2, 
        'คำสั่ง <!DOCTYPE html> ที่อยู่บรรทัดบนสุดของเอกสาร มีหน้าที่สำคัญอย่างไร?',
        'ประกาศประเภทเอกสารให้เบราว์เซอร์ทราบว่าเขียนด้วยมาตรฐาน HTML5',
        'เชื่อมโยงฐานข้อมูลภายนอกเข้ากับหน้าเว็บ',
        'กำหนดสีพื้นหลังและฟอนต์เริ่มต้น',
        'สร้างหัวข้อเรื่องขนาดใหญ่ที่สุดบนหน้าจอ',
        'A',
        '<!DOCTYPE html> คือ Document Type Declaration มีหน้าที่บอกให้เว็บเบราว์เซอร์ทราบว่าเอกสารนี้เป็นเวอร์ชัน HTML5 เพื่อให้ประมวลผลได้อย่างถูกต้อง'
    ),
    (
        'html_01', 3, 
        'แท็กใดเป็น Root Element (รากของเอกสาร) ที่ครอบคลุมเนื้อหาทั้งหมดของหน้าเว็บ?',
        '<head>',
        '<body>',
        '<html>',
        '<main>',
        'C',
        '<html> เป็นแท็กหลักระดับบนสุด (Root Element) ที่ต้องครอบคลุมแท็กและเนื้อหาทั้งหมดในหน้าเว็บเพจ'
    ),
    (
        'html_01', 4, 
        'ส่วนประกอบใดของ HTML ที่ใช้เก็บข้อมูลอธิบาย (Metadata) และชื่อเว็บ โดยไม่แสดงผลบนหน้าจอแสดงผลหลัก?',
        '<head>',
        '<body>',
        '<header>',
        '<div>',
        'A',
        'ส่วน <head> ใช้บรรจุข้อมูลส่วนหัวและ Metadata ของเอกสาร เช่น <title>, <meta charset="UTF-8"> ซึ่งผู้ใช้จะไม่เห็นบนหน้าเว็บเพจโดยตรง'
    ),
    (
        'html_01', 5, 
        'แท็ก <title> ต้องเขียนอยู่ภายใต้แท็กใด และแสดงผลที่ตำแหน่งใดของเบราว์เซอร์?',
        'เขียนใน <head> และแสดงบนแถบแท็บ (Tab) ของเบราว์เซอร์',
        'เขียนใน <body> และแสดงกึ่งกลางหน้าจอ',
        'เขียนนอก <html> และแสดงบนแถบ URL',
        'เขียนใน <footer> และแสดงมุมซ้ายล่าง',
        'A',
        'แท็ก <title> ต้องอยู่ภายในส่วน <head> เสมอ เพื่อใช้กำหนดชื่อเรื่องของหน้าเว็บที่แสดงบน Title Bar หรือแถบแท็บ (Tab) ของเว็บเบราว์เซอร์'
    ),
    (
        'html_01', 6, 
        'ข้อความ รูปภาพ ลิงก์ หรือส่วนประกอบที่ต้องการให้ผู้ใช้งานมองเห็นบนหน้าเว็บ ต้องเขียนไว้ในแท็กใด?',
        '<head>',
        '<body>',
        '<title>',
        '<!DOCTYPE>',
        'B',
        'เนื้อหา รูปภาพ วิดีโอ และข้อความทั้งหมดที่ต้องการให้ผู้ใช้งานมองเห็นและมีปฏิสัมพันธ์ด้วย จะต้องเขียนอยู่ภายในส่วน <body>'
    ),
    (
        'html_01', 7, 
        'โครงสร้างแท็กส่วนใหญ่ในภาษา HTML มักประกอบด้วยลักษณะใด?',
        'แท็กเดี่ยวเสมอ ไม่มีการปิด',
        'แท็กคู่ ประกอบด้วยแท็กเปิด <tag> และแท็กปิด </tag>',
        'ใช้วงเล็บปีกกา {tag} และไม่ต้องปิด',
        'เขียนเป็นข้อความธรรมดาโดยเว้นวรรค',
        'B',
        'แท็กส่วนใหญ่ใน HTML เป็นแท็กคู่ที่มีแท็กเปิด (Opening Tag) และแท็กปิด (Closing Tag) ที่มีเครื่องหมายสแลช เช่น <p>ข้อความ</p>'
    ),
    (
        'html_01', 8, 
        'ข้อใดเป็นแท็กเดี่ยว (Empty Element / Self-closing) ที่ไม่ต้องมีแท็กปิด </...>?',
        '<p>',
        '<h1>',
        '<br>',
        '<div>',
        'C',
        'แท็ก <br> (ขึ้นบรรทัดใหม่) และ <img> เป็นแท็กเดี่ยว (Empty Element) ที่ไม่มีเนื้อหาภายใน จึงไม่จำเป็นต้องมีแท็กปิดคู่กัน'
    ),
    (
        'html_01', 9, 
        'แอตทริบิวต์ (Attribute) เช่น lang="th" ในแท็ก <html lang="th"> มีหน้าที่อะไรและเขียนที่ตำแหน่งใด?',
        'ระบุคุณลักษณะหรือข้อมูลเพิ่มเติม โดยเขียนไว้ภายในแท็กเปิด',
        'ระบุรหัสผ่านระบบ โดยเขียนไว้ในแท็กปิด',
        'แสดงผลตัวหนา โดยเขียนไว้นอกแท็ก',
        'สั่งให้หน้าเว็บรีเฟรชตนเอง',
        'A',
        'แอตทริบิวต์ (Attribute) ทำหน้าที่กำหนดคุณลักษณะเพิ่มเติมของแท็ก โดยจะต้องเขียนอยู่ภายในแท็กเปิดเสมอในรูปแบบ name="value"'
    ),
    (
        'html_01', 10, 
        'ลำดับโครงสร้างเอกสาร HTML พื้นฐานที่ถูกต้องที่สุด เรียงลำดับตามข้อใด?',
        '<!DOCTYPE html> -> <html> -> <head> -> <body> -> </html>',
        '<body> -> <head> -> <html> -> <!DOCTYPE html>',
        '<html> -> <body> -> <head> -> <!DOCTYPE html>',
        '<head> -> <body> -> <!DOCTYPE html> -> <html>',
        'A',
        'ลำดับโครงสร้างมาตรฐานสากลคือ: 1. <!DOCTYPE html> 2. <html> 3. <head> 4. <body> และปิดท้ายด้วย </html>'
    )
ON CONFLICT (lesson_id, question_number) DO UPDATE SET
    question_text = EXCLUDED.question_text,
    option_a = EXCLUDED.option_a,
    option_b = EXCLUDED.option_b,
    option_c = EXCLUDED.option_c,
    option_d = EXCLUDED.option_d,
    correct_option = EXCLUDED.correct_option,
    explanation = EXCLUDED.explanation,
    updated_at = NOW();

-- ยืนยันว่าตาราง lessons เปิดให้ทำแบบทดสอบและเผยแพร่
UPDATE public.lessons
SET is_published = TRUE, quiz_enabled = TRUE
WHERE id = 'html_01';

-- ตรวจสอบผลลัพธ์
SELECT lesson_id, question_number, question_text, correct_option 
FROM public.quiz_questions 
WHERE lesson_id = 'html_01'
ORDER BY question_number ASC;
