// Map carrier-specific statuses to internal shipment statuses
const statusMappings = {
  fedex: {
    'PU': 'DISPATCHED', // Picked Up
    'AR': 'IN_TRANSIT', // Arrived at FedEx location
    'DP': 'IN_TRANSIT', // Departed FedEx location
    'OD': 'OUT_FOR_DELIVERY', // Out for Delivery
    'DL': 'DELIVERED', // Delivered
    'RS': 'RETURNED_TO_ORIGIN', // Return to Shipper
    'DE': 'LOST', // Delivery Exception
    'SE': 'LOST', // Shipment Exception
    'OC': 'LOST', // On Call for Pickup
    'CC': 'LOST', // Cleared Customs
    'TR': 'IN_TRANSIT', // Transfer
    'HL': 'LOST', // Hold at Location
    'IT': 'IN_TRANSIT', // In Transit
    'LO': 'LOST', // Lost
    'DM': 'DAMAGED', // Damaged
    'CREATED': 'BOOKED',
    'PICKED_UP': 'DISPATCHED',
    'IN_TRANSIT': 'IN_TRANSIT',
    'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
    'DELIVERED': 'DELIVERED',
    'RETURNED': 'RETURNED_TO_ORIGIN',
    'EXCEPTION': 'LOST',
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