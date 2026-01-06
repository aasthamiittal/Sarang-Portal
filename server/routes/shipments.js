const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Shipment = require('../models/Shipment');
const Billing = require('../models/Billing');
const Carrier = require('../models/Carrier');
const Rate = require('../models/Rate');
const AwbStock = require('../models/AwbStock');
const AccountLedger = require('../models/AccountLedger');
const TrackingEvent = require('../models/TrackingEvent');
const Pickup = require('../models/Pickup');
const Manifest = require('../models/Manifest');
const { randomUUID } = require('crypto');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { processShipmentBilling } = require('../services/billingService');

const { SHIPMENT_STATUSES, VALID_TRANSITIONS } = Shipment;

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

    // Get pickups in progress
    const pickupQuery = { userId: req.user._id, status: { $in: ['REQUESTED', 'SCHEDULED'] } };
    if (dateFilter) {
      pickupQuery.createdAt = query.createdAt;
    }
    const pickupsInProgress = await Pickup.countDocuments(pickupQuery);

    // Get open manifests
    const userShipments = await Shipment.find(query).select('_id');
    const shipmentIds = userShipments.map(s => s._id);
    const manifestQuery = { status: { $in: ['draft', 'edited'] }, shipments: { $in: shipmentIds } };
    if (dateFilter) {
      manifestQuery.uploadedAt = query.createdAt;
    }
    const openManifests = await Manifest.countDocuments(manifestQuery);

    // Get disputed orders (failed payment status)
    const disputedQuery = { user: req.user._id, paymentStatus: 'failed' };
    if (dateFilter) {
      disputedQuery.createdAt = query.createdAt;
    }
    const disputedOrders = await Shipment.countDocuments(disputedQuery);

    const summary = {
      pickupsInProgress,
      openManifests,
      disputedOrders
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET / - Retrieve all shipments for the authenticated user with filters
router.get('/', async (req, res) => {
  try {
    const { status, carrier, origin, destination, startDate, endDate, search, paymentStatus, page = 1, limit = 10 } = req.query;
    const query = { user: req.user._id };

    if (status) query.status = status;
    if (carrier) query.carrier = new RegExp(carrier, 'i');
    if (origin) query.origin = new RegExp(origin, 'i');
    if (destination) query.destination = new RegExp(destination, 'i');
    if (paymentStatus) query.paymentStatus = paymentStatus;
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

    // Populate current status from latest tracking event
    const shipmentsWithStatus = await Promise.all(
      shipments.map(async (shipment) => {
        const shipmentObj = shipment.toObject();
        const currentStatus = await shipment.getCurrentStatus();
        shipmentObj.status = currentStatus;
        return shipmentObj;
      })
    );

    const total = await Shipment.countDocuments(query);

    res.json({
      shipments: shipmentsWithStatus,
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
  console.log('POST /shipments called with body:', req.body);
  if (!origin || !destination || !carrier || !weight) {
    return res.status(400).json({ message: 'Origin, destination, carrier, and weight are required' });
  }
  try {
    const cost = parseFloat(weight) * 10;
    const trackingNumber = randomUUID();
    const orderId = 'ORD-' + Date.now();
    const initialStatus = status || 'DRAFT';

    // Validate initial status
    if (!SHIPMENT_STATUSES.includes(initialStatus)) {
      return res.status(400).json({ message: `Invalid status: ${initialStatus}. Valid statuses: ${SHIPMENT_STATUSES.join(', ')}` });
    }
    console.log('Creating shipment with orderId:', orderId);
    const shipment = new Shipment({
      orderId,
      trackingNumber,
      origin,
      destination,
      carrier,
      weight,
      cost,
      customerInfo,
      productInfo,
      orderNotes,
      pickupAddress,
      billingSameAsShipping,
      user: req.user._id,
      statusHistory: [{ status: initialStatus, note: 'Order created' }]
    });
    console.log('Shipment _id:', shipment._id);
    // Create initial tracking event
    const initialTrackingEvent = new TrackingEvent({
      shipment: shipment._id,
      eventCode: initialStatus,
      description: 'Order created',
      source: 'system'
    });
    console.log('Saving tracking event');
    await initialTrackingEvent.save();
    console.log('Tracking event saved');
    console.log('Saving shipment');
    await shipment.save();
    console.log('Shipment saved');
    const billing = new Billing({
      shipment: shipment._id,
      amount: cost
    });
    console.log('Saving billing');
    await billing.save();
    console.log('Billing saved');
    res.status(201).json(shipment);
  } catch (err) {
    console.error('Error in POST /shipments:', err);
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

    const shipmentIds = shipments.map(s => s._id);
    let statusCounts = {};
    if (shipmentIds.length > 0) {
      const aggResult = await TrackingEvent.aggregate([
        { $match: { shipment: { $in: shipmentIds } } },
        { $sort: { shipment: 1, timestamp: -1 } },
        { $group: { _id: "$shipment", latestEvent: { $first: "$eventCode" } } },
        { $group: { _id: "$latestEvent", count: { $sum: 1 } } }
      ]);
      aggResult.forEach(item => {
        statusCounts[item._id] = item.count;
      });
    }
    const summary = {
      allOrders: shipments.length,
      draftedOrders: statusCounts['DRAFT'] || 0,
      pendingForLabel: statusCounts['BOOKED'] || 0,
      packedOrders: statusCounts['PACKED'] || 0,
      dispatchedOrders: statusCounts['DISPATCHED'] || 0,
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

    // Populate current status from latest tracking event
    const shipmentsWithStatus = await Promise.all(
      shipments.map(async (shipment) => {
        const shipmentObj = shipment.toObject();
        const currentStatus = await shipment.getCurrentStatus();
        shipmentObj.status = currentStatus;
        return shipmentObj;
      })
    );

    const metrics = {
      bookingCount: shipmentsWithStatus.length,
      deliveredCount: shipmentsWithStatus.filter(s => s.status === 'DELIVERED').length,
      pendingCount: shipmentsWithStatus.filter(s => ['DRAFT', 'BOOKED', 'PACKED'].includes(s.status)).length,
      recentShipments: shipmentsWithStatus
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

// GET /export - Export shipments to CSV
router.get('/export', async (req, res) => {
  try {
    const { status, carrier, startDate, endDate, paymentStatus } = req.query;
    const query = { user: req.user._id };

    if (status) query.status = status;
    if (carrier) query.carrier = new RegExp(carrier, 'i');
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const shipments = await Shipment.find(query).sort({ createdAt: -1 });

    // Populate current status from latest tracking event
    const shipmentsWithStatus = await Promise.all(
      shipments.map(async (shipment) => {
        const shipmentObj = shipment.toObject();
        const currentStatus = await shipment.getCurrentStatus();
        shipmentObj.status = currentStatus;
        return shipmentObj;
      })
    );

    // Create CSV content
    const csvHeaders = 'Order ID,Tracking Number,Status,Origin,Destination,Carrier,Weight,Cost,Pickup Date,Dispatch Date,Delivery Date\n';
    const csvRows = shipmentsWithStatus.map(shipment =>
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

    // Check if label has been generated (AWB assigned)
    if (!shipment.awbNumber || !shipment.labelGeneratedAt) {
      return res.status(400).json({ message: 'Label not generated yet. Please generate label first by updating status to LABEL_GENERATED.' });
    }

    // Generate label content with AWB
    const labelContent = `
      AWB Label
      Order ID: ${shipment.orderId}
      Tracking Number: ${shipment.trackingNumber}
      AWB Number: ${shipment.awbNumber}
      Carrier: ${shipment.carrier}
      From: ${shipment.origin}
      To: ${shipment.destination}
      Weight: ${shipment.weight}kg
      Customer: ${shipment.customerInfo ? `${shipment.customerInfo.firstName} ${shipment.customerInfo.lastName}` : 'N/A'}
      Status: ${shipment.status}
      Generated At: ${shipment.labelGeneratedAt.toISOString()}
    `;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="label-${shipment.awbNumber}.txt"`);
    res.send(labelContent);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /:id/events - Retrieve tracking events for a shipment
router.get('/:id/events', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, user: req.user._id });
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    const events = await TrackingEvent.find({ shipment: req.params.id }).sort({ timestamp: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
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

    // Check if shipment is locked (manifest submitted)
    if (shipment.manifestSubmittedAt) {
      return res.status(400).json({
        message: 'Cannot edit shipment after manifest submission',
        lockReason: 'Manifest already submitted'
      });
    }

    const oldStatus = await shipment.getCurrentStatus();
    const newStatus = req.body.status;

    // Validate status transition
    if (newStatus && newStatus !== oldStatus) {
      if (!VALID_TRANSITIONS[oldStatus] || !VALID_TRANSITIONS[oldStatus].includes(newStatus)) {
        return res.status(400).json({
          message: `Invalid status transition from ${oldStatus} to ${newStatus}`,
          validTransitions: VALID_TRANSITIONS[oldStatus] || []
        });
      }
    }

    Object.assign(shipment, req.body);

    if (req.body.weight) {
      shipment.cost = parseFloat(req.body.weight) * 10;
    }

    // Handle label generation and AWB consumption
    if (newStatus === 'LABEL_GENERATED' && oldStatus !== 'LABEL_GENERATED') {
      // Find available AWB for the carrier
      const carrier = await Carrier.findOne({ name: shipment.carrier });
      if (!carrier) {
        return res.status(400).json({ message: 'Carrier not found' });
      }

      const availableAwb = await AwbStock.findOne({ courierId: carrier._id, status: 'available' });
      if (!availableAwb) {
        return res.status(400).json({ message: 'No available AWB stock for this carrier' });
      }

      // Assign AWB to shipment
      availableAwb.status = 'used';
      availableAwb.assignedShipmentId = shipment._id;
      availableAwb.updatedAt = new Date();
      await availableAwb.save();

      shipment.awbNumber = availableAwb.awbNumber;
      shipment.labelGeneratedAt = new Date();
    }

    if (newStatus && newStatus !== oldStatus) {
      shipment.statusHistory.push({
        status: newStatus,
        note: req.body.note || `Status changed from ${oldStatus} to ${newStatus}`
      });

      // Create tracking event
      const trackingEvent = new TrackingEvent({
        shipment: shipment._id,
        eventCode: newStatus,
        description: req.body.note || `Status changed to ${newStatus}`,
        source: 'manual'
      });
      await trackingEvent.save();

      // Process billing for the event
      await processShipmentBilling(shipment._id, newStatus, req.user._id);
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
        const status = data.status || 'DRAFT';

        // Validate status
        if (!SHIPMENT_STATUSES.includes(status)) {
          errors.push({ row: shipments.length + 1, message: `Invalid status: ${status}` });
          return;
        }

        shipments.push({
          orderId: 'ORD-' + Date.now() + '-' + shipments.length,
          trackingNumber,
          origin: data.origin,
          destination: data.destination,
          carrier: data.carrier,
          weight: parseFloat(data.weight),
          cost,
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

        // Create initial tracking events
        const trackingEvents = insertedShipments.map(shipment => ({
          shipment: shipment._id,
          eventCode: shipment.statusHistory[0].status,
          description: 'Bulk uploaded',
          source: 'system'
        }));
        await TrackingEvent.insertMany(trackingEvents);

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

module.exports = router;