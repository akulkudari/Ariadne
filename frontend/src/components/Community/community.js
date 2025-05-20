import React from 'react';

export default function Community() {
  return (
    <div className="dashboard">
    <header className="dashboard__header">
    <div className="dashboard__logo">Ariadne</div>
    <nav className="dashboard__nav">
        <a href="/dashboard" className="dashboard__nav-link">Home</a>
        <a href="/health" className="dashboard__nav-link">Health Tracker</a>
        <a href="/nav" className="dashboard__nav-link">Navigation</a>
        <a href="/community" className="dashboard__nav-link">Community</a>
        <a href="#profile" className="dashboard__nav-link">Profile</a>
    </nav>
    </header>

    <div style={{ padding: '2rem' }}>
      <h1>Community Page</h1>
      <p>This is a space for users to connect, share hiking experiences, and support one another.</p>
    </div>

    <footer className="dashboard__footer">
        <div className="dashboard__footer-left">
          © 2025 Ariadne. All rights reserved.
        </div>
    </footer>
    </div>
  );
}

