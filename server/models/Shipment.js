const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  trackingNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ['created', 'picked', 'in hub', 'in-transit', 'out for delivery', 'delivered', 'cancelled'], default: 'created' },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  carrier: { type: mongoose.Schema.Types.ObjectId, ref: 'Carrier', required: true },
  weight: { type: Number, required: true },
  cost: { type: Number },
  zone: { type: String },
  externalTrackingId: { type: String },
  archived: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  statusHistory: [{
    status: { type: String, enum: ['created', 'picked', 'in hub', 'in-transit', 'out for delivery', 'delivered', 'cancelled'] },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Shipment', shipmentSchema);