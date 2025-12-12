require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const shipmentRoutes = require('./routes/shipments');
const manifestRoutes = require('./routes/manifests');
const billingRoutes = require('./routes/billing');
const reportRoutes = require('./routes/reports');
const carrierRoutes = require('./routes/carriers');
const rateRoutes = require('./routes/rates');

app.use('/api/shipments', shipmentRoutes);
app.use('/api/manifests', manifestRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/carriers', carrierRoutes);
app.use('/api/rates', rateRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});