const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Mock wallet data - in real app, this would be a proper model
const mockWalletData = {
  balance: 1250.75,
  activity: [
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
  ]
};

router.use(auth);

// GET /balance
router.get('/balance', async (req, res) => {
  try {
    res.json({ balance: mockWalletData.balance });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /activity
router.get('/activity', async (req, res) => {
  try {
    const { dateFilter } = req.query;

    let filteredActivity = mockWalletData.activity;
    if (dateFilter) {
      const now = new Date();
      let startDate;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          filteredActivity = mockWalletData.activity.filter(a => a.date >= startDate);
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          filteredActivity = mockWalletData.activity.filter(a => a.date >= startDate && a.date < yesterdayEnd);
          break;
        case 'last7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredActivity = mockWalletData.activity.filter(a => a.date >= startDate);
          break;
        case 'last30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredActivity = mockWalletData.activity.filter(a => a.date >= startDate);
          break;
      }
    }

    res.json(filteredActivity);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /recharge
router.post('/recharge', async (req, res) => {
  try {
    const { amount } = req.body;
    // Mock recharge - in real app, this would integrate with payment gateway
    mockWalletData.balance += parseFloat(amount);
    mockWalletData.activity.unshift({
      description: 'Wallet recharge',
      amount: parseFloat(amount),
      type: 'credit',
      date: new Date()
    });
    res.json({ message: 'Recharge successful', balance: mockWalletData.balance });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /history (alias for activity)
router.get('/history', async (req, res) => {
  try {
    res.json(mockWalletData.activity);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;