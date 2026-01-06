const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { calculateBalance, getWalletActivity } = require('../services/billingService');

router.use(auth);

// GET /balance
router.get('/balance', async (req, res) => {
  try {
    const balance = await calculateBalance(req.user.id);
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /activity
router.get('/activity', async (req, res) => {
  try {
    const { dateFilter } = req.query;
    const activity = await getWalletActivity(req.user.id, { dateFilter });
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

const AccountLedger = require('../models/AccountLedger');

// POST /recharge
router.post('/recharge', async (req, res) => {
  try {
    const { amount } = req.body;
    const rechargeAmount = parseFloat(amount);

    // Calculate current balance for balanceAfter
    const currentBalance = await calculateBalance(req.user.id);

    // Create ledger entry
    const ledgerEntry = new AccountLedger({
      user: req.user.id,
      type: 'credit',
      amount: rechargeAmount,
      referenceType: 'payment',
      referenceId: null, // Could link to payment transaction
      description: 'Wallet recharge',
      balanceAfter: currentBalance + rechargeAmount
    });

    await ledgerEntry.save();

    const newBalance = currentBalance + rechargeAmount;
    res.json({ message: 'Recharge successful', balance: newBalance });
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