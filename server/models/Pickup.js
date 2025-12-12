const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true
  },
  pickupAddress: {
    type: String,
    required: true
  },
  preferredSlot: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  agentName: {
    type: String
  },
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Pickup', pickupSchema);