const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// OpenRoute API configuration
const OPENROUTE_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImZkM2MxYjJjY2E1OTRjMDA4N2UzZTc4ZjQyNmJiOWRiIiwiaCI6Im11cm11cjY0In0=';
const OPENROUTE_BASE_URL = 'https://api.openrouteservice.org';

// AeroDataBox API configuration
const AERODATABOX_API_KEY = 'bf81a21606mshed33dbfe68ade4ep1d54fbjsn6c5398775ec2';
const AERODATABOX_BASE_URL = 'https://aerodatabox.p.rapidapi.com';

// Amadeus API configuration
const AMADEUS_API_KEY = '80QiX1WZFwFhpXPO2IV2IhJW9WOWnE2G';
const AMADEUS_API_SECRET = '8rsmNSDrEhKl8HAy';
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';

// Function to get Amadeus access token
const getAmadeusToken = async () => {
  try {
    const response = await axios.post(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, 
      `grant_type=client_credentials&client_id=${AMADEUS_API_KEY}&client_secret=${AMADEUS_API_SECRET}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Amadeus token:', error);
    throw error;
  }
};

// Proxy route for OpenRoute Geocoding API
app.get('/api/geocode', async (req, res) => {
  try {
    const { text } = req.query;
    
    const response = await axios.get(`${OPENROUTE_BASE_URL}/geocode/search`, {
      params: {
        text,
        size: 1
      },
      headers: {
        'Authorization': `Bearer ${OPENROUTE_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error proxying geocode request:', error);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    res.status(500).json({ 
      error: 'Failed to fetch geocode',
      details: error.response?.data || error.message
    });
  }
});

// Proxy route for OpenRoute Directions API
app.post('/api/directions', async (req, res) => {
  try {
    const { profile, coordinates, instructions, geometry, elevation, format } = req.body;
    
    // Always request encoded polyline for actual route path
    const response = await axios.post(`${OPENROUTE_BASE_URL}/v2/directions/${profile}/json`, {
      coordinates,
      instructions: instructions || false,
      geometry: 'encodedpolyline', // Request encoded polyline for detailed route
      elevation: elevation || false
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error proxying directions request:', error);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    res.status(500).json({ 
      error: 'Failed to fetch directions',
      details: error.response?.data || error.message
    });
  }
});

// Proxy route for AeroDataBox Airports API
app.post('/api/airports', async (req, res) => {
  try {
    const { latitude, longitude, limit = 10, radiusKm = 500 } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    const response = await axios.get(`${AERODATABOX_BASE_URL}/airports/search/location`, {
      params: {
        lat: latitude,
        lon: longitude,
        radiusKm: radiusKm,
        limit: limit
      },
      headers: {
        'X-RapidAPI-Key': AERODATABOX_API_KEY,
        'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error proxying airports request:', error);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    res.status(500).json({ 
      error: 'Failed to fetch airports',
      details: error.response?.data || error.message
    });
  }
});

// Proxy route for Amadeus Flight Offers API
app.post('/api/flight-offers', async (req, res) => {
  try {
    const { origin, destination, departureDate, adults = 1 } = req.body;
    
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ 
        error: 'Origin, destination, and departure date are required' 
      });
    }

    // Get access token
    const accessToken = await getAmadeusToken();

    // Search for flight offers
    const response = await axios.get(`${AMADEUS_BASE_URL}/v2/shopping/flight-offers`, {
      params: {
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate: departureDate,
        adults: adults,
        max: 5 // Limit to 5 offers
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error proxying flight offers request:', error);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    res.status(500).json({ 
      error: 'Failed to fetch flight offers',
      details: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('This server proxies OpenRoute API calls to avoid CORS issues');
  console.log('This server also proxies AeroDataBox API calls for airport data');
  console.log('This server also proxies Amadeus API calls for flight pricing');
});
