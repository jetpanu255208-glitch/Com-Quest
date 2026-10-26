const fs = require('fs');
const path = require('path');

const pdfPath = path.join(__dirname, '..', 'PDF', 'บทที่ 1 โครงสร้างพื้นฐานของ HTML.pdf');
const buf = fs.readFileSync(pdfPath);
const outDir = path.join(__dirname, '..', 'public', 'slides', 'lesson_1');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('PDF buffer size:', buf.length);

// Find all /Filter /DCTDecode streams that are slide images (large JPEGs)
let pos = 0;
let jpegIndex = 0;

while (pos < buf.length) {
  // Find /Filter /DCTDecode or /Filter/DCTDecode
  const dctIndex = buf.indexOf(Buffer.from('/DCTDecode'), pos);
  if (dctIndex === -1) break;

  // Find next 'stream' keyword
  const streamKeyword = buf.indexOf(Buffer.from('stream'), dctIndex);
  if (streamKeyword === -1 || streamKeyword - dctIndex > 500) {
    pos = dctIndex + 10;
    continue;
  }

  // Determine where data starts (after \r\n or \n)
  let dataStart = streamKeyword + 6;
  if (buf[dataStart] === 0x0d && buf[dataStart + 1] === 0x0a) dataStart += 2;
  else if (buf[dataStart] === 0x0a || buf[dataStart] === 0x0d) dataStart += 1;

  // Find 'endstream'
  const endStream = buf.indexOf(Buffer.from('endstream'), dataStart);
  if (endStream === -1) break;

  const streamData = buf.subarray(dataStart, endStream);
  
  // Verify JPEG magic bytes 0xFF, 0xD8
  if (streamData[0] === 0xff && streamData[1] === 0xd8) {
    jpegIndex++;
    const outName = `slide_${jpegIndex}.jpg`;
    const outPath = path.join(outDir, outName);
    fs.writeFileSync(outPath, streamData);
    console.log(`Extracted JPEG ${jpegIndex}: size=${streamData.length} bytes -> ${outPath}`);
  }

  pos = endStream + 9;
}

console.log(`Total slide JPEGs extracted: ${jpegIndex}`);
