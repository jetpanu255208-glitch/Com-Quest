const fs = require('fs');
const path = require('path');

const buf = fs.readFileSync(path.join(__dirname, '..', 'PDF', 'บทที่ 1 โครงสร้างพื้นฐานของ HTML.pdf'));
const outDir = path.join(__dirname, '..', 'public', 'slides', 'lesson_1');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Target object numbers: 103, 273, 285, 305, 326, 353, 374, 394, 416, 433
const targetObjs = [103, 273, 285, 305, 326, 353, 374, 394, 416, 433];

targetObjs.forEach((objNum, idx) => {
  const headerStr = `${objNum} 0 obj`;
  const headerIdx = buf.indexOf(Buffer.from(headerStr));
  if (headerIdx === -1) {
    console.log(`Could not find ${headerStr}`);
    return;
  }

  // Find 'stream' after header
  const streamIdx = buf.indexOf(Buffer.from('stream'), headerIdx);
  let dataStart = streamIdx + 6;
  if (buf[dataStart] === 0x0d && buf[dataStart + 1] === 0x0a) dataStart += 2;
  else if (buf[dataStart] === 0x0a || buf[dataStart] === 0x0d) dataStart += 1;

  // Find 'endstream'
  const endStreamIdx = buf.indexOf(Buffer.from('endstream'), dataStart);
  const jpegBuf = buf.subarray(dataStart, endStreamIdx);

  const slideFile = path.join(outDir, `slide_${idx + 1}.jpg`);
  fs.writeFileSync(slideFile, jpegBuf);
  console.log(`Saved Slide ${idx + 1} (Obj ${objNum}): size=${jpegBuf.length} bytes -> ${slideFile}`);
  console.log(`Header bytes: ${jpegBuf.subarray(0, 4).toString('hex')}`);
});
