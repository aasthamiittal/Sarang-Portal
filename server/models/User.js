const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  profilePicture: { type: String }, // URL or path to image
  webhookUrl: { type: String }, // For webhook notifications
  webhookSecret: { type: String }, // For webhook HMAC signing
  role: { type: String, enum: ['admin', 'manager', 'staff', 'user'], default: 'staff' },
  settings: {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true }
    }
  },
  notificationPreferences: {
    shipment_status_change: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      webhook: { type: Boolean, default: false }
    },
    pickup_scheduled: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      webhook: { type: Boolean, default: false }
    },
    ndr_triggered: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      webhook: { type: Boolean, default: false }
    },
    wallet_low_balance: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      webhook: { type: Boolean, default: false }
    }
  },
  isActive: { type: Boolean, default: true },
  billingType: { type: String, enum: ['prepaid', 'postpaid'], default: 'prepaid' },
  creditLimit: { type: Number, default: 0 },
  currentOutstanding: { type: Number, default: 0 },
  // KYC fields
  gstNumber: { type: String },
  panNumber: { type: String },
  iecNumber: { type: String },
  kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);