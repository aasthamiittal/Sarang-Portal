// Map carrier-specific statuses to internal shipment statuses
const statusMappings = {
  fedex: {
    'CREATED': 'BOOKED',
    'PICKED_UP': 'DISPATCHED',
    'IN_TRANSIT': 'IN_TRANSIT',
    'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
    'DELIVERED': 'DELIVERED',
    'RETURNED': 'RETURNED_TO_ORIGIN',
    'EXCEPTION': 'LOST', // or DAMAGED depending on details
  },
  // Add mappings for other carriers
  // dhl: { ... },
  default: {
    'booked': 'BOOKED',
    'in_transit': 'IN_TRANSIT',
    'delivered': 'DELIVERED',
    'returned': 'RETURNED_TO_ORIGIN',
    'lost': 'LOST',
    'damaged': 'DAMAGED',
  }
};

function mapCarrierStatus(carrierName, carrierStatus) {
  const mapping = statusMappings[carrierName.toLowerCase()] || statusMappings.default;
  return mapping[carrierStatus.toUpperCase()] || 'IN_TRANSIT'; // default fallback
}

module.exports = { mapCarrierStatus };