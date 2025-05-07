import './App.css';
import React, { useState } from 'react';
import Login from './login';
import Registration from "./registration"


function App() {
  const [stage, setStage] = useState('register');
  const [user, setUser]   = useState('');

  const handleRegistered = username => {
    setUser(username);
    setStage('login');
  };

  return (
    <div className="App">
      {stage === 'register' ? (
        <Registration onRegistered={handleRegistered} />
      ) : (
        <Login initialUsername={user} />
      )}
    </div>
  );
}

export default App;
