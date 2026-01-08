const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Shipment = require('../models/Shipment');
const TrackingEvent = require('../models/TrackingEvent');
const Carrier = require('../models/Carrier');
const { getCarrierService } = require('../services/carriers');
const { mapCarrierStatus } = require('../services/statusMapper');
const RetryMechanism = require('../services/retryMechanism');

// Model for storing raw webhook payloads
const WebhookPayload = require('../models/WebhookPayload'); // We'll create this if needed

// POST /api/webhooks/carrier/:carrier
router.post('/carrier/:carrierName', async (req, res) => {
  const { carrierName } = req.params;
  const rawPayload = JSON.stringify(req.body);
  const signature = req.headers['x-signature'] || req.headers['x-webhook-signature'];

  try {
    // Find carrier
    const carrier = await Carrier.findOne({ name: new RegExp(`^${carrierName}$`, 'i') });
    if (!carrier) {
      return res.status(404).json({ message: 'Carrier not found' });
    }

    // Verify signature if carrier has webhook secret
    if (carrier.webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', carrier.webhookSecret)
        .update(rawPayload)
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(401).json({ message: 'Invalid signature' });
      }
    }

    // Store raw payload
    const payloadDoc = new WebhookPayload({
      carrier: carrier._id,
      payload: rawPayload,
      signature,
      receivedAt: new Date()
    });
    await payloadDoc.save();

    // Process webhook data
    await processWebhookData(carrier, req.body);

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

async function processWebhookData(carrier, payload) {
  const retryMech = new RetryMechanism();

  await retryMech.executeWithRetry(async () => {
    // Extract AWB and status from payload (carrier-specific parsing)
    const { awbNumber, status: carrierStatus, trackingEvents } = parseCarrierPayload(carrier.name, payload);

    if (!awbNumber) return;

    // Find shipment by AWB
    const shipment = await Shipment.findOne({ awbNumber });
    if (!shipment) {
      console.warn(`Shipment not found for AWB: ${awbNumber}`);
      return;
    }

    // Map status
    const internalStatus = mapCarrierStatus(carrier.name, carrierStatus);

    // Update shipment status if changed
    const currentStatus = await shipment.getCurrentStatus();
    if (internalStatus !== currentStatus) {
      shipment.statusHistory.push({
        status: internalStatus,
        note: `Updated via webhook from ${carrier.name}`,
        timestamp: new Date()
      });

      // Create tracking event
      const trackingEvent = new TrackingEvent({
        shipment: shipment._id,
        eventCode: internalStatus,
        description: `Status update from ${carrier.name} webhook`,
        source: 'courier',
        location: payload.location || ''
      });
      await trackingEvent.save();

      // Trigger exception flags based on status or payload
      if (internalStatus === 'NDR' || payload.status?.toLowerCase().includes('undelivered')) {
        if (!shipment.exceptionFlags.includes('DELIVERY_FAILED')) {
          shipment.exceptionFlags.push('DELIVERY_FAILED');
        }
      }
      if (payload.customsHold || payload.status?.toLowerCase().includes('customs')) {
        if (!shipment.exceptionFlags.includes('CUSTOMS_HOLD')) {
          shipment.exceptionFlags.push('CUSTOMS_HOLD');
        }
      }

      // Check for SLA breach (example: if delivery takes more than 7 days)
      const createdDate = shipment.createdAt;
      const now = new Date();
      const daysDiff = (now - createdDate) / (1000 * 60 * 60 * 24);
      if (daysDiff > 7 && !['DELIVERED', 'CANCELLED'].includes(internalStatus)) {
        if (!shipment.exceptionFlags.includes('SLA_BREACHED')) {
          shipment.exceptionFlags.push('SLA_BREACHED');
        }
      }

      // If NDR, create NDR case
      if (internalStatus === 'NDR') {
        const NdrCase = require('../models/NdrCase');
        const existingNdr = await NdrCase.findOne({ shipmentId: shipment._id });
        if (!existingNdr) {
          const ndrCase = new NdrCase({
            shipmentId: shipment._id,
            reason: payload.reason || 'Delivery failed',
            history: [{
              action: 'CREATED',
              notes: 'NDR case created from webhook'
            }]
          });
          await ndrCase.save();
        }
      }

      await shipment.save();
    }

    // Process additional tracking events if provided
    if (trackingEvents && Array.isArray(trackingEvents)) {
      for (const event of trackingEvents) {
        const mappedStatus = mapCarrierStatus(carrier.name, event.status);
        const existingEvent = await TrackingEvent.findOne({
          shipment: shipment._id,
          eventCode: mappedStatus,
          timestamp: new Date(event.timestamp)
        });

        if (!existingEvent) {
          const newEvent = new TrackingEvent({
            shipment: shipment._id,
            eventCode: mappedStatus,
            timestamp: new Date(event.timestamp),
            location: event.location,
            description: event.description,
            source: 'courier'
          });
          await newEvent.save();
        }
      }
    }
  }, { carrier: carrier.name, payload });
}

function parseCarrierPayload(carrierName, payload) {
  // Carrier-specific parsing logic
  switch (carrierName.toLowerCase()) {
    case 'fedex':
      return {
        awbNumber: payload.trackingNumber,
        status: payload.status,
        trackingEvents: payload.events
      };
    default:
      return {
        awbNumber: payload.awb || payload.trackingNumber,
        status: payload.status,
        trackingEvents: payload.trackingEvents
      };
  }
}

module.exports = router;