const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shipping_app');

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
  console.log('Connected to MongoDB for migration');

  try {
    // Migration 1: Add clientId to Carrier model
    console.log('Adding clientId to carriers...');
    await db.collection('carriers').updateMany(
      { clientId: { $exists: false } },
      { $set: { clientId: null } }
    );

    // Migration 2: Add webhookSecret to User model
    console.log('Adding webhookSecret to users...');
    await db.collection('users').updateMany(
      { webhookSecret: { $exists: false } },
      { $set: { webhookSecret: null } }
    );

    // Migration 3: Add lastEscalationAt and autoRtoAt to NdrCase model
    console.log('Adding escalation fields to ndrcases...');
    await db.collection('ndrcases').updateMany(
      {
        $or: [
          { lastEscalationAt: { $exists: false } },
          { autoRtoAt: { $exists: false } }
        ]
      },
      {
        $set: {
          lastEscalationAt: null,
          autoRtoAt: null
        }
      }
    );

    // Migration 4: Add carrier field to TrackingSyncLog model
    console.log('Adding carrier field to trackingsynclogs...');
    await db.collection('trackingsynclogs').updateMany(
      { carrier: { $exists: false } },
      { $set: { carrier: null } }
    );

    // Migration 5: Ensure KYC fields exist in User model
    console.log('Ensuring KYC fields in users...');
    await db.collection('users').updateMany(
      {
        $or: [
          { gstNumber: { $exists: false } },
          { panNumber: { $exists: false } },
          { iecNumber: { $exists: false } },
          { kycStatus: { $exists: false } }
        ]
      },
      {
        $set: {
          gstNumber: null,
          panNumber: null,
          iecNumber: null,
          kycStatus: 'pending'
        }
      }
    );

    // Migration 6: Create indexes for better performance
    console.log('Creating database indexes...');

    // Index for KycDocument queries
    await db.collection('kycdocuments').createIndex({ userId: 1, status: 1 });
    await db.collection('kycdocuments').createIndex({ status: 1 });

    // Index for Document queries
    await db.collection('documents').createIndex({ userId: 1 });

    // Index for NdrCase queries
    await db.collection('ndrcases').createIndex({ agingInHours: 1 });
    await db.collection('ndrcases').createIndex({ currentAction: 1 });

    // Index for TrackingSyncLog queries
    await db.collection('trackingsynclogs').createIndex({ carrier: 1, status: 1, timestamp: -1 });

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
});