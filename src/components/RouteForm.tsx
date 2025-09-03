import React, { useState, useEffect, useRef } from 'react';
import { RouteFormProps } from '../types';

const RouteForm: React.FC<RouteFormProps> = ({ onCalculate, isLoading, startInput, setStartInput, endInput, setEndInput }) => {
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const startAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const endAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Initialize Google Maps Places Autocomplete
  useEffect(() => {
    const initializeAutocomplete = () => {
      if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
        return;
      }

      // Initialize start address autocomplete
      if (startInputRef.current && !startAutocompleteRef.current) {
        try {
          startAutocompleteRef.current = new google.maps.places.Autocomplete(startInputRef.current, {
            types: ['geocode'],
            componentRestrictions: { country: 'us' }
          });

          startAutocompleteRef.current.addListener('place_changed', () => {
            const place = startAutocompleteRef.current?.getPlace();
            if (place && place.formatted_address) {
              // Use setTimeout to prevent interference with other inputs
              setTimeout(() => {
                setStartInput(place.formatted_address);
              }, 0);
            }
          });

          // Prevent autocomplete from interfering with manual typing
          startInputRef.current.addEventListener('focus', () => {
            if (startAutocompleteRef.current) {
              startAutocompleteRef.current.set('types', ['geocode']);
            }
          });
        } catch (error) {
          console.warn('Google Maps Autocomplete not available:', error);
        }
      }

      // Initialize end address autocomplete
      if (endInputRef.current && !endAutocompleteRef.current) {
        try {
          endAutocompleteRef.current = new google.maps.places.Autocomplete(endInputRef.current, {
            types: ['geocode'],
            componentRestrictions: { country: 'us' }
          });

          endAutocompleteRef.current.addListener('place_changed', () => {
            const place = endAutocompleteRef.current?.getPlace();
            if (place && place.formatted_address) {
              // Use setTimeout to prevent interference with other inputs
              setTimeout(() => {
                setEndInput(place.formatted_address);
              }, 0);
            }
          });

          // Prevent autocomplete from interfering with manual typing
          endInputRef.current.addEventListener('focus', () => {
            if (endAutocompleteRef.current) {
              endAutocompleteRef.current.set('types', ['geocode']);
            }
          });
        } catch (error) {
          console.warn('Google Maps Autocomplete not available:', error);
        }
      }
    };

    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeAutocomplete();
    } else {
      // Wait for Google Maps API to load
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkInterval);
          initializeAutocomplete();
        }
      }, 100);
    }

    return () => {
      // Cleanup autocomplete instances
      if (startAutocompleteRef.current) {
        google.maps.event.clearInstanceListeners(startAutocompleteRef.current);
      }
      if (endAutocompleteRef.current) {
        google.maps.event.clearInstanceListeners(endAutocompleteRef.current);
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (startInput.trim() && endInput.trim()) {
      onCalculate(startInput.trim(), endInput.trim());
    }
  };

  return (
    <div className="route-form">
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="start">Start Address</label>
            <input
              ref={startInputRef}
              type="text"
              id="start"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              placeholder="e.g., 123 Main St, New York, NY"
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="end">Destination Address</label>
            <input
              ref={endInputRef}
              type="text"
              id="end"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              placeholder="e.g., 456 Oak Ave, Boston, MA"
              required
              disabled={isLoading}
            />
          </div>
        </div>
        <button type="submit" disabled={isLoading} className="calculate-btn">
          {isLoading ? 'Calculating All Routes...' : '🚗⛴️✈️ Calculate All Routes'}
        </button>
      </form>
    </div>
  );
};

export default RouteForm; 