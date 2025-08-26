import React, { useEffect, useRef, useState } from 'react';
import { RouteMapProps, RouteResponse } from '../types';

// NOTE: To fix the "RefererNotAllowedMapError", you need to:
// 1. Go to Google Cloud Console > APIs & Services > Credentials
// 2. Find your Maps JavaScript API key
// 3. Add "https://altroute-one.vercel.app/*" to the "Application restrictions" > "HTTP referrers (web sites)"
// 4. Or set "Application restrictions" to "None" for development (less secure)

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
  const markerRefs = useRef<any[]>([]);
  const [showFerryControls, setShowFerryControls] = useState<boolean>(false);
  const [routeToggles, setRouteToggles] = useState({
    car: true,
    ferry: true,
    plane: true
  });
  const [useMetric, setUseMetric] = useState<boolean>(false);

  // Function to initialize the map
  const initializeMap = () => {
    if (!mapRef.current || !routes) return;
    
    try {
      // Initialize the map
      const map = new google.maps.Map(mapRef.current!, {
        center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
        zoom: 10,
        mapTypeId: 'roadmap', // Use string instead of deprecated MapTypeId.ROADMAP
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true
      });

      mapInstanceRef.current = map;

      // Initialize directions service
      const directionsService = new google.maps.DirectionsService();

      // Clear previous renderers
      directionsRendererRefs.current.forEach(renderer => renderer.setMap(null));
      directionsRendererRefs.current = [];

      const bounds = new google.maps.LatLngBounds();
      let routeCount = 0;

      // Add each route with different colors (only if toggled on)
      if (routes.car && routeToggles.car) addRoute(routes.car, 'car', '#3b82f6'); // Blue
      if (routes.ferry && routeToggles.ferry) addRoute(routes.ferry, 'ferry', '#10b981'); // Green
      if (routes.plane && routeToggles.plane) addRoute(routes.plane, 'plane', '#f59e0b'); // Orange
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
    }
  };

  // Function to add a route
  const addRoute = (routeData: any, mode: string, color: string) => {
    if (!routeData || !mapInstanceRef.current) {
      console.log('addRoute: Missing data or map instance', { routeData: !!routeData, mapInstance: !!mapInstanceRef.current });
      return;
    }

    const map = mapInstanceRef.current;
    console.log('Adding route:', mode, routeData);

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
      // Ferry route: use all coordinates from the route data with enhanced curve
      const coordinates = routeData.route.coordinates;
      if (coordinates.length < 2) return;
      
      // Create a curved path that follows the ferry route coordinates
      const ferryPath: { lat: number; lng: number }[] = [];
      
      // Add the start point
      ferryPath.push({ lat: coordinates[0][0], lng: coordinates[0][1] });
      
      // Create a smooth Bezier curve for the ferry route
      if (coordinates.length >= 2) {
        const startPoint = { lat: coordinates[0][0], lng: coordinates[0][1] };
        const endPoint = { lat: coordinates[coordinates.length - 1][0], lng: coordinates[coordinates.length - 1][1] };
        
        // Calculate the midpoint
        const midLat = (startPoint.lat + endPoint.lat) / 2;
        const midLng = (startPoint.lng + endPoint.lng) / 2;
        
        // Create control points for a smooth Bezier curve
        const baseCurveOffset = 0.2; // Much wider base curve
        // Adjust curve multiplier so that 5/10 produces the same curve as previous 8/20
        const curveMultiplier = curveSize * 0.205; // Adjusted so that 5/10 = previous 8/20
        const totalCurveOffset = (baseCurveOffset + curveMultiplier) * (ferryDirection ? -1 : 1);
        
        // Calculate perpendicular direction for natural curve
        const dx = endPoint.lng - startPoint.lng;
        const dy = endPoint.lat - startPoint.lat;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        let controlPoint1, controlPoint2;
        
        if (length > 0) {
          // Perpendicular vector for natural curve
          const perpLat = -dy / length;
          const perpLng = dx / length;
          
          // First control point (25% along the route)
          controlPoint1 = {
            lat: startPoint.lat + (endPoint.lat - startPoint.lat) * 0.25 + perpLat * totalCurveOffset,
            lng: startPoint.lng + (endPoint.lng - startPoint.lng) * 0.25 + perpLng * totalCurveOffset
          };
          
          // Second control point (75% along the route)
          controlPoint2 = {
            lat: startPoint.lat + (endPoint.lat - startPoint.lat) * 0.75 + perpLat * totalCurveOffset,
            lng: startPoint.lng + (endPoint.lng - startPoint.lng) * 0.75 + perpLng * totalCurveOffset
          };
        } else {
          // Fallback if points are too close
          controlPoint1 = {
            lat: midLat + totalCurveOffset,
            lng: midLng + totalCurveOffset
          };
          controlPoint2 = {
            lat: midLat + totalCurveOffset,
            lng: midLng + totalCurveOffset
          };
        }
        
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
        
        // Generate the smooth Bezier curve
        const bezierPoints = generateBezierCurve(
          startPoint,           // Start point
          controlPoint1,        // First control point
          controlPoint2,        // Second control point
          endPoint,             // End point
          100                   // More points for smoother curve
        );
        
        // Add all Bezier curve points to the ferry path
        bezierPoints.forEach(point => ferryPath.push(point));
      }

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

      // Add markers for start and end points using AdvancedMarkerElement if available, fallback to regular Marker
      if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        const startMarkerElement = document.createElement('div');
        startMarkerElement.style.width = '16px';
        startMarkerElement.style.height = '16px';
        startMarkerElement.style.borderRadius = '50%';
        startMarkerElement.style.backgroundColor = '#ef4444'; // Red center
        startMarkerElement.style.border = '2px solid #ffffff';
        startMarkerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        startMarkerElement.title = 'Ferry Start';

        const endMarkerElement = document.createElement('div');
        endMarkerElement.style.width = '16px';
        endMarkerElement.style.height = '16px';
        endMarkerElement.style.borderRadius = '50%';
        endMarkerElement.style.backgroundColor = '#ef4444'; // Red center
        endMarkerElement.style.border = '2px solid #ffffff';
        endMarkerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        endMarkerElement.title = 'Ferry End';

        const startMarker = new google.maps.marker.AdvancedMarkerElement({
          position: { lat: coordinates[0][0], lng: coordinates[0][1] },
          map: map,
          title: 'Ferry Start',
          content: startMarkerElement
        });

        const endMarker = new google.maps.marker.AdvancedMarkerElement({
          position: { lat: coordinates[coordinates.length - 1][0], lng: coordinates[coordinates.length - 1][1] },
          map: map,
          title: 'Ferry End',
          content: endMarkerElement
        });

        markerRefs.current.push(startMarker, endMarker);
      } else {
        // Fallback to regular markers if AdvancedMarkerElement is not available
        const startMarker = new google.maps.Marker({
          position: { lat: coordinates[0][0], lng: coordinates[0][1] },
          map: map,
          title: 'Ferry Start',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#ef4444', // Red center
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        const endMarker = new google.maps.Marker({
          position: { lat: coordinates[coordinates.length - 1][0], lng: coordinates[coordinates.length - 1][1] },
          map: map,
          title: 'Ferry End',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#ef4444', // Red center
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        // Cast to any to avoid type mismatch for fallback markers
        markerRefs.current.push(startMarker as any, endMarker as any);
      }

      // Extend bounds to include the entire ferry route
      const bounds = new google.maps.LatLngBounds();
      ferryPath.forEach(point => bounds.extend(new google.maps.LatLng(point.lat, point.lng)));
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

    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for existing script to load
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          initializeMap();
        }
      }, 100);
      return;
    }

    // Load Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&libraries=geometry&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Add a small delay to ensure API is fully loaded
      setTimeout(() => {
        if (window.google && window.google.maps) {
          initializeMap();
        }
      }, 100);
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
    // Redraw the map whenever ferryDirection, curveSize, or route toggles change
    if (mapInstanceRef.current && routes) {
      console.log('Redrawing map due to controls change');
      
      // Clear previous routes completely
      directionsRendererRefs.current.forEach(renderer => renderer.setMap(null));
      directionsRendererRefs.current = [];
      
      // Clear all stored polylines and markers
      polylineRefs.current.forEach(polyline => polyline.setMap(null));
      polylineRefs.current = [];
      markerRefs.current.forEach(marker => marker.map = null);
      markerRefs.current = [];
      
      // Small delay to ensure clearing is complete
      setTimeout(() => {
        // Redraw all routes with new settings (only if toggled on)
        if (routes.car && routeToggles.car) addRoute(routes.car, 'car', '#3b82f6'); // Blue
        if (routes.ferry && routeToggles.ferry) addRoute(routes.ferry, 'ferry', '#10b981'); // Green
        if (routes.plane && routeToggles.plane) addRoute(routes.plane, 'plane', '#f59e0b'); // Orange
      }, 50);
    }
  }, [ferryDirection, curveSize, routeToggles]);

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
          <div 
            className={`legend-color ${!routeToggles.car ? 'outlined' : ''}`}
            style={{ 
              backgroundColor: routeToggles.car ? '#3b82f6' : 'white',
              border: `2px solid #3b82f6`
            }}
            onClick={() => setRouteToggles(prev => ({ ...prev, car: !prev.car }))}
          ></div>
          <span>🚗 Car Route</span>
        </div>
        <div className="legend-item">
          <div 
            className={`legend-color ${!routeToggles.ferry ? 'outlined' : ''}`}
            style={{ 
              backgroundColor: routeToggles.ferry ? '#10b981' : 'white',
              border: `2px solid #10b981`
            }}
            onClick={() => setRouteToggles(prev => ({ ...prev, ferry: !prev.ferry }))}
          ></div>
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
          <div 
            className={`legend-color ${!routeToggles.plane ? 'outlined' : ''}`}
            style={{ 
              backgroundColor: routeToggles.plane ? '#f59e0b' : 'white',
              border: `2px solid #f59e0b`
            }}
            onClick={() => setRouteToggles(prev => ({ ...prev, plane: !prev.plane }))}
          ></div>
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
                max="10"
                step="1"
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