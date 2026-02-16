/**
 * Centralized shipment status transitions.
 * Enforces state machine, updates document status/subStatus/statusHistory, and creates TrackingEvent.
 */

const Shipment = require('../models/Shipment');
const TrackingEvent = require('../models/TrackingEvent');
const { validateTransition } = require('../domain/shipmentStateMachine');

/**
 * Transition a shipment to a new status.
 * Validates via state machine, updates shipment.status/subStatus/statusHistory, creates TrackingEvent.
 * @param {object} shipment - Mongoose document (must be loaded with current state)
 * @param {string} newStatus - Target status (must be in SHIPMENT_STATUSES)
 * @param {object} options - { subStatus?: string, note?: string, source?: 'manual'|'courier'|'system' }
 * @returns {Promise<object>} Updated shipment (caller should save if not already saved)
 */
async function transitionShipmentStatus(shipment, newStatus, options = {}) {
  const { subStatus, note, source = 'manual' } = options;

  const currentStatus = shipment.status || (await getCurrentStatusFromHistory(shipment));
  validateTransition(currentStatus, newStatus);

  const now = new Date();
  shipment.status = newStatus;
  if (subStatus !== undefined) shipment.subStatus = subStatus;
  shipment.updatedAt = now;

  const historyEntry = {
    status: newStatus,
    timestamp: now,
    note: note || `Status changed from ${currentStatus} to ${newStatus}`
  };
  if (subStatus) historyEntry.subStatus = subStatus;

  if (!shipment.statusHistory) shipment.statusHistory = [];
  shipment.statusHistory.push(historyEntry);

  const trackingEvent = new TrackingEvent({
    shipment: shipment._id,
    eventCode: newStatus,
    description: note || `Status changed to ${newStatus}`,
    source: ['manual', 'courier', 'system'].includes(source) ? source : 'manual',
    isPublic: true
  });
  await trackingEvent.save();

  return shipment;
}

/**
 * Get current status from shipment.status (if set) or latest statusHistory entry.
 * Used when document might not yet have status field (legacy).
 */
function getCurrentStatusFromHistory(shipment) {
  if (shipment.status) return shipment.status;
  const history = shipment.statusHistory;
  if (Array.isArray(history) && history.length > 0) {
    const last = history[history.length - 1];
    return last.status || 'DRAFT';
  }
  return 'DRAFT';
}

module.exports = {
  transitionShipmentStatus,
  getCurrentStatusFromHistory
};
