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

// GET /balance - Get wallet balance
router.get('/balance', async (req, res) => {
  try {
    // Mock balance - in real app, this would be calculated from transactions
    const balance = 1250.75; // Mock data
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /activity - Get wallet activity
router.get('/activity', async (req, res) => {
  try {
    const { dateFilter } = req.query;

    // Mock activity data
    const activity = [
      {
        description: 'Shipment payment - Order #12345',
        amount: 25.50,
        type: 'debit',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        orderId: '12345'
      },
      {
        description: 'Wallet recharge',
        amount: 100.00,
        type: 'credit',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        description: 'Shipment payment - Order #12346',
        amount: 15.75,
        type: 'debit',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        orderId: '12346'
      },
      {
        description: 'Refund - Order #12340',
        amount: 30.00,
        type: 'credit',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        orderId: '12340'
      }
    ];

    // Apply date filter
    let filteredActivity = activity;
    if (dateFilter) {
      const now = new Date();
      let startDate;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          filteredActivity = activity.filter(a => a.date >= startDate);
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          filteredActivity = activity.filter(a => a.date >= startDate && a.date < yesterdayEnd);
          break;
        case 'last7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredActivity = activity.filter(a => a.date >= startDate);
          break;
        case 'last30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredActivity = activity.filter(a => a.date >= startDate);
          break;
      }
    }

    res.json(filteredActivity);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /recharge - Recharge wallet
router.post('/recharge', async (req, res) => {
  try {
    const { amount } = req.body;
    // Mock recharge - in real app, this would integrate with payment gateway
    res.json({ message: 'Recharge initiated', amount });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;