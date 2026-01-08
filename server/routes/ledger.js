const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const AccountLedger = require('../models/AccountLedger');
const Shipment = require('../models/Shipment');
const Billing = require('../models/Billing');
const CustomInvoice = require('../models/CustomInvoice');

router.use(auth);

// Helper function to calculate balance
async function calculateBalance(userId, upToDate = null) {
  const query = { user: userId };
  if (upToDate) {
    query.createdAt = { $lte: upToDate };
  }

  const entries = await AccountLedger.find(query).sort({ createdAt: 1 });
  let balance = 0;

  entries.forEach(entry => {
    if (entry.type === 'credit') {
      balance += entry.amount;
    } else {
      balance -= entry.amount;
    }
  });

  return balance;
}

// POST /entries - Create ledger entry (internal use)
router.post('/entries', async (req, res) => {
  try {
    const { type, amount, referenceType, referenceId, description } = req.body;

    const balanceAfter = await calculateBalance(req.user.id);

    const entry = new AccountLedger({
      user: req.user.id,
      type,
      amount,
      referenceType,
      referenceId,
      description,
      balanceAfter: type === 'credit' ? balanceAfter + amount : balanceAfter - amount
    });

    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /report - Ledger report
router.get('/report', async (req, res) => {
  try {
    const { startDate, endDate, type, referenceType } = req.query;
    const query = { user: req.user.id };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (type) query.type = type;
    if (referenceType) query.referenceType = referenceType;

    const entries = await AccountLedger.find(query)
      .sort({ createdAt: -1 })
      .populate('referenceId');

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /invoice-summary - Invoice summary
router.get('/invoice-summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { user: req.user.id };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get shipments with billing info
    const shipments = await Shipment.find(query)
      .populate('billing')
      .sort({ createdAt: -1 });

    const summary = {
      totalInvoices: shipments.length,
      paidInvoices: shipments.filter(s => s.paymentStatus === 'paid').length,
      pendingInvoices: shipments.filter(s => s.paymentStatus === 'pending').length,
      failedInvoices: shipments.filter(s => s.paymentStatus === 'failed').length,
      totalAmount: shipments.reduce((sum, s) => sum + (s.cost || 0), 0),
      paidAmount: shipments.filter(s => s.paymentStatus === 'paid').reduce((sum, s) => sum + (s.cost || 0), 0),
      pendingAmount: shipments.filter(s => s.paymentStatus === 'pending').reduce((sum, s) => sum + (s.cost || 0), 0)
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /payment-report - Payment report
router.get('/payment-report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { user: req.user.id };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const payments = await AccountLedger.find({
      ...query,
      referenceType: 'payment'
    }).sort({ createdAt: -1 });

    const report = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      payments: payments
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /balance - Get current balance
router.get('/balance', async (req, res) => {
  try {
    const balance = await calculateBalance(req.user.id);
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;