const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Shipment = require('../models/Shipment');
const Billing = require('../models/Billing');
const Carrier = require('../models/Carrier');
const Rate = require('../models/Rate');
const { randomUUID } = require('crypto');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

router.use(auth);

// GET / - Retrieve all shipments for the authenticated user with filters
router.get('/', async (req, res) => {
  try {
    const { status, carrier, origin, destination, startDate, endDate, search, page = 1, limit = 10 } = req.query;
    const query = { user: req.user.id };

    if (status) query.status = status;
    if (carrier) query.carrier = new RegExp(carrier, 'i');
    if (origin) query.origin = new RegExp(origin, 'i');
    if (destination) query.destination = new RegExp(destination, 'i');
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { trackingNumber: new RegExp(search, 'i') },
        { origin: new RegExp(search, 'i') },
        { destination: new RegExp(search, 'i') },
        { carrier: new RegExp(search, 'i') }
      ];
    }

    const shipments = await Shipment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Shipment.countDocuments(query);

    res.json({
      shipments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST / - Create a new shipment
router.post('/', async (req, res) => {
  const { origin, destination, carrier, weight, status } = req.body;
  if (!origin || !destination || !carrier || !weight) {
    return res.status(400).json({ message: 'Origin, destination, carrier, and weight are required' });
  }
  try {
    const cost = parseFloat(weight) * 10;
    const trackingNumber = randomUUID();
    const initialStatus = status || 'pending';
    const shipment = new Shipment({
      trackingNumber,
      origin,
      destination,
      carrier,
      weight,
      cost,
      status: initialStatus,
      user: req.user.id,
      statusHistory: [{ status: initialStatus, note: 'Shipment created' }]
    });
    await shipment.save();
    const billing = new Billing({
      shipment: shipment._id,
      amount: cost
    });
    await billing.save();
    res.status(201).json(shipment);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Tracking number already exists' });
    } else {
      res.status(500).json({ message: err.message });
    }
  }
});

// GET /:id - Retrieve a specific shipment by ID
router.get('/:id', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, user: req.user.id });
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /:id - Update a shipment by ID
router.put('/:id', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, user: req.user.id });
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    const oldStatus = shipment.status;
    Object.assign(shipment, req.body);

    if (req.body.status && req.body.status !== oldStatus) {
      shipment.statusHistory.push({
        status: req.body.status,
        note: req.body.note || `Status changed from ${oldStatus} to ${req.body.status}`
      });
    }

    shipment.updatedAt = new Date();
    await shipment.save();
    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /:id - Delete a shipment by ID
router.delete('/:id', async (req, res) => {
  try {
    const shipment = await Shipment.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json({ message: 'Shipment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /bulk - Bulk upload shipments from CSV
router.post('/bulk', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const shipments = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        // Validate required fields
        if (!data.origin || !data.destination || !data.carrier || !data.weight) {
          errors.push({ row: shipments.length + 1, message: 'Missing required fields' });
          return;
        }

        const cost = parseFloat(data.weight) * 10;
        const trackingNumber = randomUUID();
        const status = data.status || 'pending';

        shipments.push({
          trackingNumber,
          origin: data.origin,
          destination: data.destination,
          carrier: data.carrier,
          weight: parseFloat(data.weight),
          cost,
          status,
          user: req.user.id,
          statusHistory: [{ status, note: 'Bulk uploaded' }]
        });
      })
      .on('end', async () => {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        if (errors.length > 0) {
          return res.status(400).json({ message: 'Validation errors', errors });
        }

        // Insert shipments
        const insertedShipments = await Shipment.insertMany(shipments);

        // Create billings
        const billings = insertedShipments.map(shipment => ({
          shipment: shipment._id,
          amount: shipment.cost
        }));
        await Billing.insertMany(billings);

        res.status(201).json({ message: `${shipments.length} shipments created successfully` });
      })
      .on('error', (err) => {
        fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Error processing CSV' });
      });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;