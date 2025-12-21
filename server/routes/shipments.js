const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Shipment = require('../models/Shipment');
const Billing = require('../models/Billing');
const Carrier = require('../models/Carrier');
const Rate = require('../models/Rate');
const AwbStock = require('../models/AwbStock');
const AccountLedger = require('../models/AccountLedger');
const { randomUUID } = require('crypto');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

router.use(auth);

// GET /actions-summary - Get actions summary for dashboard
router.get('/actions-summary', async (req, res) => {
  try {
    const { dateFilter } = req.query;
    const query = { user: req.user._id };

    // Apply date filter similar to above
    if (dateFilter) {
      const now = new Date();
      let startDate;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          query.createdAt = { $gte: startDate, $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
          break;
        case 'last7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          query.createdAt = { $gte: startDate };
          break;
        case 'last30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          query.createdAt = { $gte: startDate };
          break;
      }

      if (dateFilter === 'today') {
        query.createdAt = { $gte: startDate };
      }
    }

    // Mock data - in real app, these would come from actual models
    const summary = {
      pickupsInProgress: Math.floor(Math.random() * 5), // Mock
      openManifests: Math.floor(Math.random() * 3), // Mock
      disputedOrders: Math.floor(Math.random() * 2) // Mock
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET / - Retrieve all shipments for the authenticated user with filters
router.get('/', async (req, res) => {
  try {
    const { status, carrier, origin, destination, startDate, endDate, search, page = 1, limit = 10 } = req.query;
    const query = { user: req.user._id };

    if (status) query.status = status;
    if (carrier) query.carrier = new RegExp(carrier, 'i');
    if (origin) query.origin = new RegExp(origin, 'i');
    if (destination) query.destination = new RegExp(destination, 'i');
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { trackingNumber: new RegExp(search, 'i') },
        { awbNumber: new RegExp(search, 'i') },
        { orderId: new RegExp(search, 'i') },
        { origin: new RegExp(search, 'i') },
        { destination: new RegExp(search, 'i') },
        { carrier: new RegExp(search, 'i') }
      ];
    }

    const shipments = await Shipment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Shipment.countDocuments(query);

    res.json({
      shipments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST / - Create a new shipment
router.post('/', async (req, res) => {
  const { origin, destination, carrier, weight, status, customerInfo, productInfo, orderNotes, pickupAddress, billingSameAsShipping } = req.body;
  if (!origin || !destination || !carrier || !weight) {
    return res.status(400).json({ message: 'Origin, destination, carrier, and weight are required' });
  }
  try {
    const cost = parseFloat(weight) * 10;
    const trackingNumber = randomUUID();
    const orderId = 'ORD-' + Date.now();
    const initialStatus = status || 'draft';
    const shipment = new Shipment({
      orderId,
      trackingNumber,
      origin,
      destination,
      carrier,
      weight,
      cost,
      status: initialStatus,
      customerInfo,
      productInfo,
      orderNotes,
      pickupAddress,
      billingSameAsShipping,
      user: req.user._id,
      statusHistory: [{ status: initialStatus, note: 'Order created' }]
    });
    await shipment.save();
    const billing = new Billing({
      shipment: shipment._id,
      amount: cost
    });
    await billing.save();
    res.status(201).json(shipment);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Tracking number already exists' });
    } else {
      res.status(500).json({ message: err.message });
    }
  }
});

// GET /dashboard-summary - Get order summary for dashboard
router.get('/dashboard-summary', async (req, res) => {
  try {
    const { dateFilter } = req.query;
    const query = { user: req.user._id };

    // Apply date filter
    if (dateFilter) {
      const now = new Date();
      let startDate;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          query.createdAt = { $gte: startDate, $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
          break;
        case 'last7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          query.createdAt = { $gte: startDate };
          break;
        case 'last30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          query.createdAt = { $gte: startDate };
          break;
        default:
          // custom range or no filter
          break;
      }

      if (dateFilter === 'today') {
        query.createdAt = { $gte: startDate };
      }
    }

    const shipments = await Shipment.find(query);

    // Get AWB stock count
    const carriers = await Carrier.find({ isActive: true });
    const awbStockPromises = carriers.map(carrier =>
      AwbStock.countDocuments({ courierId: carrier._id, status: 'available' })
    );
    const awbCounts = await Promise.all(awbStockPromises);
    const totalAwbStock = awbCounts.reduce((sum, count) => sum + count, 0);

    // Get credit balance
    const ledgerEntries = await AccountLedger.find({ user: req.user._id }).sort({ createdAt: 1 });
    let creditBalance = 0;
    ledgerEntries.forEach(entry => {
      if (entry.type === 'credit') {
        creditBalance += entry.amount;
      } else {
        creditBalance -= entry.amount;
      }
    });

    const summary = {
      allOrders: shipments.length,
      draftedOrders: shipments.filter(s => s.status === 'draft').length,
      pendingForLabel: shipments.filter(s => s.status === 'pending-label').length,
      packedOrders: shipments.filter(s => s.status === 'packed').length,
      dispatchedOrders: shipments.filter(s => s.status === 'dispatched').length,
      awbStockRemaining: totalAwbStock,
      creditBalance: creditBalance
    };

    res.json(summary);
  } catch (error) {
    console.error('Error in dashboard-summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /ops-metrics - Get ops-focused dashboard metrics
router.get('/ops-metrics', async (req, res) => {
  try {
    const { dateFilter } = req.query;
    const query = { user: req.user._id };

    // Apply date filter similar to dashboard-summary
    if (dateFilter) {
      const now = new Date();
      let startDate;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          query.createdAt = { $gte: startDate };
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          query.createdAt = { $gte: startDate, $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
          break;
        case 'last7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          query.createdAt = { $gte: startDate };
          break;
        case 'last30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          query.createdAt = { $gte: startDate };
          break;
      }
    }

    const shipments = await Shipment.find(query);

    const metrics = {
      bookingCount: shipments.length,
      deliveredCount: shipments.filter(s => s.status === 'delivered').length,
      pendingCount: shipments.filter(s => ['draft', 'pending-label', 'packed'].includes(s.status)).length,
      recentShipments: shipments
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(s => ({
          id: s._id.toString(),
          orderId: s.orderId,
          trackingNumber: s.trackingNumber,
          status: s.status,
          carrier: s.carrier,
          createdAt: s.createdAt
        }))
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error in ops-metrics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /:id - Retrieve a specific shipment by ID
router.get('/:id', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, user: req.user._id });
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /:id - Update a shipment by ID
router.put('/:id', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, user: req.user._id });
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Check if shipment is locked (label generated or manifest submitted)
    if (shipment.labelGeneratedAt || shipment.manifestSubmittedAt) {
      return res.status(400).json({
        message: 'Cannot edit shipment after label generation or manifest submission',
        lockReason: shipment.labelGeneratedAt ? 'Label already generated' : 'Manifest already submitted'
      });
    }

    const oldStatus = shipment.status;
    Object.assign(shipment, req.body);

    if (req.body.status && req.body.status !== oldStatus) {
      shipment.statusHistory.push({
        status: req.body.status,
        note: req.body.note || `Status changed from ${oldStatus} to ${req.body.status}`
      });
    }

    shipment.updatedAt = new Date();
    await shipment.save();
    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /:id - Delete a shipment by ID
router.delete('/:id', async (req, res) => {
  try {
    const shipment = await Shipment.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json({ message: 'Shipment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /bulk - Bulk upload shipments from CSV
router.post('/bulk', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const shipments = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        // Validate required fields
        if (!data.origin || !data.destination || !data.carrier || !data.weight) {
          errors.push({ row: shipments.length + 1, message: 'Missing required fields' });
          return;
        }

        const cost = parseFloat(data.weight) * 10;
        const trackingNumber = randomUUID();
        const status = data.status || 'pending';

        shipments.push({
          orderId: 'ORD-' + Date.now() + '-' + shipments.length,
          trackingNumber,
          origin: data.origin,
          destination: data.destination,
          carrier: data.carrier,
          weight: parseFloat(data.weight),
          cost,
          status,
          user: req.user._id,
          statusHistory: [{ status, note: 'Bulk uploaded' }]
        });
      })
      .on('end', async () => {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        if (errors.length > 0) {
          return res.status(400).json({ message: 'Validation errors', errors });
        }

        // Insert shipments
        const insertedShipments = await Shipment.insertMany(shipments);

        // Create billings
        const billings = insertedShipments.map(shipment => ({
          shipment: shipment._id,
          amount: shipment.cost
        }));
        await Billing.insertMany(billings);

        res.status(201).json({ message: `${shipments.length} shipments created successfully` });
      })
      .on('error', (err) => {
        fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Error processing CSV' });
      });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: err.message });
  }
});



// GET /export - Export shipments to CSV
router.get('/export', async (req, res) => {
  try {
    const { status, carrier, startDate, endDate } = req.query;
    const query = { user: req.user._id };

    if (status) query.status = status;
    if (carrier) query.carrier = new RegExp(carrier, 'i');
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const shipments = await Shipment.find(query).sort({ createdAt: -1 });

    // Create CSV content
    const csvHeaders = 'Order ID,Tracking Number,Status,Origin,Destination,Carrier,Weight,Cost,Pickup Date,Dispatch Date,Delivery Date\n';
    const csvRows = shipments.map(shipment =>
      `${shipment.orderId},${shipment.trackingNumber},${shipment.status},${shipment.origin},${shipment.destination},${shipment.carrier},${shipment.weight},${shipment.cost},${shipment.pickupDate ? shipment.pickupDate.toISOString().split('T')[0] : ''},${shipment.dispatchDate ? shipment.dispatchDate.toISOString().split('T')[0] : ''},${shipment.deliveryDate ? shipment.deliveryDate.toISOString().split('T')[0] : ''}`
    ).join('\n');

    const csvContent = csvHeaders + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="shipments.csv"');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /:id/label - Generate AWB label
router.get('/:id/label', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, user: req.user._id });
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Mock label generation - in real app, this would generate a PDF or image
    const labelContent = `
      AWB Label
      Order ID: ${shipment.orderId}
      Tracking: ${shipment.trackingNumber}
      From: ${shipment.origin}
      To: ${shipment.destination}
      Weight: ${shipment.weight}kg
      Status: ${shipment.status}
    `;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="label-${shipment.trackingNumber}.txt"`);
    res.send(labelContent);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;