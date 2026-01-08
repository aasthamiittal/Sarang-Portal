const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Shipment = require('../models/Shipment');
const AccountLedger = require('../models/AccountLedger');
const User = require('../models/User');
const NdrCase = require('../models/NdrCase');
const TrackingEvent = require('../models/TrackingEvent');
const Billing = require('../models/Billing');
const { sendNotification } = require('./notificationService');

// Email transporter (configure with your SMTP settings)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Send email function
async function sendEmail(to, subject, body) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text: body
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

class ScheduledReports {
  constructor() {
    this.jobs = [];
  }

  // Generate shipment summary report
  async generateShipmentReport(userId, period = 'weekly') {
    const user = await User.findById(userId);
    if (!user) return null;

    const now = new Date();
    let startDate;

    if (period === 'weekly') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    const shipments = await Shipment.find({
      userId,
      createdAt: { $gte: startDate, $lte: now }
    });

    const totalShipments = shipments.length;
    const deliveredShipments = shipments.filter(s => s.status === 'DELIVERED').length;
    const inTransitShipments = shipments.filter(s => ['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.status)).length;
    const cancelledShipments = shipments.filter(s => s.status === 'CANCELLED').length;

    const totalRevenue = shipments.reduce((sum, s) => sum + (s.cost || 0), 0);
    const averageCost = totalShipments > 0 ? totalRevenue / totalShipments : 0;

    return {
      period,
      startDate,
      endDate: now,
      summary: {
        totalShipments,
        deliveredShipments,
        inTransitShipments,
        cancelledShipments,
        totalRevenue: totalRevenue.toFixed(2),
        averageCost: averageCost.toFixed(2)
      },
      shipments: shipments.slice(0, 10) // Last 10 shipments
    };
  }

  // Generate finance metrics report
  async generateFinanceReport(userId, period = 'weekly') {
    const user = await User.findById(userId);
    if (!user) return null;

    const now = new Date();
    let startDate;

    if (period === 'weekly') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    const transactions = await AccountLedger.find({
      userId,
      createdAt: { $gte: startDate, $lte: now }
    });

    const totalCredits = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDebits = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalCredits - totalDebits;

    return {
      period,
      startDate,
      endDate: now,
      summary: {
        totalCredits: totalCredits.toFixed(2),
        totalDebits: totalDebits.toFixed(2),
        netBalance: netBalance.toFixed(2),
        transactionCount: transactions.length
      },
      recentTransactions: transactions.slice(0, 10)
    };
  }

  // Send weekly report
  async sendWeeklyReport() {
    try {
      const users = await User.find({ isActive: true });

      for (const user of users) {
        try {
          const shipmentReport = await this.generateShipmentReport(user._id, 'weekly');
          const financeReport = await this.generateFinanceReport(user._id, 'weekly');

          if (!shipmentReport && !financeReport) continue;

          const subject = `Weekly Report - ${new Date().toLocaleDateString()}`;

          let body = `Dear ${user.name},\n\nHere's your weekly shipping and finance summary:\n\n`;

          if (shipmentReport) {
            body += `SHIPMENT SUMMARY:\n`;
            body += `- Total Shipments: ${shipmentReport.summary.totalShipments}\n`;
            body += `- Delivered: ${shipmentReport.summary.deliveredShipments}\n`;
            body += `- In Transit: ${shipmentReport.summary.inTransitShipments}\n`;
            body += `- Cancelled: ${shipmentReport.summary.cancelledShipments}\n`;
            body += `- Total Revenue: ₹${shipmentReport.summary.totalRevenue}\n`;
            body += `- Average Cost: ₹${shipmentReport.summary.averageCost}\n\n`;
          }

          if (financeReport) {
            body += `FINANCE SUMMARY:\n`;
            body += `- Total Credits: ₹${financeReport.summary.totalCredits}\n`;
            body += `- Total Debits: ₹${financeReport.summary.totalDebits}\n`;
            body += `- Net Balance: ₹${financeReport.summary.netBalance}\n`;
            body += `- Transactions: ${financeReport.summary.transactionCount}\n\n`;
          }

          body += `Best regards,\nYour Shipping Team`;

          if (user.email) {
            await sendEmail(user.email, subject, body);
            console.log(`Weekly report sent to ${user.email}`);
          }
        } catch (error) {
          console.error(`Failed to send weekly report to user ${user._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in sendWeeklyReport:', error);
    }
  }

  // Send monthly report
  async sendMonthlyReport() {
    try {
      const users = await User.find({ isActive: true });

      for (const user of users) {
        try {
          const shipmentReport = await this.generateShipmentReport(user._id, 'monthly');
          const financeReport = await this.generateFinanceReport(user._id, 'monthly');

          if (!shipmentReport && !financeReport) continue;

          const subject = `Monthly Report - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

          let body = `Dear ${user.name},\n\nHere's your monthly shipping and finance summary:\n\n`;

          if (shipmentReport) {
            body += `SHIPMENT SUMMARY:\n`;
            body += `- Total Shipments: ${shipmentReport.summary.totalShipments}\n`;
            body += `- Delivered: ${shipmentReport.summary.deliveredShipments}\n`;
            body += `- In Transit: ${shipmentReport.summary.inTransitShipments}\n`;
            body += `- Cancelled: ${shipmentReport.summary.cancelledShipments}\n`;
            body += `- Total Revenue: ₹${shipmentReport.summary.totalRevenue}\n`;
            body += `- Average Cost: ₹${shipmentReport.summary.averageCost}\n\n`;
          }

          if (financeReport) {
            body += `FINANCE SUMMARY:\n`;
            body += `- Total Credits: ₹${financeReport.summary.totalCredits}\n`;
            body += `- Total Debits: ₹${financeReport.summary.totalDebits}\n`;
            body += `- Net Balance: ₹${financeReport.summary.netBalance}\n`;
            body += `- Transactions: ${financeReport.summary.transactionCount}\n\n`;
          }

          body += `Best regards,\nYour Shipping Team`;

          if (user.email) {
            await sendEmail(user.email, subject, body);
            console.log(`Monthly report sent to ${user.email}`);
          }
        } catch (error) {
          console.error(`Failed to send monthly report to user ${user._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in sendMonthlyReport:', error);
    }
  }

  // Start scheduled jobs
  start() {
    // NDR automation every hour
    const ndrJob = cron.schedule('0 * * * *', () => {
      console.log('Running NDR automation...');
      this.processNdrAutomation();
    });

    // Weekly reports every Monday at 9 AM
    const weeklyJob = cron.schedule('0 9 * * 1', () => {
      console.log('Running weekly reports...');
      this.sendWeeklyReport();
    });

    // Monthly reports on the 1st of every month at 9 AM
    const monthlyJob = cron.schedule('0 9 1 * *', () => {
      console.log('Running monthly reports...');
      this.sendMonthlyReport();
    });

    this.jobs = [ndrJob, weeklyJob, monthlyJob];
    console.log('Scheduled reports initialized');
  }

  // Process NDR automation
  async processNdrAutomation() {
    try {
      console.log('Processing NDR automation...');

      // Find NDR cases that need escalation or auto-RTO
      const ndrCases = await NdrCase.find({
        currentAction: { $ne: 'RTO' }, // Not already RTO
        agingInHours: { $gte: 24 } // Older than 24 hours
      }).populate('shipmentId');

      for (const ndrCase of ndrCases) {
        const shipment = ndrCase.shipmentId;
        if (!shipment) continue;

        // Auto-escalate after 48 hours
        if (ndrCase.agingInHours >= 48 && ndrCase.escalationLevel < 2) {
          ndrCase.escalationLevel += 1;
          ndrCase.lastEscalationAt = new Date();
          ndrCase.history.push({
            action: 'AUTO_ESCALATE',
            notes: `Auto-escalated to level ${ndrCase.escalationLevel}`
          });
          await ndrCase.save();

          // Notify user of escalation
          await sendNotification('ndr_escalated', shipment.user, {
            shipmentId: shipment.orderId,
            escalationLevel: ndrCase.escalationLevel
          });
        }

        // Auto-RTO after 7 days (168 hours)
        if (ndrCase.agingInHours >= 168 && !ndrCase.autoRtoAt) {
          ndrCase.autoRtoAt = new Date();
          ndrCase.currentAction = 'RTO';
          ndrCase.history.push({
            action: 'AUTO_RTO',
            notes: 'Auto-initiated RTO due to timeout'
          });
          await ndrCase.save();

          // Update shipment to RTO
          shipment.statusHistory.push({
            status: 'RTO_INITIATED',
            note: 'Auto-RTO initiated'
          });
          await shipment.save();

          // Create tracking event
          const trackingEvent = new TrackingEvent({
            shipment: shipment._id,
            eventCode: 'RTO_INITIATED',
            description: 'Auto-RTO initiated due to NDR timeout',
            source: 'system'
          });
          await trackingEvent.save();

          // Add RTO cost
          const rtoCost = shipment.cost * 0.5;
          shipment.cost += rtoCost;

          const billing = new Billing({
            shipment: shipment._id,
            amount: rtoCost,
            description: 'Auto-RTO Processing Fee'
          });
          await billing.save();

          // Notify user
          await sendNotification('auto_rto_initiated', shipment.user, {
            shipmentId: shipment.orderId,
            rtoCost: rtoCost.toFixed(2)
          });
        }
      }

      console.log('NDR automation processing completed');
    } catch (error) {
      console.error('Error in NDR automation:', error);
    }
  }

  // Stop all scheduled jobs
  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    console.log('Scheduled reports stopped');
  }
}

module.exports = new ScheduledReports();