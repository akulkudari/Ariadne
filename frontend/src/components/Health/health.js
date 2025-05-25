import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header/header'

export default function Health() {
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

     <div style={{ padding: '2rem' }}>
      <h1>Health Page</h1>
      <p>This is a space for users to track their health.</p>
    </div>

     <footer className="dashboard__footer">
       <div className="dashboard__footer-left">
         © 2025 Ariadne. All rights reserved.
       </div>
     </footer>
   </div>
  );
}
