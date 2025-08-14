const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = 'AIzaSyDDCPnY2orRksw08gpAdHNnBIQ4FqzMsrs';

// Proxy route for Google Directions API
app.get('/api/directions', async (req, res) => {
  try {
    const { origin, destination, mode } = req.query;
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin,
        destination,
        mode,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error proxying directions request:', error);
    res.status(500).json({ error: 'Failed to fetch directions' });
  }
});

// Proxy route for Google Geocoding API
app.get('/api/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error proxying geocode request:', error);
    res.status(500).json({ error: 'Failed to fetch geocode' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('This server proxies Google Maps API calls to avoid CORS issues');
});
