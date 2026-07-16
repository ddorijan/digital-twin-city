import { getAllSensors } from '../storage/sensorStorage.js';

// Load sensors from JSON file dynamically
export const getSensorLocations = () => getAllSensors();
