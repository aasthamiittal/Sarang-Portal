const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Billing = require('../models/Billing');
const Shipment = require('../models/Shipment');

router.use(auth);

// GET / - Retrieve all billing records for the authenticated user
router.get('/', async (req, res) => {
  try {
    const billings = await Billing.find().populate('shipment');
    const userBillings = billings.filter(b => b.shipment && b.shipment.user.toString() === req.user.id.toString());
    res.json(userBillings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST / - Create a new billing record
router.post('/', async (req, res) => {
  const { shipment, amount, status, dueDate, paidAt } = req.body;
  if (!shipment || !amount) {
    return res.status(400).json({ message: 'Shipment and amount are required' });
  }
  try {
    const shipmentDoc = await Shipment.findOne({ _id: shipment, user: req.user.id });
    if (!shipmentDoc) {
      return res.status(404).json({ message: 'Shipment not found or not owned by user' });
    }
    const billing = new Billing({
      shipment,
      amount,
      status: status || 'unpaid',
      dueDate,
      paidAt
    });
    await billing.save();
    res.status(201).json(billing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /:id - Retrieve a specific billing record by ID
router.get('/:id', async (req, res) => {
  try {
    const billing = await Billing.findById(req.params.id).populate('shipment');
    if (!billing || !billing.shipment || billing.shipment.user.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Billing record not found' });
    }
    res.json(billing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /:id - Update a billing record by ID
router.put('/:id', async (req, res) => {
  try {
    const billing = await Billing.findById(req.params.id).populate('shipment');
    if (!billing || !billing.shipment || billing.shipment.user.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Billing record not found' });
    }
    const updatedBilling = await Billing.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(updatedBilling);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /:id - Delete a billing record by ID
router.delete('/:id', async (req, res) => {
  try {
    const billing = await Billing.findById(req.params.id).populate('shipment');
    if (!billing || !billing.shipment || billing.shipment.user.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Billing record not found' });
    }
    await Billing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Billing record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;