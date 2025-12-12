const express = require('express');
const Integration = require('../models/Integration');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/integration/shopify/connect
router.post('/shopify/connect', auth, async (req, res) => {
  try {
    const { apiKey } = req.body;

    let integration = await Integration.findOne({ platform: 'shopify', userId: req.user.id });

    if (integration) {
      integration.connected = true;
      integration.apiKey = apiKey;
    } else {
      integration = new Integration({
        platform: 'shopify',
        connected: true,
        apiKey,
        userId: req.user.id
      });
    }

    await integration.save();
    res.json({ message: 'Shopify connected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/integration/webhooks
router.post('/webhooks', auth, async (req, res) => {
  try {
    const { url } = req.body;

    // For simplicity, store webhook URL in user's settings
    // In real app, this would be more sophisticated
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user.settings) user.settings = {};
    user.settings.webhookUrl = url;
    await user.save();

    res.json({ message: 'Webhook configured successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/integration/status
router.get('/status', auth, async (req, res) => {
  try {
    const integrations = await Integration.find({ userId: req.user.id });
    const status = {};

    integrations.forEach(integration => {
      status[integration.platform] = {
        connected: integration.connected
      };
    });

    // Add webhook status
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    status.webhook = {
      url: user.settings?.webhookUrl || null
    };

    status.api = {
      enabled: true, // Mock
      key: 'mock-api-key' // Mock
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/integration/:platform/sync
router.post('/:platform/sync', auth, async (req, res) => {
  try {
    const { platform } = req.params;

    // Mock sync process
    // In real app, this would trigger actual sync with the platform
    setTimeout(() => {
      console.log(`Synced with ${platform}`);
    }, 1000);

    res.json({ message: `Sync with ${platform} initiated` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;