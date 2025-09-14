// client/src/components/common/Header.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { WalletConnect } from '../auth/WalletConnect';
import './Header.css';

const Header = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <i className="fas fa-shield-alt"></i>
          <span>ClearFund</span>
        </div>
        
        <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <li><a href="#home" className="nav-link">Home</a></li>
          <li><a href="#donations" className="nav-link">Donations</a></li>
          <li><a href="#tracking" className="nav-link">Track Funds</a></li>
          <li><a href="#dashboard" className="nav-link">Dashboard</a></li>
        </ul>
        
        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <span className="user-greeting">Hello, {user.name}</span>
              <button className="btn-secondary" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <WalletConnect />
          )}
        </div>
        
        <div 
          className="hamburger"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </nav>
  );
};

export default Header;