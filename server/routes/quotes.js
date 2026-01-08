const express = require('express');
const Quote = require('../models/Quote');
const Shipment = require('../models/Shipment');
const ActivityLog = require('../models/ActivityLog');
const { auth } = require('../middleware/auth');

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

// GET /api/quotes/my (user's quotes)
router.get('/my', auth, async (req, res) => {
  try {
    const quotes = await Quote.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(quotes);
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

    const { quotedPrice, adminResponse, expiresAt } = req.body;
    const updateData = { quotedPrice, adminResponse, status: 'RESPONDED' };
    if (expiresAt) updateData.expiresAt = new Date(expiresAt);

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Add to timeline
    quote.timeline.push({
      status: 'RESPONDED',
      notes: `Admin responded with price: ${quotedPrice}, message: ${adminResponse}`
    });

    Object.assign(quote, updateData);
    await quote.save();

    // Log activity
    await ActivityLog.create({
      user: quote.userId,
      action: 'quote_status_changed',
      description: `Quote ${quote._id} status changed to RESPONDED`
    });

    res.json(quote);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/quotes/:id/status (user only - to accept/reject quote)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body; // 'ACCEPTED' or 'REJECTED'
    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    if (quote.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (quote.status !== 'RESPONDED') {
      return res.status(400).json({ message: 'Quote not in respondable state' });
    }

    // Add to timeline
    quote.timeline.push({
      status,
      notes: `User ${status.toLowerCase()} the quote`
    });

    quote.status = status;
    await quote.save();

    // Log activity
    await ActivityLog.create({
      user: quote.userId,
      action: 'quote_status_changed',
      description: `Quote ${quote._id} status changed to ${status}`
    });

    res.json(quote);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/quotes/:id/convert (admin only - convert accepted quote to shipment)
router.post('/:id/convert', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    if (quote.status !== 'ACCEPTED') {
      return res.status(400).json({ message: 'Quote must be accepted to convert' });
    }

    // Create shipment from quote
    const shipmentData = {
      origin: quote.origin,
      destination: quote.destination,
      weight: quote.weight,
      cost: quote.quotedPrice,
      user: quote.userId,
      statusHistory: [{ status: 'DRAFT', note: 'Created from accepted quote' }]
    };

    const shipment = new Shipment(shipmentData);
    await shipment.save();

    // Update quote status to ACCEPTED (already is, but confirm)
    quote.status = 'ACCEPTED';
    quote.timeline.push({
      status: 'ACCEPTED',
      notes: 'Quote converted to shipment'
    });
    await quote.save();

    // Log activity
    await ActivityLog.create({
      user: quote.userId,
      action: 'quote_converted',
      description: `Quote ${quote._id} converted to shipment ${shipment._id}`
    });

    res.status(201).json({ shipment, quote });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;