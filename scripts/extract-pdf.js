const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function run() {
  const pdfDir = path.join(__dirname, '..', 'PDF');
  const files = fs.readdirSync(pdfDir);
  const targetPdf = files.find(f => f.endsWith('.pdf'));
  if (!targetPdf) {
    console.error('No PDF found!');
    return;
  }
  
  const fullPath = path.join(pdfDir, targetPdf);
  console.log('Reading:', fullPath);
  const dataBuffer = fs.readFileSync(fullPath);
  
  const parser = new PDFParse({ data: dataBuffer });
  const textResult = await parser.getText();
  console.log('Text result length:', textResult?.text?.length || textResult?.length);
  
  const extractedText = typeof textResult === 'string' ? textResult : (textResult.text || JSON.stringify(textResult));
  const outPath = path.join(pdfDir, 'lesson1_extracted.txt');
  fs.writeFileSync(outPath, extractedText, 'utf-8');
  console.log('Successfully saved to:', outPath);
  console.log('Preview:');
  console.log(extractedText.slice(0, 1500));
  await parser.destroy();
}

run().catch(console.error);
