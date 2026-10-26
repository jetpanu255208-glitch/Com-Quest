const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function extractAll() {
  const tasks = [
    { pdf: 'บทที่ 3 การจัดรูปแบบข้อความ HTML.pptx.pdf', dir: 'lesson_3' },
    { pdf: 'บทที่ 4 ลิงก์และการเชื่อมโยงเว็บ HTML.pptx.pdf', dir: 'lesson_4' },
  ];

  for (const task of tasks) {
    const pdfPath = path.join(__dirname, '..', 'PDF', task.pdf);
    const outDir = path.join(__dirname, '..', 'public', 'slides', task.dir);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    console.log(`Extracting ${task.pdf} -> ${task.dir}...`);
    const dataBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: dataBuffer });

    const result = await parser.getScreenshot();
    console.log(`Found ${result?.pages?.length} pages for ${task.dir}`);

    if (result && result.pages) {
      for (const page of result.pages) {
        const outPath = path.join(outDir, `slide_${page.pageNumber}.png`);
        fs.writeFileSync(outPath, Buffer.from(page.data));
        console.log(`  Saved slide_${page.pageNumber}.png (${page.data.length} bytes)`);
      }
    }

    await parser.destroy();
  }
  console.log('Finished extracting slides for lesson 3 and lesson 4!');
}

extractAll().catch(console.error);
