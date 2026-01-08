const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// POST /api/documents/upload
router.post('/upload', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const document = new Document({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      userId: req.user.id
    });

    await document.save();
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/documents
router.get('/', auth, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/documents/:id/download
router.get('/:id/download', auth, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.download(document.path, document.originalName);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete file from filesystem
    fs.unlinkSync(document.path);

    // Delete from database
    await Document.findByIdAndDelete(req.params.id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;