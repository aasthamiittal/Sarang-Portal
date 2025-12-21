const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Shipment = require('../models/Shipment');
const Carrier = require('../models/Carrier');
const Manifest = require('../models/Manifest');

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

// GET /daily-booking - Daily booking report
router.get('/daily-booking', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { user: req.user._id };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const report = await Shipment.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          bookings: { $sum: 1 },
          totalWeight: { $sum: '$weight' },
          totalCost: { $sum: '$cost' },
          carriers: { $addToSet: '$carrier' }
        }
      },
      {
        $project: {
          date: '$_id',
          bookings: 1,
          totalWeight: 1,
          totalCost: 1,
          uniqueCarriers: { $size: '$carriers' },
          _id: 0
        }
      },
      { $sort: { date: -1 } }
    ]);

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /shipment-status - Shipment status report
router.get('/shipment-status', async (req, res) => {
  try {
    const { startDate, endDate, carrier, status } = req.query;
    const match = { user: req.user._id };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    if (carrier) match.carrier = carrier;
    if (status) match.status = status;

    const report = await Shipment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          totalWeight: { $sum: '$weight' },
          avgWeight: { $avg: '$weight' },
          avgCost: { $avg: '$cost' }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          totalCost: 1,
          totalWeight: 1,
          avgWeight: { $round: ['$avgWeight', 2] },
          avgCost: { $round: ['$avgCost', 2] },
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /courier-wise - Courier-wise aggregation report
router.get('/courier-wise', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { user: req.user._id };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const report = await Shipment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$carrier',
          totalShipments: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          totalWeight: { $sum: '$weight' },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          inTransit: {
            $sum: { $cond: [{ $eq: ['$status', 'in-transit'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          courier: '$_id',
          totalShipments: 1,
          totalCost: 1,
          totalWeight: 1,
          delivered: 1,
          inTransit: 1,
          pending: 1,
          cancelled: 1,
          deliveryRate: {
            $round: [
              { $multiply: [{ $divide: ['$delivered', '$totalShipments'] }, 100] },
              2
            ]
          },
          _id: 0
        }
      },
      { $sort: { totalShipments: -1 } }
    ]);

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;