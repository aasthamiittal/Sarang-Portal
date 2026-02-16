const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');
const TrackingEvent = require('../models/TrackingEvent');
const { getCarrierNameForShipment } = require('../services/carrierResolver');

// Public tracking endpoint - no authentication required
router.get('/track', async (req, res) => {
  try {
    const { trackingNumber, secureToken } = req.query;

    if (!trackingNumber && !secureToken) {
      return res.status(400).json({ message: 'Tracking number or secure token is required.' });
    }

    let query = {};
    if (trackingNumber) {
      // Basic validation for trackingNumber format (e.g., alphanumeric, max length)
      if (!/^[a-zA-Z0-9]{5,30}$/.test(trackingNumber)) {
        return res.status(400).json({ message: 'Invalid tracking number format.' });
      }
      query.trackingNumber = trackingNumber;
    } else if (secureToken) {
      // Basic validation for secureToken format (e.g., hex string, fixed length)
      if (!/^[0-9a-fA-F]{32}$/.test(secureToken)) { // Assuming 16 bytes = 32 hex chars
        return res.status(400).json({ message: 'Invalid secure token format.' });
      }
      query.secureToken = secureToken;
    }

    const shipment = await Shipment.findOne(query)
      .select('-user -__v -cost -carrierCost -handlingCost -paymentStatus -exceptionFlags -statusHistory -updatedAt -createdAt -deliveryDetails')
      .populate('carrierId', 'name');

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found or unauthorized access.' });
    }

    // Fetch public tracking events for this shipment
    const events = await TrackingEvent.find({ shipment: shipment._id, isPublic: true }).sort({ timestamp: 1 });

    res.json({
      shipment: {
        orderId: shipment.orderId,
        trackingNumber: shipment.trackingNumber,
        awbNumber: shipment.awbNumber,
        origin: shipment.origin,
        destination: shipment.destination,
        carrier: getCarrierNameForShipment(shipment) || shipment.carrier,
        weight: shipment.weight,
        expectedDelivery: shipment.expectedDelivery,
        actualDelivery: shipment.actualDelivery,
        status: events.length > 0 ? events[events.length - 1].eventCode : 'UNKNOWN',
        deliveryDetails: shipment.deliveryDetails, // Reconfirm if this should be public
      },
      trackingEvents: events.map(event => ({
        eventCode: event.eventCode,
        timestamp: event.timestamp,
        location: event.location,
        description: event.description,
      })),
    });
  } catch (err) {
    console.error('Error in GET /public/track:', err);
    // Provide a generic error message to prevent information leakage
    res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
});

module.exports = router;