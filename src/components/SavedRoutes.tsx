import React, { useState, useEffect } from 'react';
import { SavedRoute, RouteResponse } from '../types';

interface SavedRoutesProps {
  onRouteSelect: (route: SavedRoute) => void;
  currentRoute: RouteResponse | null;
  startAddress: string;
  endAddress: string;
  useMetric?: boolean;
}

const SavedRoutes: React.FC<SavedRoutesProps> = ({ onRouteSelect, currentRoute, startAddress, endAddress, useMetric = false }) => {
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('savedRoutes');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Handle legacy routes that might not have fuelCost
        const routesWithFuelCost = parsed.map((route: any) => ({
          ...route,
          fuelCost: route.fuelCost || 0
        }));
        setSavedRoutes(routesWithFuelCost);
      }
    } catch (error) {
      console.error('Error loading saved routes:', error);
      setSavedRoutes([]);
    }
  }, []);

  const saveCurrentRoute = () => {
    if (!currentRoute) return;

    // Auto-generate route name if empty
    let routeName = newRouteName.trim();
    if (!routeName) {
      const savedRoutesCount = savedRoutes.length + 1;
      routeName = `Route ${savedRoutesCount}`;
    }

    const route: SavedRoute = {
      id: Date.now().toString(),
      name: routeName,
      startAddress,
      endAddress,
      distance: currentRoute.distance,
      duration: currentRoute.duration,
      fuelCost: currentRoute.transportMode === 'car' ? currentRoute.cost.fuel : (currentRoute.cost.ticket || 0),
      transportMode: currentRoute.transportMode,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedRoutes, route];
    setSavedRoutes(updated);
    localStorage.setItem('savedRoutes', JSON.stringify(updated));
    
    setNewRouteName('');
    setShowForm(false);
  };

  const deleteRoute = (id: string) => {
    const updated = savedRoutes.filter(route => route.id !== id);
    setSavedRoutes(updated);
    localStorage.setItem('savedRoutes', JSON.stringify(updated));
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} h ${mins} m`;
    }
    return `${mins} m`;
  };

  const convertDistance = (miles: number) => {
    if (useMetric) {
      return `${(miles * 1.60934).toFixed(1)} km`;
    }
    return `${miles.toFixed(1)} mi`;
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '15px',
        padding: '10px 15px',
        background: '#f8f9fa',
        borderRadius: '6px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#495057' }}>Saved Routes</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {currentRoute && (
            <button 
              onClick={() => setShowForm(!showForm)}
              style={{
                background: showForm ? '#dc3545' : '#28a745',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
            >
              {showForm ? 'Cancel' : 'Save Route'}
            </button>
          )}
          <button 
            onClick={() => setShowSaved(!showSaved)}
            style={{
              background: showSaved ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
          >
            {showSaved ? 'Hide' : 'View Saved'}
          </button>
        </div>
      </div>

      {showForm && currentRoute && (
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '6px', 
          marginBottom: '15px',
          border: '1px solid #dee2e6',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Route name (e.g., Home to Work)"
              value={newRouteName}
              onChange={(e) => setNewRouteName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '12px',
                fontSize: '14px'
              }}
            />
            <div style={{ 
              fontSize: '13px', 
              color: '#666', 
              marginBottom: '12px',
              padding: '10px',
              background: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ marginBottom: '4px' }}><strong>From:</strong> {startAddress}</div>
              <div style={{ marginBottom: '4px' }}><strong>To:</strong> {endAddress}</div>
              <div style={{ marginBottom: '4px' }}><strong>Distance:</strong> {convertDistance(currentRoute.distance)}</div>
              <div style={{ marginBottom: '4px' }}><strong>Time:</strong> {formatTime(currentRoute.duration)}</div>
              <div><strong>{currentRoute.transportMode === 'car' ? 'Fuel Cost' : 'Ticket Cost'}:</strong> ${currentRoute.transportMode === 'car' ? currentRoute.cost.fuel.toFixed(2) : (currentRoute.cost.ticket || 0).toFixed(2)}</div>
            </div>
            <button 
              onClick={saveCurrentRoute}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Save Route
            </button>
          </div>
        </div>
      )}

      {showSaved && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {savedRoutes.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              padding: '30px',
              background: 'white',
              borderRadius: '6px',
              border: '1px solid #dee2e6'
            }}>
              No saved routes yet
            </div>
          ) : (
            savedRoutes.map(route => (
              <div key={route.id} style={{ 
                background: 'white', 
                padding: '18px', 
                borderRadius: '6px',
                border: '1px solid #dee2e6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '16px', color: '#333', marginBottom: '6px' }}>
                      {route.name}
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: '500', 
                        color: '#007bff', 
                        marginLeft: '8px',
                        padding: '2px 6px',
                        background: '#e3f2fd',
                        borderRadius: '4px'
                      }}>
                        {route.transportMode === 'car' ? '🚗' : route.transportMode === 'ferry' ? '⛴️' : '✈️'} {route.transportMode}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      <div style={{ marginBottom: '2px' }}>From: {route.startAddress}</div>
                      <div>To: {route.endAddress}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteRoute(route.id)}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      marginLeft: '10px'
                    }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#495057' }}>
                    <span style={{ fontWeight: '600' }}>{convertDistance(route.distance)}</span>
                    <span style={{ color: '#adb5bd', margin: '0 8px' }}>•</span>
                    <span style={{ fontWeight: '600' }}>{formatTime(route.duration)}</span>
                    <span style={{ color: '#adb5bd', margin: '0 8px' }}>•</span>
                    <span style={{ fontWeight: '600', color: '#28a745' }}>${(route.fuelCost || 0).toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => onRouteSelect(route)}
                    style={{
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Use Route
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SavedRoutes;
