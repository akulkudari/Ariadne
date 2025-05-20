import React from 'react';
import "./community.css"

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
  return (
    <div className="dashboard">
    <header className="dashboard__header">
    <div className="dashboard__logo">Ariadne</div>
    <nav className="dashboard__nav">
        <a href="/dashboard" className="dashboard__nav-link">Home</a>
        <a href="/health" className="dashboard__nav-link">Health Tracker</a>
        <a href="/nav" className="dashboard__nav-link">Navigation</a>
        <a href="/community" className="dashboard__nav-link">Community</a>
        <a href="/profile" className="dashboard__nav-link">Profile</a>
    </nav>
    </header>

    <main className="community__main">
        <h1 className="community__title">Community Forum</h1>
        <p className="community__subtitle">Share your hikes, ask questions, or connect with fellow explorers.</p>

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

