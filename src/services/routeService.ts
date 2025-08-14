import { RouteRequest, RouteResponse } from '../types';

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = 'AIzaSyDDCPnY2orRksw08gpAdHNnBIQ4FqzMsrs';

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
    // For now, we'll use estimated calculations since direct API calls have CORS issues
    // The actual route calculation will be done in the RouteMap component using Google Maps JavaScript API
    
    let distanceMiles: number;
    let durationMinutes: number;
    let cost: { fuel: number; ticket?: number };
    let coordinates: [number, number][];

    if (transportMode === 'car') {
      // Estimate based on straight-line distance (will be replaced by actual Google Maps data)
      const estimatedDistance = 50; // This will be replaced by actual Google Maps data
      distanceMiles = estimatedDistance;
      durationMinutes = Math.round(estimatedDistance * 1.5); // Rough estimate: 1.5 min per mile
      
      // Calculate fuel cost (assuming 25 mpg and $3.75/gallon)
      const fuelCost = Math.round((distanceMiles / 25) * 3.75 * 100) / 100;
      cost = { fuel: fuelCost };

      // Placeholder coordinates - will be replaced by actual route data
      coordinates = [
        [37.7749, -122.4194], // San Francisco coordinates as placeholder
        [37.7021, -121.9358]  // Dublin coordinates as placeholder
      ];
    } else if (transportMode === 'ferry') {
      // Estimate based on straight-line distance
      const estimatedDistance = 30; // This will be replaced by actual Google Maps data
      distanceMiles = estimatedDistance;
      durationMinutes = Math.round(estimatedDistance * 2.5); // Ferries are slower
      
      const ticketCost = Math.round(calculateFerryTicketCost(estimatedDistance, [37.7749, -122.4194], [37.7021, -121.9358]));
      cost = { fuel: 0, ticket: ticketCost };

      coordinates = [
        [37.7749, -122.4194], // San Francisco coordinates as placeholder
        [37.7021, -121.9358]  // Dublin coordinates as placeholder
      ];
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
      
      coordinates = [
        [37.7749, -122.4194], // San Francisco coordinates as placeholder
        [37.7021, -121.9358]  // Dublin coordinates as placeholder
      ];
    } else {
      throw new Error('Invalid transport mode');
    }

    return {
      distance: distanceMiles,
      duration: durationMinutes,
      route: {
        coordinates: coordinates,
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