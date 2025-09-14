// server/src/models/Donation.js
const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: ['education', 'health', 'disaster', 'environment', 'poverty', 'other']
  },
  target: {
    type: Number,
    required: true,
    min: 1000
  },
  raised: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled', 'suspended'],
    default: 'draft'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  beneficiaryWallet: {
    type: String,
    required: true
  },
  contractAddress: {
    type: String,
    unique: true,
    sparse: true
  },
  images: [{
    url: String,
    caption: String
  }],
  documents: [{
    name: String,
    url: String,
    type: String
  }],
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],
  donors: {
    type: Number,
    default: 0
  },
  tags: [String],
  location: {
    country: { type: String, default: 'India' },
    state: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  verification: {
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    documents: [String]
  },
  metrics: {
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
donationSchema.index({ category: 1, status: 1 });
donationSchema.index({ urgency: 1, status: 1 });
donationSchema.index({ 'location.state': 1, status: 1 });
donationSchema.index({ organization: 1 });
donationSchema.index({ createdAt: -1 });

// Virtual for days remaining
donationSchema.virtual('daysLeft').get(function() {
  const today = new Date();
  const timeDiff = this.endDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Virtual for progress percentage
donationSchema.virtual('progressPercentage').get(function() {
  return (this.raised / this.target) * 100;
});

module.exports = mongoose.model('Donation', donationSchema);