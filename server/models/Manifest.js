const mongoose = require('mongoose');

const manifestSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  shipments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' }],
  status: { type: String, enum: ['draft', 'edited', 'submitted', 'locked'], default: 'draft' },
  submittedAt: { type: Date },
  lockedAt: { type: Date },
  uploadedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
manifestSchema.index({ status: 1 });
manifestSchema.index({ shipments: 1 });

// Pre-save hook to validate shipments are not already in another manifest
manifestSchema.pre('save', async function(next) {
  if (this.shipments && this.shipments.length > 0) {
    const Manifest = mongoose.model('Manifest');
    const existingManifests = await Manifest.find({
      _id: { $ne: this._id },
      shipments: { $in: this.shipments }
    });
    if (existingManifests.length > 0) {
      return next(new Error('One or more shipments are already assigned to another manifest'));
    }
  }
  next();
});

module.exports = mongoose.model('Manifest', manifestSchema);