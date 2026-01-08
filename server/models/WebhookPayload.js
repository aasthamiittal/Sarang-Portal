const mongoose = require('mongoose');

const webhookPayloadSchema = new mongoose.Schema({
  carrier: { type: mongoose.Schema.Types.ObjectId, ref: 'Carrier', required: true },
  payload: { type: String, required: true }, // Raw JSON string
  signature: { type: String },
  processed: { type: Boolean, default: false },
  receivedAt: { type: Date, default: Date.now },
  processedAt: { type: Date }
});

module.exports = mongoose.model('WebhookPayload', webhookPayloadSchema);