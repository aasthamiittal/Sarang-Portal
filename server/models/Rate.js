const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema({
  carrier: { type: mongoose.Schema.Types.ObjectId, ref: 'Carrier', required: true },
  zone: { type: String, required: true },
  perKgPrice: { type: Number, required: true },
  minimumCharge: { type: Number, default: 0 },
  fuelSurchargePercent: { type: Number, default: 0 },
  additionalFees: { type: Number, default: 0 },
  effectiveFrom: { type: Date, default: Date.now },
  effectiveTo: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rate', rateSchema);