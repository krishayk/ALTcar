import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { RouteMapProps } from '../types';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDDCPnY2orRksw08gpAdHNnBIQ4FqzMsrs';

const RouteMap: React.FC<RouteMapProps> = ({ route, isLoading }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    console.log('Starting Google Maps initialization...');
    
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places']
    });

    loader.load().then(() => {
      console.log('Google Maps API loaded successfully');
      
      if (mapRef.current) {
        console.log('Creating map...');
        
        const newMap = new google.maps.Map(mapRef.current, {
          center: { lat: 40.7128, lng: -74.0060 },
          zoom: 10,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true
        });

        const newDirectionsService = new google.maps.DirectionsService();
        const newDirectionsRenderer = new google.maps.DirectionsRenderer({
          map: newMap,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#007bff',
            strokeWeight: 5,
            strokeOpacity: 0.8
          }
        });

        setMap(newMap);
        setDirectionsService(newDirectionsService);
        setDirectionsRenderer(newDirectionsRenderer);
        
        console.log('Map created successfully');
      } else {
        console.error('Map ref is null');
      }
    }).catch(error => {
      console.error('Failed to load Google Maps:', error);
    });
  }, []);

  // Handle route changes
  useEffect(() => {
    if (!route || !map || !directionsService || !directionsRenderer) {
      console.log('Route or map not ready:', { route: !!route, map: !!map, directionsService: !!directionsService, directionsRenderer: !!directionsRenderer });
      return;
    }

    console.log('Processing route:', route.transportMode);

    // Clear previous directions
    directionsRenderer.setDirections(null);

    if (route.transportMode === 'car') {
      console.log('Processing car route...');
      
      // Use Google Directions API for driving routes
      const request: google.maps.DirectionsRequest = {
        origin: { lat: route.route.coordinates[0][0], lng: route.route.coordinates[0][1] },
        destination: { lat: route.route.coordinates[route.route.coordinates.length - 1][0], lng: route.route.coordinates[route.route.coordinates.length - 1][1] },
        travelMode: google.maps.TravelMode.DRIVING
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK' && result) {
          console.log('Car route directions OK');
          directionsRenderer.setDirections(result);
          
          // Fit bounds to show the entire route
          if (result.routes && result.routes[0] && result.routes[0].bounds) {
            map.fitBounds(result.routes[0].bounds);
          }
        } else {
          console.error('Car directions request failed:', status);
        }
      });
    } else {
      console.log('Processing ferry/plane route...');
      
      // For ferry and plane, create a simple polyline
      const path = new google.maps.Polyline({
        path: route.route.coordinates.map(coord => ({ lat: coord[0], lng: coord[1] })),
        geodesic: true,
        strokeColor: route.transportMode === 'ferry' ? '#FF6B35' : '#FFD700',
        strokeOpacity: 0.8,
        strokeWeight: 5
      });

      path.setMap(map);

      // Add start and end markers
      new google.maps.Marker({
        position: { lat: route.route.coordinates[0][0], lng: route.route.coordinates[0][1] },
        map: map,
        title: 'Start',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300FF00"><circle cx="12" cy="12" r="10"/></svg>'),
          scaledSize: new google.maps.Size(20, 20)
        }
      });

      new google.maps.Marker({
        position: { lat: route.route.coordinates[route.route.coordinates.length - 1][0], lng: route.route.coordinates[route.route.coordinates.length - 1][1] },
        map: map,
        title: 'Destination',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FF0000"><circle cx="12" cy="12" r="10"/></svg>'),
          scaledSize: new google.maps.Size(20, 20)
        }
      });

      // Fit bounds to show the entire route
      const bounds = new google.maps.LatLngBounds();
      route.route.coordinates.forEach(coord => {
        bounds.extend({ lat: coord[0], lng: coord[1] });
      });
      map.fitBounds(bounds);
      
      console.log('Ferry/plane route processed');
    }
  }, [route, map, directionsService, directionsRenderer]);

  if (isLoading) {
    return (
      <div className="map-container">
        <div className="loading">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <div 
        ref={mapRef} 
        style={{ 
          height: '500px', 
          width: '100%',
          backgroundColor: '#f0f0f0',
          border: '2px solid #ccc'
        }} 
      />
      {route && (
        <div className="route-info-panel">
          <div className="transport-mode">
            <span className="mode-icon">
              {route.transportMode === 'car' ? '🚗' : route.transportMode === 'ferry' ? '⛴️' : '✈️'}
            </span>
            <span className="mode-text">{route.transportMode.toUpperCase()}</span>
          </div>
          <div className="route-stats">
            <div className="stat">
              <span className="stat-value">{route.distance}</span>
              <span className="stat-unit">miles</span>
            </div>
            <div className="stat">
              <span className="stat-value">{route.duration}</span>
              <span className="stat-unit">min</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteMap; 