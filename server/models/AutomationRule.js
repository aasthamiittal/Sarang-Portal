const mongoose = require('mongoose');

const automationRuleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  ruleType: { type: String, enum: ['CARRIER_SELECTION', 'AUTO_PICKUP', 'AUTO_MANIFEST', 'NDR_ACTION', 'WALLET_ALERT'], required: true },
  conditions: { type: mongoose.Schema.Types.Mixed, default: {} }, // Flexible object for conditions like weight, zone, cod, price thresholds
  actions: { type: mongoose.Schema.Types.Mixed, default: {} }, // Flexible object defining what to do
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
automationRuleSchema.index({ user: 1, ruleType: 1, isActive: 1 });

module.exports = mongoose.model('AutomationRule', automationRuleSchema);