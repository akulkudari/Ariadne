// src/components/ProfilePage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './profile.css';
import Header from '../Header/header';
import avatarImg from '../../assets/images/avatar.jpg';

function ProfilePage() {
  const navigate = useNavigate();
  const [bio, setBio] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioMessage, setBioMessage] = useState('');
  const [selectedTab, setSelectedTab] = useState('register');
  const [currentUsername, setCurrentUsername] = useState("");

  // === Auth Check ===
  useEffect(() => {
    fetch("http://localhost:9000/user_auth", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (res.redirected) {
          navigate("/");
        } else {
          return res.json();
        }
      })
      .then((userObj) => {
        // If your /user_auth returns { id: 5, username: "chloe", ... }
        setCurrentUsername(userObj.username);
      })
      .catch(() => navigate("/"));
  }, [navigate]);

  // === Devices State & Fetch ===
  const [devices, setDevices] = useState([]);
  const [deviceName, setDeviceName] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [deviceMessage, setDeviceMessage] = useState('');
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editMac, setEditMac] = useState('');

  useEffect(() => {
    fetch('http://localhost:9000/devices', {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((deviceData) => setDevices(deviceData))
      .catch((err) => console.error('Failed to fetch devices', err));
  }, []);

  const handleEditClick = (device) => {
    setEditingDeviceId(device.id);
    setEditName(device.name);
    setEditMac(device.mac);
  };

  const handleUpdateSubmit = (e, deviceId) => {
    e.preventDefault();
    fetch(`http://localhost:9000/devices/${deviceId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, mac: editMac }),
    })
      .then((res) => res.json())
      .then((data) => {
        setDeviceMessage(data.message || data.detail);
        setEditingDeviceId(null);
        return fetch('http://localhost:9000/devices', {
          method: 'GET',
          credentials: 'include',
        });
      })
      .then((res) => res.json())
      .then((deviceData) => setDevices(deviceData))
      .catch(() => setDeviceMessage('Failed to update device'));
  };

  const handleDeviceSubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:9000/devices', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: deviceName, mac: macAddress }),
    })
      .then((res) => res.json())
      .then((data) => {
        setDeviceMessage(data.message || data.detail);
        setDeviceName('');
        setMacAddress('');
      })
      .catch(() => setDeviceMessage('Failed to add device'));
  };

  const [tripLength, setTripLength] = useState('');           // e.g. "5.2" miles or km
  const [tripDuration, setTripDuration] = useState('');       // e.g. minutes or seconds
  const [tripSteps, setTripSteps] = useState('');             // integer
  const [tripElevation, setTripElevation] = useState('');     // e.g. "1200" feet or meters
  const [tripMessage, setTripMessage] = useState('');
  const [trips, setTrips]               = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [tripsError, setTripsError]     = useState('');

  const fetchTrips = () => {
    setLoadingTrips(true);
    fetch('http://localhost:9000/trips', {
      method: 'GET',
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch trips');
        return res.json();
      })
      .then(data => {
        setTrips(data);
        setTripsError('');
      })
      .catch(() => setTripsError('Could not load your trips.'))
      .finally(() => setLoadingTrips(false));
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (selectedTab === 'history') {
      fetchTrips();
    }
  }, [selectedTab]);
  
  const handleTripSubmit = (e) => {
    e.preventDefault();
  
    if (!tripLength || !tripDuration || !tripSteps || !tripElevation) {
      setTripMessage('Please fill out every field.');
      return;
    }
  
    const payload = {
      length: parseFloat(tripLength),
      duration: parseInt(tripDuration, 10),
      steps: parseInt(tripSteps, 10),
      elevation_gain: parseFloat(tripElevation),
    };
  
    fetch('http://localhost:9000/trip', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to log trip.');
        }
        return res.json();
      })
      .then((data) => {
        setTripMessage(data.message || 'Trip logged successfully.');
        setTripLength('');
        setTripDuration('');
        setTripSteps('');
        setTripElevation('');
        fetchTrips();  // ✅ Refetch the trips list and re-render updated stats
      })
      .catch((err) => {
        console.error('Failed to log trip:', err);
        setTripMessage('Failed to log trip.');
      });
  };
  


  // Helper to format “duration” nicely (seconds → Hh Mm Ss)
  function formatDuration(sec) {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  return (
    <div className="profile">
      <Header />

      <main className="profile__main">
        <h1 className="profile__title">Your Hiking Profile</h1>
        <p className="profile__subtitle">
          Insights from your adventures, synced from your device.
        </p>

        <div className="profile__content">
          <div className="profile__left">
            <div className="profile__header">
              <img
                src={avatarImg}
                alt="Your Avatar"
                className="profile__avatar"
              />
              <div className="profile__bio">
  {isEditingBio ? (
    <>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        maxLength={300}
        rows={5}
        style={{ width: '100%' }}
      />
      <button
        className="profile__button"
        onClick={() => {
          fetch("http://localhost:9000/profile", {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bio }),
          })
            .then((res) => res.json())
            .then((data) => {
              setBioMessage(data.message || "Bio updated!");
              setIsEditingBio(false);
            })
            .catch(() => {
              setBioMessage("Failed to update bio.");
            });
        }}
      >
        Save Bio
      </button>
      <button
        className="profile__button profile__button--secondary"
        onClick={() => setIsEditingBio(false)}
      >
        Cancel
      </button>
      {bioMessage && <p className="device-form__message">{bioMessage}</p>}
    </>
  ) : (
    <>
      <p>{bio || "No bio set yet."}</p>
      <button
        className="profile__button profile__button--small"
        onClick={() => setIsEditingBio(true)}
      >
        Edit Bio
      </button>
    </>
  )}
</div>

            </div>

            <div className="profile__cards">
              <div className="profile__card">
                <h2 className="profile__card-title">Number of Hikes</h2>
                <p className="profile__card-value">
                  {trips.length}
                </p>
              </div>
              <div className="profile__card">
                <h2 className="profile__card-title">Longest Hike</h2>
                <p className="profile__card-value">
                  {trips.length > 0 ? Math.max(...trips.map(t => t.length)).toFixed(2) : '0.00'} miles
                </p>
              </div>
              <div className="profile__card">
                <h2 className="profile__card-title">Highest Elevation</h2>
                <p className="profile__card-value">
                {trips.length > 0 ? Math.max(...trips.map((t) => t.elevation_gain)): 0}
                </p>
              </div>
              <div className="profile__card">
                <h2 className="profile__card-title">Total Distance</h2>
                <p className="profile__card-value">
                  {trips.reduce((sum, t) => sum + t.length, 0).toFixed(2)} miles
                </p>
              </div>
              <div className="profile__card">
                <h2 className="profile__card-title">Total Steps</h2>
                <p className="profile__card-value">
                  {trips.reduce((sum, t) => sum + t.steps, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="profile__right">
            <div className="profile__device-tabs">
              <button
                className={`tab-button ${
                  selectedTab === 'register' ? 'tab-button--active' : ''
                }`}
                onClick={() => setSelectedTab('register')}
              >
                Register Device
              </button>
              <button
                className={`tab-button ${
                  selectedTab === 'devices' ? 'tab-button--active' : ''
                }`}
                onClick={() => setSelectedTab('devices')}
              >
                Your Devices
              </button>
              <button
                className={`tab-button ${
                  selectedTab === 'trip' ? 'tab-button--active' : ''
                }`}
                onClick={() => setSelectedTab('trip')}
              >
                Log a Trip
              </button>

              <button
                className={`tab-button ${
                  selectedTab === 'history' ? 'tab-button--active' : ''
                }`}
                onClick={() => setSelectedTab('history')}
              >
                Your Trips
              </button>
            </div>

            {selectedTab === 'register' && (
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
                  <button type="submit" className="profile__button">
                    Add Device
                  </button>
                  {deviceMessage && (
                    <p className="device-form__message">{deviceMessage}</p>
                  )}
                </form>
              </div>
            )}

            {selectedTab === 'devices' && (
              <div className="profile__section">
                <h2>Your Devices</h2>
                {devices.length === 0 ? (
                  <p>No devices registered.</p>
                ) : (
                  <ul className="device-list">
                    {devices.map((device) => (
                      <li key={device.id} className="device-list__item">
                        {editingDeviceId === device.id ? (
                          <form
                            onSubmit={(e) => handleUpdateSubmit(e, device.id)}
                            className="edit-device-form"
                          >
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
                            <button type="submit" className="profile__button">
                              Save
                            </button>
                            <button
                              type="button"
                              className="profile__button profile__button--secondary"
                              onClick={() => setEditingDeviceId(null)}
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <>
                            <span>
                              <strong>{device.name}</strong> — {device.mac}
                            </span>
                            <button
                              className="profile__button profile__button--small"
                              onClick={() => handleEditClick(device)}
                            >
                              Update
                            </button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {selectedTab === 'trip' && (
              <div className="profile__section">
                <h2>Log a Trip</h2>
                <form onSubmit={handleTripSubmit} className="device-form">
                  <div className="device-form__group">
                    <label htmlFor="tripLength">Length (miles):</label>
                    <input
                      type="number"
                      step="0.01"
                      id="tripLength"
                      value={tripLength}
                      onChange={(e) => setTripLength(e.target.value)}
                      placeholder="e.g. 5.2"
                      required
                    />
                  </div>
                  <div className="device-form__group">
                    <label htmlFor="tripDuration">
                      Duration (minutes):
                    </label>
                    <input
                      type="number"
                      step="1"
                      id="tripDuration"
                      value={tripDuration}
                      onChange={(e) => setTripDuration(e.target.value)}
                      placeholder="e.g. 120"
                      required
                    />
                  </div>
                  <div className="device-form__group">
                    <label htmlFor="tripSteps">Total Steps:</label>
                    <input
                      type="number"
                      step="1"
                      id="tripSteps"
                      value={tripSteps}
                      onChange={(e) => setTripSteps(e.target.value)}
                      placeholder="e.g. 15000"
                      required
                    />
                  </div>
                
                  <div className="device-form__group">
                    <label htmlFor="tripElevation">
                      Elevation Gain (feet):
                    </label>
                    <input
                      type="number"
                      step="1"
                      id="tripElevation"
                      value={tripElevation}
                      onChange={(e) => setTripElevation(e.target.value)}
                      placeholder="e.g. 1200"
                      required
                    />
                  </div>
                  <button type="submit" className="profile__button">
                    Log Trip
                  </button>
                  {tripMessage && (
                    <p className="device-form__message">{tripMessage}</p>
                  )}
                </form>
              </div>
            )}


            {selectedTab === 'history' && (
              <div className="profile__section">
                <h2>Your Trips</h2>

                {loadingTrips && <p>Loading your trip history…</p>}
                {tripsError  && <p className="error">{tripsError}</p>}

                {!loadingTrips && !tripsError && trips.length === 0 && (
                  <p>No trips logged yet.</p>
                )}

                {!loadingTrips && trips.length > 0 && (
                  <>
                    <ul className="trips-list">
                      {trips.map((t, i) => (
                        <li key={i} className="trips-list__item">
                          <div><strong>Date:</strong> {new Date(t.created_at).toLocaleString()}</div>
                          <div><strong>Distance:</strong> {t.length} mi</div>
                          <div>
                            <strong>Duration:</strong>{' '}
                            {formatDuration(t.duration * 60)} 
                          </div>
                          <div><strong>Steps:</strong> {t.steps.toLocaleString()}</div>
                          <div>
                            <strong>Elevation:</strong> {t.elevation_gain.toLocaleString()} ft
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
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
