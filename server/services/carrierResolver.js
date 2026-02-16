/**
 * Resolve Carrier document from a shipment (carrierId or legacy carrier name).
 * Use everywhere we need the Carrier model from a shipment for API/tracking/awb.
 */

const Carrier = require('../models/Carrier');

/**
 * Get Carrier document for a shipment.
 * Prefers carrierId (ObjectId); falls back to carrier (string name) for legacy documents.
 * @param {object} shipment - Shipment doc (plain or mongoose); may have carrierId (populated or id) and/or carrier (string)
 * @returns {Promise<object|null>} Carrier document or null
 */
async function getCarrierForShipment(shipment) {
  if (!shipment) return null;

  const carrierId = shipment.carrierId && (shipment.carrierId._id || shipment.carrierId);
  if (carrierId) {
    if (shipment.carrierId && shipment.carrierId.name) {
      return shipment.carrierId; // already populated
    }
    const c = await Carrier.findById(carrierId);
    return c || null;
  }

  const carrierName = shipment.carrier;
  if (carrierName) {
    return Carrier.findOne({ name: new RegExp(`^${String(carrierName).trim()}$`, 'i') });
  }

  return null;
}

/**
 * Get carrier display name for a shipment (for API responses / backward compat).
 * @param {object} shipment - Shipment with optional carrierId (populated) and/or carrier (string)
 * @returns {string|null}
 */
function getCarrierNameForShipment(shipment) {
  if (!shipment) return null;
  if (shipment.carrierId && (shipment.carrierId.name || shipment.carrierId._id)) {
    return shipment.carrierId.name || null;
  }
  return shipment.carrier || null;
}

module.exports = {
  getCarrierForShipment,
  getCarrierNameForShipment
};
