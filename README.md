# Selfie Upload App

A React frontend with Node.js backend that allows users to upload selfies with comments and processes them into Polaroid-style photos with custom text overlays.

## Features

- 📸 Photo upload with camera capture
- 💬 Comment system
- 🖼️ Polaroid-style image processing with custom borders
- 📱 QR code for easy mobile access
- ☁️ Google Drive integration for photo storage
- 🎨 Custom font rendering (Caveat)

## Tech Stack

- **Frontend**: React, Tailwind CSS, QR Code generation
- **Backend**: Node.js, Express, Sharp (image processing), Google APIs
- **Storage**: Google Drive

## Setup

### Prerequisites

- Node.js (>=16.0.0)
- Google Cloud Platform account with Drive API enabled
- Service account credentials

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```

3. Set up Google Drive credentials:
   - Place your `service-account.json` file in the `backend/` directory
   - Set the `DRIVE_FOLDER_ID` environment variable

4. Build the frontend:
   ```bash
   npm run build
   ```

5. Start the application:
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env` file in the backend directory:

```
PORT=5000
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
DRIVE_FOLDER_ID=your_google_drive_folder_id
```

## Development

Run both frontend and backend in development mode:

```bash
npm run dev
```

This will start:
- Backend on http://localhost:5000
- Frontend on http://localhost:3000

## Deployment

### Option 1: Single Server Deployment

The app is configured to serve the React frontend from the Express backend:

```bash
npm run deploy
```

### Option 2: Using Deployment Scripts

**Windows:**
```bash
deploy.bat
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

## API Endpoints

- `POST /upload` - Upload a photo with comment
  - Body: FormData with `photo` (file) and `comment` (string)
  - Returns: JSON with success message and Google Drive file ID

## File Structure

```
├── backend/
│   ├── index.js              # Express server
│   ├── fonts/                # Custom fonts
│   ├── service-account.json  # Google credentials
│   └── package.json
├── frontend/
│   ├── src/
│   │   └── App.js           # React components
│   └── package.json
├── package.json             # Root package.json
├── deploy.sh               # Linux/Mac deployment
├── deploy.bat              # Windows deployment
└── README.md
```

## Configuration

### Google Drive Setup

1. Create a Google Cloud Project
2. Enable the Google Drive API
3. Create a service account
4. Download the service account JSON file
5. Create a folder in Google Drive and get its ID
6. Update the `DRIVE_FOLDER_ID` environment variable

### Customization

- **Font**: Replace `backend/fonts/Caveat-Medium.ttf` with your preferred font
- **Image Processing**: Modify the Sharp configuration in `backend/index.js`
- **Styling**: Update Tailwind classes in `frontend/src/App.js`

## Troubleshooting

1. **Google Drive API Issues**: Ensure your service account has proper permissions
2. **Image Processing Errors**: Check that Sharp is properly installed
3. **CORS Issues**: Verify CORS configuration in backend
4. **Port Conflicts**: Change PORT environment variable if needed

## License

MIT License