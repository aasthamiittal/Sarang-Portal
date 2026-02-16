const mongoose = require('mongoose');

const savedFilterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filters: {
    type: Object,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure only one default filter per user. Mongoose 9 does not pass next.
savedFilterSchema.pre('save', async function() {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
});

module.exports = mongoose.model('SavedFilter', savedFilterSchema);