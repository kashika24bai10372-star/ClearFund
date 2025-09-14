// client/src/components/tracking/TrackingTimeline.js
import React, { useEffect, useState } from 'react';
import { useTracking } from '../../hooks/useTracking';
import { formatDate } from '../../utils/formatters';
import './TrackingTimeline.css';

const TrackingTimeline = ({ transactionId }) => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getTransactionTimeline, subscribeToUpdates } = useTracking();

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const data = await getTransactionTimeline(transactionId);
        setTimeline(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch timeline:', error);
        setLoading(false);
      }
    };

    fetchTimeline();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToUpdates(transactionId, (update) => {
      setTimeline(prev => [...prev, update]);
    });

    return () => unsubscribe();
  }, [transactionId]);

  if (loading) {
    return <div className="timeline-loading">Loading transaction history...</div>;
  }

  return (
    <div className="tracking-timeline">
      <h3>Transaction Timeline</h3>
      <div className="timeline-container">
        {timeline.map((item, index) => (
          <div 
            key={index}
            className={`timeline-item ${item.status}`}
          >
            <div className="timeline-icon">
              <i className={`fas ${item.icon}`}></i>
            </div>
            
            <div className="timeline-content">
              <h4>{item.title}</h4>
              <p>{item.description}</p>
              <div className="timeline-meta">
                <span className="timestamp">{formatDate(item.timestamp)}</span>
                {item.blockchainHash && (
                  <span className="blockchain-hash">
                    Block: {item.blockchainHash.slice(0, 10)}...
                  </span>
                )}
              </div>
              
              {item.status === 'active' && item.progress && (
                <div className="progress-indicator">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                  <span>{item.progress}% Complete</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackingTimeline;