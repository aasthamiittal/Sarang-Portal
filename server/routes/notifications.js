const express = require('express');
const { auth, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const NotificationTemplate = require('../models/NotificationTemplate');
const Notification = require('../models/Notification');

const router = express.Router();

// User notification routes
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/list', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(limit);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// All routes below require admin
router.use(auth, requireAdmin);

// Notification Templates CRUD

// Get all templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await NotificationTemplate.find();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create template
router.post('/templates', async (req, res) => {
  try {
    const { eventType, channel, subject, body } = req.body;
    const template = new NotificationTemplate({ eventType, channel, subject, body });
    await template.save();
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update template
router.put('/templates/:id', async (req, res) => {
  try {
    const { eventType, channel, subject, body, isActive } = req.body;
    const template = await NotificationTemplate.findByIdAndUpdate(
      req.params.id,
      { eventType, channel, subject, body, isActive, updatedAt: new Date() },
      { new: true }
    );
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json(template);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete template
router.delete('/templates/:id', async (req, res) => {
  try {
    const template = await NotificationTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// User Preferences

// Get current user preferences
router.get('/preferences/me', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationPreferences webhookUrl');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update current user preferences
router.put('/preferences/me', async (req, res) => {
  try {
    const { notificationPreferences, webhookUrl } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notificationPreferences, webhookUrl, updatedAt: new Date() },
      { new: true }
    ).select('notificationPreferences webhookUrl');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user preferences (admin)
router.get('/preferences/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('notificationPreferences webhookUrl');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user preferences (admin)
router.put('/preferences/:userId', async (req, res) => {
  try {
    const { notificationPreferences, webhookUrl } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { notificationPreferences, webhookUrl, updatedAt: new Date() },
      { new: true }
    ).select('notificationPreferences webhookUrl');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;