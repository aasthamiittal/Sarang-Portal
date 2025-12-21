const mongoose = require('mongoose');

const automationRuleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['courier_selection', 'label_generation', 'manifest_grouping'], required: true },
  conditions: {
    weight: { min: Number, max: Number },
    zone: { type: String },
    service: { type: String },
    origin: { type: String },
    destination: { type: String }
  },
  actions: {
    courierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Carrier' },
    labelTemplate: { type: String },
    groupBy: { type: String, enum: ['courier', 'zone', 'date'] }
  },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
automationRuleSchema.index({ user: 1, type: 1, isActive: 1 });

module.exports = mongoose.model('AutomationRule', automationRuleSchema);