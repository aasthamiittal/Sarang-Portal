const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['shopify', 'woocommerce', 'amazon'],
    required: true
  },
  connected: {
    type: Boolean,
    default: false
  },
  apiKey: {
    type: String
  },
  webhookUrl: {
    type: String
  },
  settings: {
    type: mongoose.Schema.Types.Mixed
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Integration', integrationSchema);