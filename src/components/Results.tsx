import React, { useState } from 'react';
import { ResultsProps } from '../types';

const Results: React.FC<ResultsProps> = ({ routes, isLoading, onRouteSaved, ferryDirection, curveSize, useMetric, setUseMetric, flightInfo, startAirports, endAirports }) => {
  const [showAirportPopup, setShowAirportPopup] = useState(false);
  const [showSeagliderRow, setShowSeagliderRow] = useState(false);
  const [seagliderEditMode, setSeagliderEditMode] = useState(false);
  const [seagliderData, setSeagliderData] = useState({
    distance: '',
    duration: '',
    cost: ''
  });
  const [seagliderDisplayData, setSeagliderDisplayData] = useState({
    distance: '',
    duration: '',
    cost: ''
  });
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

  const convertDistance = (miles: number) => {
    if (useMetric) {
      return `${(miles * 1.60934).toFixed(1)} km`;
    }
    return `${miles} mi`;
  };

  const handleSeagliderSubmit = () => {
    setSeagliderDisplayData({ ...seagliderData });
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
    setSeagliderData({ distance: '', duration: '', cost: '' });
    setSeagliderDisplayData({ distance: '', duration: '', cost: '' });
  };

  return (
    <div className="results">
      <div className="results-header">
        <h2>Route Comparison</h2>
      </div>
      <div className="comparison-table">
        <table>
          <thead>
            <tr>
              <th>Transport Mode</th>
              <th>
                Distance
                <select 
                  className="unit-dropdown"
                  value={useMetric ? 'km' : 'mi'}
                  onChange={(e) => setUseMetric(e.target.value === 'km')}
                >
                  <option value="mi">mi</option>
                  <option value="km">km</option>
                </select>
              </th>
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
            {flightInfo && (
              <tr className="plane-row">
                <td>
                  <span className="mode-name">Plane</span>
                  <button 
                    className="gear-button"
                    onClick={() => setShowAirportPopup(true)}
                    title="View airport details"
                  >
                    ⚙️
                  </button>
                </td>
                <td>{convertDistance(flightInfo.distance)}</td>
                <td>{formatDuration(flightInfo.duration)}</td>
                <td className="cost">N/A</td>
              </tr>
            )}
            {showSeagliderRow && (
              <tr className="seaglider-row">
                <td>
                  <span className="mode-name">Seaglider</span>
                  <button 
                    className="remove-seaglider-btn"
                    onClick={removeSeagliderRow}
                    title="Remove Seaglider row"
                  >
                    ×
                  </button>
                </td>
                <td>
                  {seagliderEditMode ? (
                    <input
                      type="text"
                      value={seagliderData.distance}
                      onChange={(e) => setSeagliderData({...seagliderData, distance: e.target.value})}
                      placeholder={useMetric ? "___ km" : "___ mi"}
                      className="seaglider-input"
                      onKeyPress={handleSeagliderKeyPress}
                      autoFocus
                    />
                  ) : (
                    <span className="seaglider-display">
                      {seagliderDisplayData.distance || (useMetric ? "___ km" : "___ mi")}
                    </span>
                  )}
                </td>
                <td>
                  {seagliderEditMode ? (
                    <input
                      type="text"
                      value={seagliderData.duration}
                      onChange={(e) => setSeagliderData({...seagliderData, duration: e.target.value})}
                      placeholder="__ hr __ min"
                      className="seaglider-input"
                      onKeyPress={handleSeagliderKeyPress}
                    />
                  ) : (
                    <span className="seaglider-display">
                      {seagliderDisplayData.duration || "__ hr __ min"}
                    </span>
                  )}
                </td>
                <td>
                  {seagliderEditMode ? (
                    <input
                      type="text"
                      value={seagliderData.cost}
                      onChange={(e) => setSeagliderData({...seagliderData, cost: e.target.value})}
                      placeholder="$___"
                      className="seaglider-input"
                      onKeyPress={handleSeagliderKeyPress}
                    />
                  ) : (
                    <span className="seaglider-display">
                      {seagliderDisplayData.cost || "$___"}
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
                    </div>
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