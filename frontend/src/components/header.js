import React from 'react';
import { useNavigate } from 'react-router-dom';
import './header.css'; // optional

function Header() {
    const navigate = useNavigate();
  
    function handleLogout() {
        navigate('/'); // Go to home page
    }

  return (
    <header className="dashboard__header">
      <div className="dashboard__logo">Ariadne</div>
      <nav className="dashboard__nav">
        <a href="/dashboard" className="dashboard__nav-link">Home</a>
        <a href="/health" className="dashboard__nav-link">Health Tracker</a>
        <a href="/nav" className="dashboard__nav-link">Navigation</a>
        <a href="/community" className="dashboard__nav-link">Community</a>
        <a href="/profile" className="dashboard__nav-link">Profile</a>
        <button className="dashboard__logout-button" onClick={() => handleLogout(navigate)}>
          Logout
        </button>
      </nav>
    </header>
  );
}

export default Header;