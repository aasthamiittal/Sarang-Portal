const express = require('express');
const Quote = require('../models/Quote');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/quotes
router.post('/', auth, async (req, res) => {
  try {
    const quoteData = { ...req.body, userId: req.user.id };
    const quote = new Quote(quoteData);
    await quote.save();
    res.status(201).json(quote);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/quotes (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const quotes = await Quote.find().populate('userId', 'name email').sort({ createdAt: -1 });
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/quotes/:id (admin only - to respond with quote)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { quotedPrice, adminResponse, status } = req.body;
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      { quotedPrice, adminResponse, status },
      { new: true }
    );

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    res.json(quote);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;