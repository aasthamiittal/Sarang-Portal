const mongoose = require('mongoose');

const manifestSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Manifest', manifestSchema);