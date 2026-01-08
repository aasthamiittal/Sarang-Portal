const AutomationRule = require('../models/AutomationRule');
const ActivityLog = require('../models/ActivityLog');
const Carrier = require('../models/Carrier');
const Shipment = require('../models/Shipment');
const Manifest = require('../models/Manifest');
const NdrCase = require('../models/NdrCase');
const AccountLedger = require('../models/AccountLedger');
const axios = require('axios');

class AutomationEngine {
  // Evaluate rules based on trigger and context
  async evaluateRules(trigger, context) {
    const { userId, data } = context;

    // Get active rules for this trigger type
    const rules = await AutomationRule.find({
      user: userId,
      ruleType: trigger,
      isActive: true
    }).sort({ priority: -1 });

    for (const rule of rules) {
      if (await this.checkConditions(rule.conditions, data)) {
        await this.executeActions(rule.actions, data, rule);
        // Log execution
        await this.logExecution(userId, rule, data);
        break; // Apply only the highest priority matching rule
      }
    }
  }

  // Check if conditions match the data
  async checkConditions(conditions, data) {
    for (const [key, value] of Object.entries(conditions)) {
      switch (key) {
        case 'weight':
          if (value.min && data.weight < value.min) return false;
          if (value.max && data.weight > value.max) return false;
          break;
        case 'zone':
          if (data.zone !== value) return false;
          break;
        case 'cod':
          if (value.min && data.cod < value.min) return false;
          if (value.max && data.cod > value.max) return false;
          break;
        case 'price':
          if (value.min && data.price < value.min) return false;
          if (value.max && data.price > value.max) return false;
          break;
        case 'origin':
          if (data.origin !== value) return false;
          break;
        case 'destination':
          if (data.destination !== value) return false;
          break;
        case 'walletThreshold':
          if (data.balance < value) return false;
          break;
        // Add more conditions as needed
        default:
          // For custom conditions, assume they match if present
          break;
      }
    }
    return true;
  }

  // Execute actions based on rule
  async executeActions(actions, data, rule) {
    for (const [key, value] of Object.entries(actions)) {
      switch (key) {
        case 'selectCarrier':
          await this.selectCarrier(data.shipmentId, value);
          break;
        case 'createManifest':
          await this.createManifest(data.shipments, data.userId);
          break;
        case 'triggerPickup':
          await this.triggerPickup(data.manifestId, data.userId);
          break;
        case 'setNdrAction':
          await this.setNdrAction(data.ndrId, value);
          break;
        case 'sendAlert':
          await this.sendWalletAlert(data.userId, value);
          break;
        // Add more actions as needed
      }
    }
  }

  // CARRIER_SELECTION: Select carrier for shipment
  async selectCarrier(shipmentId, carrierId) {
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment || shipment.carrier) return; // Manual override if already set

    const carrier = await Carrier.findById(carrierId);
    if (carrier) {
      shipment.carrier = carrier.name;
      await shipment.save();
    }
  }

  // AUTO_MANIFEST: Create manifest for shipments
  async createManifest(shipments, userId) {
    // Assuming shipments is an array of shipment IDs
    const manifest = new Manifest({
      shipments,
      status: 'draft'
    });
    await manifest.save();

    // Update shipments with manifest
    await Shipment.updateMany({ _id: { $in: shipments } }, { manifest: manifest._id });
  }

  // AUTO_PICKUP: Trigger pickup request
  async triggerPickup(manifestId, userId) {
    // Assuming pickup route exists, call it
    // For now, just log or integrate with pickup service
    console.log(`Triggering pickup for manifest ${manifestId}`);
    // TODO: Integrate with actual pickup API
  }

  // NDR_ACTION: Set action for NDR case
  async setNdrAction(ndrId, action) {
    const ndr = await NdrCase.findById(ndrId);
    if (ndr) {
      ndr.currentAction = action;
      await ndr.save();
    }
  }

  // WALLET_ALERT: Send alert
  async sendWalletAlert(userId, alertType) {
    // Send email or notification
    console.log(`Sending wallet alert to user ${userId}: ${alertType}`);
    // TODO: Integrate with notification service
  }

  // Log rule execution
  async logExecution(userId, rule, data) {
    const log = new ActivityLog({
      user: userId,
      action: 'automation_rule_executed',
      description: `Rule '${rule.name}' executed for ${rule.ruleType}`,
      ipAddress: null, // Not applicable
      userAgent: null
    });
    await log.save();
  }
}

module.exports = new AutomationEngine();