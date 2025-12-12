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
    enum: ['pending', 'quoted', 'accepted', 'rejected'],
    default: 'pending'
  },
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

module.exports = mongoose.model('Quote', quoteSchema);