import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { generateAllData } from '../services/simulation/dataGenerator.js';
import { evaluateAlerts } from '../services/simulation/alertRules.js';
import { saveSensorReadings } from '../database/index.js';
import { CORS_ORIGIN } from '../config/env.js';

// Track if we should log performance info
let saveCount = 0;

const TICK_INTERVAL_MS = 3000;

let ioInstance: SocketIOServer | null = null;

/** Lets REST routes (e.g. city events) broadcast to every connected client. */
export const getIO = (): SocketIOServer | null => ioInstance;

export const setupWebSocket = (httpServer: HTTPServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: CORS_ORIGIN,
      methods: ['GET', 'POST']
    }
  });
  ioInstance = io;

  // Single authoritative simulation state shared by every connected client -
  // a digital twin must have one ground truth, not one per socket.
  let latestData = generateAllData();
  saveDataToDatabase(latestData);

  const tick = () => {
    latestData = generateAllData();
    io.emit('city-data', latestData);
    saveDataToDatabase(latestData);

    const newAlerts = evaluateAlerts(latestData);
    if (newAlerts.length > 0) io.emit('city-alert', newAlerts);
  };
  const interval = setInterval(tick, TICK_INTERVAL_MS);

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.emit('city-data', latestData);

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });

    socket.on('request-data', () => {
      socket.emit('city-data', latestData);
    });
  });

  process.on('SIGINT', () => clearInterval(interval));
  process.on('SIGTERM', () => clearInterval(interval));

  return io;
};

/**
 * Save generated data to database using batch inserts
 */
function saveDataToDatabase(data: any) {
  try {
    const startTime = Date.now();
    let totalInserted = 0;
    
    // Save traffic data
    if (data.traffic && data.traffic.length > 0) {
      const result = saveSensorReadings(data.traffic, 'traffic');
      totalInserted += result.inserted;
    }
    
    // Save environment data
    if (data.environment && data.environment.length > 0) {
      const result = saveSensorReadings(data.environment, 'environment');
      totalInserted += result.inserted;
    }
    
    // Save energy data
    if (data.energy && data.energy.length > 0) {
      const result = saveSensorReadings(data.energy, 'energy');
      totalInserted += result.inserted;
    }
    
    // Save parking data
    if (data.parking && data.parking.length > 0) {
      const result = saveSensorReadings(data.parking, 'parking');
      totalInserted += result.inserted;
    }
    
    // Save traffic light data
    if (data.trafficLights && data.trafficLights.length > 0) {
      const result = saveSensorReadings(data.trafficLights, 'traffic-light');
      totalInserted += result.inserted;
    }
    
    const duration = Date.now() - startTime;
    saveCount++;
    
    // Log performance every 20 saves (every minute)
    if (saveCount % 20 === 0) {
      console.log(`💾 Saved ${totalInserted} sensor readings to database in ${duration}ms`);
    }
  } catch (error) {
    console.error('❌ Error saving data to database:', error);
  }
}
