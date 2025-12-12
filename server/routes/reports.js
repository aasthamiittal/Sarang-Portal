const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Shipment = require('../models/Shipment');

router.use(auth);

// GET /shipments-summary - Aggregate data for shipments
router.get('/shipments-summary', async (req, res) => {
  try {
    const summary = await Shipment.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalShipments: { $sum: 1 },
          totalCost: { $sum: "$cost" },
          statusCounts: { $push: "$status" }
        }
      },
      {
        $project: {
          _id: 0,
          totalShipments: 1,
          totalCost: 1,
          statusCounts: {
            pending: { $size: { $filter: { input: "$statusCounts", cond: { $eq: ["$$this", "pending"] } } } },
            inTransit: { $size: { $filter: { input: "$statusCounts", cond: { $eq: ["$$this", "in-transit"] } } } },
            delivered: { $size: { $filter: { input: "$statusCounts", cond: { $eq: ["$$this", "delivered"] } } } },
            cancelled: { $size: { $filter: { input: "$statusCounts", cond: { $eq: ["$$this", "cancelled"] } } } }
          }
        }
      }
    ]);
    const result = summary[0] || { totalShipments: 0, totalCost: 0, statusCounts: { pending: 0, inTransit: 0, delivered: 0, cancelled: 0 } };
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /daily-shipments
router.get('/daily-shipments', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { user: req.user._id };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }
    const daily = await Shipment.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          totalWeight: { $sum: '$weight' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    res.json(daily);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /status-summary
router.get('/status-summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { user: req.user._id };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }
    const summary = await Shipment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' }
        }
      }
    ]);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /revenue-summary
router.get('/revenue-summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { user: req.user._id };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }
    const revenue = await Shipment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$cost' },
          totalShipments: { $sum: 1 },
          averageCost: { $avg: '$cost' }
        }
      }
    ]);
    res.json(revenue[0] || { totalRevenue: 0, totalShipments: 0, averageCost: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;