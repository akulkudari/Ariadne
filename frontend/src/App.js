import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import RegistrationPage from './components/Registration/registration';
import LoginPage from './components/Login/login';
import Dashboard from './components/Dashboard/dashboard';
import Navigation from './components/Navigation/navboard';
import Community from './components/Community/community';
import Health from './components/Health/health';
import Profile from './components/Profile/profile';
import './App.css';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="overlay-card">
        <h1 className="main-heading">Welcome to Ariadne</h1>
        <p className="tagline">
          Your smart hiking companion—vibrations for direction, live metrics, and safety alerts in a durable, weather‑resistant design.
        </p>
        <div className="button-row">
          <button className="btn btn-login" onClick={() => navigate('/login')}>
            Log In
          </button>
          <button className="btn btn-start" onClick={() => navigate('/register')}>
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage onLoggedIn={() => window.location.href = '/dashboard'} />} />
          <Route path="/register" element={<RegistrationPage onRegistered={() => window.location.href = '/login'} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/nav" element = {<Navigation/>} />
          <Route path="/community" element={<Community />} />
          <Route path="/health" element={<Health />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}
