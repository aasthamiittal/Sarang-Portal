const mongoose = require('mongoose');

const customInvoiceSchema = new mongoose.Schema({
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  manifest: { type: mongoose.Schema.Types.ObjectId, ref: 'Manifest' },
  hsCode: { type: String, required: true },
  declaredValue: { type: Number, required: true },
  originCountry: { type: String, required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  currency: { type: String, default: 'USD' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
customInvoiceSchema.index({ shipment: 1 });
customInvoiceSchema.index({ manifest: 1 });
customInvoiceSchema.index({ invoiceNumber: 1 });

module.exports = mongoose.model('CustomInvoice', customInvoiceSchema);