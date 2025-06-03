import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './profile.css';
import Header from '../Header/header';

function ProfilePage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auth check (for redirect only)
    fetch("http://localhost:9000/user_auth", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (res.redirected) {
          navigate("/");
        }
      })
      .catch((err) => {
        console.error("Auth check failed", err);
        navigate("/");
      });
  }, [navigate]);
  
  useEffect(() => {
    // Fetch devices independently
    fetch("http://localhost:9000/devices", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((deviceData) => {
        setDevices(deviceData);
      })
      .catch((err) => {
        console.error("Failed to fetch devices", err);
      });
  }, []);  
  const [hikeStats, setHikeStats] = useState({
    numberOfHikes: 12,
    longestHike: '8.4 miles',
    highestElevation: '1,200 ft',
    totalSteps: 58234,
  });

  const [deviceName, setDeviceName] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [deviceMessage, setDeviceMessage] = useState('');
  const [devices, setDevices] = useState([]);
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editMac, setEditMac] = useState('');
    
  const handleEditClick = (device) => {
    setEditingDeviceId(device.id);
    setEditName(device.name);
    setEditMac(device.mac);
  };

  const handleUpdateSubmit = (e, deviceId) => {
    e.preventDefault();
    console.log("Updating device with ID:", deviceId);
    fetch(`http://localhost:9000/devices/${deviceId}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: editName,
        mac: editMac,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setDeviceMessage(data.message || data.detail);
        setEditingDeviceId(null);
        // Re-fetch devices
        return fetch("http://localhost:9000/devices", {
          method: "GET",
          credentials: "include",
        });
      })
      .then((res) => res.json())
      .then((deviceData) => setDevices(deviceData))
      .catch((err) => {
        console.error("Failed to update device", err);
        setDeviceMessage("Failed to update device");
      });
  };
  

  const handleDeviceSubmit = (e) => {
    e.preventDefault();

    fetch("http://localhost:9000/devices", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: deviceName,
        mac: macAddress,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setDeviceMessage(data.message || data.detail);
        setDeviceName('');
        setMacAddress('');
      })
      .catch((err) => {
        console.error("Failed to add device", err);
        setDeviceMessage("Failed to add device");
      });
  };

  return (
    <div className="profile">
      <Header />

      <main className="profile__main">
        <h1 className="profile__title">Your Hiking Profile</h1>
        <p className="profile__subtitle">Insights from your adventures, synced from your device.</p>

        <div className="profile__cards">
          <div className="profile__card">
            <h2 className="profile__card-title">Number of Hikes</h2>
            <p className="profile__card-value">{hikeStats.numberOfHikes}</p>
          </div>
          <div className="profile__card">
            <h2 className="profile__card-title">Longest Hike</h2>
            <p className="profile__card-value">{hikeStats.longestHike}</p>
          </div>
          <div className="profile__card">
            <h2 className="profile__card-title">Highest Elevation</h2>
            <p className="profile__card-value">{hikeStats.highestElevation}</p>
          </div>
          <div className="profile__card">
            <h2 className="profile__card-title">Total Steps</h2>
            <p className="profile__card-value">{hikeStats.totalSteps.toLocaleString()}</p>
          </div>
        </div>

        <div className="profile__section">
          <h2>Register a Device</h2>
          <form onSubmit={handleDeviceSubmit} className="device-form">
            <div className="device-form__group">
              <label htmlFor="deviceName">Device Name:</label>
              <input
                type="text"
                id="deviceName"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                required
              />
            </div>
            <div className="device-form__group">
              <label htmlFor="macAddress">MAC Address:</label>
              <input
                type="text"
                id="macAddress"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="profile__button">Add Device</button>
            {deviceMessage && <p className="device-form__message">{deviceMessage}</p>}
          </form>
        </div>

        <div className="profile__section">
          <h2>Your Devices</h2>
          {devices.length === 0 ? (
            <p>No devices registered.</p>
          ) : (
            <ul className="device-list">
            {devices.map((device) => (
              <li key={device.id} className="device-list__item">
                {editingDeviceId === device.id ? (
                  <form onSubmit={(e) => handleUpdateSubmit(e, device.id)} className="edit-device-form">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Device Name"
                      required
                    />
                    <input
                      type="text"
                      value={editMac}
                      onChange={(e) => setEditMac(e.target.value)}
                      placeholder="MAC Address"
                      required
                    />
                    <button type="submit" className="profile__button">Save</button>
                    <button type="button" onClick={() => setEditingDeviceId(null)}>Cancel</button>
                  </form>
                ) : (
                  <>
                    <span><strong>{device.name}</strong> — {device.mac}</span>
                    <button className="profile__button" onClick={() => handleEditClick(device)}>Update</button>
                  </>
                )}
              </li>
            ))}
          </ul>
          )}
        </div>

        <div className="profile__section">
          <h2>Smartwatch Integration</h2>
          <p>Sync your smartwatch for real-time stats and route tracking. (Coming soon)</p>
        </div>

        <div className="profile__section">
          <h2>Community</h2>
          <p>Connect with fellow hikers, share stories, and plan group treks.</p>
          <button className="profile__button" onClick={() => window.location.href = '/community'}>
            Go to Community
          </button>
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

export default ProfilePage;