const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const pdfPath = path.join(__dirname, '..', 'PDF', 'บทที่ 1 โครงสร้างพื้นฐานของ HTML.pdf');
const buf = fs.readFileSync(pdfPath);

console.log('PDF size:', buf.length);

// Find all stream ... endstream blocks
let offset = 0;
let streamIndex = 0;
let allExtractedText = [];

while (offset < buf.length) {
  const streamStart = buf.indexOf(Buffer.from('stream'), offset);
  if (streamStart === -1) break;
  
  // Find newline after 'stream'
  let dataStart = streamStart + 6;
  if (buf[dataStart] === 0x0d && buf[dataStart + 1] === 0x0a) dataStart += 2;
  else if (buf[dataStart] === 0x0a || buf[dataStart] === 0x0d) dataStart += 1;

  const streamEnd = buf.indexOf(Buffer.from('endstream'), dataStart);
  if (streamEnd === -1) break;

  const streamData = buf.subarray(dataStart, streamEnd);
  streamIndex++;

  try {
    const uncompressed = zlib.inflateSync(streamData);
    const textStr = uncompressed.toString('utf-8');
    
    // Look for text operators like Tj, TJ
    if (textStr.includes('Tj') || textStr.includes('TJ') || textStr.includes('BT')) {
      allExtractedText.push(`\n--- Stream ${streamIndex} (size ${uncompressed.length}) ---\n` + textStr);
    }
  } catch (e) {
    // Not zlib or deflate error
  }

  offset = streamEnd + 9;
}

console.log(`Found ${allExtractedText.length} text streams out of ${streamIndex} streams`);
fs.writeFileSync(path.join(__dirname, '..', 'PDF', 'raw_streams.txt'), allExtractedText.join('\n'));
console.log('Saved to PDF/raw_streams.txt');
