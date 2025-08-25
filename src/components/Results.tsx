import React from 'react';
import { ResultsProps } from '../types';

const Results: React.FC<ResultsProps> = ({ routes, isLoading, onRouteSaved, ferryDirection, curveSize }) => {
  const saveRoutes = () => {
    if (!routes) return;
    
    const routesToSave = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      startAddress: routes.car?.route.startAddress || routes.ferry?.route.startAddress || routes.plane?.route.startAddress,
      endAddress: routes.car?.route.endAddress || routes.ferry?.route.endAddress || routes.plane?.route.endAddress,
      routes: {
        car: routes.car,
        ferry: routes.ferry,
        plane: routes.plane
      },
      ferryDirection: ferryDirection, // Save the ferry direction preference
      curveSize: curveSize // Save the curve size preference
    };

    // Get existing saved routes
    const existingRoutes = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
    
    // Add new routes
    existingRoutes.push(routesToSave);
    
    // Save back to localStorage
    localStorage.setItem('savedRoutes', JSON.stringify(existingRoutes));
    
    // Show success message
    alert('All routes saved successfully! 🎉');
    
    // Notify parent component to refresh saved routes
    if (onRouteSaved) {
      onRouteSaved();
    }
  };

  if (isLoading) {
    return (
      <div className="results">
        <div className="loading">Calculating routes...</div>
      </div>
    );
  }

  if (!routes || (!routes.car && !routes.ferry && !routes.plane)) {
    return null;
  }

  const formatCost = (cost: any) => {
    if (cost.fuel && cost.ticket) {
      return `$${cost.fuel.toFixed(2)} fuel + $${cost.ticket.toFixed(2)} ticket`;
    } else if (cost.fuel) {
      return `$${cost.fuel.toFixed(2)}`;
    } else if (cost.ticket) {
      return `$${cost.ticket.toFixed(2)}`;
    }
    return 'N/A';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="results">
      <h2>Route Comparison</h2>
      <div className="comparison-table">
        <table>
          <thead>
            <tr>
              <th>Transport Mode</th>
              <th>Distance</th>
              <th>Duration</th>
              <th>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {routes.car && (
              <tr className="car-row">
                <td>
                  <span className="mode-icon">🚗</span>
                  <span className="mode-name">Car</span>
                </td>
                <td>{routes.car.distance} miles</td>
                <td>{formatDuration(routes.car.duration)}</td>
                <td className="cost">{formatCost(routes.car.cost)}</td>
              </tr>
            )}
            {routes.ferry && (
              <tr className="ferry-row">
                <td>
                  <span className="mode-icon">⛴️</span>
                  <span className="mode-name">Ferry</span>
                </td>
                <td>{routes.ferry.distance} miles</td>
                <td>{formatDuration(routes.ferry.duration)}</td>
                <td className="cost">{formatCost(routes.ferry.cost)}</td>
              </tr>
            )}
            {routes.plane && (
              <tr className="plane-row">
                <td>
                  <span className="mode-icon">✈️</span>
                  <span className="mode-name">Plane</span>
                </td>
                <td>{routes.plane.distance} miles</td>
                <td>{formatDuration(routes.plane.duration)}</td>
                <td className="cost">{formatCost(routes.plane.cost)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="route-actions">
        <button className="save-routes-btn" onClick={saveRoutes}>
          💾 Save All Routes
        </button>
      </div>
    </div>
  );
};

export default Results; 