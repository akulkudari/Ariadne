import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './profile.css';
import Header from '../Header/header'



function ProfilePage() {
  const navigate = useNavigate();
    useEffect(() => {
      fetch("http://localhost:9000/user_auth", {
        method: "GET",
        credentials: "include", // <-- Ensures cookies are sent
      })
        .then((res) => {
          if (res.redirected) {
            // FastAPI redirect was triggered (user not authenticated)
            navigate("/");
          }
          return res.json();
        })
        .catch((err) => {
          console.error("Auth check failed", err);
          navigate("/"); // fallback to redirect on error
        });
    }, [navigate]);
  
  const [hikeStats, setHikeStats] = useState({
    numberOfHikes: 12,
    longestHike: '8.4 miles',
    highestElevation: '1,200 ft',
    totalSteps: 58234,
  });

  useEffect(() => {
    console.log("Smartwatch data sync initialized...");
  }, []);

    function handleLogout() {
    // Clear user session if needed (e.g., localStorage.clear())
        navigate('/'); // Go to home page
    }
  return (
    <div className="profile">
      <Header />

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
