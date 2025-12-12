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

// PUT /:id - Update a manifest by ID
router.put('/:id', async (req, res) => {
  try {
    const manifest = await Manifest.findById(req.params.id).populate('shipment');
    if (!manifest || !manifest.shipment || manifest.shipment.user.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Manifest not found' });
    }
    const updatedManifest = await Manifest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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

module.exports = router;