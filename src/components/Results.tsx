import React from 'react';
import { ResultsProps } from '../types';

const Results: React.FC<ResultsProps> = ({ route, isLoading }) => {
  if (isLoading) {
    return (
      <div className="results">
        <div className="loading">Calculating route...</div>
      </div>
    );
  }

  if (!route) {
    return null;
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} h ${mins} m`;
    }
    return `${mins} m`;
  };

  const formatDistance = (miles: number) => {
    return `${miles.toFixed(1)} mi`;
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(2)}`;
  };

  return (
    <div className="results">
      <div className="result-card">
        <h3>Distance</h3>
        <div>
          <span className="value">{formatDistance(route.distance)}</span>
        </div>
      </div>

      <div className="result-card">
        <h3>Travel Time</h3>
        <div>
          <span className="value">{formatTime(route.duration)}</span>
        </div>
      </div>

      <div className="result-card">
        <h3>{route.transportMode === 'car' ? 'Fuel Cost' : 'Ticket Cost'}</h3>
        <div>
          <span className="value">
            {route.transportMode === 'car'
              ? formatCost(route.cost.fuel)
              : formatCost(route.cost.ticket || 0)
            }
          </span>
          <span className="unit">USD</span>
        </div>
      </div>

    </div>
  );
};

export default Results; 