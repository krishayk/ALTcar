import React, { useEffect, useRef, useState } from 'react';
import { RouteMapProps, RouteResponse } from '../types';

interface AllRoutes {
  car: any;
  ferry: any;
  plane: any;
}

const RouteMap: React.FC<RouteMapProps> = ({ routes, isLoading, ferryDirection, setFerryDirection, curveSize, setCurveSize }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRefs = useRef<google.maps.DirectionsRenderer[]>([]);
  const polylineRefs = useRef<google.maps.Polyline[]>([]);
  const markerRefs = useRef<google.maps.Marker[]>([]);
  const [showFerryControls, setShowFerryControls] = useState<boolean>(false);

  // Function to add a route
  const addRoute = (routeData: any, mode: string, color: string) => {
    if (!routeData || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    if (mode === 'plane') {
      // Plane route: straight line from A to B
      const startLat = routeData.route.coordinates[0][0];
      const startLng = routeData.route.coordinates[0][1];
      const endLat = routeData.route.coordinates[1][0];
      const endLng = routeData.route.coordinates[1][1];

      // Create straight line for plane
      const planeRoute = new google.maps.Polyline({
        path: [
          { lat: startLat, lng: startLng },
          { lat: endLat, lng: endLng }
        ],
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map
      });
      
      // Store reference to polyline for cleanup
      polylineRefs.current.push(planeRoute);

      // Extend bounds
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(startLat, startLng));
      bounds.extend(new google.maps.LatLng(endLat, endLng));
      map.fitBounds(bounds);

    } else if (mode === 'ferry') {
      // Ferry route: same start/end points but wide water path to avoid overlap
      const startLat = routeData.route.coordinates[0][0];
      const startLng = routeData.route.coordinates[0][1];
      const endLat = routeData.route.coordinates[1][0];
      const endLng = routeData.route.coordinates[1][1];
      
      // Calculate midpoint
      const midLat = (startLat + endLat) / 2;
      const midLng = (startLng + endLng) / 2;
      
      // Create control points for a perfect semicircle
      // Start and end at same points as car route, but curve in perfect semicircle
      const controlPoint1 = {
        lat: startLat + (endLat - startLat) * 0.25,
        lng: startLng + (endLng - startLng) * (ferryDirection ? -curveSize * 0.7 : curveSize * 0.7)  // Left or right based on direction
      };
      
      const controlPoint2 = {
        lat: midLat, // Exactly at the midpoint
        lng: midLng + (endLng - startLng) * (ferryDirection ? -curveSize : curveSize)   // Deepest point at exact center
      };
      
      const controlPoint3 = {
        lat: startLat + (endLat - startLat) * 0.75,
        lng: startLng + (endLng - startLng) * (ferryDirection ? -curveSize * 0.7 : curveSize * 0.7)  // Left or right based on direction
      };
      
      // Generate smooth Bezier curve points
      const generateBezierCurve = (p0: any, p1: any, p2: any, p3: any, steps: number) => {
        const curve = [];
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const u = 1 - t;
          const tt = t * t;
          const uu = u * u;
          const uuu = uu * u;
          const ttt = tt * t;
          
          // Cubic Bezier formula: B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
          const lat = uuu * p0.lat + 3 * uu * t * p1.lat + 3 * u * tt * p2.lat + ttt * p3.lat;
          const lng = uuu * p0.lng + 3 * uu * t * p1.lng + 3 * u * tt * p2.lng + ttt * p3.lng;
          
          curve.push({ lat, lng });
        }
        return curve;
      };
      
      // Generate the smooth Bezier curve using same start/end points as car route
      const ferryPath = generateBezierCurve(
        { lat: startLat, lng: startLng },           // Same start as car route
        controlPoint1,                               // Control point 1
        controlPoint2,                               // Control point 2
        { lat: endLat, lng: endLng },               // Same end as car route
        50                                           // Number of curve points
      );

      const ferryRoute = new google.maps.Polyline({
        path: ferryPath,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map
      });
      
      // Store reference to polyline for cleanup
      polylineRefs.current.push(ferryRoute);

      // Extend bounds
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(startLat, startLng));
      bounds.extend(new google.maps.LatLng(endLat, endLng));
      map.fitBounds(bounds);

    } else if (mode === 'car') {
      // Car route: use Google Maps Directions API
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 4
        }
      });

      directionsRenderer.setMap(map);
      directionsRendererRefs.current.push(directionsRenderer);

      const request: google.maps.DirectionsRequest = {
        origin: routeData.route.startAddress,
        destination: routeData.route.endAddress,
        travelMode: google.maps.TravelMode.DRIVING
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
          
          // Extend bounds to include the route
          const bounds = new google.maps.LatLngBounds();
          if (result.routes && result.routes[0]) {
            const path = result.routes[0].overview_path;
            path.forEach(point => bounds.extend(point));
            map.fitBounds(bounds);
          }
        }
      });
    }
  };

  useEffect(() => {
    if (!routes || !mapRef.current) return;

    // Load Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&libraries=geometry`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Initialize the map
      const map = new google.maps.Map(mapRef.current!, {
        center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true
      });

      mapInstanceRef.current = map;

      // Initialize directions service
      const directionsService = new google.maps.DirectionsService();
      // directionsServiceRef.current = directionsService; // This line is removed as per the new_code

      // Clear previous renderers
      directionsRendererRefs.current.forEach(renderer => renderer.setMap(null));
      directionsRendererRefs.current = [];

      const bounds = new google.maps.LatLngBounds();
      let routeCount = 0;

      // Add each route with different colors
      if (routes.car) addRoute(routes.car, 'car', '#3b82f6'); // Blue
      if (routes.ferry) addRoute(routes.ferry, 'ferry', '#10b981'); // Green
      if (routes.plane) addRoute(routes.plane, 'plane', '#f59e0b'); // Orange
    };

    document.head.appendChild(script);

    return () => {
      directionsRendererRefs.current.forEach(renderer => renderer.setMap(null));
      directionsRendererRefs.current = [];
      if (mapInstanceRef.current && mapRef.current) {
        mapRef.current.innerHTML = '';
      }
    };
  }, [routes]);

  useEffect(() => {
    // Redraw the map whenever ferryDirection or curveSize changes
    if (mapInstanceRef.current && routes) {
      // Clear previous routes completely
      directionsRendererRefs.current.forEach(renderer => renderer.setMap(null));
      directionsRendererRefs.current = [];
      
      // Clear all stored polylines and markers
      polylineRefs.current.forEach(polyline => polyline.setMap(null));
      polylineRefs.current = [];
      markerRefs.current.forEach(marker => marker.setMap(null));
      markerRefs.current = [];
      
      // Clear the map container
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
      }
      
      // Redraw all routes with new settings
      if (routes.car) addRoute(routes.car, 'car', '#3b82f6'); // Blue
      if (routes.ferry) addRoute(routes.ferry, 'ferry', '#10b981'); // Green
      if (routes.plane) addRoute(routes.plane, 'plane', '#f59e0b'); // Orange
    }
  }, [ferryDirection, curveSize, routes]);

  if (isLoading) {
    return (
      <div className="route-map">
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>Calculating all routes...</p>
        </div>
      </div>
    );
  }

  if (!routes || (!routes.car && !routes.ferry && !routes.plane)) {
    return (
      <div className="route-map">
        <div className="map-placeholder">
          <h3>🗺️ Route Comparison Map</h3>
          <p>Enter start and destination addresses to see all three routes on the map.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="route-map">
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}></div>
          <span>🚗 Car Route</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
          <span>⛴️ Ferry Route</span>
          <button 
            className="ferry-controls-toggle"
            onClick={() => setShowFerryControls(!showFerryControls)}
            title="Toggle ferry controls"
          >
            ⚙️
          </button>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
          <span>✈️ Plane Route</span>
        </div>
      </div>
      
      {/* Collapsible Ferry Controls Panel */}
      <div className={`ferry-controls-panel ${showFerryControls ? 'open' : ''}`}>
        <div className="ferry-controls-header">
          <h3>Ferry Controls</h3>
          <button 
            className="ferry-controls-close"
            onClick={() => setShowFerryControls(false)}
            title="Close ferry controls"
          >
            ✕
          </button>
        </div>
        <div className="ferry-controls-content">
          <div className="control-section">
            <h4>Ferry Direction</h4>
            <button 
              className="ferry-direction-toggle"
              onClick={() => setFerryDirection(!ferryDirection)}
              title="Toggle ferry route direction"
            >
              {ferryDirection ? '→' : '←'}
            </button>
          </div>
          
          <div className="control-section">
            <h4>Curve Size</h4>
            <div className="curve-control">
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={curveSize}
                onChange={(e) => setCurveSize(parseFloat(e.target.value))}
                className="curve-slider"
                title="Adjust ferry curve width"
              />
              <span className="curve-value">{curveSize.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
      <div ref={mapRef} className="actual-map"></div>
    </div>
  );
};

export default RouteMap; 