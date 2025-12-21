const mongoose = require('mongoose');

const awbStockSchema = new mongoose.Schema({
  courierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Carrier', required: true },
  awbNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ['available', 'used', 'expired'], default: 'available' },
  assignedShipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
awbStockSchema.index({ courierId: 1, status: 1 });
awbStockSchema.index({ awbNumber: 1 });

module.exports = mongoose.model('AwbStock', awbStockSchema);