const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function exportSlideImages() {
  const pdfPath = path.join(__dirname, '..', 'PDF', 'บทที่ 1 โครงสร้างพื้นฐานของ HTML.pdf');
  const targetDir = path.join(__dirname, '..', 'public', 'slides', 'lesson_1');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const dataBuffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: dataBuffer });

  console.log('Rendering all 10 pages...');
  const result = await parser.getScreenshot();
  console.log('Result total pages:', result.pages.length);

  for (const page of result.pages) {
    const outPath = path.join(targetDir, `slide_${page.pageNumber}.png`);
    fs.writeFileSync(outPath, Buffer.from(page.data));
    console.log(`Saved slide ${page.pageNumber} -> ${outPath}`);
  }

  await parser.destroy();
  console.log('All slides saved successfully!');
}

exportSlideImages().catch(console.error);
