const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true
  },
  pickupLocation: {
    type: String,
    required: true
  },
  preferredSlot: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['REQUESTED', 'SCHEDULED', 'PICKED', 'FAILED'],
    default: 'REQUESTED'
  },
  manifests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manifest'
  }],
  courier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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