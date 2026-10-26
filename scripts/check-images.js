const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function checkImages() {
  const pdfPath = path.join(__dirname, '..', 'PDF', 'บทที่ 1 โครงสร้างพื้นฐานของ HTML.pdf');
  const dataBuffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: dataBuffer });

  console.log('Extracting embedded images...');
  const images = await parser.getImage();
  console.log('Total images found:', images?.total || images?.images?.length || Object.keys(images || {}));
  
  if (images && images.images) {
    const targetDir = path.join(__dirname, '..', 'public', 'slides', 'lesson_1_extracted');
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    
    for (let i = 0; i < images.images.length; i++) {
      const img = images.images[i];
      console.log(`Image ${i}: page ${img.pageNumber}, format: ${img.format}, size: ${img.data?.length || img.width + 'x' + img.height}`);
      if (img.data) {
        fs.writeFileSync(path.join(targetDir, `img_${i + 1}_p${img.pageNumber}.${img.format || 'png'}`), Buffer.from(img.data));
      }
    }
  }

  await parser.destroy();
}

checkImages().catch(console.error);
