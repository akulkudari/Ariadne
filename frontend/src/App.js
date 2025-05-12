import React, { useState } from 'react';
import RegistrationPage from './registration';
import LoginPage        from './login';

export default function App() {
  const [stage, setStage] = useState('home');  // ← start on “home”
  
  const renderStage = () => {
    switch(stage) {
      case 'register':
        return <RegistrationPage onRegistered={() => setStage('login')} />;
      case 'login':
        return <LoginPage onLoggedIn={() => setStage('dashboard')} />;
      case 'dashboard':
        return <h2>🛠️ Dashboard coming soon…</h2>;
      default:  // 'home'
        return (
          <div style={{ textAlign: 'center', marginTop: 80 }}>
            <h1>Welcome to Ariadne</h1>
            <button
              style={{ padding: '10px 20px', margin: '0 10px' }}
              onClick={() => setStage('login')}
            >
              Login
            </button>
            <button
              style={{ padding: '10px 20px', margin: '0 10px' }}
              onClick={() => setStage('register')}
            >
              Register
            </button>
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
