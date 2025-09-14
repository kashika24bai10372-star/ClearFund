// client/src/components/donations/DonationCard.js
import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useBlockchain } from '../../hooks/useBlockchain';
import './DonationCard.css';

const DonationCard = ({ donation, onDonate, onViewDetails }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { verifyTransaction } = useBlockchain();
  
  const progressPercentage = (donation.raised / donation.target) * 100;
  
  const handleDonate = async (amount) => {
    setIsLoading(true);
    try {
      await onDonate(donation.id, amount);
      // Verify transaction on blockchain
      await verifyTransaction(donation.lastTransactionHash);
    } catch (error) {
      console.error('Donation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="donation-card">
      <div className="card-image">
        <img src={donation.image} alt={donation.title} />
        <div className="blockchain-badge">
          <i className="fas fa-shield-alt"></i>
          Blockchain Verified
        </div>
      </div>
      
      <div className="card-content">
        <span className="card-category">{donation.category}</span>
        <h3 className="card-title">{donation.title}</h3>
        <p className="card-description">{donation.description}</p>
        
        <div className="card-progress">
          <div className="progress-info">
            <span>Raised: {formatCurrency(donation.raised)}</span>
            <span>Goal: {formatCurrency(donation.target)}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="progress-percentage">{progressPercentage.toFixed(1)}%</div>
        </div>
        
        <div className="card-meta">
          <div className="meta-item">
            <i className="fas fa-users"></i>
            <span>{donation.donors} donors</span>
          </div>
          <div className="meta-item">
            <i className="fas fa-clock"></i>
            <span>{donation.daysLeft} days left</span>
          </div>
          <div className={`urgency-badge urgency-${donation.urgency}`}>
            {donation.urgency.toUpperCase()}
          </div>
        </div>
        
        <div className="card-actions">
          <button 
            className="btn-primary"
            onClick={() => handleDonate(1000)}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Donate ₹1000'}
          </button>
          <button 
            className="btn-outline"
            onClick={() => onViewDetails(donation.id)}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonationCard;