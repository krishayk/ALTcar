import { RouteRequest, RouteResponse } from '../types';

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

// Helper function to calculate great-circle distance using Haversine formula
const calculateGreatCircleDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper function to convert degrees to radians
const toRadians = (degrees: number): number => {
  return degrees * Math.PI / 180;
};

// Helper function to convert radians to degrees
const toDegrees = (radians: number): number => {
  return radians * 180 / Math.PI;
};

// Realistic plane time and distance calculation using aviation algorithms
const calculatePlaneDistance = (startLat: number, startLng: number, endLat: number, endLng: number): number => {
  // Calculate great-circle distance
  const greatCircleDistance = calculateGreatCircleDistance(startLat, startLng, endLat, endLng);
  
  // Route adjustment: Air traffic control, weather systems, and air corridors add 5-10%
  const routeAdjustmentFactor = 1 + (Math.random() * 0.05 + 0.05); // 5-10% additional distance
  
  return Math.round(greatCircleDistance * routeAdjustmentFactor);
};

const calculatePlaneTime = (distance: number): number => {
  // Aircraft specifications (average commercial aircraft)
  const cruisingSpeed = 500; // mph (typical cruising speed)
  const climbTime = 18; // minutes for takeoff and climb
  const descentTime = 17; // minutes for descent and landing
  
  // Ground time calculations
  const taxiOutTime = 12; // minutes to taxi from gate to runway
  const taxiInTime = 8; // minutes to taxi from runway to gate
  
  // Wind factor: Headwinds/tailwinds can affect flight time by ±15%
  const windFactor = 1 + (Math.random() * 0.3 - 0.15); // ±15% time variation
  
  // Delay buffer for air traffic control, weather, maintenance (5-20 minutes)
  const delayBuffer = Math.random() * 15 + 5;
  
  // Calculate cruise time
  const cruiseTime = (distance / cruisingSpeed) * 60; // Convert to minutes
  
  // Total flight time
  const totalTime = Math.round(
    climbTime + 
    descentTime + 
    taxiOutTime + 
    taxiInTime + 
    (cruiseTime * windFactor) + 
    delayBuffer
  );
  
  return totalTime;
};

// Realistic cruise/ferry time and distance calculation using maritime algorithms
const calculateFerryDistance = (startLat: number, startLng: number, endLat: number, endLng: number): number => {
  // Calculate great-circle distance
  const greatCircleDistance = calculateGreatCircleDistance(startLat, startLng, endLat, endLng);
  
  // Maritime route adjustment: Ships follow shipping lanes and avoid obstacles
  // This adds 15-25% to the great-circle distance
  const maritimeRouteFactor = 1 + (Math.random() * 0.1 + 0.15); // 15-25% additional distance
  
  // Convert to nautical miles for maritime calculations
  const nauticalMiles = greatCircleDistance * 0.868976; // Convert miles to nautical miles
  
  return Math.round(nauticalMiles * maritimeRouteFactor * 1.15078); // Convert back to miles
};

const calculateFerryTime = (distance: number): number => {
  // Vessel specifications (realistic ferry speed)
  const cruisingSpeed = 35; // knots (modern high-speed ferries can do 30-40 knots)
  
  // Convert distance back to nautical miles for maritime calculations
  const nauticalMiles = distance * 0.868976;
  
  // Calculate sailing time
  const sailingTimeHours = nauticalMiles / cruisingSpeed;
  const sailingTimeMinutes = sailingTimeHours * 60;
  
  // Port operations time (much more realistic for ferries)
  const departurePreparation = 15; // minutes for departure procedures (ferries are faster than cruise ships)
  const arrivalProcedures = 10; // minutes for arrival and docking (ferries dock much faster)
  
  // Weather and sea conditions factor (reduced for ferries - they're more reliable)
  const seaConditionsFactor = 1 + (Math.random() * 0.1 + 0.05); // 5-15% additional time (was 10-30%)
  
  // Total voyage time
  const totalTime = Math.round(
    departurePreparation + 
    arrivalProcedures + 
    (sailingTimeMinutes * seaConditionsFactor)
  );
  
  return totalTime;
};

// Generate realistic route coordinates between two points
function generateRouteCoordinates(startLat: number, startLng: number, endLat: number, endLng: number, mode: 'car' | 'ferry' | 'plane'): [number, number][] {
  if (mode === 'plane') {
    // Plane: straight line
    return [
      [startLat, startLng],
      [endLat, endLng]
    ];
  } else if (mode === 'ferry') {
    // Ferry: curved path
    const midLat = (startLat + endLat) / 2;
    const midLng = (startLng + endLng) / 2;
    const curveOffset = 0.1; // Curve intensity
    
    const controlLat = midLat + (Math.random() - 0.5) * curveOffset;
    const controlLng = midLng + (Math.random() - 0.5) * curveOffset;
    
    // Generate curved path with multiple points
    const points: [number, number][] = [];
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const u = 1 - t;
      
      // Quadratic Bezier curve
      const lat = u * u * startLat + 2 * u * t * controlLat + t * t * endLat;
      const lng = u * u * startLng + 2 * u * t * controlLng + t * t * endLng;
      
      points.push([lat, lng]);
    }
    
    return points;
  } else {
    // Car: realistic road-like path with some curves
    const points: [number, number][] = [];
    const steps = 15;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const u = 1 - t;
      
      // Add some realistic road curves
      const roadCurve = Math.sin(t * Math.PI * 2) * 0.01;
      
      const lat = startLat + (endLat - startLat) * t + roadCurve;
      const lng = startLng + (endLng - startLng) * t + roadCurve;
      
      points.push([lat, lng]);
    }
    
    return points;
  }
}

export const calculateRoute = async (start: string, end: string, transportMode: 'car' | 'ferry' | 'plane' = 'car'): Promise<RouteResponse> => {
  try {
    // Simulate API delay for realism
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Get coordinates for start and end points
    const startCoords = await geocodeAddress(start);
    const endCoords = await geocodeAddress(end);

    let distanceMiles: number;
    let durationMinutes: number;
    let finalCoordinates: [number, number][];
    
    if (transportMode === 'plane') {
      // Use realistic flight distance and time calculations
      distanceMiles = calculatePlaneDistance(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng);
      durationMinutes = calculatePlaneTime(distanceMiles);
      finalCoordinates = generateRouteCoordinates(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng, 'plane');
    } else if (transportMode === 'ferry') {
      // Use realistic ferry distance and time calculations
      distanceMiles = calculateFerryDistance(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng);
      durationMinutes = calculateFerryTime(distanceMiles);
      finalCoordinates = generateRouteCoordinates(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng, 'ferry');
    } else {
      // Car route: realistic road calculations
      const greatCircleDistance = calculateGreatCircleDistance(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng);
      
      // Road routes are typically 10-30% longer than great circle due to road networks
      const roadFactor = 1 + (Math.random() * 0.2 + 0.1); // 10-30% additional distance
      distanceMiles = Math.round(greatCircleDistance * roadFactor);
      
      // Realistic driving time: assume average speed of 45 mph in cities, 65 mph on highways
      const avgSpeed = 45 + Math.random() * 20; // 45-65 mph
      durationMinutes = Math.round((distanceMiles / avgSpeed) * 60);
      
      finalCoordinates = generateRouteCoordinates(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng, 'car');
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

    return {
      distance: distanceMiles,
      duration: durationMinutes,
      route: {
        coordinates: finalCoordinates,
        summary: `Route from ${start} to ${end}`,
        startAddress: start,
        endAddress: end,
        geometry: {
          type: 'LineString',
          coordinates: finalCoordinates.map(coord => [coord[1], coord[0]]) // Convert to [lng, lat] format
        }
      },
      cost,
      transportMode
    };
  } catch (error) {
    console.error('Error calculating route:', error);
    throw new Error(`Failed to calculate ${transportMode} route. Please check your addresses.`);
  }
};

// Mock geocoding function that returns realistic coordinates for common cities
function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve) => {
    // Simulate API delay for realism
    setTimeout(() => {
      const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
        'new york': { lat: 40.7128, lng: -74.0060 },
        'los angeles': { lat: 34.0522, lng: -118.2437 },
        'chicago': { lat: 41.8781, lng: -87.6298 },
        'houston': { lat: 29.7604, lng: -95.3698 },
        'phoenix': { lat: 33.4484, lng: -112.0740 },
        'philadelphia': { lat: 39.9526, lng: -75.1652 },
        'san antonio': { lat: 29.4241, lng: -98.4936 },
        'san diego': { lat: 32.7157, lng: -117.1611 },
        'dallas': { lat: 32.7767, lng: -96.7970 },
        'san jose': { lat: 37.3382, lng: -121.8863 },
        'austin': { lat: 30.2672, lng: -97.7431 },
        'jacksonville': { lat: 30.3322, lng: -81.6557 },
        'fort worth': { lat: 32.7555, lng: -97.3308 },
        'columbus': { lat: 39.9612, lng: -82.9988 },
        'charlotte': { lat: 35.2271, lng: -80.8431 },
        'san francisco': { lat: 37.7749, lng: -122.4194 },
        'indianapolis': { lat: 39.7684, lng: -86.1581 },
        'seattle': { lat: 47.6062, lng: -122.3321 },
        'denver': { lat: 39.7392, lng: -104.9903 },
        'washington': { lat: 38.9072, lng: -77.0369 },
        'boston': { lat: 42.3601, lng: -71.0589 },
        'el paso': { lat: 31.7619, lng: -106.4850 },
        'nashville': { lat: 36.1627, lng: -86.7816 },
        'detroit': { lat: 42.3314, lng: -83.0458 },
        'oklahoma city': { lat: 35.4676, lng: -97.5164 },
        'portland': { lat: 45.5152, lng: -122.6784 },
        'las vegas': { lat: 36.1699, lng: -115.1398 },
        'memphis': { lat: 35.1495, lng: -90.0490 },
        'louisville': { lat: 38.2527, lng: -85.7585 },
        'baltimore': { lat: 39.2904, lng: -76.6122 },
        'milwaukee': { lat: 43.0389, lng: -87.9065 },
        'albuquerque': { lat: 35.0844, lng: -106.6504 },
        'tucson': { lat: 32.2226, lng: -110.9747 },
        'fresno': { lat: 36.7378, lng: -119.7871 },
        'sacramento': { lat: 38.5816, lng: -121.4944 },
        'atlanta': { lat: 33.7490, lng: -84.3880 },
        'long beach': { lat: 33.7701, lng: -118.1937 },
        'colorado springs': { lat: 38.8339, lng: -104.8214 },
        'raleigh': { lat: 35.7796, lng: -78.6382 },
        'miami': { lat: 25.7617, lng: -80.1918 },
        'omaha': { lat: 41.2565, lng: -95.9345 },
        'oakland': { lat: 37.8044, lng: -122.2711 },
        'minneapolis': { lat: 44.9778, lng: -93.2650 },
        'tulsa': { lat: 36.1540, lng: -95.9928 },
        'cleveland': { lat: 41.4993, lng: -81.6944 },
        'wichita': { lat: 37.6872, lng: -97.3301 },
        'arlington': { lat: 32.7357, lng: -97.1081 },
        'new orleans': { lat: 29.9511, lng: -90.0715 },
        'bakersfield': { lat: 35.3733, lng: -119.0187 },
        'tampa': { lat: 27.9506, lng: -82.4572 },
        'honolulu': { lat: 21.3099, lng: -157.8581 },
        'aurora': { lat: 39.7294, lng: -104.8319 },
        'anaheim': { lat: 33.8366, lng: -117.9143 },
        'santa ana': { lat: 33.7455, lng: -117.8677 },
        'corpus christi': { lat: 27.8006, lng: -97.3964 },
        'riverside': { lat: 33.9533, lng: -117.3962 },
        'lexington': { lat: 32.2226, lng: -84.5037 },
        'stockton': { lat: 37.9577, lng: -121.2908 },
        'henderson': { lat: 36.0395, lng: -114.9817 },
        'saint paul': { lat: 44.9537, lng: -93.0900 },
        'st. paul': { lat: 44.9537, lng: -93.0900 },
        'st louis': { lat: 38.6270, lng: -90.1994 },
        'cincinnati': { lat: 39.1031, lng: -84.5120 },
        'pittsburgh': { lat: 40.4406, lng: -79.9959 },
        'anchorage': { lat: 61.2181, lng: -149.9003 }
      };

      // Normalize the address for matching
      const normalizedAddress = address.toLowerCase().trim();
      
      // Try to find an exact match first
      for (const [city, coords] of Object.entries(cityCoordinates)) {
        if (normalizedAddress.includes(city)) {
          resolve(coords);
          return;
        }
      }
      
      // If no exact match, return NYC coordinates as default
      console.warn(`No coordinates found for "${address}", using NYC as default`);
      resolve({ lat: 40.7128, lng: -74.0060 });
    }, 100);
  });
} 