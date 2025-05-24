import React from 'react';
import { useNavigate } from 'react-router-dom';
import './header.css'; // optional

function Header() {
    const navigate = useNavigate();

    async function handleLogout() {
      try {
        const response = await fetch('http://localhost:9000/login', {
          method: 'DELETE',  // important to send cookies
        });
  
        if (response.redirected) {
          // backend returned a redirect, just follow it
          window.location.href = response.url;
        } else if (response.ok) {
          // manually redirect on success
          navigate('/login');
        } else {
          alert('Logout failed');
        }
      } catch (error) {
        console.error('Logout error:', error);
        alert('Logout error');
      }
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
        <button className="dashboard__logout-button" onClick={() => handleLogout()}>
          Logout
        </button>
      </nav>
    </header>
  );
}

export default Header;