import React, { useState } from 'react';
import RegistrationPage from './registration';
import LoginPage        from './login'; 
import './App.css';
import Dashboard from './dashboard.js';


export default function App() {
  const [stage, setStage] = useState('home');  // ← start on “home”
  
  const renderStage = () => {
    switch(stage) {
      case 'register':
        return <RegistrationPage onRegistered={() => setStage('login')} />;
      case 'login':
        return <LoginPage onLoggedIn={() => setStage('dashboard')} />;
      case 'dashboard':
        return <Dashboard />;
      default:  // 'home'
        return (
          <div className="home-container">
            <div className="overlay-card">
              <h1 className="main-heading">Welcome to Ariadne</h1>
              <p className="tagline">
                Your smart hiking companion—vibrations for direction, live metrics, and safety alerts in a durable, weather‑resistant design.
              </p>
              <div className="button-row">
                <button className="btn btn-login" onClick={() => setStage('login')}>
                  Log In
                </button>
                <button className="btn btn-start" onClick={() => setStage('register')}>
                  Get Started
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="App">
      {renderStage()}
    </div>
  );
}
