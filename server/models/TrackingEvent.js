const mongoose = require('mongoose');

// Define valid statuses
const SHIPMENT_STATUSES = [
  'DRAFT',
  'BOOKED',
  'LABEL_GENERATED',
  'PACKED',
  'MANIFESTED',
  'DISPATCHED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'NDR',
  'RTO_INITIATED',
  'RTO_IN_TRANSIT',
  'RTO_COMPLETED',
  'RETURNED_TO_ORIGIN',
  'LOST',
  'DAMAGED',
  'CANCELLED'
];

const trackingEventSchema = new mongoose.Schema({
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  eventCode: { type: String, enum: SHIPMENT_STATUSES, required: true },
  timestamp: { type: Date, default: Date.now },
  location: { type: String },
  source: { type: String, enum: ['courier', 'manual', 'system'], default: 'manual' },
  description: { type: String },
  isPublic: { type: Boolean, default: false } // New field to control public visibility
});

module.exports = mongoose.model('TrackingEvent', trackingEventSchema);