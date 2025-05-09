import React, { useState } from 'react';
import './registration.css';

export default function RegistrationPage({ onRegistered }) {
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
    deviceId: ''
  });
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
  
    if (form.password !== form.password_confirm) {
      setError("Passwords don't match");
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append("email", form.email);
      formData.append("username", form.username);
      formData.append("password", form.password);
      formData.append("password_confirm", form.password_confirm);
      formData.append("deviceId", form.deviceId); // make sure this is set
  
      const res = await fetch("http://localhost:9000/register", {
        method: "POST",
        body: formData  // DO NOT set Content-Type manually
      });
  
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Registration failed");
      }
  
      onRegistered(form.username);
    } catch (err) {
      setError(err.message);
    }
  };
  


  return (
    <div className="reg-container">
      <h2 className="reg-title">Register Your Device</h2>
      {error && <p className="reg-error">{error}</p>}
      <form className="reg-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
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
          />
        </label>

        <label>
          Device ID
          <input
            type="text"
            name="deviceId"
            value={form.deviceId}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit" className="reg-button">
          Register
        </button>
      </form>
    </div>
  );
}

