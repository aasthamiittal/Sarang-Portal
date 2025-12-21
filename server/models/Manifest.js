const mongoose = require('mongoose');

const manifestSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  status: { type: String, enum: ['draft', 'edited', 'submitted', 'locked'], default: 'draft' },
  submittedAt: { type: Date },
  lockedAt: { type: Date },
  uploadedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
manifestSchema.index({ status: 1 });
manifestSchema.index({ shipment: 1 });

module.exports = mongoose.model('Manifest', manifestSchema);