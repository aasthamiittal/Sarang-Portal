const express = require('express');
const Pickup = require('../models/Pickup');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/pickup/request
router.post('/request', auth, async (req, res) => {
  try {
    const { orderId, pickupAddress, preferredSlot } = req.body;

    const pickup = new Pickup({
      orderId,
      pickupAddress,
      preferredSlot,
      userId: req.user.id,
      timeline: [{ status: 'pending', note: 'Pickup requested' }]
    });

    await pickup.save();
    res.status(201).json(pickup);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/pickup
router.get('/', auth, async (req, res) => {
  try {
    const pickups = await Pickup.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(pickups);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/pickup/status?orderId=
router.get('/status', auth, async (req, res) => {
  try {
    const { orderId } = req.query;
    const pickup = await Pickup.findOne({ orderId, userId: req.user.id });
    if (!pickup) {
      return res.status(404).json({ message: 'Pickup not found' });
    }
    res.json(pickup);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/pickup/slots
router.get('/slots', auth, async (req, res) => {
  try {
    // Mock time slots - in real app, this would come from a service
    const slots = [
      { id: 1, time: '9:00 AM - 12:00 PM' },
      { id: 2, time: '12:00 PM - 3:00 PM' },
      { id: 3, time: '3:00 PM - 6:00 PM' },
      { id: 4, time: '6:00 PM - 9:00 PM' }
    ];
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;