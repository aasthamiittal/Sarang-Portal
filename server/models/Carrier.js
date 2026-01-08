const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../services/encryption');

const carrierSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  encryptedApiKey: { type: String },
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
  webhookSecret: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Virtual for apiKey
carrierSchema.virtual('apiKey').get(function() {
  return this.encryptedApiKey ? decrypt(this.encryptedApiKey) : null;
}).set(function(value) {
  this.encryptedApiKey = value ? encrypt(value) : null;
});

// Ensure virtual fields are serialized
carrierSchema.set('toJSON', { virtuals: true });
carrierSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Carrier', carrierSchema);