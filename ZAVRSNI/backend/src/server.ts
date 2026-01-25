import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import apiRouter from './routes/api.js';
import { setupWebSocket } from './websocket/index.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Digital Twin Đakovo Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      locations: '/api/locations',
      data: '/api/data'
    }
  });
});
app.use('/api', apiRouter);

// Setup WebSocket
setupWebSocket(httpServer);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Digital Twin Đakovo Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
});
