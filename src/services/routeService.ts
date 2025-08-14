import axios from 'axios';
import { RouteRequest, RouteResponse } from '../types';

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = 'AIzaSyDDCPnY2orRksw08gpAdHNnBIQ4FqzMsrs';

// Note: We'll use the Google Maps JavaScript API directly in the RouteMap component
// to avoid CORS issues. This service will provide fallback calculations.
export const calculateRoute = async (start: string, end: string, transportMode: 'car' | 'ferry' | 'plane' = 'car'): Promise<RouteResponse> => {
  try {
    let routeData;
    let distanceMiles;
    let durationMinutes;
    let cost;

    // For now, we'll use estimated calculations since direct API calls have CORS issues
    // The actual route calculation will be done in the RouteMap component using Google Maps JavaScript API
    
    if (transportMode === 'car') {
      // Estimate based on straight-line distance
      const estimatedDistance = 50; // This will be replaced by actual Google Maps data
      distanceMiles = estimatedDistance;
      durationMinutes = Math.round(estimatedDistance * 1.5); // Rough estimate: 1.5 min per mile
      
      // Calculate fuel cost (assuming 25 mpg and $3.75/gallon)
      const fuelCost = Math.round((distanceMiles / 25) * 3.75 * 100) / 100;
      cost = { fuel: fuelCost };

      // Placeholder coordinates - will be replaced by actual route data
      routeData = { 
        geometry: { 
          coordinates: [
            [37.7749, -122.4194], // San Francisco coordinates as placeholder
            [37.7021, -121.9358]  // Dublin coordinates as placeholder
          ] 
        } 
      };
    } else if (transportMode === 'ferry') {
      // Estimate based on straight-line distance
      const estimatedDistance = 30; // This will be replaced by actual Google Maps data
      distanceMiles = estimatedDistance;
      durationMinutes = Math.round(estimatedDistance * 2.5); // Ferries are slower
      
      const ticketCost = Math.round(calculateFerryTicketCost(estimatedDistance, [37.7749, -122.4194], [37.7021, -121.9358]));
      cost = { fuel: 0, ticket: ticketCost };

      routeData = { 
        geometry: { 
          coordinates: [
            [37.7749, -122.4194], // San Francisco coordinates as placeholder
            [37.7021, -121.9358]  // Dublin coordinates as placeholder
          ] 
        } 
      };
    } else if (transportMode === 'plane') {
      // Estimate based on straight-line distance
      const estimatedDistance = 50; // This will be replaced by actual Google Maps data
      distanceMiles = estimatedDistance;
      
      // Use distance-based calculation for flight times
      let flightTimeHours;
      if (estimatedDistance <= 300) {
        flightTimeHours = 1.2; // Short domestic flights
      } else if (estimatedDistance <= 800) {
        flightTimeHours = 2.0; // Medium domestic flights
      } else if (estimatedDistance <= 1500) {
        flightTimeHours = 3.0; // Long domestic flights
      } else {
        flightTimeHours = 4.5; // International flights
      }
      
      const baseTime = flightTimeHours + (estimatedDistance * 0.0005);
      durationMinutes = Math.round(baseTime * 60);
      
      const ticketCost = Math.round(calculateEstimatedFlightCost(estimatedDistance, [37.7749, -122.4194], [37.7021, -121.9358]));
      cost = { fuel: 0, ticket: ticketCost };
      
      routeData = { 
        geometry: { 
          coordinates: [
            [37.7749, -122.4194], // San Francisco coordinates as placeholder
            [37.7021, -121.9358]  // Dublin coordinates as placeholder
          ] 
        } 
      };
    }

    return {
      distance: distanceMiles,
      duration: durationMinutes,
      route: {
        coordinates: routeData.geometry.coordinates,
        summary: `Route from ${start} to ${end}`,
        startAddress: start,
        endAddress: end
      },
      cost,
      transportMode
    };
  } catch (error) {
    console.error('Error calculating route:', error);
    throw new Error(`Failed to calculate ${transportMode} route. Please check your addresses.`);
  }
};

// Simplified ferry ticket cost calculation
const calculateFerryTicketCost = (distanceMiles: number, startCoords: [number, number], endCoords: [number, number]): number => {
  let baseCost = 0;
  let perMileCost = 0;
  
  if (distanceMiles <= 5) {
    baseCost = 8;
    perMileCost = 1.5;
  } else if (distanceMiles <= 15) {
    baseCost = 15;
    perMileCost = 2.0;
  } else if (distanceMiles <= 50) {
    baseCost = 25;
    perMileCost = 2.5;
  } else {
    baseCost = 40;
    perMileCost = 3.0;
  }
  
  const calculatedCost = baseCost + (distanceMiles * perMileCost);
  return Math.max(5, calculatedCost);
};

// Simplified flight cost calculation
const calculateEstimatedFlightCost = (distanceMiles: number, startCoords: [number, number], endCoords: [number, number]): number => {
  let baseCost = 0;
  let perMileCost = 0;
  
  if (distanceMiles <= 100) {
    baseCost = 80;
    perMileCost = 0.12;
  } else if (distanceMiles <= 500) {
    baseCost = 120;
    perMileCost = 0.15;
  } else if (distanceMiles <= 1500) {
    baseCost = 200;
    perMileCost = 0.18;
  } else {
    baseCost = 300;
    perMileCost = 0.20;
  }
  
  const calculatedCost = baseCost + (distanceMiles * perMileCost);
  return Math.max(50, calculatedCost);
};

// Decode Google Maps polyline to get coordinates
const decodePolyline = (encoded: string): [number, number][] => {
  const coordinates: [number, number][] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let shift = 0, result = 0;

    do {
      let b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result >= 0x20);

    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      let b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result >= 0x20);

    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
}; 