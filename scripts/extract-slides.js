const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function extractSlides() {
  const pdfDir = path.join(__dirname, '..', 'PDF');
  const files = fs.readdirSync(pdfDir);
  const targetPdf = files.find(f => f.endsWith('.pdf'));
  const fullPath = path.join(pdfDir, targetPdf);
  
  const slidesDir = path.join(pdfDir, 'slides');
  if (!fs.existsSync(slidesDir)) {
    fs.mkdirSync(slidesDir, { recursive: true });
  }

  const dataBuffer = fs.readFileSync(fullPath);
  const parser = new PDFParse({ data: dataBuffer });
  
  console.log('Loading PDF...');
  const info = await parser.getInfo();
  console.log('Total pages:', info?.total || info?.pages || 'unknown', info);
  
  // Extract screenshots for each page (1 to 10)
  for (let page = 1; page <= 10; page++) {
    try {
      console.log(`Extracting screenshot for page ${page}...`);
      const screenshot = await parser.getScreenshot({ page, scale: 1.0 });
      if (screenshot) {
        const outName = `slide_${page}.png`;
        const outFilePath = path.join(slidesDir, outName);
        fs.writeFileSync(outFilePath, screenshot);
        console.log(`Saved ${outFilePath} (${screenshot.length} bytes)`);
      }
    } catch (err) {
      console.error(`Error page ${page}:`, err.message);
    }
  }

  await parser.destroy();
  console.log('Done!');
}

extractSlides().catch(console.error);
