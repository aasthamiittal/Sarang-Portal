const AccountLedger = require('../models/AccountLedger');
const Billing = require('../models/Billing');
const Shipment = require('../models/Shipment');
const User = require('../models/User');
const automationEngine = require('./automationEngine');
const { sendNotification } = require('./notificationService');

// Billing triggers based on shipment events
const BILLING_TRIGGERS = {
  'LABEL_GENERATED': {
    description: 'Label generation fee',
    amountMultiplier: 0.1, // 10% of shipment cost
    type: 'debit'
  },
  'MANIFESTED': {
    description: 'Manifest submission fee',
    amountMultiplier: 0.05, // 5% of shipment cost
    type: 'debit'
  },
  'DELIVERED': {
    description: 'Delivery confirmation fee',
    amountMultiplier: 0.02, // 2% of shipment cost
    type: 'debit'
  },
  'RTO_INITIATED': {
    description: 'RTO processing fee',
    amountMultiplier: 0.15, // 15% of shipment cost
    type: 'debit'
  },
  'LOST': {
    description: 'Loss adjustment - full refund',
    amountMultiplier: 1.0, // Full refund
    type: 'credit'
  },
  'DAMAGED': {
    description: 'Damage adjustment - partial refund',
    amountMultiplier: 0.5, // 50% refund
    type: 'credit'
  },
  'RTO_IN_TRANSIT': {
    description: 'RTO transit processing fee',
    amountMultiplier: 0.05, // 5% of shipment cost
    type: 'debit'
  },
  'RETURNED_TO_ORIGIN': {
    description: 'RTO return - shipment returned to origin',
    amountMultiplier: 1.0, // Full refund for returned shipment
    type: 'credit'
  }
};

// Process billing for shipment event
async function processShipmentBilling(shipmentId, eventCode, userId) {
  try {
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) return;

    const trigger = BILLING_TRIGGERS[eventCode];
    if (!trigger) return; // No billing trigger for this event

    const amount = shipment.cost * trigger.amountMultiplier;

    const user = await User.findById(userId);
    if (!user) return;

    if (user.billingType === 'postpaid') {
      // For postpaid, accumulate in currentOutstanding
      if (trigger.type === 'debit') {
        if (user.currentOutstanding + amount > user.creditLimit) {
          console.log(`Postpaid billing denied for user ${userId}: credit limit exceeded`);
          return; // Or send notification
        }
        user.currentOutstanding += amount;
      } else {
        // For credits, reduce outstanding
        user.currentOutstanding -= amount;
        if (user.currentOutstanding < 0) user.currentOutstanding = 0;
      }
      await user.save();

      // Still create ledger entry for tracking
      const currentBalance = await calculateBalance(userId);
      const ledgerEntry = new AccountLedger({
        user: userId,
        type: trigger.type,
        amount: Math.abs(amount),
        referenceType: 'shipment',
        referenceId: shipmentId,
        description: `${trigger.description} - ${shipment.orderId}`,
        balanceAfter: trigger.type === 'credit' ? currentBalance + amount : currentBalance - amount
      });
      await ledgerEntry.save();

    } else {
      // Prepaid logic
      const currentBalance = await calculateBalance(userId);

      // Create ledger entry
      const ledgerEntry = new AccountLedger({
        user: userId,
        type: trigger.type,
        amount: Math.abs(amount),
        referenceType: 'shipment',
        referenceId: shipmentId,
        description: `${trigger.description} - ${shipment.orderId}`,
        balanceAfter: trigger.type === 'credit' ? currentBalance + amount : currentBalance - amount
      });

      await ledgerEntry.save();

      // Trigger notification for wallet low balance
      if (ledgerEntry.balanceAfter < 100) {
        await sendNotification('wallet_low_balance', userId, {
          userName: user.name,
          balance: ledgerEntry.balanceAfter
        });
      }

      // Apply automation rules for wallet alert on billing events
      await automationEngine.evaluateRules('WALLET_ALERT', {
        userId: userId,
        data: {
          balance: ledgerEntry.balanceAfter,
          amount: amount,
          type: trigger.type
        }
      });
    }

    // Update billing record if exists
    const billing = await Billing.findOne({ shipment: shipmentId });
    if (billing) {
      if (trigger.type === 'credit') {
        // For refunds/adjustments, reduce the amount or mark as adjusted
        billing.adjustments = billing.adjustments || [];
        billing.adjustments.push({
          type: eventCode,
          amount: amount,
          description: trigger.description,
          date: new Date()
        });
        billing.amount -= amount; // Reduce billed amount
      }
      await billing.save();
    }

    console.log(`Billing processed for shipment ${shipment.orderId}: ${trigger.description} - ${trigger.type} $${amount}`);
  } catch (error) {
    console.error('Error processing shipment billing:', error);
  }
}

// Helper function to calculate balance
async function calculateBalance(userId, upToDate = null) {
  const query = { user: userId };
  if (upToDate) {
    query.createdAt = { $lte: upToDate };
  }

  const entries = await AccountLedger.find(query).sort({ createdAt: 1 });
  let balance = 0;

  entries.forEach(entry => {
    if (entry.type === 'credit') {
      balance += entry.amount;
    } else {
      balance -= entry.amount;
    }
  });

  return balance;
}

// Get wallet activity from ledger
async function getWalletActivity(userId, options = {}) {
  const { dateFilter } = options;
  const query = { user: userId };

  // Apply date filter
  if (dateFilter) {
    const now = new Date();
    let startDate;

    switch (dateFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query.createdAt = { $gte: startDate };
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query.createdAt = { $gte: startDate, $lt: yesterdayEnd };
        break;
      case 'last7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query.createdAt = { $gte: startDate };
        break;
      case 'last30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query.createdAt = { $gte: startDate };
        break;
    }
  }

  const entries = await AccountLedger.find(query)
    .sort({ createdAt: -1 })
    .populate('referenceId', 'orderId trackingNumber');

  return entries.map(entry => ({
    id: entry._id,
    description: entry.description,
    amount: entry.amount,
    type: entry.type,
    date: entry.createdAt,
    orderId: entry.referenceId?.orderId || 'N/A',
    balanceAfter: entry.balanceAfter
  }));
}

module.exports = {
  processShipmentBilling,
  calculateBalance,
  getWalletActivity
};