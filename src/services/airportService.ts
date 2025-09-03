export interface Airport {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  distance: number; // Distance from the input location in miles
}

export interface AirportSearchResponse {
  airports: Airport[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

// Helper function to calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper function to geocode an address using Google Maps API
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    // Check if Google Maps API is available
    if (typeof google === 'undefined' || !google.maps || !google.maps.Geocoder) {
      console.warn('Google Maps API not available, using fallback');
      // Fallback to mock geocoding
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
        'miami': { lat: 25.7617, lng: -80.1918 },
        'atlanta': { lat: 33.7490, lng: -84.3880 },
        'detroit': { lat: 42.3314, lng: -83.0458 },
        'minneapolis': { lat: 44.9778, lng: -93.2650 },
        'cleveland': { lat: 41.4993, lng: -81.6944 },
        'pittsburgh': { lat: 40.4406, lng: -79.9959 },
        'anchorage': { lat: 61.2181, lng: -149.9003 },
        'honolulu': { lat: 21.3099, lng: -157.8581 }
      };

      const normalizedAddress = address.toLowerCase().trim();
      
      for (const [city, coords] of Object.entries(cityCoordinates)) {
        if (normalizedAddress.includes(city) || city.includes(normalizedAddress.split(',')[0])) {
          resolve(coords);
          return;
        }
      }
      
      // Default to NYC if no match found
      resolve({ lat: 40.7128, lng: -74.0060 });
      return;
    }

    // Use Google Maps Geocoder
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng()
        });
      } else {
        console.warn('Google Maps geocoding failed:', status);
        // Fallback to mock geocoding
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
          'miami': { lat: 25.7617, lng: -80.1918 },
          'atlanta': { lat: 33.7490, lng: -84.3880 },
          'detroit': { lat: 42.3314, lng: -83.0458 },
          'minneapolis': { lat: 44.9778, lng: -93.2650 },
          'cleveland': { lat: 41.4993, lng: -81.6944 },
          'pittsburgh': { lat: 40.4406, lng: -79.9959 },
          'anchorage': { lat: 61.2181, lng: -149.9003 },
          'honolulu': { lat: 21.3099, lng: -157.8581 }
        };

        const normalizedAddress = address.toLowerCase().trim();
        
        for (const [city, coords] of Object.entries(cityCoordinates)) {
          if (normalizedAddress.includes(city) || city.includes(normalizedAddress.split(',')[0])) {
            resolve(coords);
            return;
          }
        }
        
        // Default to NYC if no match found
        resolve({ lat: 40.7128, lng: -74.0060 });
      }
    });
  });
};

