const mongoose = require('mongoose');

const customInvoiceSchema = new mongoose.Schema({
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  manifest: { type: mongoose.Schema.Types.ObjectId, ref: 'Manifest' },
  hsCode: { type: String, required: true },
  declaredValue: { type: Number, required: true },
  originCountry: { type: String, required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  gstNumber: { type: String },
  taxRates: {
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 }
  },
  currency: { type: String, default: 'USD' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
customInvoiceSchema.index({ shipment: 1 });
customInvoiceSchema.index({ manifest: 1 });

module.exports = mongoose.model('CustomInvoice', customInvoiceSchema);