import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useNavigate } from 'react-router-dom';
import Header from '../Header/header';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';


mapboxgl.accessToken = 'pk.eyJ1IjoiYWt1ZGFyaSIsImEiOiJjbWFvam5tM3owNjgxMmtvOHZpYzNlbWdwIn0.hx9QD3NKieHATfs_btT-bw';

const WaypointsMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [waypoints, setWaypoints] = useState([]);
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/dark-v11");
  const [showWaypoints, setShowWaypoints] = useState(true);
  const markerRefs = useRef([]);
  const navigate = useNavigate();
  const [show3D, setShow3D] = useState(true);
  const [selectedWaypointId, setSelectedWaypointId] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const toggleLabel = mapStyle.includes("dark") ? "Toggle Light Mode" : "Toggle Dark Mode";
  const directionsRef = useRef(null);
  const fetchDirections = async (start, end) => {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes && data.routes.length) {
        const route = data.routes[0].geometry;
        setRouteGeoJSON(route);
      }
    } catch (error) {
      console.error("Error fetching directions:", error);
    }
  };
  const addRouteLayer = (geojson) => {
    if (!map.current.getSource("route")) {
      map.current.addSource("route", {
        type: "geojson",
        data: geojson,
      });
  
      map.current.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3b9ddd",
          "line-width": 6,
        },
      });
    } else {
      map.current.getSource("route").setData(geojson);
    }
  };

  useEffect(() => {
    if (map.current && routeGeoJSON) {
      addRouteLayer({
        type: "Feature",
        geometry: routeGeoJSON,
      });
    }
  }, [routeGeoJSON]);
  
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
  useEffect(() => {
    fetch("http://localhost:9000/user_waypoints",{
      method: "GET",
      credentials: "include", // <-- Ensures cookies are sent
    })
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
      style: mapStyle, // Use dynamic style
      center: initialCenter,
      zoom: 17,
      pitch: 60,
      bearing: -20
    });
    
  
    map.current.on("load", () => {
      if (show3D) {
        map.current.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.terrain-rgb",
          tileSize: 512,
          maxzoom: 14,
        });
        map.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
    
        map.current.addLayer({
          id: "sky",
          type: "sky",
          paint: {
            "sky-type": "atmosphere",
            "sky-atmosphere-sun": [0.0, 0.0],
            "sky-atmosphere-sun-intensity": 15,
          },
        });
        // Initialize Directions only once
if (!directionsRef.current) {
  directionsRef.current = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    unit: "metric",
    profile: "mapbox/driving",
    alternatives: false,
    controls: {
      inputs: true,
      instructions: true,
      profileSwitcher: true,
    },
  });
  map.current.addControl(directionsRef.current, "top-left");
}
        map.current.addLayer({
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": "#aaa",
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["get", "min_height"],
            "fill-extrusion-opacity": 0.6,
          },
          
        });
      }
    
      addMarkers();
    });
    
  }, [waypoints]);
  useEffect(() => {
    if (!map.current) return;
  
    if (show3D) {
      if (!map.current.getSource("mapbox-dem")) {
        map.current.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.terrain-rgb",
          tileSize: 512,
          maxzoom: 14,
        });
      }
      map.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
  
      if (!map.current.getLayer("sky")) {
        map.current.addLayer({
          id: "sky",
          type: "sky",
          paint: {
            "sky-type": "atmosphere",
            "sky-atmosphere-sun": [0.0, 0.0],
            "sky-atmosphere-sun-intensity": 15,
          },
        });
      }
  
      if (!map.current.getLayer("3d-buildings")) {
        map.current.addLayer({
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": "#aaa",
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["get", "min_height"],
            "fill-extrusion-opacity": 0.6,
          },
        });
      }
    } else {
      if (map.current.getLayer("3d-buildings")) {
        map.current.removeLayer("3d-buildings");
      }
      if (map.current.getLayer("sky")) {
        map.current.removeLayer("sky");
      }
      if (map.current.getTerrain()) {
        map.current.setTerrain(null);
      }
      if (map.current.getSource("mapbox-dem")) {
        map.current.removeSource("mapbox-dem");
      }
    }
  }, [show3D]);
  
  useEffect(() => {
    if (!map.current) return;
    map.current.setStyle(mapStyle);
  
    map.current.once("style.load", () => {
      // Re-add terrain and 3D layers when style is reset
      map.current.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.terrain-rgb",
        tileSize: 512,
        maxzoom: 14
      });
  
      map.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
  
      map.current.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 0.0],
          "sky-atmosphere-sun-intensity": 15
        }
      });
  
      map.current.addLayer({
        id: "3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", "extrude", "true"],
        type: "fill-extrusion",
        minzoom: 15,
        paint: {
          "fill-extrusion-color": "#aaa",
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": ["get", "min_height"],
          "fill-extrusion-opacity": 0.6
        }
      });
  
      // Re-add markers
      if (showWaypoints) {
        addMarkers();
      }
    });
  }, [mapStyle]);
  

  useEffect(() => {
    if (!map.current) return;

    // Show/hide markers when toggle changes
    if (showWaypoints) {
      addMarkers();
    } else {
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
    }
  }, [showWaypoints]);

  const addMarkers = () => {
    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = [];

    waypoints.forEach((wp) => {
      const markerEl = document.createElement("div");
      markerEl.className = "waypoint-marker";

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      }).setHTML(`
        <strong>Waypoint ${wp.id}</strong><br/>
        Latitude: ${wp.latitude.toFixed(6)}<br/>
        Longitude: ${wp.longitude.toFixed(6)}<br/>
        Time: ${new Date(wp.created_at).toLocaleString()}
      `);

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([wp.longitude, wp.latitude])
        .addTo(map.current);

      markerEl.addEventListener("mouseenter", () =>
        popup.addTo(map.current).setLngLat([wp.longitude, wp.latitude])
      );
      markerEl.addEventListener("mouseleave", () => popup.remove());

      markerRefs.current.push(marker);
    });
  };

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <Header />
      
      <select
  value={selectedWaypointId || ""}
  onChange={(e) => {
    const id = parseInt(e.target.value, 10);
    setSelectedWaypointId(id);
    const selected = waypoints.find((wp) => wp.id === id);
    if (selected && map.current) {
      map.current.flyTo({
        center: [selected.longitude, selected.latitude],
        zoom: 18,
        speed: 1.2,
        curve: 1
      });
    }
  }}
  style={{
    position: "absolute",
    bottom: 20,
    left: 20,
    zIndex: 1,
    padding: "8px",
    fontSize: "14px",
    backgroundColor: "#ffffffcc",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)"
  }}
