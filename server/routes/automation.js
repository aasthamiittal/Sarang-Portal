const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const AutomationRule = require('../models/AutomationRule');
const Carrier = require('../models/Carrier');
const Shipment = require('../models/Shipment');

router.use(auth);

// GET /rules - Get automation rules
router.get('/rules', async (req, res) => {
  try {
    const rules = await AutomationRule.find({ user: req.user.id })
      .sort({ priority: -1, createdAt: -1 });

    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /rules - Create automation rule
router.post('/rules', async (req, res) => {
  try {
    const ruleData = { ...req.body, user: req.user.id };

    const rule = new AutomationRule(ruleData);
    await rule.save();

    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /rules/:id - Update automation rule
router.put('/rules/:id', async (req, res) => {
  try {
    const rule = await AutomationRule.findOne({ _id: req.params.id, user: req.user.id });
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    Object.assign(rule, req.body);
    rule.updatedAt = new Date();
    await rule.save();

    res.json(rule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /rules/:id - Delete automation rule
router.delete('/rules/:id', async (req, res) => {
  try {
    const rule = await AutomationRule.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    res.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /apply - Apply automation rules to shipment
router.post('/apply', async (req, res) => {
  try {
    const { shipmentId, ruleType } = req.body;

    const shipment = await Shipment.findOne({ _id: shipmentId, user: req.user.id });
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Get active rules for this user and ruleType
    const rules = await AutomationRule.find({
      user: req.user.id,
      ruleType: ruleType,
      isActive: true
    }).sort({ priority: -1 });

    let appliedRule = null;
    let actions = {};

    // Find matching rule
    for (const rule of rules) {
      const conditions = rule.conditions;
      let matches = true;

      // Check weight conditions
      if (conditions.weight?.min && shipment.weight < conditions.weight.min) matches = false;
      if (conditions.weight?.max && shipment.weight > conditions.weight.max) matches = false;

      // Check zone
      if (conditions.zone && shipment.zone !== conditions.zone) matches = false;

      // Check origin/destination
      if (conditions.origin && shipment.origin !== conditions.origin) matches = false;
      if (conditions.destination && shipment.destination !== conditions.destination) matches = false;

      if (matches) {
        appliedRule = rule;
        actions = rule.actions;
        break;
      }
    }

    if (!appliedRule) {
      return res.json({ message: 'No matching automation rule found', applied: false });
    }

    // Apply actions
    const updates = {};

    if (actions.courierId) {
      const carrier = await Carrier.findById(actions.courierId);
      if (carrier) {
        updates.carrier = carrier.name;
      }
    }

    if (Object.keys(updates).length > 0) {
      Object.assign(shipment, updates);
      shipment.updatedAt = new Date();
      await shipment.save();
    }

    res.json({
      applied: true,
      rule: appliedRule.name,
      actions: updates
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /settings - Get automation settings
router.get('/settings', async (req, res) => {
  try {
    const rules = await AutomationRule.find({ user: req.user.id, isActive: true });
    const settings = {
      carrierSelectionEnabled: rules.some(r => r.ruleType === 'CARRIER_SELECTION'),
      autoPickupEnabled: rules.some(r => r.ruleType === 'AUTO_PICKUP'),
      autoManifestEnabled: rules.some(r => r.ruleType === 'AUTO_MANIFEST'),
      ndrActionEnabled: rules.some(r => r.ruleType === 'NDR_ACTION'),
      walletAlertEnabled: rules.some(r => r.ruleType === 'WALLET_ALERT')
    };

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;