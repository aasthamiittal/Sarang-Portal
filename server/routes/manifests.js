const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Manifest = require('../models/Manifest');
const Shipment = require('../models/Shipment');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.use(auth);

// GET / - Retrieve all manifests for the authenticated user
router.get('/', async (req, res) => {
  try {
    const manifests = await Manifest.find().populate('shipment');
    const userManifests = manifests.filter(m => m.shipment && m.shipment.user.toString() === req.user.id.toString());
    res.json(userManifests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST / - Create a new manifest
router.post('/', upload.single('file'), async (req, res) => {
  const { shipment } = req.body;
  if (!req.file || !shipment) {
    return res.status(400).json({ message: 'File and shipment are required' });
  }
  try {
    const shipmentDoc = await Shipment.findOne({ _id: shipment, user: req.user.id });
    if (!shipmentDoc) {
      return res.status(404).json({ message: 'Shipment not found or not owned by user' });
    }
    const manifest = new Manifest({
      fileName: req.file.originalname,
      filePath: req.file.path,
      shipment
    });
    await manifest.save();
    res.status(201).json(manifest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /:id - Retrieve a specific manifest by ID
router.get('/:id', async (req, res) => {
  try {
    const manifest = await Manifest.findById(req.params.id).populate('shipment');
    if (!manifest || !manifest.shipment || manifest.shipment.user.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Manifest not found' });
    }
    res.json(manifest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /:id - Update a manifest by ID (only before submission)
router.put('/:id', async (req, res) => {
  try {
    const manifest = await Manifest.findById(req.params.id).populate('shipment');
    if (!manifest || !manifest.shipment || manifest.shipment.user.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Manifest not found' });
    }

    // Check if manifest is already submitted or locked
    if (manifest.status === 'submitted' || manifest.status === 'locked') {
      return res.status(400).json({ message: 'Cannot edit submitted or locked manifest' });
    }

    const updatedManifest = await Manifest.findByIdAndUpdate(req.params.id, {
      ...req.body,
      status: 'edited',
      updatedAt: new Date()
    }, { new: true, runValidators: true });

    res.json(updatedManifest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /:id - Delete a manifest by ID
router.delete('/:id', async (req, res) => {
  try {
    const manifest = await Manifest.findById(req.params.id).populate('shipment');
    if (!manifest || !manifest.shipment || manifest.shipment.user.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Manifest not found' });
    }
    await Manifest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Manifest deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /:id/submit - Submit manifest (lock shipments)
router.post('/:id/submit', async (req, res) => {
  try {
    const manifest = await Manifest.findById(req.params.id).populate('shipment');
    if (!manifest || !manifest.shipment || manifest.shipment.user.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Manifest not found' });
    }

    if (manifest.status === 'submitted' || manifest.status === 'locked') {
      return res.status(400).json({ message: 'Manifest already submitted or locked' });
    }

    // Update manifest status
    manifest.status = 'submitted';
    manifest.submittedAt = new Date();
    manifest.updatedAt = new Date();
    await manifest.save();

    // Update shipment status and lock it
    const shipment = manifest.shipment;
    shipment.manifestSubmittedAt = new Date();
    shipment.updatedAt = new Date();
    await shipment.save();

    res.json({ message: 'Manifest submitted successfully', manifest });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /:id/lock - Lock manifest (final step)
router.post('/:id/lock', async (req, res) => {
  try {
    const manifest = await Manifest.findById(req.params.id).populate('shipment');
    if (!manifest || !manifest.shipment || manifest.shipment.user.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Manifest not found' });
    }

    if (manifest.status !== 'submitted') {
      return res.status(400).json({ message: 'Manifest must be submitted before locking' });
    }

    manifest.status = 'locked';
    manifest.lockedAt = new Date();
    manifest.updatedAt = new Date();
    await manifest.save();

    res.json({ message: 'Manifest locked successfully', manifest });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /:id/download - Download manifest file
router.get('/:id/download', async (req, res) => {
  try {
    const manifest = await Manifest.findById(req.params.id).populate('shipment');
    if (!manifest || !manifest.shipment || manifest.shipment.user.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Manifest not found' });
    }

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(manifest.filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(manifest.filePath, manifest.fileName);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /:id/report - Manifest report
router.get('/:id/report', async (req, res) => {
  try {
    const manifest = await Manifest.findById(req.params.id).populate('shipment');
    if (!manifest || !manifest.shipment || manifest.shipment.user.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Manifest not found' });
    }

    const report = {
      manifestId: manifest._id,
      fileName: manifest.fileName,
      status: manifest.status,
      submittedAt: manifest.submittedAt,
      lockedAt: manifest.lockedAt,
      shipment: {
        orderId: manifest.shipment.orderId,
        trackingNumber: manifest.shipment.trackingNumber,
        carrier: manifest.shipment.carrier,
        weight: manifest.shipment.weight,
        cost: manifest.shipment.cost,
        status: manifest.shipment.status
      }
    };

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;