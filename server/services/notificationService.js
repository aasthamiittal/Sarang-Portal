const nodemailer = require('nodemailer');
const axios = require('axios');
const crypto = require('crypto');
const twilio = require('twilio'); // Assuming installed
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

// Send SMS via Twilio
async function sendSMS(to, message) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured');
  }

  const client = twilio(accountSid, authToken);

  await retryWithBackoff(async () => {
    await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });
  });
}

// Send webhook with HMAC signature
async function sendWebhook(url, data, secret) {
  await retryWithBackoff(async () => {
    const payload = JSON.stringify(data);
    const signature = crypto.createHmac('sha256', secret || 'default-secret').update(payload).digest('hex');

    await axios.post(url, data, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-Hook-Signature': `sha256=${signature}`
      }
    });
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
          // Log success
          await ActivityLog.create({
            user: userId,
            action: 'notification_success',
            description: `Successfully sent email notification for ${eventType}`,
            ipAddress: '',
            userAgent: ''
          });
        } else if (channel === 'sms' && user.phone) {
          await sendSMS(user.phone, body);
          // Log success
          await ActivityLog.create({
            user: userId,
            action: 'notification_success',
            description: `Successfully sent SMS notification for ${eventType}`,
            ipAddress: '',
            userAgent: ''
          });
        } else if (channel === 'webhook' && user.webhookUrl) {
          await sendWebhook(user.webhookUrl, { eventType, ...data }, user.webhookSecret);
          // Log success
          await ActivityLog.create({
            user: userId,
            action: 'notification_success',
            description: `Successfully sent webhook notification for ${eventType}`,
            ipAddress: '',
            userAgent: ''
          });
        }
      } catch (error) {
        // Log failure to ActivityLog
        await ActivityLog.create({
          user: userId,
          action: 'notification_failure',
          description: `Failed to send ${channel} notification for ${eventType}: ${error.message}`,
          ipAddress: '',
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