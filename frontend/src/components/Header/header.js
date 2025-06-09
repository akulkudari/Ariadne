import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './header.css'; // optional

function Header() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');

  useEffect(() => {
    async function fetchUsername() {
      try {
        const response = await fetch('http://localhost:9000/username', {
          method: 'GET',
          credentials: 'include', // so it sends the session cookie
        });

        if (response.ok) {
          const data = await response.json();
          setUsername(data.username);
        } else {
          console.warn('Failed to fetch username');
        }
      } catch (error) {
        console.error('Error fetching username:', error);
      }
    }

    fetchUsername();
  }, []);

  async function handleLogout() {
    try {
      const response = await fetch('http://localhost:9000/login', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.redirected) {
        window.location.href = response.url;
      } else if (response.ok) {
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
        <a href="/profile" className="dashboard__nav-link">Profile: {username}</a>
        <button className="dashboard__logout-button" onClick={handleLogout}>
          Logout
        </button>
      </nav>
    </header>
  );
}

export default Header;
