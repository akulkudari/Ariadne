import React, { useState } from 'react';
import './login.css';

export default function Login() {
  const [username, setUsername]   = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword]   = useState('');
  const [isLoggedIn, setLoggedIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username, // Assuming 'username' holds the user's email
          password: password,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }
  
      const data = await response.json();
      console.log("Login successful:", data);
      setLoggedIn(true);
    } catch (error) {
      console.error("Error during login:", error.message);
      // Optionally, set an error state here to display an error message to the user
    }
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
            Email
            <input
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
