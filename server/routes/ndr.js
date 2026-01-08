const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const NdrCase = require('../models/NdrCase');
const Shipment = require('../models/Shipment');
const TrackingEvent = require('../models/TrackingEvent');
const Billing = require('../models/Billing');

router.use(auth);

// GET /api/ndr - List NDR cases for user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};

    // Find shipments for the user
    const userShipments = await Shipment.find({ user: req.user._id }).select('_id');
    const shipmentIds = userShipments.map(s => s._id);
    query.shipmentId = { $in: shipmentIds };

    if (status) {
      query.currentAction = status;
    }

    const ndrCases = await NdrCase.find(query)
      .populate('shipmentId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await NdrCase.countDocuments(query);

    res.json({
      ndrCases,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/ndr/:id/action - Perform action on NDR case
router.post('/:id/action', async (req, res) => {
  try {
    const { action, notes } = req.body; // action: 'REATTEMPT', 'RTO', 'HOLD'

    const ndrCase = await NdrCase.findById(req.params.id).populate('shipmentId');
    if (!ndrCase) {
      return res.status(404).json({ message: 'NDR case not found' });
    }

    // Check if shipment belongs to user
    if (ndrCase.shipmentId.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const shipment = ndrCase.shipmentId;
    let newStatus;

    if (action === 'REATTEMPT') {
      newStatus = 'OUT_FOR_DELIVERY';
      ndrCase.attempts += 1;
    } else if (action === 'RTO') {
      newStatus = 'RTO_INITIATED';
      // Calculate RTO cost - additional charge
      const rtoCost = shipment.cost * 0.5; // Example: 50% of original cost
      shipment.cost += rtoCost;

      // Create billing entry for RTO
      const billing = new Billing({
        shipment: shipment._id,
        amount: rtoCost,
        description: 'RTO Processing Fee'
      });
      await billing.save();
    } else if (action === 'HOLD') {
      newStatus = 'NDR'; // Stay in NDR but mark as hold
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    // Update NDR case
    ndrCase.currentAction = action;
    ndrCase.history.push({
      action,
      notes: notes || `Action performed: ${action}`
    });
    await ndrCase.save();

    // Update shipment status
    shipment.statusHistory.push({
      status: newStatus,
      note: `NDR action: ${action}`
    });
    await shipment.save();

    // Create tracking event
    const trackingEvent = new TrackingEvent({
      shipment: shipment._id,
      eventCode: newStatus,
      description: `NDR action: ${action}`,
      source: 'manual'
    });
    await trackingEvent.save();

    // If RTO, update to RTO_COMPLETED after some time (simplified)
    if (action === 'RTO') {
      setTimeout(async () => {
        shipment.statusHistory.push({
          status: 'RTO_COMPLETED',
          note: 'RTO completed'
        });
        await shipment.save();

        const completedEvent = new TrackingEvent({
          shipment: shipment._id,
          eventCode: 'RTO_COMPLETED',
          description: 'RTO process completed',
          source: 'system'
        });
        await completedEvent.save();
      }, 5000); // Simulate delay
    }

    res.json({ message: 'Action performed successfully', ndrCase });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;