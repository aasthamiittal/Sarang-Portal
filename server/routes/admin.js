const express = require('express');
const requireAdmin = require('../middleware/auth').requireAdmin;
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const KycDocument = require('../models/KycDocument');

const router = express.Router();

// All admin routes require admin role
router.use(requireAdmin);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new user
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user'
    });
    await user.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    user.updatedAt = new Date();
    await user.save();

    res.json({ message: 'User role updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Deactivate/activate user
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    user.updatedAt = new Date();
    await user.save();

    res.json({ message: `User ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get activity logs
router.get('/activity-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, user, action } = req.query;
    const query = {};
    if (user) query.user = user;
    if (action) query.action = action;

    const logs = await ActivityLog.find(query)
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ActivityLog.countDocuments(query);

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// KYC Management

// Get pending KYC documents
router.get('/kyc/pending', async (req, res) => {
  try {
    const documents = await KycDocument.find({ status: 'pending' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Review KYC document
router.post('/kyc/:documentId/review', async (req, res) => {
  try {
    const { status, rejectionReason, gstNumber, panNumber, iecNumber } = req.body;

    const document = await KycDocument.findById(req.params.documentId).populate('userId');
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.status = status;
    document.verifiedBy = req.user._id;
    document.verifiedAt = new Date();

    if (status === 'rejected' && rejectionReason) {
      document.rejectionReason = rejectionReason;
    }

    await document.save();

    // Update user KYC status and details
    const user = document.userId;
    if (gstNumber) user.gstNumber = gstNumber;
    if (panNumber) user.panNumber = panNumber;
    if (iecNumber) user.iecNumber = iecNumber;

    // Check if all required documents are approved
    const allDocuments = await KycDocument.find({ userId: user._id });
    const requiredTypes = ['gst', 'pan', 'iec'];
    const approvedRequired = requiredTypes.every(type =>
      allDocuments.some(doc => doc.documentType === type && doc.status === 'approved')
    );

    user.kycStatus = approvedRequired ? 'approved' : 'pending';
    await user.save();

    res.json({ message: 'KYC document reviewed successfully', document });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user KYC details
router.get('/users/:userId/kyc', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('name email kycStatus gstNumber panNumber iecNumber');
    const documents = await KycDocument.find({ userId: req.params.userId });

    res.json({
      user,
      documents
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;