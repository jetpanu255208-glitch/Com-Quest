const fs = require('fs');
const path = require('path');

const pdfPath = path.join(__dirname, '..', 'PDF', 'บทที่ 1 โครงสร้างพื้นฐานของ HTML.pdf');
const content = fs.readFileSync(pdfPath, 'binary');

console.log('Searching for /Subtype /Image...');
let count = 0;
let pos = 0;
while ((pos = content.indexOf('/Subtype /Image', pos)) !== -1) {
  count++;
  const snippet = content.substring(Math.max(0, pos - 150), Math.min(content.length, pos + 250));
  console.log(`\n--- Image ${count} snippet ---:\n`, snippet);
  pos += 15;
}

console.log('Searching for /Filter /DCTDecode (JPEG)...');
let jpegCount = 0;
pos = 0;
while ((pos = content.indexOf('/DCTDecode', pos)) !== -1) {
  jpegCount++;
  pos += 10;
}
console.log('Total JPEGs (/DCTDecode):', jpegCount);

console.log('Total /Subtype /Image:', count);
