import React, { useState } from 'react';
import { AirportSearchResponse, FlightInfo } from '../services/airportService';

interface AirportInfoProps {
  startAirports: AirportSearchResponse | null;
  endAirports: AirportSearchResponse | null;
  flightInfo: FlightInfo | null;
  isLoading: boolean;
}

const AirportInfo: React.FC<AirportInfoProps> = ({ startAirports, endAirports, flightInfo, isLoading }) => {
  const [isFlightInfoExpanded, setIsFlightInfoExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="airport-info">
        <div className="loading">Finding closest airports and calculating flight times...</div>
      </div>
    );
  }

  if (!startAirports && !endAirports) {
    return null;
  }

  const formatDistance = (distance: number) => {
    return `${distance.toFixed(1)} mi`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const renderAirportList = (airports: AirportSearchResponse, title: string) => (
    <div className="airport-section">
      <h3 className="airport-section-title">
        <span className="airport-icon">✈️</span>
        {title}
      </h3>
      <div className="airport-list">
        {airports.airports.map((airport, index) => (
          <div key={`${airport.icao}-${index}`} className="airport-item">
            <div className="airport-header">
              <span className="airport-codes">
                <span className="airport-iata">{airport.iata}</span>
                <span className="airport-icao">({airport.icao})</span>
              </span>
              <span className="airport-distance">{formatDistance(airport.distance)}</span>
            </div>
            <div className="airport-name">{airport.name}</div>
            <div className="airport-location">{airport.city}, {airport.country}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFlightInfo = () => {
    if (!flightInfo) return null;

    return (
      <div className="flight-info-section">
        <div 
          className="flight-info-header"
          onClick={() => setIsFlightInfoExpanded(!isFlightInfoExpanded)}
        >
          <h3 className="flight-info-title">
            <span className="flight-icon">🛫</span>
            Direct Flight Between Closest Airports
          </h3>
          <span className={`flight-dropdown-arrow ${isFlightInfoExpanded ? 'expanded' : ''}`}>
            ▼
          </span>
        </div>
        {isFlightInfoExpanded && (
          <div className="flight-details">
            <div className="flight-route">
              <div className="flight-airport">
                <span className="flight-airport-code">{flightInfo.departureAirport.iata}</span>
                <span className="flight-airport-name">{flightInfo.departureAirport.name}</span>
              </div>
              <div className="flight-arrow">→</div>
              <div className="flight-airport">
                <span className="flight-airport-code">{flightInfo.arrivalAirport.iata}</span>
                <span className="flight-airport-name">{flightInfo.arrivalAirport.name}</span>
              </div>
            </div>
            <div className="flight-stats">
              <div className="flight-stat">
                <span className="flight-stat-label">Distance:</span>
                <span className="flight-stat-value">{formatDistance(flightInfo.distance)}</span>
              </div>
              <div className="flight-stat">
                <span className="flight-stat-label">Flight Time:</span>
                <span className="flight-stat-value">{formatDuration(flightInfo.duration)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="airport-info">
      <div className="airport-info-header">
        <h2>Closest Airports & Flight Information</h2>
        <p className="airport-info-subtitle">Nearest airports to your locations and direct flight details</p>
      </div>
      
      <div className="airport-sections">
        {startAirports && renderAirportList(startAirports, `Start Location: ${startAirports.location.address}`)}
        {endAirports && renderAirportList(endAirports, `Destination: ${endAirports.location.address}`)}
        {renderFlightInfo()}
      </div>
    </div>
  );
};

export default AirportInfo;
