import React, { useState } from 'react';
import RouteForm from './components/RouteForm';
import RouteMap from './components/RouteMap';
import Results from './components/Results';
import { calculateRoute } from './services/routeService';
import { RouteResponse } from './types';

const App: React.FC = () => {
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transportMode, setTransportMode] = useState('car');

  const handleCalculateRoute = async (start: string, end: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const routeData = await calculateRoute(start, end, transportMode as 'car' | 'ferry' | 'plane');
      setRoute(routeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setRoute(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>REGENT Alternative Route Calculator</h1>
        <div className="transport-mode-selector">
          <select 
            value={transportMode} 
            onChange={(e) => setTransportMode(e.target.value)}
            className="mode-dropdown"
          >
            <option value="car">🚗 Car</option>
            <option value="ferry">⛴️ Ferry</option>
            <option value="plane">✈️ Plane</option>
          </select>
        </div>
      </header>

      <RouteForm onCalculate={handleCalculateRoute} isLoading={isLoading} currentRoute={route} transportMode={transportMode} />

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <RouteMap route={route} isLoading={isLoading} />
      
      <Results route={route} isLoading={isLoading} />
    </div>
  );
};

export default App; 