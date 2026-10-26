const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function extractAll() {
  const tasks = [
    { pdf: 'บทที่ 5 การแทรกรูปภาพและสื่อใน HTML.pptx.pdf', dir: 'lesson_5', textFile: 'บทที่ 5 การแทรกรูปภาพและสื่อใน HTML.pptx_text.txt' },
    { pdf: 'บทที่ 6 รายการและตารางข้อมูลใน HTML.pptx.pdf', dir: 'lesson_6', textFile: 'บทที่ 6 รายการและตารางข้อมูลใน HTML.pptx_text.txt' },
  ];

  for (const task of tasks) {
    const pdfPath = path.join(__dirname, '..', 'PDF', task.pdf);
    const outDir = path.join(__dirname, '..', 'public', 'slides', task.dir);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    console.log(`Processing ${task.pdf} -> ${task.dir}...`);
    const dataBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: dataBuffer });

    // Extract text
    const textResult = await parser.getText();
    const textDumpPath = path.join(__dirname, '..', 'PDF', task.textFile);
    fs.writeFileSync(textDumpPath, textResult?.text || '', 'utf8');
    console.log(`Saved text dump to ${task.textFile} (${(textResult?.text || '').length} chars)`);

    // Extract screenshots
    const screenshotResult = await parser.getScreenshot();
    console.log(`Found ${screenshotResult?.pages?.length} pages for ${task.dir}`);

    if (screenshotResult && screenshotResult.pages) {
      for (const page of screenshotResult.pages) {
        const outPath = path.join(outDir, `slide_${page.pageNumber}.png`);
        fs.writeFileSync(outPath, Buffer.from(page.data));
        console.log(`  Saved slide_${page.pageNumber}.png (${page.data.length} bytes)`);
      }
    }

    await parser.destroy();
  }
  console.log('Finished extracting slides and text for lesson 5 and lesson 6!');
}

extractAll().catch(console.error);