export const findClosestAirports = async (address: string, limit: number = 3): Promise<AirportSearchResponse> => {
  try {
    // Get coordinates for the input address
    const coords = await geocodeAddress(address);
    
    // Call our backend API to get airports from AeroDataBox
    const response = await fetch('http://localhost:3001/api/airports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude: coords.lat,
        longitude: coords.lng,
        limit: limit,
        radiusKm: 500
      })
    });

    if (!response.ok) {
      throw new Error(`Airport API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the API response to our format
    const airports = data.items.map((airport: any) => ({
      icao: airport.icao,
      iata: airport.iata,
      name: airport.name,
      city: airport.municipalityName,
      country: airport.countryCode,
      latitude: airport.location.lat,
      longitude: airport.location.lon,
      distance: calculateDistance(coords.lat, coords.lng, airport.location.lat, airport.location.lon)
    })).sort((a: Airport, b: Airport) => a.distance - b.distance);

    return {
      airports: airports.slice(0, limit),
      location: {
        latitude: coords.lat,
        longitude: coords.lng,
        address: address
      }
    };
  } catch (error) {
    console.error('Error finding closest airports:', error);
    
    // Try to get coordinates for the address even if airport API fails
    let coords;
    try {
      coords = await geocodeAddress(address);
    } catch (geocodeError) {
      console.error('Geocoding also failed:', geocodeError);
      coords = { lat: 40.7128, lng: -74.0060 }; // Only fallback to NYC if geocoding fails too
    }
    
    // Return mock data as fallback, but use the actual coordinates
    return {
      airports: [
        {
          icao: 'KJFK',
          iata: 'JFK',
          name: 'John F Kennedy International Airport',
          city: 'New York',
          country: 'US',
          latitude: 40.6413,
          longitude: -73.7781,
          distance: calculateDistance(coords.lat, coords.lng, 40.6413, -73.7781)
        },
        {
          icao: 'KLGA',
          iata: 'LGA',
          name: 'LaGuardia Airport',
          city: 'New York',
          country: 'US',
          latitude: 40.7769,
          longitude: -73.8740,
          distance: calculateDistance(coords.lat, coords.lng, 40.7769, -73.8740)
        },
        {
          icao: 'KEWR',
          iata: 'EWR',
          name: 'Newark Liberty International Airport',
          city: 'Newark',
          country: 'US',
          latitude: 40.6895,
          longitude: -74.1745,
          distance: calculateDistance(coords.lat, coords.lng, 40.6895, -74.1745)
        }
      ],
      location: {
        latitude: coords.lat,
        longitude: coords.lng,
        address: address
      }
    };
  }
};

// Flight information interface
export interface FlightInfo {
  distance: number; // in miles
  duration: number; // in minutes
  departureAirport: Airport;
  arrivalAirport: Airport;
  cost?: FlightCostInfo; // Optional flight cost information
}

// Flight cost information interface
export interface FlightCostInfo {
  cheapest: number;
  average: number;
  mostExpensive: number;
  currency: string;
  offers: FlightOffer[];
}

// Individual flight offer interface
export interface FlightOffer {
  price: number;
  currency: string;
  airline: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
}

// Calculate flight time and distance between two airports
export const calculateFlightBetweenAirports = async (
  startAirport: Airport, 
  endAirport: Airport
): Promise<FlightInfo> => {
  try {
    // Calculate great circle distance between airports
    const distance = calculateDistance(
      startAirport.latitude, 
      startAirport.longitude, 
      endAirport.latitude, 
      endAirport.longitude
    );

    // Calculate flight time using realistic aviation algorithms
    const duration = calculateFlightTime(distance);

    // Fetch flight costs from Amadeus API
    const costInfo = await fetchFlightCosts(startAirport, endAirport);

    return {
      distance: Math.round(distance),
      duration: Math.round(duration),
      departureAirport: startAirport,
      arrivalAirport: endAirport,
      cost: costInfo || undefined
    };
  } catch (error) {
    console.error('Error calculating flight between airports:', error);
    throw error;
  }
};

// Helper function to calculate realistic flight time
const calculateFlightTime = (distanceMiles: number): number => {
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
  const cruiseTime = (distanceMiles / cruisingSpeed) * 60; // Convert to minutes
  
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

// Fetch flight costs from Amadeus API
export const fetchFlightCosts = async (
  departureAirport: Airport,
  arrivalAirport: Airport
): Promise<FlightCostInfo | null> => {
  try {
    // Use tomorrow's date for flight search
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const departureDate = tomorrow.toISOString().split('T')[0];

    const response = await fetch('http://localhost:3001/api/flight-offers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: departureAirport.iata,
        destination: arrivalAirport.iata,
        departureDate: departureDate,
        adults: 1
      })
    });

    if (!response.ok) {
      console.warn('Flight offers API request failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.warn('No flight offers found');
      return null;
    }

    // Process flight offers
    const offers: FlightOffer[] = data.data.map((offer: any) => {
      let price = parseFloat(offer.price.total);
      const currency = offer.price.currency;
      const itinerary = offer.itineraries[0];
      const segments = itinerary.segments;
      
      // Convert EUR to USD if needed (approximate rate: 1 EUR = 1.08 USD)
      if (currency === 'EUR') {
        price = price * 1.08;
      }
      
      return {
        price: price,
        currency: '$', // Always display in USD with $ symbol
        airline: segments[0].carrierCode,
        departureTime: segments[0].departure.at,
        arrivalTime: segments[segments.length - 1].arrival.at,
        duration: itinerary.duration,
        stops: segments.length - 1
      };
    });

    // Calculate price statistics
    const prices = offers.map(offer => offer.price);
    const cheapest = Math.min(...prices);
    const mostExpensive = Math.max(...prices);
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    return {
      cheapest: Math.round(cheapest),
      average: Math.round(average),
      mostExpensive: Math.round(mostExpensive),
      currency: offers[0]?.currency || 'USD',
      offers: offers.slice(0, 5) // Limit to 5 offers
    };
  } catch (error) {
    console.error('Error fetching flight costs:', error);
    return null;
  }
};
