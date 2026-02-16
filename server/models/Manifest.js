const mongoose = require('mongoose');

const manifestSchema = new mongoose.Schema({
  manifestNumber: { type: String, unique: true, sparse: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  shipments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' }],
  carrierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Carrier' },
  type: { type: String, enum: ['inbound', 'outbound', 'branch'], default: 'outbound' },
  totalWeight: { type: Number, default: 0 },
  totalShipments: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  branchId: { type: mongoose.Schema.Types.ObjectId }, // ref: Branch (Phase 2)
  status: { type: String, enum: ['draft', 'edited', 'submitted', 'locked'], default: 'draft' },
  submittedAt: { type: Date },
  lockedAt: { type: Date },
  uploadedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
manifestSchema.index({ status: 1 });
manifestSchema.index({ shipments: 1 });
manifestSchema.index({ carrierId: 1 });
manifestSchema.index({ createdBy: 1 });
manifestSchema.index({ branchId: 1 });
manifestSchema.index({ manifestNumber: 1 });

// Pre-save: auto-calculate totalWeight and totalShipments from shipments
manifestSchema.pre('save', async function() {
  if (this.shipments && this.shipments.length > 0) {
    const Manifest = mongoose.model('Manifest');
    const existingManifests = await Manifest.find({
      _id: { $ne: this._id },
      shipments: { $in: this.shipments }
    });
    if (existingManifests.length > 0) {
      throw new Error('One or more shipments are already assigned to another manifest');
    }

    const Shipment = mongoose.model('Shipment');
    const shipmentDocs = await Shipment.find({ _id: { $in: this.shipments } }).select('weight').lean();
    this.totalShipments = shipmentDocs.length;
    this.totalWeight = shipmentDocs.reduce((sum, s) => sum + (s.weight || 0), 0);
  } else {
    this.totalShipments = 0;
    this.totalWeight = 0;
  }

  if (this.isNew && !this.manifestNumber) {
    this.manifestNumber = 'MF-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  }
});

module.exports = mongoose.model('Manifest', manifestSchema);