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
  labelTemplate: {
    format: { type: String, enum: ['standard', 'thermal', 'pdf'], default: 'standard' },
    barcodeType: { type: String, enum: ['code128', 'code39', 'qrcode'], default: 'code128' },
    includeFields: [{ type: String }],
    customLayout: { type: String }
  },
  labelRules: {
    autoGenerate: { type: Boolean, default: false },
    requireAWB: { type: Boolean, default: true },
    maxReprints: { type: Number, default: 3 }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Carrier', carrierSchema);