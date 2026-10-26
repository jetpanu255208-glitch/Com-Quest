const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const buf = fs.readFileSync(path.join(__dirname, '..', 'PDF', 'บทที่ 1 โครงสร้างพื้นฐานของ HTML.pdf'));
const content = buf.toString('binary');

// Find all object headers: \d+ \d+ obj
const regex = /(\d+)\s+(\d+)\s+obj\s*<<([\s\S]*?)>>\s*stream([\s\S]*?)endstream/g;
let match;
let count = 0;

console.log('Scanning all stream objects...');
while ((match = regex.exec(content)) !== null) {
  count++;
  const objNum = match[1];
  const dict = match[3];
  const rawStream = Buffer.from(match[4], 'binary');
  
  // Clean leading newline
  let start = 0;
  if (rawStream[0] === 0x0d && rawStream[1] === 0x0a) start = 2;
  else if (rawStream[0] === 0x0a || rawStream[0] === 0x0d) start = 1;
  const streamData = rawStream.subarray(start);

  let filter = 'None';
  const filterMatch = dict.match(/\/Filter\s*(\/\w+|\[[^\]]+\])/);
  if (filterMatch) filter = filterMatch[1];

  let uncompressed = null;
  if (filter.includes('FlateDecode')) {
    try {
      uncompressed = zlib.inflateSync(streamData);
    } catch(e) {
      try { uncompressed = zlib.inflateRawSync(streamData); } catch(_) {}
    }
  }

  const length = streamData.length;
  const uncompLen = uncompressed ? uncompressed.length : 'N/A';
  
  let preview = '';
  if (uncompressed) {
    const s = uncompressed.toString('utf-8');
    if (s.includes('BT') || s.includes('Tj') || s.includes('HTML') || s.includes('Font') || s.length < 500) {
      preview = s.slice(0, 300).replace(/[\r\n]+/g, ' ');
    }
  } else if (filter === 'None') {
    preview = streamData.toString('utf-8').slice(0, 100).replace(/[\r\n]+/g, ' ');
  }

  console.log(`Obj ${objNum}: Filter=${filter}, rawLen=${length}, uncompLen=${uncompLen} | ${preview}`);
}

console.log('Total stream objects:', count);
