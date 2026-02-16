const mongoose = require('mongoose');

const ndrCaseSchema = new mongoose.Schema({
  shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  reason: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  currentAction: { type: String, enum: ['REATTEMPT', 'RTO', 'HOLD'], default: 'REATTEMPT' },
  history: [{
    timestamp: { type: Date, default: Date.now },
    action: { type: String, required: true },
    notes: { type: String }
  }],
  severity: { type: String, enum: ['low', 'medium', 'high'] },
  agingInHours: { type: Number },
  escalationLevel: { type: Number, default: 0 },
  lastEscalationAt: { type: Date },
  autoRtoAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to calculate aging. Mongoose 9 does not pass next.
ndrCaseSchema.pre('save', function() {
  if (this.isNew || this.isModified()) {
    this.agingInHours = Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
  }
});

module.exports = mongoose.model('NdrCase', ndrCaseSchema);