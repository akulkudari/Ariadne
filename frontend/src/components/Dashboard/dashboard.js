import React from 'react';
import './dashboard.css';
import communityImg from '../../assets/images/community.jpg';
import navigationImg from '../../assets/images/navigation.png';
import healthImg from '../../assets/images/health.png';
import Header from '../header'

// you can replace these with real icons or <img> tags
const cards = [
    {
    title: 'Navigation',
    img: navigationImg,
    desc: 'Find your way with ease using our detailed maps and trail guides.',
    link: '/nav'
    },
  {
    title: 'Health Tracker',
    img: healthImg,
    desc: 'Monitor your fitness levels and track your health metrics while you explore the great outdoors.',
    link: '/health'
  },

  {
    title: 'Community',
    img: communityImg,
    desc: 'Connect with fellow adventurers and share your experiences.',
    link: '/community'
  },
];

export default function Dashboard() {
  return (
    <div className="dashboard">
      <Header />

      <main className="dashboard__main">
        <h1 className="dashboard__title">Welcome to Ariadne</h1>
        <p className="dashboard__subtitle">Your ultimate companion for outdoor adventures.</p>

        <div className="dashboard__cards">
          {cards.map(c => (
            <a key={c.title} href={c.link} className="dashboard__card">
              <div className="dashboard__card-img">
                <img src={c.img} alt={c.title} />
              </div>
              <h2 className="dashboard__card-title">{c.title}</h2>
              <p className="dashboard__card-desc">{c.desc}</p>
            </a>
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
