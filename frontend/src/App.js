import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';

function LandingPage() {
  // Use environment variable or default to current host
  const uploadUrl = process.env.REACT_APP_UPLOAD_URL || `${window.location.origin}/upload`;
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6">Welcome! Scan to Upload Your Selfie</h1>
      <QRCodeCanvas value={uploadUrl} size={256} className="mb-6" />
      <p className="text-lg">Scan this QR code with your phone to take a photo and leave a comment!</p>
    </div>
  );
}

function UploadPage() {
  const [photo, setPhoto] = React.useState(null);
  const [comment, setComment] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [success, setSuccess] = React.useState(null);
  const [error, setError] = React.useState(null);

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setSuccess(null);
    setError(null);
    const formData = new FormData();
    formData.append('photo', photo);
    formData.append('comment', comment);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Upload successful! Thank you!');
        setPhoto(null);
        setComment('');
      } else {
        setError(data.error || 'Upload failed.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      <h2 className="text-2xl font-semibold mb-4">Upload Your Selfie & Comment</h2>
      <form className="w-full max-w-xs flex flex-col gap-4" onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          required
        />
        <textarea
          className="border rounded p-2 w-full"
          placeholder="Add a celebratory comment!"
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded font-bold disabled:opacity-50"
          disabled={uploading || !photo}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {success && <div className="mt-4 text-green-600 font-semibold">{success}</div>}
      {error && <div className="mt-4 text-red-600 font-semibold">{error}</div>}
      <Link to="/" className="mt-6 text-blue-500 underline">Back to QR</Link>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<UploadPage />} />
      </Routes>
    </Router>
  );
}

export default App;
