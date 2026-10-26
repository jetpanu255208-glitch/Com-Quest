export interface MissionCriteria {
  id: string;
  label: string;
  description: string;
  check: (html: string) => boolean;
}

export interface LessonMission {
  lessonId: string;
  lessonNumber: number;
  title: string;
  subtitle: string;
  objective: string;
  instructions: string[];
  initialCode: string;
  solutionCode: string;
  solutionExplanation: string;
  criteria: MissionCriteria[];
  hint?: string;
}

export const LESSON_MISSIONS: Record<string, LessonMission> = {
  html_02: {
    lessonId: 'html_02',
    lessonNumber: 2,
    title: 'ภารกิจเขียนโค้ด: บัตรประจำตัวนักเรียนดิจิทัล',
    subtitle: 'ฝึกปฏิบัติการเขียนแท็กหัวเรื่อง (h1-h6) และย่อหน้าข้อความ (p, br)',
    objective: 'เขียนโค้ด HTML เพื่อแสดง "ชื่อของตนเอง" และ "รหัสประจำตัวนักเรียน 11 หลัก"',
    instructions: [
      'ใช้แท็กหัวข้อ (เช่น <h1> หรือ <h2>) เพื่อแสดงชื่อและนามสกุลของคุณ',
      'ใช้แท็กย่อหน้า (<p>) หรือแท็กที่เกี่ยวข้อง เพื่อแสดงรหัสประจำตัวนักเรียน 11 หลัก (เช่น 68219100010)',
      'ตรวจสอบผลลัพธ์ในหน้าต่างจำลองเว็บเบราว์เซอร์ทางฝั่งขวา',
      'หากผ่านครบทุกเงื่อนไข ปุ่มเข้าทำแบบทดสอบท้ายบท 10 ข้อจะปลดล็อกทันที!',
    ],
    initialCode: '',
    solutionCode: `<h1>เด็กชายไอที คนเก่ง</h1>
<p>รหัสประจำตัว: 68219100010</p>`,
    solutionExplanation:
      'ในบทที่ 2 เราได้เรียนรู้การใช้แท็ก <h1>-<h6> สำหรับกำหนดหัวข้อ และแท็ก <p> สำหรับย่อหน้าข้อความ โค้ดเฉลยนี้ใช้แท็ก <h1> ครอบชื่อนักเรียนเพื่อให้ตัวอักษรใหญ่และหนา และใช้แท็ก <p> แสดงรหัสประจำตัว 11 หลัก',
    hint: 'ลองเปลี่ยนข้อความใน <h1> เป็นชื่อจริงของคุณ และเปลี่ยนจุดไข่ปลาใน <p> เป็นตัวเลขรหัสประจำตัว 11 หลัก เช่น 68219100010',
    criteria: [
      {
        id: 'html-tags',
        label: 'ใช้แท็กหัวข้อ (h1-h6) หรือย่อหน้า (p)',
        description: 'โค้ดต้องมีแท็ก <h1>-<h6> หรือ <p> ตามหลักไวยากรณ์ HTML',
        check: (html: string) => {
          return /<(h[1-6]|p)[^>]*>[\s\S]*?<\/\1>/i.test(html);
        },
      },
      {
        id: 'student-id-11-digits',
        label: 'ระบุรหัสประจำตัวนักเรียน 11 หลัก',
        description: 'ต้องมีตัวเลขรหัสประจำตัวนักเรียน 11 หลักปรากฏอยู่ในโค้ด (เช่น 68219100010)',
        check: (html: string) => {
          // Look for 11 consecutive digits surrounded by non-digits
          return /(?<!\d)\d{11}(?!\d)/.test(html);
        },
      },
      {
        id: 'student-name',
        label: 'แสดงชื่อหรือข้อความระบุตัวตน',
        description: 'ต้องมีชื่อ-นามสกุล หรือข้อความระบุตัวตน (ความยาวอย่างน้อย 2 ตัวอักษรที่ไม่ใช่ตัวเลข)',
        check: (html: string) => {
          // Remove HTML tags, comments, and numbers, check if substantive name text remains
          const textOnly = html
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<[^>]*>/g, '')
            .replace(/\d+/g, '')
            .replace(/รหัสประจำตัว|ชื่อของคุณ|ชื่อ|name|student|id/gi, '')
            .trim();
          return textOnly.length >= 2;
        },
      },
    ],
  },
  html_03: {
    lessonId: 'html_03',
    lessonNumber: 3,
    title: 'ภารกิจเขียนโค้ด: ประกาศข้อความเน้นความสำคัญ',
    subtitle: 'ฝึกใช้แท็กตัวหนา (strong, b), ตัวเอียง (em, i) และการไฮไลต์ (mark)',
    objective: 'เขียนโค้ด HTML เพื่อสร้างประกาศที่มีข้อความตัวหนา, ข้อความตัวเอียง และข้อความไฮไลต์',
    instructions: [
      'ใช้แท็ก <strong> หรือ <b> เพื่อเน้นข้อความตัวหนา (เช่น คำเตือน หรือหัวข้อย่อยสำคัญ)',
      'ใช้แท็ก <em> หรือ <i> เพื่อทำข้อความตัวเอียง (เช่น คำศัพท์เฉพาะทาง หรือใส่น้ำหนักเน้นย้ำเสียง)',
      'ใช้แท็ก <mark> เพื่อสร้างแถบสีไฮไลต์ข้อความสำคัญ (เช่น กำหนดส่งงาน หรือคำค้นหา)',
      'ตรวจสอบผลลัพธ์ในหน้าต่างจำลองเว็บเบราว์เซอร์ทางขวา และกด "รันโค้ดและส่งภารกิจ"',
    ],
    initialCode: `<h2>ประกาศกิจกรรมวิชาคอมพิวเตอร์</h2>
<!-- 1. ใช้ <strong> หรือ <b> ทำข้อความตัวหนา -->
<!-- 2. ใช้ <em> หรือ <i> ทำข้อความตัวเอียง -->
<!-- 3. ใช้ <mark> ทำแถบสีไฮไลต์ข้อความสำคัญ -->
<p>
  
</p>`,
    solutionCode: `<h2>ประกาศกิจกรรมวิชาคอมพิวเตอร์</h2>
<p>
  <strong>คำเตือน:</strong> นักเรียนทุกคนต้องฝึกเขียนภาษา <em>HTML</em> และส่งงาน <mark>ภายในวันศุกร์นี้</mark>
</p>`,
    solutionExplanation:
      'ในบทที่ 3 เราได้เรียนรู้แท็กจัดรูปแบบข้อความ: <strong> หรือ <b> สำหรับตัวหนาเน้นความสำคัญ, <em> หรือ <i> สำหรับตัวเอียงเพื่อเน้นเสียงหรือคำเฉพาะ, และ <mark> สำหรับทำแถบสีไฮไลต์ข้อความสำคัญให้เห็นเด่นชัด',
    hint: 'ลองเขียนประโยคใน <p> โดยใส่ <strong>ข้อความ</strong>, <em>ข้อความ</em>, และ <mark>ข้อความ</mark> ให้ครบทั้ง 3 รูปแบบ',
    criteria: [
      {
        id: 'bold-tag',
        label: 'มีข้อความตัวหนา (<strong> หรือ <b>)',
        description: 'โค้ดต้องมีการใช้แท็ก <strong> หรือ <b> ครอบข้อความที่ไม่ว่างเปล่า',
        check: (html: string) => {
          const match = html.match(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/i);
          return !!match && match[2].trim().length > 0;
        },
      },
      {
        id: 'italic-tag',
        label: 'มีข้อความตัวเอียง (<em> หรือ <i>)',
        description: 'โค้ดต้องมีการใช้แท็ก <em> หรือ <i> ครอบข้อความที่ไม่ว่างเปล่า',
        check: (html: string) => {
          const match = html.match(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/i);
          return !!match && match[2].trim().length > 0;
        },
      },
      {
        id: 'mark-tag',
        label: 'มีข้อความไฮไลต์ (<mark>)',
        description: 'โค้ดต้องมีการใช้แท็ก <mark> เพื่อสร้างแถบสีไฮไลต์ข้อความสำคัญ',
        check: (html: string) => {
          const match = html.match(/<mark[^>]*>([\s\S]*?)<\/mark>/i);
          return !!match && match[1].trim().length > 0;
        },
      },
      {
        id: 'content-length',
        label: 'มีเนื้อหาข้อความสมบูรณ์',
        description: 'ต้องมีเนื้อหาข้อความบรรยายความยาวรวมไม่น้อยกว่า 10 ตัวอักษร',
        check: (html: string) => {
          const textOnly = html
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<[^>]*>/g, '')
            .trim();
          return textOnly.length >= 10;
        },
      },
    ],
  },
  html_04: {
    lessonId: 'html_04',
    lessonNumber: 4,
    title: 'ภารกิจเขียนโค้ด: นำทางสู่โลกกว้างด้วย Hyperlinks',
    subtitle: 'ฝึกสร้างจุดเชื่อมโยงแท็ก <a>, กำหนด href และ target="_blank"',
    objective: 'เขียนโค้ด HTML สร้างลิงก์เชื่อมโยงไปยังเว็บไซต์ภายนอกแบบเปิดแท็บใหม่ และลิงก์ภายในหน้าเว็บ',
    instructions: [
      'ใช้แท็ก <a> พร้อมกำหนด Attribute href="https://..." เพื่อเชื่อมโยงไปยังเว็บไซต์ภายนอก (เช่น Google หรือ Wikipedia)',
      'ใส่ Attribute target="_blank" ในลิงก์ภายนอกเพื่อให้เปิดในแท็บใหม่โดยไม่ปิดหน้าเดิม',
      'สร้างลิงก์ภายในเว็บไซต์ (Internal Link) โดยใช้ Relative URL (เช่น about.html หรือ contact.html)',
      'ระบุข้อความลิงก์ให้อ่านเข้าใจง่ายว่ากดแล้วจะไปที่ใด',
    ],
    initialCode: `<h3>ศูนย์รวมการเชื่อมโยงเว็บไซต์</h3>
<!-- 1. สร้างลิงก์ภายนอก (มี https:// พร้อม target="_blank") -->

<!-- 2. สร้างลิงก์ภายในหน้าเว็บ (เช่น about.html) -->
`,
    solutionCode: `<h3>ศูนย์รวมการเชื่อมโยงเว็บไซต์</h3>
<p>
  ค้นหาข้อมูลเพิ่มเติม: 
  <a href="https://www.google.com" target="_blank">ไปยัง Google</a>
</p>
<p>
  เกี่ยวกับผู้พัฒนา: 
  <a href="about.html">ข้อมูลเกี่ยวกับเรา</a>
</p>`,
    solutionExplanation:
      'ในบทที่ 4 เราได้เรียนรู้การสร้าง Hyperlink ด้วยแท็ก <a> โดยการเชื่อมโยงภายนอกใช้ Absolute URL (เช่น https://www.google.com) คู่กับ target="_blank" เพื่อเปิดแท็บใหม่ และการเชื่อมโยงภายในใช้ Relative URL (เช่น about.html) อ้างอิงไฟล์ในโฟลเดอร์เดียวกัน',
    hint: 'พิมพ์ <a href="https://www.google.com" target="_blank">ไปยัง Google</a> สำหรับลิงก์ภายนอก และ <a href="about.html">เกี่ยวกับเรา</a> สำหรับลิงก์ภายใน',
    criteria: [
      {
        id: 'external-link',
        label: 'สร้างลิงก์ภายนอกด้วย Absolute URL',
        description: 'ต้องมีแท็ก <a> ที่มี href ระบุ URL เต็มขึ้นต้นด้วย https:// หรือ http://',
        check: (html: string) => {
          return /<a\s+[^>]*href=["']https?:\/\/[^"']+["'][^>]*>/i.test(html);
        },
      },
      {
        id: 'target-blank',
        label: 'กำหนด target="_blank" ให้เปิดในแท็บใหม่',
        description: 'ต้องมี Attribute target="_blank" อยู่ในแท็กลิงก์ภายนอก',
        check: (html: string) => {
          return /<a\s+[^>]*target=["']_blank["'][^>]*>/i.test(html);
        },
      },
      {
        id: 'internal-link',
        label: 'สร้างลิงก์ภายในเว็บไซต์ (Relative URL)',
        description: 'ต้องมีแท็ก <a> ที่มี href ชี้ไปยังไฟล์ภายใน เช่น about.html, contact.html หรือ index.html',
        check: (html: string) => {
          // Matches href with .html file that is not http/https/mailto
          return /<a\s+[^>]*href=["'](?!(https?:|mailto:|#))[^"']+\.html["'][^>]*>/i.test(html);
        },
      },
      {
        id: 'link-text',
        label: 'มีข้อความระบุชื่อลิงก์ชัดเจน',
        description: 'แท็กลิงก์ <a> ต้องมีข้อความคลิกได้อยู่ภายในแท็ก',
        check: (html: string) => {
          const matches = [...html.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)];
          if (matches.length === 0) return false;
          return matches.some((m) => m[1].replace(/<[^>]*>/g, '').trim().length >= 2);
        },
      },
    ],
  },
  html_05: {
    lessonId: 'html_05',
    lessonNumber: 5,
    title: 'ภารกิจเขียนโค้ด: การแทรกรูปภาพและกำหนดขนาดอย่างถูกต้อง',
    subtitle: 'ฝึกใช้แท็ก <img> กำหนด src, alt และควบคุมขนาดด้วย width / height',
    objective: 'เขียนโค้ด HTML แทรกรูปภาพโดยใช้แท็ก <img> พร้อมกำหนด Attribute src, alt และระบุขนาดความกว้าง width หรือ height ให้ถูกต้องตามมาตรฐาน',
    instructions: [
      'ใช้แท็ก <img> ซึ่งเป็น Void Element (ไม่ต้องมีแท็กปิด </img>)',
      'กำหนด Attribute src เพื่อระบุตำแหน่งของไฟล์ภาพ (เช่น "photo.jpg" หรือ URL รูปภาพ)',
      'กำหนด Attribute alt เพื่อใส่ข้อความอธิบายภาพ สำหรับ Accessibility และ SEO',
      'กำหนด Attribute width หรือ height (เช่น width="300") เพื่อควบคุมขนาดภาพไม่ให้ล้นหน้าจอ',
      'ตรวจสอบผลลัพธ์ในหน้าต่างจำลองทางขวา และกด "รันโค้ดและส่งภารกิจ"',
    ],
    initialCode: `<h2>แกลเลอรีรูปภาพของฉัน</h2>
<!-- 1. ใช้แท็ก <img> แทรกรูปภาพ -->
<!-- 2. ระบุ src สำหรับที่อยู่ไฟล์ภาพ -->
<!-- 3. ใส่คำอธิบายภาพใน Attribute alt -->
<!-- 4. กำหนดความกว้าง width หรือ height -->

`,
    solutionCode: `<h2>แกลเลอรีรูปภาพของฉัน</h2>
<img src="photo.jpg" alt="รูปภาพวิวธรรมชาติแสนสวย" width="300">`,
    solutionExplanation:
      'ในบทที่ 5 เราได้เรียนรู้การใช้แท็ก <img> ซึ่งเป็น Void Element (แท็กเดี่ยวไม่มีแท็กปิด) โดยต้องระบุ src สำหรับระบุเส้นทางไฟล์ภาพ, ระบุ alt สำหรับใส่ข้อความอธิบายภาพเมื่อภาพไม่แสดงผลหรือสำหรับ Screen Reader, และระบุ width หรือ height เพื่อควบคุมขนาดภาพให้เหมาะสมกับหน้าเว็บ',
    hint: 'เขียนแท็กในรูปแบบ <img src="photo.jpg" alt="รูปภาพแนะนำ" width="300"> โดยไม่ต้องใส่แท็กปิด </img>',
    criteria: [
      {
        id: 'has-img-tag',
        label: 'มีแท็กรูปภาพ <img>',
        description: 'โค้ดต้องมีการใช้แท็ก <img> เพื่อแสดงผลรูปภาพ',
        check: (html: string) => {
          return /<img\s+[^>]*>/i.test(html);
        },
      },
      {
        id: 'has-src',
        label: 'ระบุ Attribute src อย่างถูกต้อง',
        description: 'แท็ก <img> ต้องมี Attribute src ระบุเส้นทางหรือ URL ของภาพที่ไม่ว่างเปล่า',
        check: (html: string) => {
          return /<img\s+[^>]*src=["'][^"'\s]+["'][^>]*>/i.test(html);
        },
      },
      {
        id: 'has-alt',
        label: 'มีคำอธิบายภาพใน Attribute alt',
        description: 'แท็ก <img> ต้องมี Attribute alt อธิบายความหมายของภาพ (ไม่ปล่อยว่าง)',
        check: (html: string) => {
          const altMatch = html.match(/<img\s+[^>]*alt=["']([^"']+)["'][^>]*>/i);
          return !!altMatch && altMatch[1].trim().length >= 2;
        },
      },
      {
        id: 'has-dimension',
        label: 'กำหนดขนาดภาพ (width หรือ height)',
        description: 'แท็ก <img> ต้องมีการกำหนดขนาดด้วย Attribute width หรือ height หรือ style',
        check: (html: string) => {
          return /<img\s+[^>]*(width|height|style)=["'][^"']+["'][^>]*>/i.test(html);
        },
      },
    ],
  },
  html_06: {
    lessonId: 'html_06',
    lessonNumber: 6,
    title: 'ภารกิจเขียนโค้ด: การจัดทำรายการและตารางข้อมูล',
    subtitle: 'ฝึกสร้างรายการ (ul / ol) และโครงสร้างตารางข้อมูล (table, tr, th, td)',
    objective: 'เขียนโค้ด HTML เพื่อสร้างรายการหัวข้อ (ul หรือ ol) และสร้างตารางข้อมูลที่มีแถวหัวข้อ (th) และข้อมูล (td)',
    instructions: [
      'สร้างรายการแบบไม่มีลำดับ (<ul>) หรือมีลำดับ (<ol>) พร้อมใส่หัวข้อย่อยด้วยแท็ก <li> อย่างน้อย 2 รายการ',
      'สร้างตารางข้อมูลด้วยแท็ก <table> พร้อมกำหนดขอบตาราง (เช่น border="1")',
      'ใช้แท็ก <tr> สำหรับสร้างแถวของตาราง',
      'ใช้แท็ก <th> สำหรับหัวข้อตาราง (Table Header)',
      'ใช้แท็ก <td> สำหรับช่องข้อมูลทั่วไปในตาราง (Table Data)',
    ],
    initialCode: `<h3>สรุปข้อมูลคะแนนกิจกรรม</h3>
<!-- 1. สร้างรายการหัวข้อด้วย <ul> หรือ <ol> พร้อม <li> -->

<!-- 2. สร้างตาราง <table> พร้อม <tr>, <th>, <td> -->

`,
    solutionCode: `<h3>สรุปข้อมูลคะแนนกิจกรรม</h3>
<ul>
  <li>วิชาการเขียนภาษา HTML เบื้องต้น</li>
  <li>การทดสอบความรู้ท้ายบทเรียน</li>
</ul>

<table border="1">
  <tr>
    <th>ชื่อผู้เรียน</th>
    <th>คะแนน</th>
  </tr>
  <tr>
    <td>สมชาย</td>
    <td>95</td>
  </tr>
</table>`,
    solutionExplanation:
      'ในบทที่ 6 เราได้เรียนรู้การจัดโครงสร้างข้อมูลด้วยรายการ <ul> (Unordered List) หรือ <ol> (Ordered List) ร่วมกับ <li> สำหรับแต่ละข้อ และการสร้างตารางข้อมูลด้วยแท็กหลัก <table> ประกอบด้วย <tr> (แถวตาราง), <th> (หัวข้อตาราง จัดกึ่งกลางและตัวหนา), และ <td> (ข้อมูลในตาราง)',
    hint: 'เริ่มต้นด้วย <ul><li>รายการที่ 1</li><li>รายการที่ 2</li></ul> จากนั้นสร้างตาราง <table border="1"><tr><th>หัวข้อ</th></tr><tr><td>ข้อมูล</td></tr></table>',
    criteria: [
      {
        id: 'has-list',
        label: 'สร้างรายการด้วย <ul> หรือ <ol> พร้อมแท็ก <li>',
        description: 'ต้องมีแท็ก <ul> หรือ <ol> และมีแท็ก <li> ครอบข้อความอย่างน้อย 2 รายการ',
        check: (html: string) => {
          const hasListTag = /<(ul|ol)[^>]*>[\s\S]*?<\/\1>/i.test(html);
          const liMatches = html.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || [];
          return hasListTag && liMatches.length >= 2;
        },
      },
      {
        id: 'has-table',
        label: 'สร้างโครงสร้างตารางด้วย <table> และ <tr>',
        description: 'ต้องมีแท็ก <table> ครอบแถวตาราง <tr> อย่างน้อย 1 แถว',
        check: (html: string) => {
          return /<table[^>]*>[\s\S]*?<tr[^>]*>[\s\S]*?<\/tr>[\s\S]*?<\/table>/i.test(html);
        },
      },
      {
        id: 'has-th',
        label: 'มีช่องหัวข้อตาราง (<th>)',
        description: 'ตารางต้องมีแท็ก <th> สำหรับระบุหัวข้อของคอลัมน์',
        check: (html: string) => {
          return /<th[^>]*>[\s\S]*?<\/th>/i.test(html);
        },
      },
      {
        id: 'has-td',
        label: 'มีช่องข้อมูลตาราง (<td>)',
        description: 'ตารางต้องมีแท็ก <td> สำหรับบรรจุข้อมูลในแถว',
        check: (html: string) => {
          return /<td[^>]*>[\s\S]*?<\/td>/i.test(html);
        },
      },
    ],
  },
  html_07: {
    lessonId: 'html_07',
    lessonNumber: 7,
    title: 'ภารกิจเขียนโค้ด: แบบฟอร์มลงทะเบียนรับข้อมูลผู้ใช้',
    subtitle: 'ฝึกสร้างฟอร์ม <form>, ช่องกรอกข้อมูล <input>, <label> และปุ่มส่งข้อมูล <button>',
    objective: 'เขียนโค้ด HTML เพื่อสร้างแบบฟอร์มที่มีแท็ก <form>, ช่องกรอกข้อความ <input type="text"> พร้อม <label>, ช่องกรอกอีเมล <input type="email"> และปุ่มกดส่งข้อมูล <button type="submit">',
    instructions: [
      'สร้างแท็ก <form> ครอบองค์ประกอบแบบฟอร์มทั้งหมด พร้อมระบุ method="POST"',
      'สร้างช่องกรอกชื่อ <input type="text"> พร้อมใส่ Attribute placeholder หรือ required',
      'ใช้แท็ก <label> กำหนดข้อความบอกผู้ใช้ว่าช่องนี้ให้กรอกอะไร',
      'สร้างช่องกรอกอีเมล <input type="email"> เพื่อตรวจสอบรูปแบบอีเมล',
      'สร้างปุ่มส่งข้อมูล <button type="submit">ส่งข้อมูล</button>',
    ],
    initialCode: `<h3>แบบฟอร์มลงทะเบียนกิลด์ Com Quest</h3>
<!-- 1. ใช้แท็ก <form method="POST"> ครอบทั้งหมด -->
<!-- 2. ใส่ <label> และ <input type="text"> สำหรับชื่อผู้ใช้ -->
<!-- 3. ใส่ <input type="email"> สำหรับอีเมล -->
<!-- 4. ใส่ <button type="submit"> สำหรับส่งข้อมูล -->

`,
    solutionCode: `<h3>แบบฟอร์มลงทะเบียนกิลด์ Com Quest</h3>
<form action="/register" method="POST">
  <div>
    <label for="username">ชื่อผู้ใช้:</label>
    <input type="text" id="username" name="username" placeholder="กรอกชื่อผู้ใช้" required>
  </div>
  <div>
    <label for="email">อีเมล:</label>
    <input type="email" id="email" name="email" placeholder="example@mail.com" required>
  </div>
  <button type="submit">ส่งข้อมูล</button>
</form>`,
    solutionExplanation:
      'ในบทที่ 7 เราได้เรียนรู้การสร้างแบบฟอร์มด้วยแท็ก <form> ร่วมกับแอตทริบิวต์ method="POST" สำหรับส่งข้อมูลสำคัญ, การใช้แท็ก <input> ชนิด text และ email, การใช้ <label> เพื่อเพิ่มการเข้าถึงและ UX ที่ดี, ตลอดจนปุ่ม <button type="submit"> เพื่อส่งข้อมูลไปยังเซิร์ฟเวอร์',
    hint: 'เขียน <form method="POST"> ภายในใส่ <label>ชื่อผู้ใช้:</label> <input type="text" required> ต่อด้วย <input type="email" required> และปิดท้ายด้วย <button type="submit">ส่งข้อมูล</button> </form>',
    criteria: [
      {
        id: 'has-form-tag',
        label: 'มีแท็กแบบฟอร์ม <form>',
        description: 'โค้ดต้องมีการใช้แท็ก <form> ครอบช่องรับข้อมูลทั้งหมด',
        check: (html: string) => {
          return /<form[^>]*>[\s\S]*?<\/form>/i.test(html);
        },
      },
      {
        id: 'has-input-text',
        label: 'มีช่องกรอกข้อความ <input type="text">',
        description: 'ต้องมีแท็ก <input> ที่ระบุ type="text"',
        check: (html: string) => {
          return /<input\s+[^>]*type=["']text["'][^>]*>/i.test(html);
        },
      },
      {
        id: 'has-label',
        label: 'มีแท็กกำกับชื่อข้อมูล <label>',
        description: 'ต้องมีแท็ก <label> สำหรับกำกับชื่อช่องกรอกข้อมูล',
        check: (html: string) => {
          const match = html.match(/<label[^>]*>([\s\S]*?)<\/label>/i);
          return !!match && match[1].trim().length > 0;
        },
      },
      {
        id: 'has-input-email',
        label: 'มีช่องกรอกอีเมล <input type="email">',
        description: 'ต้องมีแท็ก <input> ที่ระบุ type="email"',
        check: (html: string) => {
          return /<input\s+[^>]*type=["']email["'][^>]*>/i.test(html);
        },
      },
      {
        id: 'has-submit-btn',
        label: 'มีปุ่มส่งข้อมูล (Submit Button)',
        description: 'ต้องมีปุ่ม <button type="submit"> หรือ <input type="submit"> สำหรับส่งข้อมูล',
        check: (html: string) => {
          return (
            /<button\s+[^>]*type=["']submit["'][^>]*>/i.test(html) ||
            /<input\s+[^>]*type=["']submit["'][^>]*>/i.test(html)
          );
        },
      },
    ],
  },
  html_08: {
    lessonId: 'html_08',
    lessonNumber: 8,
    title: 'ภารกิจเขียนโค้ด: จัดโครงร่างหน้าเว็บด้วย Semantic HTML5',
    subtitle: 'ฝึกจัดโครงสร้างหน้าเว็บด้วยแท็ก <header>, <nav>, <main>, <section> และ <footer>',
    objective: 'เขียนโค้ด HTML5 เชิงความหมายเพื่อสร้างโครงร่างหน้าเว็บที่สมบูรณ์ โดยใช้แท็ก <header>, <nav>, <main> (ครอบ <section> หรือ <article>) และ <footer> ตามมาตรฐานสากล',
    instructions: [
      'ใช้แท็ก <header> ครอบส่วนหัวของเว็บไซต์ พร้อมใส่หัวเรื่อง <h1>',
      'ใช้แท็ก <nav> ครอบเมนูนำทาง พร้อมใส่ลิงก์ <a> อย่างน้อย 2 ลิงก์',
      'ใช้แท็ก <main> สำหรับพื้นที่เนื้อหาหลักของหน้าเว็บ (มีได้ 1 แท็กต่อหน้า)',
      'ภายใน <main> ให้ใช้แท็ก <section> หรือ <article> สำหรับแบ่งกลุ่มเนื้อหาหรือบทความ',
      'ใช้แท็ก <footer> สำหรับส่วนท้ายของเว็บ พร้อมระบุข้อความลิขสิทธิ์หรือข้อมูลติดต่อ',
    ],
    initialCode: `<!-- 1. ส่วนหัวเว็บไซต์ <header> -->

<!-- 2. เมนูนำทาง <nav> -->

<!-- 3. เนื้อหาหลัก <main> พร้อม <section> หรือ <article> -->

<!-- 4. ส่วนท้ายเว็บไซต์ <footer> -->

`,
    solutionCode: `<header>
  <h1>Com Quest Portal</h1>
</header>
<nav>
  <a href="#home">หน้าแรก</a> | <a href="#lessons">บทเรียน</a>
</nav>
<main>
  <section>
    <h2>ยินดีต้อนรับสู่โลกของ HTML5</h2>
    <p>เรียนรู้การสร้างโครงสร้างเว็บเชิงความหมายที่ถูกต้อง</p>
  </section>
</main>
<footer>
  <p>&copy; 2026 Com Quest. All rights reserved.</p>
</footer>`,
    solutionExplanation:
      'ในบทที่ 8 เราได้เรียนรู้การจัดโครงสร้างหน้าเว็บสมัยใหม่ด้วย Semantic Tags: <header> สำหรับส่วนหัว, <nav> สำหรับเมนูนำทางหลัก, <main> สำหรับเนื้อหาหลักที่มีได้เพียง 1 แท็กต่อหน้า (ภายในแบ่งเป็น <section> หรือ <article>), และ <footer> สำหรับส่วนท้ายของเอกสาร ซึ่งช่วยเพิ่มประสิทธิภาพ SEO และ Accessibility อย่างมาก',
    hint: 'เขียนโครงสร้างตามลำดับ: <header><h1>หัวข้อ</h1></header> ตามด้วย <nav><a href="#">ลิงก์ 1</a> <a href="#">ลิงก์ 2</a></nav> ตามด้วย <main><section><h2>เนื้อหา</h2></section></main> และปิดท้ายด้วย <footer><p>ลิขสิทธิ์</p></footer>',
    criteria: [
      {
        id: 'has-header',
        label: 'มีแท็กส่วนหัว <header>',
        description: 'ต้องมีแท็ก <header> ครอบส่วนหัวของเอกสารหรือเว็บไซต์',
        check: (html: string) => {
          return /<header[^>]*>[\s\S]*?<\/header>/i.test(html);
        },
      },
      {
        id: 'has-nav',
        label: 'มีแท็กเมนูนำทาง <nav> พร้อมลิงก์',
        description: 'ต้องมีแท็ก <nav> ครอบลิงก์ <a> อย่างน้อย 2 จุด',
        check: (html: string) => {
          const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
          if (!navMatch) return false;
          const aCount = (navMatch[1].match(/<a[^>]*>[\s\S]*?<\/a>/gi) || []).length;
          return aCount >= 2;
        },
      },
      {
        id: 'has-main',
        label: 'มีแท็กเนื้อหาหลัก <main>',
        description: 'ต้องมีแท็ก <main> ครอบพื้นที่เนื้อหาหลักของหน้าเว็บ',
        check: (html: string) => {
          return /<main[^>]*>[\s\S]*?<\/main>/i.test(html);
        },
      },
      {
        id: 'has-section-or-article',
        label: 'มีแท็กจัดกลุ่มเนื้อหา (<section> หรือ <article>)',
        description: 'ต้องมีแท็ก <section> หรือ <article> ครอบเนื้อหาหรือบทความ',
        check: (html: string) => {
          return /<(section|article)[^>]*>[\s\S]*?<\/\1>/i.test(html);
        },
      },
      {
        id: 'has-footer',
        label: 'มีแท็กส่วนท้ายเอกสาร <footer>',
        description: 'ต้องมีแท็ก <footer> สำหรับแสดงข้อมูลท้ายหน้าเว็บ',
        check: (html: string) => {
          return /<footer[^>]*>[\s\S]*?<\/footer>/i.test(html);
        },
      },
    ],
  },
};

export function getLessonMission(lessonId: string): LessonMission | null {
  return LESSON_MISSIONS[lessonId] || null;
}
