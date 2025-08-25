import axios from 'axios';
import { RouteRequest, RouteResponse } from '../types';

// Local server configuration to avoid CORS issues
const LOCAL_SERVER_URL = 'http://localhost:3001';
const GEOCODING_API_URL = `${LOCAL_SERVER_URL}/api/geocode`;
const DIRECTIONS_API_URL = `${LOCAL_SERVER_URL}/api/directions`;

// Helper function to calculate realistic ferry ticket cost
function calculateFerryTicketCost(distanceMiles: number): number {
  // Very realistic ferry ticket pricing based on real-world data
  
  // Base pricing tiers (similar to real ferry companies like Washington State Ferries, BC Ferries)
  if (distanceMiles <= 5) {
    // Short crossing (e.g., Seattle-Bainbridge)
    return 8.50;
  } else if (distanceMiles <= 15) {
    // Medium crossing (e.g., Seattle-Bremerton)
    return 15.75;
  } else if (distanceMiles <= 30) {
    // Long crossing (e.g., Seattle-Port Townsend)
    return 24.50;
  } else if (distanceMiles <= 50) {
    // Very long crossing (e.g., Seattle-Victoria BC)
    return 35.00;
  } else if (distanceMiles <= 100) {
    // Extended crossing (e.g., Seattle-San Juan Islands)
    return 52.00;
  } else {
    // Ultra-long crossing (e.g., Seattle-Alaska)
    return 75.00 + (distanceMiles - 100) * 0.45;
  }
}

// Helper function to calculate realistic flight ticket cost
function calculateEstimatedFlightCost(distanceMiles: number): number {
  // Very realistic flight ticket pricing based on real-world data
  
  // Base pricing tiers (similar to real airline pricing)
  if (distanceMiles <= 100) {
    // Short domestic (e.g., LA-San Diego)
    return 89;
  } else if (distanceMiles <= 300) {
    // Medium domestic (e.g., LA-San Francisco)
    return 145;
  } else if (distanceMiles <= 500) {
    // Medium-long domestic (e.g., LA-Phoenix)
    return 189;
  } else if (distanceMiles <= 800) {
    // Long domestic (e.g., LA-Denver)
    return 245;
  } else if (distanceMiles <= 1200) {
    // Very long domestic (e.g., LA-Chicago)
    return 325;
  } else if (distanceMiles <= 2000) {
    // Cross-country (e.g., LA-New York)
    return 425;
  } else if (distanceMiles <= 3000) {
    // Transcontinental (e.g., LA-Honolulu)
    return 589;
  } else {
    // International long-haul (e.g., LA-London)
    return 789 + (distanceMiles - 3000) * 0.12;
  }
}

