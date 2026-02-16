const mongoose = require('mongoose');

// Define valid statuses
const SHIPMENT_STATUSES = [
  'DRAFT',
  'BOOKED',
  'LABEL_GENERATED',
  'PACKED',
  'MANIFESTED',
  'DISPATCHED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'NDR',
  'RTO_INITIATED',
  'RTO_IN_TRANSIT',
  'RTO_COMPLETED',
  'RETURNED_TO_ORIGIN',
  'LOST',
  'DAMAGED',
  'CANCELLED'
];

// Define valid transitions
const VALID_TRANSITIONS = {
  'DRAFT': ['BOOKED', 'CANCELLED'],
  'BOOKED': ['LABEL_GENERATED', 'CANCELLED'],
  'LABEL_GENERATED': ['PACKED', 'RTO_INITIATED', 'LOST', 'DAMAGED'],
  'PACKED': ['MANIFESTED', 'RTO_INITIATED', 'LOST', 'DAMAGED'],
  'MANIFESTED': ['DISPATCHED', 'RTO_INITIATED', 'LOST', 'DAMAGED'],
  'DISPATCHED': ['IN_TRANSIT', 'RTO_INITIATED', 'LOST', 'DAMAGED'],
  'IN_TRANSIT': ['OUT_FOR_DELIVERY', 'NDR', 'RTO_INITIATED', 'LOST', 'DAMAGED'],
  'OUT_FOR_DELIVERY': ['DELIVERED', 'NDR', 'RTO_INITIATED', 'LOST', 'DAMAGED'],
  'DELIVERED': [],
  'NDR': ['REATTEMPT', 'RTO_INITIATED', 'HOLD'],
  'RTO_INITIATED': ['RTO_IN_TRANSIT'],
  'RTO_IN_TRANSIT': ['RTO_COMPLETED'],
  'RTO_COMPLETED': [],
  'RETURNED_TO_ORIGIN': [],
  'LOST': [],
  'DAMAGED': [],
  'CANCELLED': []
};

// Fields that become immutable after LABEL_GENERATED
const IMMUTABLE_FIELDS_AFTER_LABEL = [
  'origin',
  'destination',
  'weight',
  'carrier',
  'carrierId',
  'customerInfo',
  'productInfo',
  'pickupAddress'
];

// All fields become immutable after manifest submission
const IMMUTABLE_FIELDS_AFTER_MANIFEST = [
  'orderId',
  'trackingNumber',
  'awbNumber',
  'origin',
  'destination',
  'carrier',
  'carrierId',
  'weight',
  'cost',
  'pickupDate',
  'dispatchDate',
  'deliveryDate',
  'proofOfDelivery',
  'paymentStatus',
  'pickupAddress',
  'customerInfo',
  'billingSameAsShipping',
  'productInfo',
  'orderNotes',
  'zone',
  'externalTrackingId',
  'archived',
  'labelGeneratedAt',
  'manifestSubmittedAt',
  'manifest',
  'user'
];

const shipmentSchema = new mongoose.Schema({
   orderId: { type: String, unique: true },
   trackingNumber: { type: String, required: true, unique: true },
   awbNumber: { type: String },
   origin: { type: String, required: true },
   destination: { type: String, required: true },
   carrier: { type: String }, // legacy: keep for backward compat; prefer carrierId
   carrierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Carrier' },
   status: { type: String, enum: SHIPMENT_STATUSES }, // stored current status; fallback from statusHistory/TrackingEvent
   subStatus: { type: String },
   weight: { type: Number, required: true },
   cost: { type: Number },
   carrierCost: { type: Number },
   handlingCost: { type: Number },
   expectedDelivery: { type: Date },
   actualDelivery: { type: Date },
   pickupDate: { type: Date },
  dispatchDate: { type: Date },
  deliveryDate: { type: Date },
  proofOfDelivery: { type: String },
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
  manifest: { type: mongoose.Schema.Types.ObjectId, ref: 'Manifest' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  exceptionFlags: [{ type: String, enum: ['CUSTOMS_HOLD', 'DELIVERY_FAILED', 'SLA_BREACHED'] }],
  statusHistory: [{
    status: { type: String, enum: SHIPMENT_STATUSES },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  secureToken: { type: String, unique: true, sparse: true } // New field for public tracking
});

// Indexes for carrierId (prefer for queries) and status
shipmentSchema.index({ carrierId: 1 });
shipmentSchema.index({ status: 1 });

// Pre-validate: require either carrierId or carrier (legacy). Mongoose 9 does not pass next.
shipmentSchema.pre('validate', function() {
  if (this.isNew && !this.carrierId && !this.carrier) {
    throw new Error('Either carrierId or carrier (name) is required');
  }
});

// Pre-save hook to generate secureToken if not provided
shipmentSchema.pre('save', function() {
  if (this.isNew && !this.secureToken) {
    this.secureToken = require('crypto').randomBytes(16).toString('hex');
  }
});

// Virtual for margin calculation
shipmentSchema.virtual('margin').get(function() {
  if (this.cost && (this.carrierCost || this.handlingCost)) {
    const totalCost = (this.carrierCost || 0) + (this.handlingCost || 0);
    return this.cost - totalCost;
  }
  return null;
});

// Method to check SLA compliance
shipmentSchema.methods.isSLACompliant = function() {
  if (this.expectedDelivery && this.actualDelivery) {
    return this.actualDelivery <= this.expectedDelivery;
  }
  return null; // Not yet determined
};

// Pre-save hook to enforce immutability after label generation and manifest submission. Mongoose 9 does not pass next.
shipmentSchema.pre('save', function() {
  if (this.labelGeneratedAt && this.isModified()) {
    const modifiedFields = this.modifiedPaths();
    const immutableModified = modifiedFields.filter(field => IMMUTABLE_FIELDS_AFTER_LABEL.includes(field));
    if (immutableModified.length > 0) {
      throw new Error(`Cannot modify immutable fields after label generation: ${immutableModified.join(', ')}`);
    }
  }

  if (this.manifestSubmittedAt && this.isModified()) {
    const modifiedFields = this.modifiedPaths();
    const immutableModified = modifiedFields.filter(field => IMMUTABLE_FIELDS_AFTER_MANIFEST.includes(field));
    if (immutableModified.length > 0) {
      throw new Error(`Cannot modify immutable fields after manifest submission: ${immutableModified.join(', ')}`);
    }
  }
});

// Method to get current status from latest tracking event
shipmentSchema.methods.getCurrentStatus = async function() {
  const TrackingEvent = mongoose.model('TrackingEvent');
  const latestEvent = await TrackingEvent.findOne({ shipment: this._id }).sort({ timestamp: -1 });
  return latestEvent ? latestEvent.eventCode : 'DRAFT';
};

module.exports = mongoose.model('Shipment', shipmentSchema);
module.exports.SHIPMENT_STATUSES = SHIPMENT_STATUSES;
module.exports.VALID_TRANSITIONS = VALID_TRANSITIONS;
