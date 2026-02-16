const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  origin: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  serviceType: {
    type: String,
    enum: ['standard', 'express', 'overnight', 'international'],
    required: true
  },
  specialRequirements: {
    type: String
  },
  status: {
    type: String,
    enum: ['PENDING', 'RESPONDED', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
    default: 'PENDING'
  },
  expiresAt: {
    type: Date
  },
  timeline: [{
    timestamp: { type: Date, default: Date.now },
    status: { type: String, required: true },
    notes: { type: String }
  }],
  quotedPrice: {
    type: Number
  },
  adminResponse: {
    type: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Pre-save hook to initialize timeline. Mongoose 9 does not pass next.
quoteSchema.pre('save', function() {
  if (this.isNew) {
    this.timeline.push({
      status: this.status,
      notes: 'Quote request created'
    });
  }
});

module.exports = mongoose.model('Quote', quoteSchema);