const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const AwbStock = require('../models/AwbStock');
const Carrier = require('../models/Carrier');
const Shipment = require('../models/Shipment');
const { getCarrierForShipment } = require('../services/carrierResolver');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

router.use(auth);

// POST /upload - Upload AWB stock (CSV + manual)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { courierId, awbNumbers } = req.body;
    const awbs = [];

    // Validate courier exists
    const carrier = await Carrier.findById(courierId);
    if (!carrier) {
      return res.status(404).json({ message: 'Courier not found' });
    }

    if (req.file) {
      // CSV upload
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (data) => {
            if (data.awbNumber) {
              awbs.push({
                courierId,
                awbNumber: data.awbNumber.trim(),
                status: 'available'
              });
            }
          })
          .on('end', () => {
            fs.unlinkSync(req.file.path);
            resolve();
          })
          .on('error', (err) => {
            if (req.file) fs.unlinkSync(req.file.path);
            reject(err);
          });
      });
    } else if (awbNumbers) {
      // Manual entry (comma-separated)
      const numbers = awbNumbers.split(',').map(n => n.trim()).filter(n => n);
      numbers.forEach(number => {
        awbs.push({
          courierId,
          awbNumber: number,
          status: 'available'
        });
      });
    }

    if (awbs.length === 0) {
      return res.status(400).json({ message: 'No AWB numbers provided' });
    }

    // Check for duplicates
    const existingAwbs = await AwbStock.find({
      awbNumber: { $in: awbs.map(a => a.awbNumber) }
    });
    if (existingAwbs.length > 0) {
      return res.status(400).json({
        message: 'Some AWB numbers already exist',
        duplicates: existingAwbs.map(a => a.awbNumber)
      });
    }

    const insertedAwbs = await AwbStock.insertMany(awbs);
    res.status(201).json({
      message: `${insertedAwbs.length} AWB numbers uploaded successfully`
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: error.message });
  }
});

// GET /available/:courierId - Fetch available AWB count per courier
router.get('/available/:courierId', async (req, res) => {
  try {
    const count = await AwbStock.countDocuments({
      courierId: req.params.courierId,
      status: 'available'
    });
    res.json({ availableCount: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /assign/:shipmentId - Auto-assign AWB during shipment booking
router.post('/assign/:shipmentId', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      _id: req.params.shipmentId,
      user: req.user.id
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    if (shipment.awbNumber) {
      return res.status(400).json({ message: 'AWB already assigned to this shipment' });
    }

    const carrier = await getCarrierForShipment(shipment);
    if (!carrier) {
      return res.status(404).json({ message: 'Carrier not found' });
    }

    // Find available AWB
    const availableAwb = await AwbStock.findOne({
      courierId: carrier._id,
      status: 'available'
    });

    if (!availableAwb) {
      return res.status(400).json({ message: 'No available AWB numbers for this courier' });
    }

    // Assign AWB
    availableAwb.status = 'used';
    availableAwb.assignedShipmentId = shipment._id;
    availableAwb.updatedAt = new Date();
    await availableAwb.save();

    // Update shipment
    shipment.awbNumber = availableAwb.awbNumber;
    shipment.updatedAt = new Date();
    await shipment.save();

    res.json({
      awbNumber: availableAwb.awbNumber,
      message: 'AWB assigned successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /search - Search shipment by AWB number
router.get('/search', async (req, res) => {
  try {
    const { awbNumber } = req.query;
    if (!awbNumber) {
      return res.status(400).json({ message: 'AWB number is required' });
    }

    const awbStock = await AwbStock.findOne({ awbNumber })
      .populate('courierId')
      .populate({
        path: 'assignedShipmentId',
        populate: { path: 'user' }
      });

    if (!awbStock) {
      return res.status(404).json({ message: 'AWB number not found' });
    }

    // Check if shipment belongs to user
    if (awbStock.assignedShipmentId && awbStock.assignedShipmentId.user._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(awbStock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;