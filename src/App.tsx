import React, { useState, useEffect } from 'react';
import RouteForm from './components/RouteForm';
import RouteMap from './components/RouteMap';
import Results from './components/Results';
import SavedRoutesViewer from './components/SavedRoutesViewer';

import { calculateRoute } from './services/routeService';
import { findClosestAirports, AirportSearchResponse, calculateFlightBetweenAirports, FlightInfo } from './services/airportService';
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
  const [curveSize, setCurveSize] = useState<number>(5); // Controls the width of the ferry curve (default 5/10)
  const [useMetric, setUseMetric] = useState<boolean>(false); // false = miles, true = kilometers
  const [startInput, setStartInput] = useState<string>('');
  const [endInput, setEndInput] = useState<string>('');
  const [startAirports, setStartAirports] = useState<AirportSearchResponse | null>(null);
  const [endAirports, setEndAirports] = useState<AirportSearchResponse | null>(null);
  const [flightInfo, setFlightInfo] = useState<FlightInfo | null>(null);
  const [isLoadingAirports, setIsLoadingAirports] = useState(false);

  useEffect(() => {
    // Load saved routes on component mount
    const saved = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
    setSavedRoutes(saved);
  }, []);

  const handleCalculateRoute = async (start: string, end: string) => {
    setIsLoading(true);
    setIsLoadingAirports(true);
    setError(null);
    
    try {
      // Calculate all three routes and find airports simultaneously
      const [carRoute, ferryRoute, planeRoute, startAirportData, endAirportData] = await Promise.all([
        calculateRoute(start, end, 'car'),
        calculateRoute(start, end, 'ferry'),
        calculateRoute(start, end, 'plane'),
        findClosestAirports(start, 3),
        findClosestAirports(end, 3)
      ]);
      
      setRoutes({
        car: carRoute,
        ferry: ferryRoute,
        plane: planeRoute
      });
      
      setStartAirports(startAirportData);
      setEndAirports(endAirportData);
      
      // Calculate flight between the closest airports
      if (startAirportData.airports.length > 0 && endAirportData.airports.length > 0) {
        const closestStartAirport = startAirportData.airports[0];
        const closestEndAirport = endAirportData.airports[0];
        
        try {
          const flightData = await calculateFlightBetweenAirports(closestStartAirport, closestEndAirport);
          setFlightInfo(flightData);
        } catch (flightError) {
          console.error('Error calculating flight between airports:', flightError);
          setFlightInfo(null);
        }
      } else {
        setFlightInfo(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setRoutes({ car: null, ferry: null, plane: null });
      setStartAirports(null);
      setEndAirports(null);
      setFlightInfo(null);
    } finally {
      setIsLoading(false);
      setIsLoadingAirports(false);
    }
  };

  const handleRouteSaved = () => {
    // Refresh saved routes after saving
    const saved = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
    setSavedRoutes(saved);
  };

  const handleViewRoute = (start: string, end: string) => {
    setStartInput(start);
    setEndInput(end);
    handleCalculateRoute(start, end);
  };

  const hasAnyRoute = routes.car || routes.ferry || routes.plane;

  return (
    <div className="app">
      <header className="header">
        <h1>REGENT Alternative Route Calculator</h1>
        <p className="subtitle">Compare car, ferry, and plane routes in one view</p>
      </header>

      <RouteForm 
        onCalculate={handleCalculateRoute} 
        isLoading={isLoading}
        startInput={startInput}
        setStartInput={setStartInput}
        endInput={endInput}
        setEndInput={setEndInput}
      />

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
            useMetric={useMetric}
            setUseMetric={setUseMetric}
          />
          <Results 
            routes={routes} 
            isLoading={isLoading} 
            onRouteSaved={handleRouteSaved}
            ferryDirection={ferryDirection}
            curveSize={curveSize}
            useMetric={useMetric}
            setUseMetric={setUseMetric}
            flightInfo={flightInfo}
            startAirports={startAirports}
            endAirports={endAirports}
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
          useMetric={useMetric}
          setUseMetric={setUseMetric}
        />
      )}
    </div>
  );
};

export default App; 