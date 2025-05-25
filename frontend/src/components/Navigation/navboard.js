// src/components/MapGlobe.js
import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import './navboard.css';
import Header from '../Header/header'

mapboxgl.accessToken = 'pk.eyJ1IjoiYWt1ZGFyaSIsImEiOiJjbWFvam5tM3owNjgxMmtvOHZpYzNlbWdwIn0.hx9QD3NKieHATfs_btT-bw';

export default function NavBoard() {

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
  
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const spinEnabled = true;
  let userInteracting = false;

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-79.4512, 43.6568],
      zoom: 13
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl());

    const directions = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: 'metric',
      profile: 'mapbox/driving'
    });
    map.addControl(directions, 'top-left');

    map.scrollZoom.disable();

    mapContainer.current.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoom = map.getZoom();
      const delta = Math.sign(e.deltaY);
      const newZoom = Math.max(0.5, Math.min(22, zoom - delta));
      map.easeTo({ zoom: newZoom });
    }, { passive: false });

    map.setProjection('globe');
    map.on('style.load', () => {
      map.setFog({});
    });

    const secondsPerRevolution = 240;
    const maxSpinZoom = 5;
    const slowSpinZoom = 3;

    function spinGlobe() {
      const zoom = map.getZoom();
      if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
          const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
          distancePerSecond *= zoomDif;
        }
        const center = map.getCenter();
        center.lng -= distancePerSecond;
        map.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }

    map.on('mousedown', () => { userInteracting = true; });
    map.on('dragstart', () => { userInteracting = true; });
    map.on('moveend', () => { spinGlobe(); });

    spinGlobe();

    return () => map.remove();
  }, []);

  return (
    <div className="dashboard">
      <Header/>

      <div ref={mapContainer} className="dashboard__map" />

      <footer className="dashboard__footer">
        <div className="dashboard__footer-left">
          © 2025 Ariadne. All rights reserved.
        </div>
      </footer>
    </div>
  );
}