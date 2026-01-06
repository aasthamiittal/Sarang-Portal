const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  dueDate: { type: Date },
  paidAt: { type: Date },
  adjustments: [{
    type: { type: String },
    amount: { type: Number },
    description: { type: String },
    date: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Billing', billingSchema);