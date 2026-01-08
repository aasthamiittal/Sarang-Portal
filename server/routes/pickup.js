const express = require('express');
const Pickup = require('../models/Pickup');
const { auth } = require('../middleware/auth');
const { sendNotification } = require('../services/notificationService');

const router = express.Router();

// POST /api/pickup/request
router.post('/request', auth, async (req, res) => {
  try {
    const { orderId, pickupLocation, preferredSlot, manifests } = req.body;

    const pickup = new Pickup({
      orderId,
      pickupLocation,
      preferredSlot,
      manifests,
      userId: req.user.id,
      timeline: [{ status: 'REQUESTED', note: 'Pickup requested' }]
    });

    await pickup.save();
    res.status(201).json(pickup);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
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

// PUT /api/pickup/:id/schedule
router.put('/:id/schedule', auth, async (req, res) => {
  try {
    const { courier } = req.body;
    const pickup = await Pickup.findOne({ _id: req.params.id, userId: req.user.id });
    if (!pickup) {
      return res.status(404).json({ message: 'Pickup not found' });
    }
    if (pickup.status !== 'REQUESTED') {
      return res.status(400).json({ message: 'Pickup can only be scheduled from REQUESTED status' });
    }
    pickup.status = 'SCHEDULED';
    pickup.courier = courier;
    pickup.timeline.push({ status: 'SCHEDULED', note: 'Pickup scheduled' });
    await pickup.save();

    // Trigger notification for pickup scheduled
    await sendNotification('pickup_scheduled', req.user.id, {
      userName: req.user.name,
      pickupId: pickup.orderId,
      pickupLocation: pickup.pickupLocation,
      preferredSlot: pickup.preferredSlot
    });

    res.json(pickup);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// PUT /api/pickup/:id/pick
router.put('/:id/pick', auth, async (req, res) => {
  try {
    const pickup = await Pickup.findOne({ _id: req.params.id, userId: req.user.id });
    if (!pickup) {
      return res.status(404).json({ message: 'Pickup not found' });
    }
    if (pickup.status !== 'SCHEDULED') {
      return res.status(400).json({ message: 'Pickup can only be picked from SCHEDULED status' });
    }
    pickup.status = 'PICKED';
    pickup.timeline.push({ status: 'PICKED', note: 'Pickup completed' });
    await pickup.save();
    res.json(pickup);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// PUT /api/pickup/:id/fail
router.put('/:id/fail', auth, async (req, res) => {
  try {
    const { note } = req.body;
    const pickup = await Pickup.findOne({ _id: req.params.id, userId: req.user.id });
    if (!pickup) {
      return res.status(404).json({ message: 'Pickup not found' });
    }
    if (pickup.status === 'PICKED' || pickup.status === 'FAILED') {
      return res.status(400).json({ message: 'Pickup cannot be failed from current status' });
    }
    pickup.status = 'FAILED';
    pickup.timeline.push({ status: 'FAILED', note: note || 'Pickup failed' });
    await pickup.save();
    res.json(pickup);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;