// Helper function to calculate realistic plane distance
function calculatePlaneDistance(startCoords: { lat: number; lng: number }, endCoords: { lat: number; lng: number }): number {
  // Calculate straight-line distance (as the crow flies) for planes
  const R = 3959; // Earth's radius in miles
  const dLat = (endCoords.lat - startCoords.lat) * Math.PI / 180;
  const dLng = (endCoords.lng - startCoords.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(startCoords.lat * Math.PI / 180) * Math.cos(endCoords.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

// Helper function to calculate realistic plane time
function calculatePlaneTime(distanceMiles: number): number {
  // Realistic flight times based on distance (including taxi, takeoff, landing)
  if (distanceMiles <= 100) {
    // Short domestic (including taxi time)
    return 75; // 1 hour 15 minutes
  } else if (distanceMiles <= 300) {
    // Medium domestic
    return 120; // 2 hours
  } else if (distanceMiles <= 500) {
    // Medium-long domestic
    return 180; // 3 hours
  } else if (distanceMiles <= 800) {
    // Long domestic
    return 240; // 4 hours
  } else if (distanceMiles <= 1200) {
    // Very long domestic
    return 300; // 5 hours
  } else if (distanceMiles <= 2000) {
    // Cross-country
    return 360; // 6 hours
  } else if (distanceMiles <= 3000) {
    // Transcontinental
    return 420; // 7 hours
  } else {
    // International long-haul
    return 480 + Math.floor((distanceMiles - 3000) / 500) * 60; // 8+ hours
  }
}

// Helper function to calculate realistic ferry distance
function calculateFerryDistance(startCoords: { lat: number; lng: number }, endCoords: { lat: number; lng: number }): number {
  // Calculate water route distance (slightly longer than straight-line due to water navigation)
  const R = 3959; // Earth's radius in miles
  const dLat = (endCoords.lat - startCoords.lat) * Math.PI / 180;
  const dLng = (endCoords.lng - startCoords.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(startCoords.lat * Math.PI / 180) * Math.cos(endCoords.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineDistance = R * c;
  
  // Add water route factor (ferries don't go straight, they follow water channels)
  const waterRouteFactor = 1.15; // 15% longer than straight-line
  const distance = straightLineDistance * waterRouteFactor;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

// Helper function to calculate realistic ferry time
function calculateFerryTime(distanceMiles: number): number {
  // Realistic ferry times based on distance (ferries are slower than planes)
  if (distanceMiles <= 5) {
    // Short crossing (e.g., Seattle-Bainbridge)
    return 35; // 35 minutes
  } else if (distanceMiles <= 15) {
    // Medium crossing (e.g., Seattle-Bremerton)
    return 60; // 1 hour
  } else if (distanceMiles <= 30) {
    // Long crossing (e.g., Seattle-Port Townsend)
    return 90; // 1.5 hours
  } else if (distanceMiles <= 50) {
    // Very long crossing (e.g., Seattle-Victoria BC)
    return 150; // 2.5 hours
  } else if (distanceMiles <= 100) {
    // Extended crossing (e.g., Seattle-San Juan Islands)
    return 240; // 4 hours
  } else {
    // Ultra-long crossing (e.g., Seattle-Alaska)
    return 300 + Math.floor((distanceMiles - 100) / 50) * 60; // 5+ hours
  }
}

// Polyline decoder function
function decodePolyline(encoded: string): [number, number][] {
  const poly: [number, number][] = [];
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

    poly.push([lat / 1e5, lng / 1e5]);
  }

  return poly;
}

export const calculateRoute = async (start: string, end: string, transportMode: 'car' | 'ferry' | 'plane' = 'car'): Promise<RouteResponse> => {
  try {
    let profile: string;
    let avoidFeatures: string[] = [];
    
    // Set profile and avoid features based on transport mode
    switch (transportMode) {
      case 'car':
        profile = 'driving-car';
        break;
      case 'ferry':
        profile = 'driving-car'; // Use driving profile for ferry routes
        break;
      case 'plane':
        profile = 'driving-car'; // Use driving profile for plane routes (direct path)
        break;
      default:
        profile = 'driving-car';
    }

    // First, geocode the addresses to get coordinates
    const startCoords = await geocodeAddress(start);
    const endCoords = await geocodeAddress(end);

    // Calculate route using OpenRoute Directions API via local server
    const response = await axios.post(DIRECTIONS_API_URL, {
      profile,
      coordinates: [
        [startCoords.lng, startCoords.lat],
        [endCoords.lng, endCoords.lat]
      ],
      instructions: false,
      geometry: true,
      elevation: false
    });

    if (!response.data.routes || response.data.routes.length === 0) {
      throw new Error(`No ${transportMode} route found. Please check your addresses.`);
    }

    const route = response.data.routes[0];
    const summary = route.summary;
    
    // Debug: Log what we're getting from the API
    console.log('OpenRoute API response:', response.data);
    console.log('Route geometry:', route.geometry);
    
    // Calculate route data based on transport mode
    let distanceMiles: number;
    let durationMinutes: number;
    
    if (transportMode === 'plane') {
      // Use realistic flight distance and time calculations
      distanceMiles = calculatePlaneDistance(startCoords, endCoords);
      durationMinutes = calculatePlaneTime(distanceMiles);
    } else if (transportMode === 'ferry') {
      // Use realistic ferry distance and time calculations
      distanceMiles = calculateFerryDistance(startCoords, endCoords);
      durationMinutes = calculateFerryTime(distanceMiles);
    } else {
      // Car route: use actual route data
      distanceMiles = Math.round(summary.distance * 0.000621371); // Convert meters to miles
      durationMinutes = Math.round(summary.duration / 60); // Convert seconds to minutes
    }

    // Calculate costs
    let cost: { fuel: number; ticket?: number } = { fuel: 0 };
    
    if (transportMode === 'car') {
      const carCost = Math.round(distanceMiles * 0.7 * 100) / 100; // $0.70 per mile
      cost = { fuel: carCost };
    } else if (transportMode === 'ferry') {
      const ticketCost = calculateFerryTicketCost(distanceMiles);
      cost = { fuel: 0, ticket: ticketCost };
    } else if (transportMode === 'plane') {
      const ticketCost = calculateEstimatedFlightCost(distanceMiles);
      cost = { fuel: 0, ticket: ticketCost };
    }

    // Extract coordinates from the route geometry
    let coordinates: [number, number][] = [];
    if (route.geometry && route.geometry.coordinates) {
      // OpenRoute returns coordinates as [lng, lat] arrays, we need [lat, lng]
      coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
    } else if (route.geometry && route.geometry.type === 'LineString' && route.geometry.coordinates) {
      // Handle GeoJSON LineString format
      coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
    } else if (route.geometry && route.geometry.encoded) {
      // Handle encoded polyline format - this gives us the actual driving route!
      const decodedCoords = decodePolyline(route.geometry.encoded);
      coordinates = decodedCoords.map((coord: [number, number]) => [coord[0], coord[1]]);
    } else {
      // Fallback to start and end coordinates if no route geometry
      coordinates = [
        [startCoords.lat, startCoords.lng],
        [endCoords.lat, endCoords.lng]
      ];
    }

    return {
      distance: distanceMiles,
      duration: durationMinutes,
      route: {
        coordinates,
        summary: `Route from ${start} to ${end}`,
        startAddress: start,
        endAddress: end,
        geometry: route.geometry // Pass through the geometry data from OpenRoute API
      },
      cost,
      transportMode
    };
  } catch (error) {
    console.error('Error calculating route:', error);
    throw new Error(`Failed to calculate ${transportMode} route. Please check your addresses.`);
  }
};

// Geocoding function using local server proxy
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  try {
    const response = await axios.get(GEOCODING_API_URL, {
      params: {
        text: address
      }
    });

    if (!response.data.features || response.data.features.length === 0) {
      throw new Error(`Could not geocode address: ${address}`);
    }

    const feature = response.data.features[0];
    return {
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0]
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error(`Failed to geocode address: ${address}`);
  }
} 