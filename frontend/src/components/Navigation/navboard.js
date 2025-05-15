// src/components/MapGlobe.js
import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import './navboard.css';

mapboxgl.accessToken = 'pk.eyJ1IjoiYWt1ZGFyaSIsImEiOiJjbWFvam5tM3owNjgxMmtvOHZpYzNlbWdwIn0.hx9QD3NKieHATfs_btT-bw';

export default function NavBoard() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const spinEnabled = true;
  let userInteracting = false;

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12', // updated to v12 for directions
      center: [-79.4512, 43.6568],
      zoom: 13
    });

    mapRef.current = map;

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl());

    // Add directions control
    const directions = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: 'metric',
      profile: 'mapbox/driving'
    });
    map.addControl(directions, 'top-left');

    // Smooth zoom on wheel scroll
    map.scrollZoom.disable(); // disable default scroll zoom

    mapContainer.current.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoom = map.getZoom();
      const delta = Math.sign(e.deltaY);
      const newZoom = Math.max(0.5, Math.min(22, zoom - delta * 0.25));
      map.easeTo({ zoom: newZoom });
    }, { passive: false });

    // Globe + fog settings
    map.setProjection('globe');
    map.on('style.load', () => {
      map.setFog({});
    });

    // Auto-spin logic
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
    <div>
      <header className="header">
        <div className="header__logo">Ariadne</div>
        <nav className="nav">
          <a className="nav__link" href="/">Home</a>
          <a className="nav__link" href="/dashboard">Dashboard</a>
          <a className="nav__link" href="/nav">Navigation</a>
        </nav>
      </header>

      <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />

      <footer className="footer">
        <div className="footer__left">© 2025 Styck. All rights reserved.</div>
      </footer>
    </div>
  );
}
