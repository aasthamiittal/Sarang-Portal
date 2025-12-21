const mongoose = require('mongoose');

const accountLedgerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['debit', 'credit'], required: true },
  amount: { type: Number, required: true },
  referenceType: { type: String, enum: ['shipment', 'manifest', 'invoice', 'payment'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  description: { type: String },
  balanceAfter: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Indexes
accountLedgerSchema.index({ user: 1, createdAt: -1 });
accountLedgerSchema.index({ referenceType: 1, referenceId: 1 });

module.exports = mongoose.model('AccountLedger', accountLedgerSchema);