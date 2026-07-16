import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { generateAllData } from '../services/simulation/dataGenerator.js';
import { saveSensorReadings } from '../database/index.js';

// Track if we should log performance info
let saveCount = 0;

export const setupWebSocket = (httpServer: HTTPServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Send initial data immediately
    const initialData = generateAllData();
    socket.emit('city-data', initialData);
    
    // Save to database (batch insert for all sensors)
    saveDataToDatabase(initialData);

    // Send updates every 3 seconds
    const interval = setInterval(() => {
      const data = generateAllData();
      socket.emit('city-data', data);
      
      // Save to database
      saveDataToDatabase(data);
    }, 3000);

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      clearInterval(interval);
    });

    socket.on('request-data', () => {
      const data = generateAllData();
      socket.emit('city-data', data);
    });
  });

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
