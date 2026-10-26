const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function extractLesson2() {
  const pdfPath = path.join(__dirname, '..', 'PDF', 'บทที่ 2 หัวเรื่องและย่อหน้าข้อความ.pdf');
  const outDir = path.join(__dirname, '..', 'public', 'slides', 'lesson_2');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const buf = fs.readFileSync(pdfPath);
  console.log('PDF buffer size:', buf.length);

  // First try screenshot / render
  try {
    const parser = new PDFParse({ data: buf });
    console.log('Trying parser.getScreenshot()...');
    const result = await parser.getScreenshot();
    if (result && result.pages && result.pages.length > 0) {
      console.log('Found pages:', result.pages.length);
      for (const page of result.pages) {
        const outPath = path.join(outDir, `slide_${page.pageNumber}.png`);
        fs.writeFileSync(outPath, Buffer.from(page.data));
        console.log(`Saved slide_${page.pageNumber}.png`);
      }
      await parser.destroy();
      console.log('Screenshot extraction finished!');
      return;
    }
    await parser.destroy();
  } catch (err) {
    console.log('getScreenshot not supported or failed:', err.message);
  }

  // Fallback to DCTDecode stream search
  console.log('Searching for /DCTDecode JPEG streams...');
  let pos = 0;
  let jpegIndex = 0;

  while (pos < buf.length) {
    const dctIndex = buf.indexOf(Buffer.from('/DCTDecode'), pos);
    if (dctIndex === -1) break;

    const streamKeyword = buf.indexOf(Buffer.from('stream'), dctIndex);
    if (streamKeyword === -1 || streamKeyword - dctIndex > 500) {
      pos = dctIndex + 10;
      continue;
    }

    let dataStart = streamKeyword + 6;
    if (buf[dataStart] === 0x0d && buf[dataStart + 1] === 0x0a) dataStart += 2;
    else if (buf[dataStart] === 0x0a || buf[dataStart] === 0x0d) dataStart += 1;

    const endStream = buf.indexOf(Buffer.from('endstream'), dataStart);
    if (endStream === -1) break;

    const streamData = buf.subarray(dataStart, endStream);
    if (streamData[0] === 0xff && streamData[1] === 0xd8) {
      jpegIndex++;
      const outName = `slide_${jpegIndex}.jpg`;
      const outPath = path.join(outDir, outName);
      fs.writeFileSync(outPath, streamData);
      console.log(`Extracted ${outName}: size=${streamData.length} bytes`);
    }

    pos = endStream + 9;
  }

  console.log(`Total slide JPEGs extracted: ${jpegIndex}`);
}

extractLesson2().catch(console.error);
