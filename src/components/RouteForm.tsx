import React, { useState, useEffect, useRef } from 'react';
import { RouteFormProps, SavedRoute, RouteResponse } from '../types';
import SavedRoutes from './SavedRoutes';

const RouteForm: React.FC<RouteFormProps> = ({ onCalculate, isLoading, currentRoute, transportMode }) => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const [startAutocomplete, setStartAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [endAutocomplete, setEndAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  // Clear inputs when transport mode changes
  useEffect(() => {
    setStart('');
    setEnd('');
  }, [transportMode]);

  // Initialize Google Maps Places Autocomplete
  useEffect(() => {
    const initAutocomplete = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        if (startInputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(startInputRef.current, {
            types: ['geocode'],
            componentRestrictions: { country: 'us' }
          });
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.formatted_address) {
              setStart(place.formatted_address);
            }
          });
          setStartAutocomplete(autocomplete);
        }

        if (endInputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(endInputRef.current, {
            types: ['geocode'],
            componentRestrictions: { country: 'us' }
          });
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.formatted_address) {
              setEnd(place.formatted_address);
            }
          });
          setEndAutocomplete(autocomplete);
        }
      }
    };

    // Check if Google Maps is loaded
    if (window.google && window.google.maps) {
      initAutocomplete();
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMaps);
          initAutocomplete();
        }
      }, 100);
    }

    return () => {
      if (startAutocomplete) {
        google.maps.event.clearInstanceListeners(startAutocomplete);
      }
      if (endAutocomplete) {
        google.maps.event.clearInstanceListeners(endAutocomplete);
      }
    };
  }, []);

  const handleRouteSelect = (route: SavedRoute) => {
    setStart(route.startAddress);
    setEnd(route.endAddress);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (start.trim() && end.trim()) {
      onCalculate(start.trim(), end.trim());
    }
  };

  return (
    <div>
      <SavedRoutes
        onRouteSelect={handleRouteSelect}
        currentRoute={currentRoute}
        startAddress={start}
        endAddress={end}
      />
      <form onSubmit={handleSubmit} className="controls">
        <div className="input-group">
          <label htmlFor="start">Start Location</label>
          <input
            ref={startInputRef}
            id="start"
            type="text"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            placeholder="Enter start address..."
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="end">End Location</label>
          <input
            ref={endInputRef}
            id="end"
            type="text"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            placeholder="Enter destination address..."
            required
          />
        </div>
        <button type="submit" className="calculate-btn" disabled={isLoading}>
          {isLoading ? 'Calculating...' : 'Calculate Route'}
        </button>
      </form>
    </div>
  );
};

export default RouteForm; 