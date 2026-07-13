require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { google } = require('googleapis');
const cors = require('cors');
const streamifier = require('streamifier');
const sharp = require('sharp');
const opentype = require('opentype.js');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend/build')));
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

// Generate a unique filename without relying on persistent local state
// (a counter file doesn't survive on serverless hosts with ephemeral filesystems)
function getUniqueFilename() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
  const randomSuffix = Math.random().toString(36).slice(2, 6); // 4 random chars
  return `${timestamp}_${randomSuffix}`;
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

    // Get unique filename (no shared state needed — safe for serverless)
    const filenameId = getUniqueFilename();

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
        name: `img_${filenameId}.jpg`,
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

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 