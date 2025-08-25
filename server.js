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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('This server proxies OpenRoute API calls to avoid CORS issues');
});
