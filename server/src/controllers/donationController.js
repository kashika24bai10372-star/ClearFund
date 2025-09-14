// server/src/controllers/donationController.js
const Donation = require('../models/Donation');
const Transaction = require('../models/Transaction');
const blockchainService = require('../services/blockchainService');
const { validationResult } = require('express-validator');

class DonationController {
  // Get all donations with filtering and pagination
  async getDonations(req, res) {
    try {
      const { 
        page = 1, 
        limit = 12, 
        category, 
        urgency, 
        search 
      } = req.query;

      let filter = { status: 'active' };
      
      if (category) filter.category = category;
      if (urgency) filter.urgency = urgency;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'organization.name': { $regex: search, $options: 'i' } }
        ];
      }

      const donations = await Donation.find(filter)
        .populate('organization', 'name verified')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Donation.countDocuments(filter);

      res.json({
        success: true,
        data: {
          donations,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalDonations: total
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch donations',
        error: error.message
      });
    }
  }

  // Create new donation campaign
  async createDonation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const donationData = {
        ...req.body,
        organization: req.user.organizationId,
        createdBy: req.user.id
      };

      const donation = new Donation(donationData);
      await donation.save();

      // Deploy smart contract for this donation
      const contractAddress = await blockchainService.deployDonationContract({
        target: donation.target,
        beneficiaryAddress: donation.beneficiaryWallet,
        organizationAddress: req.user.walletAddress
      });

      donation.contractAddress = contractAddress;
      await donation.save();

      res.status(201).json({
        success: true,
        message: 'Donation campaign created successfully',
        data: donation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create donation campaign',
        error: error.message
      });
    }
  }

  // Process donation
  async processDonation(req, res) {
    try {
      const { donationId } = req.params;
      const { amount, walletAddress } = req.body;

      const donation = await Donation.findById(donationId);
      if (!donation) {
        return res.status(404).json({
          success: false,
          message: 'Donation campaign not found'
        });
      }

      // Process blockchain transaction
      const txHash = await blockchainService.processDonation({
        contractAddress: donation.contractAddress,
        amount,
        donorAddress: walletAddress
      });

      // Record transaction
      const transaction = new Transaction({
        donation: donationId,
        donor: req.user.id,
        amount,
        transactionHash: txHash,
        status: 'pending',
        type: 'donation'
      });

      await transaction.save();

      // Update donation totals
      donation.raised += amount;
      donation.donors += 1;
      donation.transactions.push(transaction._id);
      await donation.save();

      res.json({
        success: true,
        message: 'Donation processed successfully',
        data: {
          transactionHash: txHash,
          transactionId: transaction._id
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to process donation',
        error: error.message
      });
    }
  }
}

module.exports = new DonationController();