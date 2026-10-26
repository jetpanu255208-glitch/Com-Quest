import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const pdfPath = path.join(__dirname, '..', 'PDF', 'บทที่ 1 โครงสร้างพื้นฐานของ HTML.pdf');
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  
  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0
  });

  const doc = await loadingTask.promise;
  console.log('Document loaded, total pages:', doc.numPages);

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const strings = textContent.items.map(item => item.str).filter(Boolean);
    console.log(`Page ${i} strings (${strings.length}):`, strings.join(' | '));
  }
}

run().catch(console.error);
