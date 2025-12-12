const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Rate = require('../models/Rate');

router.use(auth);

// GET / - Retrieve all rates
router.get('/', async (req, res) => {
  try {
    const rates = await Rate.find().populate('carrier').sort({ createdAt: -1 });
    res.json(rates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST / - Create a new rate
router.post('/', async (req, res) => {
  const { carrier, zone, perKgPrice, minimumCharge, fuelSurchargePercent, additionalFees, effectiveFrom, effectiveTo } = req.body;
  if (!carrier || !zone || !perKgPrice) {
    return res.status(400).json({ message: 'Carrier, zone, and perKgPrice are required' });
  }
  try {
    const rate = new Rate({
      carrier,
      zone,
      perKgPrice,
      minimumCharge,
      fuelSurchargePercent,
      additionalFees,
      effectiveFrom,
      effectiveTo
    });
    await rate.save();
    await rate.populate('carrier');
    res.status(201).json(rate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /:id - Retrieve a specific rate by ID
router.get('/:id', async (req, res) => {
  try {
    const rate = await Rate.findById(req.params.id).populate('carrier');
    if (!rate) {
      return res.status(404).json({ message: 'Rate not found' });
    }
    res.json(rate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /:id - Update a rate by ID
router.put('/:id', async (req, res) => {
  try {
    const rate = await Rate.findById(req.params.id);
    if (!rate) {
      return res.status(404).json({ message: 'Rate not found' });
    }
    Object.assign(rate, req.body);
    rate.updatedAt = new Date();
    await rate.save();
    await rate.populate('carrier');
    res.json(rate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /:id - Delete a rate by ID
router.delete('/:id', async (req, res) => {
  try {
    const rate = await Rate.findByIdAndDelete(req.params.id);
    if (!rate) {
      return res.status(404).json({ message: 'Rate not found' });
    }
    res.json({ message: 'Rate deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;