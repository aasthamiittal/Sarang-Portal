const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Carrier = require('../models/Carrier');

router.use(auth);

// GET / - Retrieve all carriers
router.get('/', async (req, res) => {
  try {
    const carriers = await Carrier.find().sort({ createdAt: -1 });
    res.json(carriers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST / - Create a new carrier
router.post('/', async (req, res) => {
  const { name, apiKey, trackingUrl, rules } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  try {
    const carrier = new Carrier({
      name,
      apiKey,
      trackingUrl,
      rules
    });
    await carrier.save();
    res.status(201).json(carrier);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Carrier name already exists' });
    } else {
      res.status(500).json({ message: err.message });
    }
  }
});

// GET /:id - Retrieve a specific carrier by ID
router.get('/:id', async (req, res) => {
  try {
    const carrier = await Carrier.findById(req.params.id);
    if (!carrier) {
      return res.status(404).json({ message: 'Carrier not found' });
    }
    res.json(carrier);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /:id - Update a carrier by ID
router.put('/:id', async (req, res) => {
  try {
    const carrier = await Carrier.findById(req.params.id);
    if (!carrier) {
      return res.status(404).json({ message: 'Carrier not found' });
    }
    Object.assign(carrier, req.body);
    carrier.updatedAt = new Date();
    await carrier.save();
    res.json(carrier);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /:id - Delete a carrier by ID
router.delete('/:id', async (req, res) => {
  try {
    const carrier = await Carrier.findByIdAndDelete(req.params.id);
    if (!carrier) {
      return res.status(404).json({ message: 'Carrier not found' });
    }
    res.json({ message: 'Carrier deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;