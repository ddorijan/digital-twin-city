import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { SensorLocation } from '../../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SENSORS_FILE = join(__dirname, '../../../data/sensors.json');

// In-memory cache to avoid re-reading/parsing the file on every simulation
// tick (it was being read up to 5x per connected client every 3 seconds).
let cachedSensors: SensorLocation[] | null = null;

// Load sensors from JSON file (cached after first read)
export const loadSensors = (): SensorLocation[] => {
  if (cachedSensors) return cachedSensors;

  try {
    if (!existsSync(SENSORS_FILE)) {
      console.warn('Sensors file not found, returning empty array');
      cachedSensors = [];
      return cachedSensors;
    }
    const data = readFileSync(SENSORS_FILE, 'utf-8');
    cachedSensors = JSON.parse(data);
    return cachedSensors!;
  } catch (error) {
    console.error('Error loading sensors:', error);
    cachedSensors = [];
    return cachedSensors;
  }
};

// Save sensors to JSON file and refresh the cache
export const saveSensors = (sensors: SensorLocation[]): boolean => {
  try {
    writeFileSync(SENSORS_FILE, JSON.stringify(sensors, null, 2), 'utf-8');
    cachedSensors = sensors;
    console.log('✅ Sensors saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving sensors:', error);
    return false;
  }
};

// Get all sensors
export const getAllSensors = (): SensorLocation[] => {
  return loadSensors();
};

// Get sensor by ID
export const getSensorById = (id: string): SensorLocation | undefined => {
  const sensors = loadSensors();
  return sensors.find(s => s.id === id);
};

// Add new sensor
export const addSensor = (sensor: SensorLocation): boolean => {
  const sensors = loadSensors();
  
  // Check if sensor with same ID exists
  if (sensors.find(s => s.id === sensor.id)) {
    console.error('Sensor with this ID already exists');
    return false;
  }
  
  sensors.push(sensor);
  return saveSensors(sensors);
};

// Update sensor
export const updateSensor = (id: string, updatedSensor: SensorLocation): boolean => {
  const sensors = loadSensors();
  const index = sensors.findIndex(s => s.id === id);
  
  if (index === -1) {
    console.error('Sensor not found');
    return false;
  }
  
  sensors[index] = { ...updatedSensor, id }; // Keep original ID
  return saveSensors(sensors);
};

// Delete sensor
export const deleteSensor = (id: string): boolean => {
  const sensors = loadSensors();
  const filtered = sensors.filter(s => s.id !== id);
  
  if (filtered.length === sensors.length) {
    console.error('Sensor not found');
    return false;
  }
  
  return saveSensors(filtered);
};
