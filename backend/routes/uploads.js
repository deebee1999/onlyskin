

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');

// === Create uploads directory if not exists ===
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}


// === Avatar storage (fixed name) ===
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}${ext}`);
  },
});

// === Post media storage (unique per upload) ===
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
filename: (req, file, cb) => {
  const ext = path.extname(file.originalname);
  const base = path.basename(file.originalname, ext);
  const finalName = `media-${Date.now()}-${base}${ext}`;
  console.log('Saved to:', path.join(uploadDir, finalName)); 
  cb(null, finalName);
}


const avatarUpload = multer({ storage: avatarStorage });
const mediaUpload = multer({ storage: mediaStorage });


// === General file upload ===
const upload = multer({ storage: mediaStorage });

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ filename: req.file.filename, path: `/uploads/${req.file.filename}` });
});

// === Avatar upload with user authentication ===
router.post('/avatar', authMiddleware, avatarUpload.single('avatar'), async (req, res) => {

  if (!req.file) return res.status(400).json({ error: 'No avatar uploaded' });

  const db = req.app.get('db');
  const avatarPath = `/uploads/${req.file.filename}`;

  try {
    await db.query(
      'UPDATE users SET avatar = $1 WHERE id = $2',
      [avatarPath, req.user.id]
    );
    res.json({ message: 'Avatar uploaded successfully', avatar: avatarPath });
  } catch (err) {
    console.error('Upload avatar error:', err);
    res.status(500).json({ error: 'Failed to save avatar' });
  }
});

// === Post media upload ===
router.post('/post', authMiddleware, mediaUpload.single('media'), (req, res) => {

  if (!req.file) return res.status(400).json({ error: 'No media uploaded' });

  const mediaPath = `/uploads/${req.file.filename}`;
  res.json({ message: 'Media uploaded successfully', url: mediaPath });
});

// === Upload multiple images/videos and return URLs ===
router.post('/media', authMiddleware, mediaUpload.array('media', 5), async (req, res) => {

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No media files uploaded' });
  }

  try {
   const baseUrl = `${req.protocol}://${req.get('host')}`;
const urls = req.files.map((file) => ({
  url: `${baseUrl}/uploads/${file.filename}`,
  type: file.mimetype.startsWith('video') ? 'video' : 'image',
}));


    res.json({ success: true, urls });
  } catch (err) {
    console.error('❌ Media upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});




module.exports = router;
