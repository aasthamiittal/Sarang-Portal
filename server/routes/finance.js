const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Shipment = require('../models/Shipment');
const User = require('../models/User');

// Middleware to check admin role
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

router.use(auth);
router.use(adminAuth);

// GET /profitability - Get profitability report
router.get('/profitability', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate && endDate) {
      match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const result = await Shipment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$cost' },
          totalCarrierCost: { $sum: { $ifNull: ['$carrierCost', 0] } },
          totalHandlingCost: { $sum: { $ifNull: ['$handlingCost', 0] } },
          count: { $sum: 1 }
        }
      }
    ]);

    if (result.length === 0) {
      return res.json({ totalRevenue: 0, totalCost: 0, totalMargin: 0, count: 0 });
    }

    const data = result[0];
    const totalCost = data.totalCarrierCost + data.totalHandlingCost;
    const totalMargin = data.totalRevenue - totalCost;

    res.json({
      totalRevenue: data.totalRevenue,
      totalCost,
      totalMargin,
      count: data.count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /sla - Get SLA compliance report
router.get('/sla', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { actualDelivery: { $exists: true }, expectedDelivery: { $exists: true } };
    if (startDate && endDate) {
      match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const result = await Shipment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalShipments: { $sum: 1 },
          onTimeDeliveries: {
            $sum: {
              $cond: [{ $lte: ['$actualDelivery', '$expectedDelivery'] }, 1, 0]
            }
          }
        }
      }
    ]);

    if (result.length === 0) {
      return res.json({ totalShipments: 0, onTimeDeliveries: 0, slaCompliance: 0 });
    }

    const data = result[0];
    const slaCompliance = data.totalShipments > 0 ? (data.onTimeDeliveries / data.totalShipments) * 100 : 0;

    res.json({
      totalShipments: data.totalShipments,
      onTimeDeliveries: data.onTimeDeliveries,
      slaCompliance: slaCompliance.toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;