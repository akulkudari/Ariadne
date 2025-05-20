import React, { useState, useEffect } from 'react';
import './profile.css';

function ProfilePage() {
  const [hikeStats, setHikeStats] = useState({
    numberOfHikes: 12,
    longestHike: '8.4 miles',
    highestElevation: '1,200 ft',
    totalSteps: 58234,
  });

  useEffect(() => {
    console.log("Smartwatch data sync initialized...");
  }, []);

  return (
    <div className="profile">
      <header className="dashboard__header">
        <div className="dashboard__logo">Ariadne</div>
        <nav className="dashboard__nav">
          <a href="/dashboard" className="dashboard__nav-link">Home</a>
          <a href="/health" className="dashboard__nav-link">Health Tracker</a>
          <a href="/nav" className="dashboard__nav-link">Navigation</a>
          <a href="/community" className="dashboard__nav-link">Community</a>
          <a href="/profile" className="dashboard__nav-link">Profile</a>
        </nav>
      </header>

      <main className="profile__main">
        <h1 className="profile__title">Your Hiking Profile</h1>
        <p className="profile__subtitle">Insights from your adventures, synced from your device.</p>

        <div className="profile__cards">
          <div className="profile__card">
            <h2 className="profile__card-title">Number of Hikes</h2>
            <p className="profile__card-value">{hikeStats.numberOfHikes}</p>
          </div>
          <div className="profile__card">
            <h2 className="profile__card-title">Longest Hike</h2>
            <p className="profile__card-value">{hikeStats.longestHike}</p>
          </div>
          <div className="profile__card">
            <h2 className="profile__card-title">Highest Elevation</h2>
            <p className="profile__card-value">{hikeStats.highestElevation}</p>
          </div>
          <div className="profile__card">
            <h2 className="profile__card-title">Total Steps</h2>
            <p className="profile__card-value">{hikeStats.totalSteps.toLocaleString()}</p>
          </div>
        </div>

        <div className="profile__section">
          <h2>Smartwatch Integration</h2>
          <p>Sync your smartwatch for real-time stats and route tracking. (Coming soon)</p>
        </div>

        <div className="profile__section">
          <h2>Community</h2>
          <p>Connect with fellow hikers, share stories, and plan group treks.</p>
          <button className="profile__button" onClick={() => window.location.href='/community'}>
            Go to Community
          </button>
        </div>
      </main>

      <footer className="dashboard__footer">
        <div className="dashboard__footer-left">
          © 2025 Ariadne. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default ProfilePage;
