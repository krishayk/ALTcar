import React, { useEffect, useRef } from 'react';
import { RouteMapProps, RouteResponse } from '../types';

interface AllRoutes {
  car: any;
  ferry: any;
  plane: any;
}

const RouteMap: React.FC<RouteMapProps> = ({ routes, isLoading }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRefs = useRef<google.maps.DirectionsRenderer[]>([]);

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
      directionsServiceRef.current = directionsService;

      // Clear previous renderers
      directionsRendererRefs.current.forEach(renderer => renderer.setMap(null));
      directionsRendererRefs.current = [];

      const bounds = new google.maps.LatLngBounds();
      let routeCount = 0;

      // Function to add a route
      const addRoute = (routeData: any, mode: string, color: string) => {
        if (!routeData) return;

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

          // Add markers for plane route at different positions to prevent overlap
          new google.maps.Marker({
            position: { lat: startLat, lng: startLng },
            map: map,
            title: `PLANE: Start - ${routeData.route.startAddress}`,
            label: { text: '✈️', fontSize: '18px' }
          });

          // Add plane label at the midpoint to prevent overlap - offset slightly
          const midLat = (startLat + endLat) / 2;
          const midLng = (startLng + endLng) / 2;
          const planeMidPoint = { 
            lat: midLat + (endLat - startLat) * 0.1, 
            lng: midLng + (endLng - startLng) * 0.1 
          };
          new google.maps.Marker({
            position: planeMidPoint,
            map: map,
            title: 'Plane Route',
            label: { text: '✈️', fontSize: '18px' }
          });

          new google.maps.Marker({
            position: { lat: endLat, lng: endLng },
            map: map,
            title: `PLANE: End - ${routeData.route.endAddress}`,
            label: { text: '✈️', fontSize: '18px' }
          });

          // Extend bounds
          bounds.extend(new google.maps.LatLng(startLat, startLng));
          bounds.extend(new google.maps.LatLng(endLat, endLng));
          routeCount++;

        } else if (mode === 'ferry') {
          // Ferry route: same start/end points but wide water path to avoid overlap
          const startLat = routeData.route.coordinates[0][0];
          const startLng = routeData.route.coordinates[0][1];
          const endLat = routeData.route.coordinates[1][0];
          const endLng = routeData.route.coordinates[1][1];
          
          // Calculate midpoint
          const midLat = (startLat + endLat) / 2;
          const midLng = (startLng + endLng) / 2;
          
          // Create control points for a wide, smooth water route
          // Start and end at same points as car route, but curve wide through water
          const controlPoint1 = {
            lat: startLat + (endLat - startLat) * 0.2,
            lng: startLng - (endLng - startLng) * 1.5  // Wide left curve
          };
          
          const controlPoint2 = {
            lat: midLat - (endLat - startLat) * 0.3,
            lng: midLng - (endLng - startLng) * 2.5   // Deepest point, well in water
          };
          
          const controlPoint3 = {
            lat: startLat + (endLat - startLat) * 0.8,
            lng: startLng - (endLng - startLng) * 1.5  // Wide left curve
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

          // Add markers for ferry route at same start/end points as car route
          new google.maps.Marker({
            position: { lat: startLat, lng: startLng },
            map: map,
            title: `FERRY: Start - ${routeData.route.startAddress}`,
            label: { text: '⛴️', fontSize: '18px' }
          });

          // Add ferry label at a point on the actual ferry path (not control point)
          // Calculate a point at 50% along the ferry curve for the label
          const ferryMidPoint = generateBezierCurve(
            { lat: startLat, lng: startLng },
            controlPoint1,
            controlPoint2,
            { lat: endLat, lng: endLng },
            50  // Get all 50 points
          )[25]; // Take the 25th point (50% along the curve)
          
          new google.maps.Marker({
            position: ferryMidPoint,
            map: map,
            title: 'Ferry Route (Water)',
            label: { text: '⛴️', fontSize: '18px' }
          });

          new google.maps.Marker({
            position: { lat: endLat, lng: endLng },
            map: map,
            title: `FERRY: End - ${routeData.route.endAddress}`,
            label: { text: '⛴️', fontSize: '18px' }
          });

          // Extend bounds to include the entire ferry route
          bounds.extend(new google.maps.LatLng(startLat, startLng));
          bounds.extend(new google.maps.LatLng(endLat, endLng));
          bounds.extend(new google.maps.LatLng(controlPoint2.lat, controlPoint2.lng));
          routeCount++;
        } else {
          // Car route: normal Google Directions
          const directionsRenderer = new google.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: color,
              strokeWeight: 4,
              strokeOpacity: 0.8
            }
          });

          directionsRendererRefs.current.push(directionsRenderer);
          directionsRenderer.setMap(map);

          const request: google.maps.DirectionsRequest = {
            origin: routeData.route.startAddress,
            destination: routeData.route.endAddress,
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.IMPERIAL
          };

          directionsService.route(request, (result, status) => {
            if (status === 'OK' && result) {
              directionsRenderer.setDirections(result);
              
              // Add custom markers at different positions to prevent overlap
              const startMarker = new google.maps.Marker({
                position: result.routes[0].legs[0].start_location,
                map: map,
                title: `${mode.toUpperCase()}: Start - ${routeData.route.startAddress}`,
                label: {
                  text: mode === 'car' ? '🚗' : mode === 'ferry' ? '⛴️' : '✈️',
                  fontSize: '16px'
                }
              });

              // Add car label at the middle of the route to prevent overlap - offset to prevent overlap
              const routePath = result.routes[0].overview_path;
              if (routePath && routePath.length > 0) {
                const midPoint = routePath[Math.floor(routePath.length / 2)];
                // Offset the car label slightly to prevent overlap with other routes
                const carMidPoint = {
                  lat: midPoint.lat() + (routeData.route.coordinates[1][0] - routeData.route.coordinates[0][0]) * 0.05,
                  lng: midPoint.lng() + (routeData.route.coordinates[1][1] - routeData.route.coordinates[0][1]) * 0.05
                };
                new google.maps.Marker({
                  position: carMidPoint,
                  map: map,
                  title: 'Car Route',
                  label: { text: '🚗', fontSize: '18px' }
                });
              }

              const endMarker = new google.maps.Marker({
                position: result.routes[0].legs[0].end_location,
                map: map,
                title: `${mode.toUpperCase()}: End - ${routeData.route.endAddress}`,
                label: {
                  text: mode === 'car' ? '🚗' : mode === 'ferry' ? '⛴️' : '✈️',
                  fontSize: '16px'
                }
              });

              // Extend bounds
              result.routes[0].legs.forEach(leg => {
                bounds.extend(leg.start_location);
                bounds.extend(leg.end_location);
              });

              routeCount++;
              
              // Fit bounds after all routes are added
              if (routeCount === Object.values(routes).filter(Boolean).length) {
                map.fitBounds(bounds);
              }
            }
          });
        }
      };

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
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
          <span>✈️ Plane Route</span>
        </div>
      </div>
      <div ref={mapRef} className="actual-map"></div>
    </div>
  );
};

export default RouteMap; 