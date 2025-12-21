const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  trackingNumber: { type: String, required: true, unique: true },
  awbNumber: { type: String },
  status: { type: String, enum: ['draft', 'pending-label', 'packed', 'dispatched', 'in-transit', 'delivered', 'cancelled'], default: 'draft' },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  carrier: { type: String, required: true },
  weight: { type: Number, required: true },
  cost: { type: Number },
  pickupDate: { type: Date },
  dispatchDate: { type: Date },
  deliveryDate: { type: Date },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  pickupAddress: {
    name: String,
    address: String,
    phone: String
  },
  customerInfo: {
    firstName: String,
    lastName: String,
    mobile: String,
    alternateMobile: String,
    email: String,
    country: String,
    address1: String,
    address2: String,
    landmark: String,
    pincode: String,
    city: String,
    state: String
  },
  billingSameAsShipping: { type: Boolean, default: true },
  productInfo: {
    description: String,
    quantity: Number,
    value: Number
  },
  orderNotes: { type: String },
  zone: { type: String },
  externalTrackingId: { type: String },
  archived: { type: Boolean, default: false },
  labelGeneratedAt: { type: Date },
  manifestSubmittedAt: { type: Date },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  statusHistory: [{
    status: { type: String, enum: ['draft', 'pending-label', 'packed', 'dispatched', 'in-transit', 'delivered', 'cancelled'] },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Shipment', shipmentSchema);