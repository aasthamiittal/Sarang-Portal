const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: ['shipment_status_change', 'pickup_scheduled', 'ndr_triggered', 'wallet_low_balance']
  },
  channel: {
    type: String,
    required: true,
    enum: ['email', 'sms', 'webhook']
  },
  subject: { type: String, required: true }, // For email and SMS
  body: { type: String, required: true }, // Template with placeholders
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);