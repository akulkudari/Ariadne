import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = 'pk.eyJ1IjoiYWt1ZGFyaSIsImEiOiJjbWFvam5tM3owNjgxMmtvOHZpYzNlbWdwIn0.hx9QD3NKieHATfs_btT-bw';

const WaypointsMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [waypoints, setWaypoints] = useState([]);

  useEffect(() => {
    // Fetch waypoints from FastAPI backend
    fetch("http://localhost:9000/waypoints")
      .then((res) => res.json())
      .then((data) => {
        setWaypoints(data.waypoints || []);
      })
      .catch((err) => console.error("Error fetching waypoints:", err));
  }, []);

  useEffect(() => {
    if (map.current || waypoints.length === 0) return;

    const initialCenter = [waypoints[0].longitude, waypoints[0].latitude];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: initialCenter,
      zoom: 17
    });

    map.current.on("load", () => {
      // Add markers with hoverable popups
      waypoints.forEach((wp) => {
        const marker = document.createElement("div");
        marker.className = "waypoint-marker";

        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false
        }).setHTML(`
          <strong>Waypoint ${wp.id}</strong><br/>
          Latitude: ${wp.latitude.toFixed(6)}<br/>
          Longitude: ${wp.longitude.toFixed(6)}<br/>
          Time: ${new Date(wp.created_at).toLocaleString()}
        `);

        const mapboxMarker = new mapboxgl.Marker(marker)
          .setLngLat([wp.longitude, wp.latitude])
          .addTo(map.current);

        marker.addEventListener("mouseenter", () => popup.addTo(map.current).setLngLat([wp.longitude, wp.latitude]));
        marker.addEventListener("mouseleave", () => popup.remove());
      });

      // Draw the path line
      map.current.addSource("waypoints-line", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: waypoints.map((wp) => [wp.longitude, wp.latitude])
          }
        }
      });

      map.current.addLayer({
        id: "waypoints-line-layer",
        type: "line",
        source: "waypoints-line",
        layout: {},
        paint: {
          "line-color": "#ff6600",
          "line-width": 4
        }
      });
    });
  }, [waypoints]);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <div ref={mapContainer} style={{ height: "100%", width: "100%" }} />
      <style>{`
        .waypoint-marker {
          width: 12px;
          height: 12px;
          background-color: #007cbf;
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default WaypointsMap;
