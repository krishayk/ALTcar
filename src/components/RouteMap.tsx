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

    // Clear previous directions and overlays
    directionsRenderer.setDirections(null);
    
    // Clear any existing polylines and markers by recreating the map
    if (mapRef.current) {
      const newMap = new google.maps.Map(mapRef.current, {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        zoomControl: true,
        streetViewControl: true,
        mapTypeControl: true,
        fullscreenControl: true
      });
      
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
      setDirectionsRenderer(newDirectionsRenderer);
      
      // Update the local variables for this function
      const currentMap = newMap;
      const currentDirectionsRenderer = newDirectionsRenderer;
      
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
            currentDirectionsRenderer.setDirections(result);
            
            // Fit bounds to show the entire route
            if (result.routes && result.routes[0] && result.routes[0].bounds) {
              currentMap.fitBounds(result.routes[0].bounds);
              // Add some padding to the bounds
              currentMap.setZoom(Math.min(currentMap.getZoom() || 10, 15));
            }
          } else {
            console.error('Car directions request failed:', status);
            // Fallback to polyline if directions fail
            displayPolylineRoute(currentMap);
          }
        });
      } else {
        console.log('Processing ferry/plane route...');
        displayPolylineRoute(currentMap);
      }

      function displayPolylineRoute(currentMap: google.maps.Map) {
        if (!route) return;
        
        // Create a polyline for the route
        const path = new google.maps.Polyline({
          path: route.route.coordinates.map(coord => ({ lat: coord[0], lng: coord[1] })),
          geodesic: true,
          strokeColor: route.transportMode === 'ferry' ? '#FF6B35' : '#FFD700',
          strokeOpacity: 0.8,
          strokeWeight: 5
        });

        path.setMap(currentMap);

        // Add start and end markers
        new google.maps.Marker({
          position: { lat: route.route.coordinates[0][0], lng: route.route.coordinates[0][1] },
          map: currentMap,
          title: 'Start',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300FF00"><circle cx="12" cy="12" r="10"/></svg>'),
            scaledSize: new google.maps.Size(20, 20)
          }
        });

        new google.maps.Marker({
          position: { lat: route.route.coordinates[route.route.coordinates.length - 1][0], lng: route.route.coordinates[route.route.coordinates.length - 1][1] },
          map: currentMap,
          title: 'Destination',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FF0000"><circle cx="12" cy="12" r="10"/></svg>'),
            scaledSize: new google.maps.Size(20, 20)
          }
        });

        // Fit bounds to show the entire route with padding
        const bounds = new google.maps.LatLngBounds();
        route.route.coordinates.forEach(coord => {
          bounds.extend({ lat: coord[0], lng: coord[1] });
        });
        
        // Add some padding to the bounds
        const padding = { top: 50, right: 50, bottom: 50, left: 50 };
        currentMap.fitBounds(bounds, padding);
        
        // Set a reasonable zoom level
        if (currentMap.getZoom() && currentMap.getZoom() > 18) {
          currentMap.setZoom(18);
        }
        
        console.log('Polyline route displayed');
      }
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
    </div>
  );
};

export default RouteMap; 