const Shipment = require('../models/Shipment');
const TrackingEvent = require('../models/TrackingEvent');
const TrackingSyncLog = require('../models/TrackingSyncLog');
const { getCarrierService } = require('./carriers');
const { mapCarrierStatus } = require('./statusMapper');
const { getCarrierForShipment } = require('./carrierResolver');
const RetryMechanism = require('./retryMechanism');

class TrackingSyncService {
  constructor() {
    this.retryMech = new RetryMechanism(3, 2000);
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Poll every 5 minutes
    setInterval(() => {
      this.syncAllShipments();
    }, 5 * 60 * 1000);

    console.log('Tracking sync service started');
  }

  stop() {
    this.isRunning = false;
  }

  async syncAllShipments() {
    try {
      // Find shipments that are not delivered and have AWB
      const shipments = await Shipment.find({
        awbNumber: { $exists: true, $ne: null },
        $and: [
          { $or: [{ status: { $ne: 'DELIVERED' } }, { status: { $exists: false } }] },
          {
            statusHistory: {
              $not: { $elemMatch: { status: 'DELIVERED' } }
            }
          }
        ]
      }).populate('carrierId');

      for (const shipment of shipments) {
        await this.syncShipmentTracking(shipment);
      }
    } catch (error) {
      console.error('Error in syncAllShipments:', error);
    }
  }

  async syncShipmentTracking(shipment) {
    try {
      const carrier = await getCarrierForShipment(shipment);
      if (!carrier || !carrier.apiKey) {
        await TrackingSyncLog.create({
          user: shipment.user,
          shipment: shipment._id,
          status: 'failed',
          errorMessage: 'Carrier not found or API key missing'
        });
        return;
      }

      const carrierService = getCarrierService(carrier);

      await this.retryMech.executeWithRetry(async () => {
        const trackingData = await carrierService.fetchTracking(shipment.awbNumber);

        for (const event of trackingData) {
          const internalStatus = mapCarrierStatus(carrier.name, event.status);

          // Check if event already exists
          const existingEvent = await TrackingEvent.findOne({
            shipment: shipment._id,
            eventCode: internalStatus,
            timestamp: event.timestamp
          });

          if (!existingEvent) {
            const newEvent = new TrackingEvent({
              shipment: shipment._id,
              eventCode: internalStatus,
              timestamp: event.timestamp,
              location: event.location,
              description: event.description,
              source: 'courier'
            });
            await newEvent.save();

            // Update shipment status if it's a new status
            const currentStatus = shipment.status || await shipment.getCurrentStatus();
            if (internalStatus !== currentStatus) {
              shipment.status = internalStatus;
              shipment.statusHistory.push({
                status: internalStatus,
                note: `Auto-sync from ${carrier.name}`,
                timestamp: new Date()
              });
              await shipment.save();
            }
          }
        }
      }, { shipmentId: shipment._id, awb: shipment.awbNumber });

      // Log success
      await TrackingSyncLog.create({
        user: shipment.user,
        shipment: shipment._id,
        status: 'success'
      });
    } catch (error) {
      console.error(`Failed to sync tracking for shipment ${shipment._id}:`, error.message);
      // Log failure
      await TrackingSyncLog.create({
        user: shipment.user,
        shipment: shipment._id,
        status: 'failed',
        errorMessage: error.message
      });
    }
  }
}

module.exports = new TrackingSyncService();