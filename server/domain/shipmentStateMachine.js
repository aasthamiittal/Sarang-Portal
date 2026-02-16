/**
 * Centralized shipment lifecycle state machine.
 * Single source of truth for allowed status transitions.
 * No DB access — pure validation and transition rules.
 */

const { SHIPMENT_STATUSES, VALID_TRANSITIONS } = require('../models/Shipment');

/**
 * Check if a transition from currentStatus to newStatus is allowed.
 * @param {string} currentStatus
 * @param {string} newStatus
 * @returns {boolean}
 */
function canTransition(currentStatus, newStatus) {
  if (!currentStatus || !newStatus) return false;
  const allowed = VALID_TRANSITIONS[currentStatus];
  return Array.isArray(allowed) && allowed.includes(newStatus);
}

/**
 * Get allowed next statuses for a given current status.
 * @param {string} currentStatus
 * @returns {string[]}
 */
function getAllowedTransitions(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] || [];
}

/**
 * Validate transition. Throws if invalid.
 * @param {string} currentStatus
 * @param {string} newStatus
 * @throws {Error} if transition not allowed
 */
function validateTransition(currentStatus, newStatus) {
  if (!SHIPMENT_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}. Valid statuses: ${SHIPMENT_STATUSES.join(', ')}`);
  }
  if (!canTransition(currentStatus, newStatus)) {
    const allowed = getAllowedTransitions(currentStatus);
    throw new Error(
      `Invalid status transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.length ? allowed.join(', ') : 'none (terminal state)'}`
    );
  }
}

module.exports = {
  SHIPMENT_STATUSES,
  VALID_TRANSITIONS,
  canTransition,
  getAllowedTransitions,
  validateTransition
};
