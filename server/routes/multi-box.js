const express = require('express');
const MultiBox = require('../models/MultiBox');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/multi-box/:orderId
router.post('/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { length, width, height, weight } = req.body;

    const multiBox = new MultiBox({
      orderId,
      length,
      width,
      height,
      weight,
      userId: req.user.id
    });

    await multiBox.save();
    res.status(201).json(multiBox);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/multi-box/:orderId
router.get('/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const multiBoxes = await MultiBox.find({ orderId, userId: req.user.id });
    res.json(multiBoxes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/multi-box/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const multiBox = await MultiBox.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!multiBox) {
      return res.status(404).json({ message: 'Multi box not found' });
    }

    res.json({ message: 'Multi box deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;