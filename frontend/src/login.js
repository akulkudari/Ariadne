import React, { useState } from 'react';
import './login.css';

export default function Login() {
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [isLoggedIn, setLoggedIn] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoggedIn(true);
  };

  if (isLoggedIn) {
    return (
      <div className="login-container">
        <h2 className="login-title">Welcome to Ariadne, {username}!</h2>
        <p>You’ve successfully logged in.</p>
      </div>
    );
  }

  return (
    <div className="login-container">
      <h2 className="login-title">Log In</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Username
            <input
              className="form-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="form-group">
          <label>
            Password
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>
        </div>
        <button className="login-button" type="submit">
          Log In
        </button>
      </form>
    </div>
  );
}
