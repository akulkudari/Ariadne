import React, { useState } from 'react';
import './registration.css';

export default function RegistrationPage({ onRegistered }) {
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
  });
  const [error, setError] = useState('');

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (form.password !== form.password_confirm) {
      setError("Passwords don't match");
      return;
    }

    try {
      const res = await fetch('http://localhost:9000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Registration failed');
      }
      onRegistered(form.username);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="reg-container">
      <div className="reg-overlay-card">
        <h2 className="reg-title">Register Your Device</h2>
        {error && <p className="error-message">{error}</p>}
        <form className="reg-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="form-input"
            />
          </label>

          <label>
            Username
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="form-input"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="form-input"
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              name="password_confirm"
              value={form.password_confirm}
              onChange={handleChange}
              required
              className="form-input"
            />
          </label>

  

          <button type="submit" className="btn btn-reg-button">
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
