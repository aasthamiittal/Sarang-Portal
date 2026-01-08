const mongoose = require('mongoose');

const trackingSyncLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  status: { type: String, enum: ['success', 'failed'], required: true },
  errorMessage: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TrackingSyncLog', trackingSyncLogSchema);