>
  <option value="">Select a Waypoint</option>
  {waypoints.map((wp) => (
    <option key={wp.id} value={wp.id}>
      Waypoint {wp.id} - {new Date(wp.created_at).toLocaleTimeString()}
    </option>
  ))}
</select>

      <div ref={mapContainer} style={{ height: "100%", width: "100%" }} />
      
      {/* Toggle Button */}
      <button
  onClick={() => setShowWaypoints((prev) => !prev)}
  style={{
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 1,
    padding: "10px 16px",
    fontSize: "14px",
    backgroundColor: "#ffffffcc",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)"
  }}
>
  {showWaypoints ? "Hide Waypoints" : "Show Waypoints"}
</button>

<button
  onClick={() =>
    setMapStyle((prev) =>
      prev.includes("dark") ? "mapbox://styles/mapbox/light-v11" : "mapbox://styles/mapbox/dark-v11"
    )
  }
  style={{
    position: "absolute",
    bottom: 70,
    right: 20,
    zIndex: 1,
    padding: "10px 16px",
    fontSize: "14px",
    backgroundColor: "#ffffffcc",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)"
  }}
>
  {toggleLabel}
</button>

<button
  onClick={() => setShow3D((prev) => !prev)}
  style={{
    position: "absolute",
    bottom: 120,
    right: 20,
    zIndex: 1,
    padding: "10px 16px",
    fontSize: "14px",
    backgroundColor: "#ffffffcc",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)"
  }}
>
  {show3D ? "Disable 3D" : "Enable 3D"}
</button>





<style>{`
  .waypoint-marker {
    width: 20px;
    height: 20px;
    background-color: red;
    border: 2px solid white;
    border-radius: 50%;
    cursor: pointer;
    box-sizing: border-box;
  }
`}</style>
    </div>
  );
};

export default WaypointsMap;
