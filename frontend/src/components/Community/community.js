import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./community.css";
import Header from '../Header/header';

export default function Community() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:9000/user_auth", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (res.redirected) {
          navigate("/");
        }
        return res.json();
      })
      .catch((err) => {
        console.error("Auth check failed", err);
        navigate("/");
      });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const res = await fetch("http://localhost:9000/community", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (res.ok) {
        setMessage("");
        alert("Post submitted successfully!");
      } else {
        const err = await res.json();
        alert("Error posting: " + err.detail);
      }
    } catch (err) {
      console.error("Post submission error", err);
      alert("Failed to submit post.");
    }
  };

  return (
    <div className="dashboard">
      <Header />

      <main className="community__main">
        <h1 className="community__title">Submit a Community Post</h1>
        <p className="community__subtitle">
          Share your hike or message with fellow explorers.
        </p>

        <form className="community__form" onSubmit={handleSubmit}>
          <textarea
            className="community__textarea"
            placeholder="Write your post..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="4"
            required
          />
          <button type="submit" className="community__submit">Post</button>
        </form>
      </main>

      <footer className="dashboard__footer">
        <div className="dashboard__footer-left">
          © 2025 Ariadne. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
