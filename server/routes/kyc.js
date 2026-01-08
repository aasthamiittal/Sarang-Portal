const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const KycDocument = require('../models/KycDocument');
const User = require('../models/User');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/kyc');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for KYC document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `kyc-${req.user._id}-${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF allowed.'));
    }
  }
});

// All routes require authentication
router.use(auth);

// Upload KYC documents
router.post('/upload', upload.fields([
  { name: 'gst', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'iec', maxCount: 1 },
  { name: 'address_proof', maxCount: 1 },
  { name: 'identity_proof', maxCount: 1 }
]), async (req, res) => {
  try {
    const uploadedFiles = req.files;
    const documents = [];

    for (const [docType, files] of Object.entries(uploadedFiles)) {
      const file = files[0];
      const kycDoc = new KycDocument({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        userId: req.user._id,
        documentType: docType
      });
      await kycDoc.save();
      documents.push(kycDoc);
    }

    res.status(201).json({
      message: 'KYC documents uploaded successfully',
      documents
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's KYC documents
router.get('/documents', async (req, res) => {
  try {
    const documents = await KycDocument.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get KYC status
router.get('/status', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('kycStatus gstNumber panNumber iecNumber');
    const documents = await KycDocument.find({ userId: req.user._id });

    const status = {
      overallStatus: user.kycStatus,
      gstNumber: user.gstNumber,
      panNumber: user.panNumber,
      iecNumber: user.iecNumber,
      documents: documents.map(doc => ({
        type: doc.documentType,
        status: doc.status,
        rejectionReason: doc.rejectionReason,
        uploadedAt: doc.createdAt
      }))
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Resubmit rejected document
router.post('/resubmit/:documentId', upload.single('document'), async (req, res) => {
  try {
    const document = await KycDocument.findOne({
      _id: req.params.documentId,
      userId: req.user._id,
      status: 'rejected'
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found or not rejected' });
    }

    // Delete old file
    if (fs.existsSync(document.path)) {
      fs.unlinkSync(document.path);
    }

    // Update with new file
    document.filename = req.file.filename;
    document.originalName = req.file.originalname;
    document.mimetype = req.file.mimetype;
    document.size = req.file.size;
    document.path = req.file.path;
    document.status = 'pending';
    document.rejectionReason = null;
    document.verifiedBy = null;
    document.verifiedAt = null;
    document.updatedAt = new Date();

    await document.save();

    res.json({ message: 'Document resubmitted successfully', document });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;