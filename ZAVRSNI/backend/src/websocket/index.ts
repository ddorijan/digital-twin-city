import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { generateAllData } from '../services/simulation/dataGenerator.js';

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

    // Send updates every 3 seconds
    const interval = setInterval(() => {
      const data = generateAllData();
      socket.emit('city-data', data);
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
