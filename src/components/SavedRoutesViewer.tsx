import React, { useState } from 'react';

interface SavedRoute {
  id: string;
  timestamp: string;
  startAddress: string;
  endAddress: string;
  routes: {
    car: any;
    ferry: any;
    plane: any;
  };
}

interface SavedRoutesViewerProps {
  savedRoutes: SavedRoute[];
  onRouteDeleted: () => void;
}

const SavedRoutesViewer: React.FC<SavedRoutesViewerProps> = ({ savedRoutes, onRouteDeleted }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  const deleteRoute = (id: string) => {
    const existingRoutes = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
    const updatedRoutes = existingRoutes.filter((route: SavedRoute) => route.id !== id);
    localStorage.setItem('savedRoutes', JSON.stringify(updatedRoutes));
    onRouteDeleted();
  };

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

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (savedRoutes.length === 0) return null;

  return (
    <div className="saved-routes">
      <div className="saved-routes-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h2>💾 Saved Route Comparisons ({savedRoutes.length})</h2>
        <span className="dropdown-arrow">{isExpanded ? '▼' : '▶'}</span>
      </div>
      
      {isExpanded && (
        <div className="saved-routes-content">
          <div className="saved-routes-grid">
            {savedRoutes.map((savedRoute) => (
              <div key={savedRoute.id} className="saved-route-card">
                <div className="saved-route-header">
                  <div className="route-info">
                    <h3>{savedRoute.startAddress} → {savedRoute.endAddress}</h3>
                    <p className="saved-date">{formatDate(savedRoute.timestamp)}</p>
                  </div>
                  <div className="route-actions">
                    <button 
                      className="expand-btn"
                      onClick={() => setExpandedRoute(expandedRoute === savedRoute.id ? null : savedRoute.id)}
                    >
                      {expandedRoute === savedRoute.id ? '📖 Hide Details' : '📖 Show Details'}
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteRoute(savedRoute.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                
                {expandedRoute === savedRoute.id && (
                  <div className="saved-route-details">
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
                          {savedRoute.routes.car && (
                            <tr className="car-row">
                              <td>
                                <span className="mode-icon">🚗</span>
                                <span className="mode-name">Car</span>
                              </td>
                              <td>{savedRoute.routes.car.distance} miles</td>
                              <td>{formatDuration(savedRoute.routes.car.duration)}</td>
                              <td className="cost">{formatCost(savedRoute.routes.car.cost)}</td>
                            </tr>
                          )}
                          {savedRoute.routes.ferry && (
                            <tr className="ferry-row">
                              <td>
                                <span className="mode-icon">⛴️</span>
                                <span className="mode-name">Ferry</span>
                              </td>
                              <td>{savedRoute.routes.ferry.distance} miles</td>
                              <td>{formatDuration(savedRoute.routes.ferry.duration)}</td>
                              <td className="cost">{formatCost(savedRoute.routes.ferry.cost)}</td>
                            </tr>
                          )}
                          {savedRoute.routes.plane && (
                            <tr className="plane-row">
                              <td>
                                <span className="mode-icon">✈️</span>
                                <span className="mode-name">Plane</span>
                              </td>
                              <td>{savedRoute.routes.plane.distance} miles</td>
                              <td>{formatDuration(savedRoute.routes.plane.duration)}</td>
                              <td className="cost">{formatCost(savedRoute.routes.plane.cost)}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedRoutesViewer;
