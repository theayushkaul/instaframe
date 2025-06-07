require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { google } = require('googleapis');
const fs = require('fs');
const cors = require('cors');
const streamifier = require('streamifier');
const sharp = require('sharp');
const opentype = require('opentype.js');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

// Multer setup: store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Google Drive setup
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});
const drive = google.drive({ version: 'v3', auth });
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;

// Helper to get the next serial number (stored in a local file for simplicity)
function getNextSerial() {
  const counterPath = './serial_counter.txt';
  let serial = 1;
  if (fs.existsSync(counterPath)) {
    serial = parseInt(fs.readFileSync(counterPath, 'utf8'), 10) + 1;
  }
  fs.writeFileSync(counterPath, serial.toString());
  return serial.toString().padStart(3, '0');
}

// Helper to escape XML special characters
function escapeXML(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
}

// Upload endpoint
app.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    const file = req.file;
    const comment = req.body.comment;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get serial number for filename
    const serial = getNextSerial();

    // Resize image to square (crop to center) and auto-rotate
    let image = sharp(file.buffer).rotate().resize(620, 620, { fit: 'cover' });
    const photoSize = 620; // px (arbitrary, but keeps ratio)

    // Polaroid border ratios (1:1:1:4)
    const borderUnit = Math.round(photoSize * 0.056); // ~13.45mm/62mm ratio
    const borderTop = borderUnit;
    const borderLeft = borderUnit;
    const borderRight = borderUnit;
    const borderBottom = borderUnit * 4;
    const borderColor = { r: 255, g: 255, b: 255, alpha: 1 };

    // Add border
    image = image.extend({
      top: borderTop,
      bottom: borderBottom,
      left: borderLeft,
      right: borderRight, 
      background: borderColor,
    });

    // Prepare text as SVG path using opentype.js for robust Caveat rendering
    const fontPath = path.join(__dirname, 'fonts', 'Caveat-Medium.ttf');
    const font = opentype.loadSync(fontPath);
    const caption = comment || '';
    const fontSize = 48;
    const svgWidth = photoSize + borderLeft + borderRight;
    const svgHeight = borderBottom;
    const pathData = font.getPath(caption, 0, fontSize, fontSize).toPathData();
    const textWidth = font.getAdvanceWidth(caption, fontSize);
    const x = (svgWidth - textWidth) / 2;
    const y = svgHeight / 4 + 1;
    const svgText = `
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
  <path d="${pathData}" transform="translate(${x},${y})" fill="#222" />
</svg>
`;

    // Composite the text SVG onto the bottom border
    const captionedImageBuffer = await image
      .composite([
        {
          input: Buffer.from(svgText),
          top: photoSize + borderTop,
          left: 0,
        },
      ])
      .jpeg()
      .toBuffer();

    // Upload the processed image to Google Drive (no folder), named img_<serialNo>.jpg
    const photoRes = await drive.files.create({
      requestBody: {
        name: `img_${serial}.jpg`,
        parents: [DRIVE_FOLDER_ID],
        mimeType: 'image/jpeg',
      },
      media: {
        mimeType: 'image/jpeg',
        body: streamifier.createReadStream(captionedImageBuffer),
      },
      fields: 'id',
    });

    res.status(200).json({
      message: 'Polaroid photo uploaded to Google Drive',
      photoFileId: photoRes.data.id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 