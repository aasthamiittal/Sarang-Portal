const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Manifest = require('../models/Manifest');
const Shipment = require('../models/Shipment');
const TrackingEvent = require('../models/TrackingEvent');
const Billing = require('../models/Billing');
const { processShipmentBilling } = require('../services/billingService');
const automationEngine = require('../services/automationEngine');
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
    const manifests = await Manifest.find().populate('shipments');
    const userManifests = manifests.filter(m => m.shipments && m.shipments.every(s => s.user.toString() === req.user.id.toString()));
    res.json(userManifests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST / - Create a new manifest
router.post('/', upload.single('file'), async (req, res) => {
  const { shipments } = req.body;
  if (!req.file || !shipments || !Array.isArray(shipments) || shipments.length === 0) {
    return res.status(400).json({ message: 'File and at least one shipment are required' });
  }
  try {
    const shipmentDocs = await Shipment.find({ _id: { $in: shipments }, user: req.user.id });
    if (shipmentDocs.length !== shipments.length) {
      return res.status(404).json({ message: 'One or more shipments not found or not owned by user' });
    }
    const manifest = new Manifest({
      fileName: req.file.originalname,
      filePath: req.file.path,
      shipments
    });
    await manifest.save();

    // Apply automation rules for auto pickup after manifest creation
    await automationEngine.evaluateRules('AUTO_PICKUP', {
      userId: req.user.id,
      data: {
        manifestId: manifest._id,
        shipments: shipments
      }
    });

    res.status(201).json(manifest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /:id - Retrieve a specific manifest by ID
router.get('/:id', async (req, res) => {
  try {
    const manifest = await Manifest.findById(req.params.id).populate('shipments');
    if (!manifest || !manifest.shipments || !manifest.shipments.every(s => s.user.toString() === req.user.id.toString())) {
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
    const manifest = await Manifest.findById(req.params.id).populate('shipments');
    if (!manifest || !manifest.shipments || !manifest.shipments.every(s => s.user.toString() === req.user.id.toString())) {
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
    const manifest = await Manifest.findById(req.params.id).populate('shipments');
    if (!manifest || !manifest.shipments || !manifest.shipments.every(s => s.user.toString() === req.user.id.toString())) {
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
    const manifest = await Manifest.findById(req.params.id).populate('shipments');
    if (!manifest || !manifest.shipments || !manifest.shipments.every(s => s.user.toString() === req.user.id.toString())) {
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

    // Update shipments: set status to DISPATCHED, manifestSubmittedAt, dispatchDate, and process billing
    for (const shipment of manifest.shipments) {
      // Create tracking event for DISPATCHED
      const trackingEvent = new TrackingEvent({
        shipment: shipment._id,
        eventCode: 'DISPATCHED',
        description: 'Shipment dispatched via manifest submission'
      });
      await trackingEvent.save();

      // Update shipment
      shipment.manifestSubmittedAt = new Date();
      shipment.dispatchDate = new Date();
      shipment.manifest = manifest._id;
      shipment.updatedAt = new Date();
      await shipment.save();

      // Process billing for dispatch event
      await processShipmentBilling(shipment._id, 'DISPATCHED', req.user.id);

      // Create or update billing record
      let billing = await Billing.findOne({ shipment: shipment._id });
      if (!billing) {
        billing = new Billing({
          shipment: shipment._id,
          amount: shipment.cost || 0,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        });
        await billing.save();
      }
    }

    res.json({ message: 'Manifest submitted successfully', manifest });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /:id/lock - Lock manifest (final step)
router.post('/:id/lock', async (req, res) => {
  try {
    const manifest = await Manifest.findById(req.params.id).populate('shipments');
    if (!manifest || !manifest.shipments || !manifest.shipments.every(s => s.user.toString() === req.user.id.toString())) {
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
    const manifest = await Manifest.findById(req.params.id).populate('shipments');
    if (!manifest || !manifest.shipments || !manifest.shipments.every(s => s.user.toString() === req.user.id.toString())) {
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

// GET /:id/pdf - Generate manifest PDF
router.get('/:id/pdf', async (req, res) => {
  try {
    const manifest = await Manifest.findById(req.params.id).populate('shipments');
    if (!manifest || !manifest.shipments || !manifest.shipments.every(s => s.user.toString() === req.user.id.toString())) {
      return res.status(404).json({ message: 'Manifest not found' });
    }

    const pdfService = require('../services/pdfService');
    const { filePath, documentId } = await pdfService.generateManifestPDF(manifest, manifest.shipments, req.user.id);

    res.download(filePath, `manifest_${manifest._id}.pdf`);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /:id/report - Manifest report
router.get('/:id/report', async (req, res) => {
  try {
    const manifest = await Manifest.findById(req.params.id).populate('shipments');
    if (!manifest || !manifest.shipments || !manifest.shipments.every(s => s.user.toString() === req.user.id.toString())) {
      return res.status(404).json({ message: 'Manifest not found' });
    }

    const report = {
      manifestId: manifest._id,
      fileName: manifest.fileName,
      status: manifest.status,
      submittedAt: manifest.submittedAt,
      lockedAt: manifest.lockedAt,
      shipments: manifest.shipments.map(shipment => ({
        orderId: shipment.orderId,
        trackingNumber: shipment.trackingNumber,
        carrier: shipment.carrier,
        weight: shipment.weight,
        cost: shipment.cost,
        status: shipment.getCurrentStatus ? shipment.getCurrentStatus() : 'Unknown'
      }))
    };

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;