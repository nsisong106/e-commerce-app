const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

router.post('/', protect, adminOnly, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Upload error (multer):', err.message);
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No image received by the server' });
    }

    console.log('Received file:', req.file.originalname, req.file.size, 'bytes');

    const stream = cloudinary.uploader.upload_stream(
      { folder: 'ecommerce-products', timeout: 30000 },
      (error, result) => {
        if (error) {
          console.error('Cloudinary error:', error.message || error);
          return res.status(500).json({ message: error.message || 'Image upload failed' });
        }
        console.log('Uploaded to Cloudinary:', result.secure_url);
        res.json({ url: result.secure_url });
      }
    );
    stream.end(req.file.buffer);
  });
});

module.exports = router;