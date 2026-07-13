# Instaframe📸

A QR-triggered photobooth: scan a code, take a photo, leave a comment, and it's automatically composited into a Polaroid-style print and uploaded to Google Drive.

**Status:** Built and working locally. Not yet deployed.

## How it works

1. A landing page renders a QR code (client-side, via `qrcode.react`) pointing to the upload page
2. Scanning it opens the upload page on the visitor's phone
3. The visitor takes a photo (native mobile camera, via `<input capture>`) and writes a short comment
4. The backend:
   - Crops the photo to a square and auto-rotates it (`sharp`)
   - Adds a white Polaroid-style border (classic 1:1:1:4 ratio)
   - Renders the comment as handwritten-style caption text (via `opentype.js` + the Caveat font) and composites it onto the bottom border
   - Uploads the finished image to a specified Google Drive folder via a service account — no visitor login required

## Tech Stack

**Frontend:** React, React Router, Tailwind CSS, `qrcode.react`
**Backend:** Node.js, Express, `multer` (upload handling), `sharp` (image compositing), `opentype.js` (caption rendering), Google Drive API (`googleapis`) via service account auth

## Known limitations (current state)

- Image numbering uses a local counter file on disk — works fine locally, but won't hold up on serverless hosts with ephemeral filesystems (Vercel/Netlify functions), since the counter resets on every cold start
- The QR code always routes to the same upload endpoint — it isn't tied to individual sessions or events
- No database — Drive is the only persistence layer

## Setup

```bash
# Backend
cd backend
npm install
# Add a .env with PORT, GOOGLE_APPLICATION_CREDENTIALS, DRIVE_FOLDER_ID
npm run dev

# Frontend
cd frontend
npm install
npm start
```

You'll need a Google Cloud service account with Drive API access and `drive.file` scope, and a Drive folder ID to upload into. Credentials are never committed — see `.env.example` / `service-account.example.json` for the expected shape.

## Roadmap

- [ ] Replace local serial counter with a serverless-safe approach
- [ ] Deploy (Vercel for frontend, a persistent host for backend)
- [ ] Optional: per-event/session QR codes instead of one static endpoint
