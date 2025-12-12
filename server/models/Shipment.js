const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  trackingNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'in-transit', 'delivered', 'cancelled'], default: 'pending' },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  carrier: { type: String, required: true },
  weight: { type: Number },
  cost: { type: Number },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  statusHistory: [{
    status: { type: String, enum: ['pending', 'in-transit', 'delivered', 'cancelled'] },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Shipment', shipmentSchema);