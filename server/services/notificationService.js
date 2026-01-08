const nodemailer = require('nodemailer');
const axios = require('axios');
const User = require('../models/User');
const NotificationTemplate = require('../models/NotificationTemplate');
const ActivityLog = require('../models/ActivityLog');

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

// Retry mechanism with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Send email
async function sendEmail(to, subject, body) {
  await retryWithBackoff(async () => {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text: body
    });
  });
}

// Send SMS (mocked)
async function sendSMS(to, message) {
  await retryWithBackoff(async () => {
    // Mock SMS sending
    console.log(`SMS sent to ${to}: ${message}`);
    // In real implementation, integrate with SMS provider
  });
}

// Send webhook
async function sendWebhook(url, data) {
  await retryWithBackoff(async () => {
    await axios.post(url, data, { timeout: 5000 });
  });
}

// Replace placeholders in template
function replacePlaceholders(template, data) {
  let result = template;
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, data[key] || '');
  });
  return result;
}

// Main notification function
async function sendNotification(eventType, userId, data = {}) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const preferences = user.notificationPreferences[eventType];
    if (!preferences) return;

    const templates = await NotificationTemplate.find({ eventType, isActive: true });

    for (const template of templates) {
      const channel = template.channel;
      if (!preferences[channel]) continue;

      const subject = replacePlaceholders(template.subject, data);
      const body = replacePlaceholders(template.body, data);

      try {
        if (channel === 'email' && user.email) {
          await sendEmail(user.email, subject, body);
        } else if (channel === 'sms' && user.phone) {
          await sendSMS(user.phone, body);
        } else if (channel === 'webhook' && user.webhookUrl) {
          await sendWebhook(user.webhookUrl, { eventType, ...data });
        }
      } catch (error) {
        // Log failure to ActivityLog
        await ActivityLog.create({
          user: userId,
          action: 'notification_failure',
          description: `Failed to send ${channel} notification for ${eventType}: ${error.message}`,
          ipAddress: '', // Can be added if available
          userAgent: ''
        });
        console.error(`Notification failure for ${channel}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in sendNotification:', error);
  }
}

module.exports = {
  sendNotification
};