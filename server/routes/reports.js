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

// GET /shipments - Get shipments data for reports
router.get('/shipments', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { user: req.user._id };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const shipments = await Shipment.find(query).sort({ createdAt: -1 });
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /shipments/export - Export shipments data
router.get('/shipments/export', async (req, res) => {
  try {
    const { startDate, endDate, format } = req.query;
    const query = { user: req.user._id };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const shipments = await Shipment.find(query).sort({ createdAt: -1 });

    if (format === 'csv') {
      // CSV export
      const csvHeaders = 'Order ID,Tracking Number,Status,Carrier,Weight,Cost,Pickup Date,Dispatch Date,Delivery Date\n';
      const csvRows = shipments.map(shipment =>
        `${shipment.orderId || ''},${shipment.trackingNumber},${shipment.status},${shipment.carrier},${shipment.weight},${shipment.cost},${shipment.pickupDate ? shipment.pickupDate.toISOString().split('T')[0] : ''},${shipment.dispatchDate ? shipment.dispatchDate.toISOString().split('T')[0] : ''},${shipment.deliveryDate ? shipment.deliveryDate.toISOString().split('T')[0] : ''}`
      ).join('\n');

      const csvContent = csvHeaders + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="shipments.csv"');
      res.send(csvContent);
    } else if (format === 'pdf') {
      // Mock PDF export - in real app, use a PDF library
      const pdfContent = `Shipment Report\n\n${shipments.map(s => `Order: ${s.orderId}, Tracking: ${s.trackingNumber}, Status: ${s.status}`).join('\n')}`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="shipments.pdf"');
      res.send(pdfContent);
    } else {
      res.status(400).json({ message: 'Invalid format. Use csv or pdf.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;