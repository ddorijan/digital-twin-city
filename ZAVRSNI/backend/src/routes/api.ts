import express from 'express';
import { getSensorLocations } from '../services/simulation/locations.js';
import { generateAllData } from '../services/simulation/dataGenerator.js';

const router = express.Router();

// Get all sensor locations
router.get('/locations', (req, res) => {
  res.json(getSensorLocations()); // Load fresh data
});

// Get current city data snapshot
router.get('/data', (req, res) => {
  const data = generateAllData();
  res.json(data);
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    message: 'Digital Twin Đakovo API is running'
  });
});

export default router;
