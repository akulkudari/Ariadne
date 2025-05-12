import React, { useState } from 'react';
import './login.css';

export default function Login() {
  // form fields
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  // result states
  const [error, setError]       = useState('');   // ← new
  const [isLoggedIn, setLoggedIn] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); // clear previous
    try {
      console.log("here");
      const response = await fetch("http://localhost:9000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 302) {
        // backend redirected us after setting cookie
        console.log("here3");
        window.location.href = "/dashboard";
        return;
      }

      if (!response.ok) {
        console.log("here2");
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Invalid email or password");
      }

      console.log("Login OK:", await response.json());
      setLoggedIn(true);

    } catch (err) {
      console.error("Error during login:", err.message);
      setError(err.message);           
    }
  };

  if (isLoggedIn) {
    return (
      <div className="login-container">
        <h2 className="login-title">Welcome back!</h2>
        <p>You’ve successfully logged in.</p>
      </div>
    );
  }

  return (
    <div className="login-container">
      <h2 className="login-title">Log In</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="form-group">
          <label>Password
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

        {error && (
          <div className="error-message" style={{ color: 'red', marginTop: '1rem' }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
