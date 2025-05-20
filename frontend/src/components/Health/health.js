import React from 'react';
import Header from '../header'

export default function Health() {
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
