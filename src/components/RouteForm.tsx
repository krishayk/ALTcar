import React, { useState } from 'react';
import { RouteFormProps } from '../types';

const RouteForm: React.FC<RouteFormProps> = ({ onCalculate, isLoading }) => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (start.trim() && end.trim()) {
      onCalculate(start.trim(), end.trim());
    }
  };

  return (
    <div className="route-form">
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="start">Start Address</label>
            <input
              type="text"
              id="start"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="e.g., 123 Main St, New York, NY"
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="end">Destination Address</label>
            <input
              type="text"
              id="end"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
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