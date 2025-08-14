import axios from 'axios';
import { RouteRequest, RouteResponse } from '../types';

// Google Maps API configuration - using our local server to avoid CORS
const GOOGLE_MAPS_API_KEY = 'AIzaSyDDCPnY2orRksw08gpAdHNnBIQ4FqzMsrs';
const LOCAL_SERVER_URL = 'http://localhost:3001';
const DIRECTIONS_API_URL = `${LOCAL_SERVER_URL}/api/directions`;
const GEOCODING_API_URL = `${LOCAL_SERVER_URL}/api/geocode`;

// Helper function to decode Google's polyline
function decodePolyline(encoded: string): [number, number][] {
  const poly = [];
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

    poly.push([lat / 1E5, lng / 1E5]);
  }

  return poly;
}

// Helper function to calculate ferry ticket cost
function calculateFerryTicketCost(distanceMiles: number, start: [number, number], end: [number, number]): number {
  // Base ferry ticket cost with distance multiplier
  const baseCost = 15;
  const distanceMultiplier = distanceMiles * 0.5;
  return Math.round((baseCost + distanceMultiplier) * 100) / 100;
}

// Helper function to calculate estimated flight cost
function calculateEstimatedFlightCost(distanceMiles: number, start: [number, number], end: [number, number]): number {
  // Base flight cost with distance multiplier
  const baseCost = 100;
  const distanceMultiplier = distanceMiles * 0.8;
  return Math.round((baseCost + distanceMultiplier) * 100) / 100;
}

export const calculateRoute = async (start: string, end: string, transportMode: 'car' | 'ferry' | 'plane' = 'car'): Promise<RouteResponse> => {
  try {
    let routeData: { geometry: { coordinates: [number, number][] } } = { geometry: { coordinates: [] } };
    let distanceMiles: number = 0;
    let durationMinutes: number = 0;
    let cost: { fuel: number; ticket?: number } = { fuel: 0 };

    if (transportMode === 'car') {
      // Use Google Directions API for car routes via our local server
      const response = await axios.get(DIRECTIONS_API_URL, {
        params: {
          origin: start,
          destination: end,
          mode: 'driving'
        }
      });

      if (response.data.status !== 'OK' || !response.data.routes || response.data.routes.length === 0) {
        throw new Error('No car route found. Please check your addresses.');
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];
      
      // Convert meters to miles and round to nearest whole number
      distanceMiles = Math.round(leg.distance.value * 0.000621371);
      
      // Convert seconds to minutes and round to nearest whole number
      durationMinutes = Math.round(leg.duration.value / 60);
      
      // Calculate fuel cost (assuming 25 mpg and $3.75/gallon) and round to nearest cent
      const fuelCost = Math.round((distanceMiles / 25) * 3.75 * 100) / 100;
      cost = { fuel: fuelCost };

      // Extract route coordinates directly from Google
      const coordinates: [number, number][] = [];
      if (route.overview_polyline && route.overview_polyline.points) {
        const decodedCoords = decodePolyline(route.overview_polyline.points);
        coordinates.push(...decodedCoords);
      } else {
        coordinates.push([leg.start_location.lat, leg.start_location.lng]);
        coordinates.push([leg.end_location.lat, leg.end_location.lng]);
      }

      routeData = { geometry: { coordinates } };
    } else if (transportMode === 'ferry') {
      // Use Google Directions API for ferry routes with transit mode to get actual ferry times
      const response = await axios.get(DIRECTIONS_API_URL, {
        params: {
          origin: start,
          destination: end,
          mode: 'transit'
        }
      });

      if (response.data.status !== 'OK' || !response.data.routes || response.data.routes.length === 0) {
        throw new Error('No ferry route found. Please check your addresses.');
      }

      // Use Google's actual ferry route data
      const route = response.data.routes[0];
      const leg = route.legs[0];
      
      // Convert meters to miles and round to nearest whole number
      distanceMiles = Math.round(leg.distance.value * 0.000621371);
      
      // Use Google's actual duration for ferry routes
      durationMinutes = Math.round(leg.duration.value / 60);
      
      const ticketCost = Math.round(calculateFerryTicketCost(distanceMiles, [leg.start_location.lat, leg.start_location.lng], [leg.end_location.lat, leg.end_location.lng]));
      cost = { fuel: 0, ticket: ticketCost };

      // Extract route coordinates directly from Google
      const coordinates: [number, number][] = [];
      if (route.overview_polyline && route.overview_polyline.points) {
        coordinates.push(...decodePolyline(route.overview_polyline.points));
      } else {
        coordinates.push([leg.start_location.lat, leg.start_location.lng]);
        coordinates.push([leg.end_location.lat, leg.end_location.lng]);
      }
      routeData = { geometry: { coordinates } };
    } else if (transportMode === 'plane') {
      // Use Google Directions API for plane routes with driving mode to get direct path
      const response = await axios.get(DIRECTIONS_API_URL, {
        params: {
          origin: start,
          destination: end,
          mode: 'driving'
        }
      });

      if (response.data.status !== 'OK' || !response.data.routes || response.data.routes.length === 0) {
        throw new Error('No plane route found. Please check your addresses.');
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];
      
      // Convert meters to miles and round to nearest whole number
      distanceMiles = Math.round(leg.distance.value * 0.000621371);
      
      // Use Google's actual flight time data when available, or calculate based on distance
      // For now, use distance-based calculation since Google doesn't provide flight times in Directions API
      let flightTimeHours;
      if (distanceMiles <= 300) {
        flightTimeHours = 1.2; // Short domestic flights
      } else if (distanceMiles <= 800) {
        flightTimeHours = 2.0; // Medium domestic flights
      } else if (distanceMiles <= 1500) {
        flightTimeHours = 3.0; // Long domestic flights
      } else {
        flightTimeHours = 4.5; // International flights
      }
      
      // Add some variation based on distance
      const baseTime = flightTimeHours + (distanceMiles * 0.0005);
      durationMinutes = Math.round(baseTime * 60);
      
      const ticketCost = Math.round(calculateEstimatedFlightCost(distanceMiles, [leg.start_location.lat, leg.start_location.lng], [leg.end_location.lat, leg.end_location.lng]));
      cost = { fuel: 0, ticket: ticketCost };
      
      // Extract route coordinates directly from Google for plane path
      const coordinates: [number, number][] = [];
      if (route.overview_polyline && route.overview_polyline.points) {
        coordinates.push(...decodePolyline(route.overview_polyline.points));
      } else {
        coordinates.push([leg.start_location.lat, leg.start_location.lng]);
        coordinates.push([leg.end_location.lat, leg.end_location.lng]);
      }
      routeData = { geometry: { coordinates } };
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