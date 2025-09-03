import React, { useState, useEffect } from 'react';
import { ResultsProps } from '../types';

const Results: React.FC<ResultsProps> = ({ routes, isLoading, onRouteSaved, ferryDirection, curveSize, useMetric, setUseMetric, flightInfo, startAirports, endAirports }) => {
  const [showAirportPopup, setShowAirportPopup] = useState(false);
  const [showSeagliderRow, setShowSeagliderRow] = useState(false);
  const [seagliderEditMode, setSeagliderEditMode] = useState(false);
  const [seagliderData, setSeagliderData] = useState({
    distance: '',
    distanceInMiles: '', // Store the original value in miles for conversion
    duration: '',
    durationMinutes: '',
    cost: ''
  });
  const [seagliderDisplayData, setSeagliderDisplayData] = useState({
    distance: '',
    duration: '',
    cost: ''
  });

  // Handle unit conversion for Seaglider distance when useMetric changes
  useEffect(() => {
    if (seagliderData.distanceInMiles && seagliderData.distanceInMiles !== '') {
      const convertedDistance = convertSeagliderDistance(
        seagliderData.distanceInMiles, 
        false, // fromMetric (we store in miles)
        useMetric // toMetric
      );
      setSeagliderData(prev => ({
        ...prev,
        distance: convertedDistance
      }));
    }
  }, [useMetric, seagliderData.distanceInMiles]);
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

  const formatFlightCost = (flightInfo: any) => {
    if (flightInfo?.cost) {
      const { average, currency } = flightInfo.cost;
      return `${currency}${average}`;
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

  const convertDistance = (miles: number) => {
    if (useMetric) {
      return `${(miles * 1.60934).toFixed(1)} km`;
    }
    return `${miles} mi`;
  };

  const convertSeagliderDistance = (value: string, fromMetric: boolean, toMetric: boolean) => {
    if (!value || value === '') return '';
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    
    if (fromMetric && !toMetric) {
      // Convert from km to miles
      return (numValue / 1.60934).toFixed(1);
    } else if (!fromMetric && toMetric) {
      // Convert from miles to km
      return (numValue * 1.60934).toFixed(1);
    }
    
    return value; // No conversion needed
  };

  const handleSeagliderSubmit = () => {
    const combinedDuration = `${seagliderData.duration} hr ${seagliderData.durationMinutes} min`;
    setSeagliderDisplayData({ 
      ...seagliderData, 
      duration: combinedDuration 
    });
    setSeagliderEditMode(false);
  };

  const handleSeagliderKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSeagliderSubmit();
    }
  };

  const removeSeagliderRow = () => {
    setShowSeagliderRow(false);
    setSeagliderEditMode(false);
    setSeagliderData({ distance: '', distanceInMiles: '', duration: '', durationMinutes: '', cost: '' });
    setSeagliderDisplayData({ distance: '', duration: '', cost: '' });
  };

  return (
    <div className="results">
      <div className="results-header">
        <h2>Route Comparison</h2>
        <div className="results-controls">
          <div className="unit-selector">
            <label>Units:</label>
            <select 
              className="unit-dropdown"
              value={useMetric ? 'km' : 'mi'}
              onChange={(e) => setUseMetric(e.target.value === 'km')}
            >
              <option value="mi">Miles (mi)</option>
              <option value="km">Kilometers (km)</option>
            </select>
          </div>
        </div>
      </div>
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
                  <span className="mode-name">Car</span>
                </td>
                <td>{convertDistance(routes.car.distance)}</td>
                <td>{formatDuration(routes.car.duration)}</td>
                <td className="cost">{formatCost(routes.car.cost)}</td>
              </tr>
            )}
            {flightInfo && (
              <tr className="plane-row">
                <td>
                  <span className="mode-name">Plane</span>
                </td>
                <td>{convertDistance(flightInfo.distance)}</td>
                <td>{formatDuration(flightInfo.duration)}</td>
                <td className="cost">{formatFlightCost(flightInfo)}</td>
              </tr>
            )}
            {routes.ferry && (
              <tr className="ferry-row">
                <td>
                  <span className="mode-name">Ferry</span>
                </td>
                <td>{convertDistance(routes.ferry.distance)}</td>
                <td>{formatDuration(routes.ferry.duration)}</td>
                <td className="cost">{formatCost(routes.ferry.cost)}</td>
              </tr>
            )}
            {showSeagliderRow && (
              <tr className="seaglider-row">
                <td>
                  <span className="mode-name">Seaglider</span>
                </td>
                <td>
                  {seagliderEditMode ? (
                    <div className="seaglider-input-container">
                      <input
                        type="text"
                        value={seagliderData.distance}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          // Store the original value in miles for conversion
                          const milesValue = useMetric ? 
                            (inputValue ? (parseFloat(inputValue) / 1.60934).toString() : '') : 
                            inputValue;
                          
                          setSeagliderData({
                            ...seagliderData, 
                            distance: inputValue,
                            distanceInMiles: milesValue
                          });
                        }}
                        placeholder="___"
                        className="seaglider-input"
                        onKeyPress={handleSeagliderKeyPress}
                        autoFocus
                      />
                      <span className="unit-label">{useMetric ? "km" : "mi"}</span>
                    </div>
                  ) : (
                    <span className="seaglider-display">
                      {seagliderDisplayData.distance ? `${seagliderDisplayData.distance} ${useMetric ? "km" : "mi"}` : `___ ${useMetric ? "km" : "mi"}`}
                    </span>
                  )}
                </td>
                <td>
                  {seagliderEditMode ? (
                    <div className="seaglider-input-container">
                      <input
                        type="text"
                        value={seagliderData.duration}
                        onChange={(e) => setSeagliderData({...seagliderData, duration: e.target.value})}
                        placeholder="__"
                        className="seaglider-input"
                        onKeyPress={handleSeagliderKeyPress}
                      />
                      <span className="unit-label">hr</span>
                      <input
                        type="text"
                        value={seagliderData.durationMinutes || ''}
                        onChange={(e) => setSeagliderData({...seagliderData, durationMinutes: e.target.value})}
                        placeholder="__"
                        className="seaglider-input"
                        onKeyPress={handleSeagliderKeyPress}
                      />
                      <span className="unit-label">min</span>
                    </div>
                  ) : (
                    <span className="seaglider-display">
                      {seagliderDisplayData.duration || "__ hr __ min"}
                    </span>
                  )}
                </td>
                <td>
                  {seagliderEditMode ? (
                    <div className="seaglider-input-container">
                      <input
                        type="text"
                        value={seagliderData.cost}
                        onChange={(e) => setSeagliderData({...seagliderData, cost: e.target.value})}
                        placeholder="___"
                        className="seaglider-input"
                        onKeyPress={handleSeagliderKeyPress}
                      />
                      <span className="unit-label">$</span>
                    </div>
                  ) : (
                    <span className="seaglider-display">
                      {seagliderDisplayData.cost ? `$${seagliderDisplayData.cost}` : "$___"}
                    </span>
                  )}
                </td>
                <td>
                  {!seagliderEditMode && (
                    <button 
                      className="edit-seaglider-btn"
                      onClick={() => setSeagliderEditMode(true)}
                      title="Edit Seaglider data"
                    >
                      ✏️
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="route-actions">
        {!showSeagliderRow && (
          <button 
            className="add-seaglider-btn" 
            onClick={() => {
              setShowSeagliderRow(true);
              setSeagliderEditMode(true);
            }}
          >
            Add Seaglider Row
          </button>
        )}
        {showSeagliderRow && (
          <button 
            className="remove-seaglider-btn" 
            onClick={removeSeagliderRow}
            title="Remove Seaglider row"
          >
            × Remove Seaglider
          </button>
        )}
        {flightInfo && (
          <button 
            className="gear-button"
            onClick={() => setShowAirportPopup(true)}
            title="View airport details"
          >
            ⚙️ Airport Details
          </button>
        )}
        <button className="save-routes-btn" onClick={saveRoutes}>
          Save All Routes
        </button>
      </div>

      {/* Airport Details Popup */}
      {showAirportPopup && (
        <div className="popup-overlay" onClick={() => setShowAirportPopup(false)}>
          <div className="airport-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Airport Details</h3>
              <button className="close-button" onClick={() => setShowAirportPopup(false)}>×</button>
            </div>
            
            <div className="popup-content">
              {startAirports && (
                <div className="airport-section">
                  <h4>Closest Airports to Start Location</h4>
                  <div className="airport-list">
                    {startAirports.airports.map((airport, index) => (
                      <div key={index} className="airport-item">
                        <div className="airport-name">{airport.name}</div>
                        <div className="airport-details">
                          {airport.iata} ({airport.icao}) • {airport.city}, {airport.country}
                        </div>
                        <div className="airport-distance">{convertDistance(airport.distance)} away</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {endAirports && (
                <div className="airport-section">
                  <h4>Closest Airports to End Location</h4>
                  <div className="airport-list">
                    {endAirports.airports.map((airport, index) => (
                      <div key={index} className="airport-item">
                        <div className="airport-name">{airport.name}</div>
                        <div className="airport-details">
                          {airport.iata} ({airport.icao}) • {airport.city}, {airport.country}
                        </div>
                        <div className="airport-distance">{convertDistance(airport.distance)} away</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {flightInfo && (
                <div className="flight-section">
                  <h4>Direct Flight Information</h4>
                  <div className="flight-details">
                    <div className="flight-route">
                      <strong>{flightInfo.departureAirport.iata}</strong> → <strong>{flightInfo.arrivalAirport.iata}</strong>
                    </div>
                    <div className="flight-stats">
                      <div className="flight-stat">
                        <span className="stat-label">Distance:</span>
                        <span className="stat-value">{convertDistance(flightInfo.distance)}</span>
                      </div>
                      <div className="flight-stat">
                        <span className="stat-label">Duration:</span>
                        <span className="stat-value">{formatDuration(flightInfo.duration)}</span>
                      </div>
                      <div className="flight-stat">
                        <span className="stat-label">Average Price:</span>
                        <span className="stat-value">{formatFlightCost(flightInfo)}</span>
                      </div>
                    </div>
                    
                    {flightInfo.cost && (
                      <div className="flight-offers">
                        <h5>Available Flights</h5>
                        <div className="offers-list">
                          {flightInfo.cost.offers.map((offer, index) => (
                            <div key={index} className="offer-item">
                              <div className="offer-header">
                                <span className="offer-price">{offer.currency}{offer.price}</span>
                                <span className="offer-airline">{offer.airline}</span>
                              </div>
                              <div className="offer-details">
                                <span className="offer-time">{offer.departureTime.split('T')[1].substring(0, 5)} → {offer.arrivalTime.split('T')[1].substring(0, 5)}</span>
                                <span className="offer-duration">{offer.duration}</span>
                                <span className="offer-stops">{offer.stops === 0 ? 'Direct' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results; 