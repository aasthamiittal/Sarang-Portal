const mongoose = require('mongoose');

const carrierSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  apiKey: { type: String },
  trackingUrl: { type: String },
  rules: {
    minWeight: { type: Number, default: 0 },
    maxWeight: { type: Number },
    supportedZones: [{ type: String }],
    fuelSurcharge: { type: Number, default: 0 },
    additionalFees: { type: Number, default: 0 }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Carrier', carrierSchema);