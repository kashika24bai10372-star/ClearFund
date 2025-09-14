// server/src/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  donation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  type: {
    type: String,
    enum: ['donation', 'distribution', 'refund', 'fee'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  transactionHash: {
    type: String,
    unique: true,
    sparse: true
  },
  blockNumber: Number,
  blockHash: String,
  gasUsed: Number,
  gasFee: Number,
  paymentMethod: {
    type: String,
    enum: ['crypto', 'bank', 'upi', 'card'],
    default: 'crypto'
  },
  paymentDetails: {
    gateway: String,
    gatewayTransactionId: String,
    walletAddress: String
  },
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    description: String,
    txHash: String
  }],
  metadata: {
    donorName: String,
    donorEmail: String,
    message: String,
    isAnonymous: { type: Boolean, default: false },
    campaign: String,
    source: String
  },
  verification: {
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verificationHash: String
  },
  fees: {
    platformFee: { type: Number, default: 0 },
    processingFee: { type: Number, default: 0 },
    networkFee: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ donation: 1, createdAt: -1 });
transactionSchema.index({ donor: 1, createdAt: -1 });
transactionSchema.index({ transactionHash: 1 });
transactionSchema.index({ status: 1, type: 1 });

// Pre-save middleware to add timeline entry
transactionSchema.pre('save', function(next) {
  if (this.isModified('status') || this.isNew) {
    this.timeline.push({
      status: this.status,
      description: `Transaction ${this.status}`,
      timestamp: new Date()
    });
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);