const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CustomInvoice = require('../models/CustomInvoice');
const Shipment = require('../models/Shipment');
const Manifest = require('../models/Manifest');

router.use(auth);

// POST /invoices - Generate custom invoice
router.post('/invoices', async (req, res) => {
  try {
    const { shipmentId, manifestId, hsCode, declaredValue, originCountry, invoiceNumber, currency } = req.body;

    // Validate shipment exists and belongs to user
    const shipment = await Shipment.findOne({ _id: shipmentId, user: req.user.id });
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    let manifest = null;
    if (manifestId) {
      manifest = await Manifest.findOne({ _id: manifestId, shipment: shipmentId });
      if (!manifest) {
        return res.status(404).json({ message: 'Manifest not found' });
      }
    }

    // Check if invoice already exists
    const existingInvoice = await CustomInvoice.findOne({ shipment: shipmentId });
    if (existingInvoice) {
      return res.status(400).json({ message: 'Invoice already exists for this shipment' });
    }

    const invoice = new CustomInvoice({
      shipment: shipmentId,
      manifest: manifestId,
      hsCode,
      declaredValue,
      originCountry,
      invoiceNumber,
      currency: currency || 'USD'
    });

    await invoice.save();
    await invoice.populate(['shipment', 'manifest']);

    res.status(201).json(invoice);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Invoice number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// GET /invoices - Fetch invoices
router.get('/invoices', async (req, res) => {
  try {
    const { shipmentId, manifestId } = req.query;
    const query = {};

    if (shipmentId) {
      query.shipment = shipmentId;
      // Ensure shipment belongs to user
      const shipment = await Shipment.findOne({ _id: shipmentId, user: req.user.id });
      if (!shipment) {
        return res.status(404).json({ message: 'Shipment not found' });
      }
    } else {
      // Get all invoices for user's shipments
      const userShipments = await Shipment.find({ user: req.user.id }).select('_id');
      query.shipment = { $in: userShipments.map(s => s._id) };
    }

    if (manifestId) {
      query.manifest = manifestId;
    }

    const invoices = await CustomInvoice.find(query)
      .populate('shipment')
      .populate('manifest')
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /invoices/:id - Get specific invoice
router.get('/invoices/:id', async (req, res) => {
  try {
    const invoice = await CustomInvoice.findById(req.params.id)
      .populate('shipment')
      .populate('manifest');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if shipment belongs to user
    if (invoice.shipment.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /invoices/:id - Update invoice
router.put('/invoices/:id', async (req, res) => {
  try {
    const invoice = await CustomInvoice.findById(req.params.id).populate('shipment');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if shipment belongs to user
    if (invoice.shipment.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(invoice, req.body);
    invoice.updatedAt = new Date();
    await invoice.save();

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /invoices/:id/download - Print/download customs invoice
router.get('/invoices/:id/download', async (req, res) => {
  try {
    const invoice = await CustomInvoice.findById(req.params.id)
      .populate('shipment')
      .populate('manifest');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if shipment belongs to user
    if (invoice.shipment.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate simple text invoice (in real app, this would generate PDF)
    const invoiceContent = `
CUSTOMS INVOICE
================

Invoice Number: ${invoice.invoiceNumber}
Date: ${invoice.createdAt.toLocaleDateString()}

Shipment Details:
- Order ID: ${invoice.shipment.orderId}
- Tracking: ${invoice.shipment.trackingNumber}
- From: ${invoice.shipment.origin}
- To: ${invoice.shipment.destination}

Customs Information:
- HS Code: ${invoice.hsCode}
- Declared Value: ${invoice.currency} ${invoice.declaredValue}
- Origin Country: ${invoice.originCountry}

Product Information:
- Description: ${invoice.shipment.productInfo?.description || 'N/A'}
- Quantity: ${invoice.shipment.productInfo?.quantity || 'N/A'}
- Weight: ${invoice.shipment.weight}kg

================
Generated on: ${new Date().toLocaleString()}
    `;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="customs-invoice-${invoice.invoiceNumber}.txt"`);
    res.send(invoiceContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;