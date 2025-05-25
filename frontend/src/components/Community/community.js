import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "./community.css";
import Header from '../Header/header';

const mockPosts = [
  {
    username: 'TrailBlazer_21',
    content: 'Just completed the Rocky Ridge Loop — amazing views and solid elevation gain!',
    timestamp: '2h ago',
  },
  {
    username: 'HikeHaven',
    content: 'Looking for partners for a weekend trek near Yosemite. Message me!',
    timestamp: '5h ago',
  },
  {
    username: 'GreenWalker',
    content: 'Styck really helped me stay on trail in foggy conditions. Great job team!',
    timestamp: '1d ago',
  },
];

export default function Community() {
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:9000/user_auth", {
      method: "GET",
      credentials: "include", // <-- Ensures cookies are sent
    })
      .then((res) => {
        if (res.redirected) {
          // FastAPI redirect was triggered (user not authenticated)
          navigate("/");
        }
        return res.json();
      })
      .catch((err) => {
        console.error("Auth check failed", err);
        navigate("/"); // fallback to redirect on error
      });
  }, [navigate]);

  return (
    <div className="dashboard">
      <Header />

      <main className="community__main">
        <h1 className="community__title">Community Forum</h1>
        <p className="community__subtitle">
          Share your hikes, ask questions, or connect with fellow explorers.
        </p>

        <div className="community__posts">
          {mockPosts.map((post, idx) => (
            <div key={idx} className="community__post">
              <div className="community__post-user">@{post.username}</div>
              <div className="community__post-content">{post.content}</div>
              <div className="community__post-time">{post.timestamp}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="dashboard__footer">
        <div className="dashboard__footer-left">
          © 2025 Ariadne. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
