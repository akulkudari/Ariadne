import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header/header';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function Health() {
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [deviceList, setDeviceList] = useState([]);

  useEffect(() => {
    fetch("http://localhost:9000/user_auth", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (res.redirected) {
          navigate("/");
          throw new Error("Redirected due to auth failure");
        }
        return res.json();
      })
      .then(() => {
        return fetch("http://localhost:9000/health_data", {
          method: "GET",
          credentials: "include",
        });
      })
      .then((res) => res.json())
      .then((data) => {
        setHealthData(data);
        setFilteredData(data);

        // Extract unique device MACs to populate filter dropdown
        const uniqueDevices = [...new Set(data.map(d => d.device_mac))];
        setDeviceList(uniqueDevices);

        setLoading(false);
      })
      .catch((err) => {
        if (err.message !== "Redirected due to auth failure") {
          console.error("Failed to load health data:", err);
          setError("Failed to load health data");
          setLoading(false);
        }
      });
  }, [navigate]);

  // Update filtered data when selectedDevice changes
  useEffect(() => {
    if (selectedDevice === 'all') {
      setFilteredData(healthData);
    } else {
      setFilteredData(healthData.filter(d => d.device_mac === selectedDevice));
    }
  }, [selectedDevice, healthData]);

  return (
    <div className="dashboard">
      <Header />

      <div style={{ padding: '2rem' }}>
        <h1>Health Page</h1>
        <p>This is a space for users to track their health.</p>

        {loading && <p>Loading health data...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!loading && !error && healthData.length > 0 && (
          <>
            <label htmlFor="deviceFilter">Filter by Device: </label>
            <select
              id="deviceFilter"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              style={{ marginBottom: '1rem', marginLeft: '0.5rem' }}
            >
              <option value="all">All Devices</option>
              {deviceList.map((mac) => (
                <option key={mac} value={mac}>
                  {mac}
                </option>
              ))}
            </select>
          </>
        )}

        {!loading && !error && filteredData.length === 0 && <p>No health data available for this device.</p>}

        {!loading && !error && filteredData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(tick) => tick.slice(11, 16)} // show time only
                minTickGap={20}
              />
              <YAxis label={{ value: 'Heart Rate (bpm)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="heart_rate"
                stroke="#8884d8"
                dot={false}
                name="Heart Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {!loading && !error && healthData.length === 0 && <p>No health data available.</p>}
      </div>

      <footer className="dashboard__footer">
        <div className="dashboard__footer-left">© 2025 Ariadne. All rights reserved.</div>
      </footer>
    </div>
  );
}
