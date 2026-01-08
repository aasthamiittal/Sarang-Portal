const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const TrackingSyncLog = require('../models/TrackingSyncLog');

router.use(auth);

// GET /health - Get tracking sync health metrics for the authenticated user
router.get('/health', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get last sync time
    const lastSyncLog = await TrackingSyncLog.findOne({ user: userId }).sort({ timestamp: -1 });
    const lastSyncTime = lastSyncLog ? lastSyncLog.timestamp : null;

    // Get success count in last 24 hours
    const successCount = await TrackingSyncLog.countDocuments({
      user: userId,
      status: 'success',
      timestamp: { $gte: last24h }
    });

    // Get failed count in last 24 hours
    const failedCount = await TrackingSyncLog.countDocuments({
      user: userId,
      status: 'failed',
      timestamp: { $gte: last24h }
    });

    res.json({
      lastSyncTime,
      successCount,
      failedCount
    });
  } catch (error) {
    console.error('Error in GET /tracking/health:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;