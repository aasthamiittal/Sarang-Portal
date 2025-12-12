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

module.exports = router;