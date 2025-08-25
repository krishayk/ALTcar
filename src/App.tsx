import React, { useState, useEffect } from 'react';
import RouteForm from './components/RouteForm';
import RouteMap from './components/RouteMap';
import Results from './components/Results';
import SavedRoutesViewer from './components/SavedRoutesViewer';
import { calculateRoute } from './services/routeService';
import { RouteResponse } from './types';

interface AllRoutes {
  car: RouteResponse | null;
  ferry: RouteResponse | null;
  plane: RouteResponse | null;
}

const App: React.FC = () => {
  const [routes, setRoutes] = useState<AllRoutes>({ car: null, ferry: null, plane: null });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
  const [ferryDirection, setFerryDirection] = useState<boolean>(true); // true = left, false = right
  const [curveSize, setCurveSize] = useState<number>(5); // Controls the width of the ferry curve

  useEffect(() => {
    // Load saved routes on component mount
    const saved = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
    setSavedRoutes(saved);
  }, []);

  const handleCalculateRoute = async (start: string, end: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Calculate all three routes simultaneously
      const [carRoute, ferryRoute, planeRoute] = await Promise.all([
        calculateRoute(start, end, 'car'),
        calculateRoute(start, end, 'ferry'),
        calculateRoute(start, end, 'plane')
      ]);
      
      setRoutes({
        car: carRoute,
        ferry: ferryRoute,
        plane: planeRoute
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setRoutes({ car: null, ferry: null, plane: null });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRouteSaved = () => {
    // Refresh saved routes after saving
    const saved = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
    setSavedRoutes(saved);
  };

  const handleViewRoute = (start: string, end: string) => {
    handleCalculateRoute(start, end);
  };

  const hasAnyRoute = routes.car || routes.ferry || routes.plane;

  return (
    <div className="app">
      <header className="header">
        <h1>REGENT Alternative Route Calculator</h1>
        <p className="subtitle">Compare car, ferry, and plane routes in one view</p>
      </header>

      <RouteForm onCalculate={handleCalculateRoute} isLoading={isLoading} />

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {hasAnyRoute && (
        <>
          <RouteMap 
            routes={routes} 
            isLoading={isLoading} 
            ferryDirection={ferryDirection}
            setFerryDirection={setFerryDirection}
            curveSize={curveSize}
            setCurveSize={setCurveSize}
          />
          <Results 
            routes={routes} 
            isLoading={isLoading} 
            onRouteSaved={handleRouteSaved}
            ferryDirection={ferryDirection}
            curveSize={curveSize}
          />
        </>
      )}

      {savedRoutes.length > 0 && (
        <SavedRoutesViewer 
          savedRoutes={savedRoutes} 
          onRouteDeleted={() => {
            const saved = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
            setSavedRoutes(saved);
          }}
          onViewRoute={handleViewRoute}
        />
      )}
    </div>
  );
};

export default App; 