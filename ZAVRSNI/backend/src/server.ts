import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import apiRouter from './routes/api.js';
import adminRouter from './routes/admin.js';
import historyRouter from './routes/history.js';
import eventsRouter from './routes/events.js';
import { setupWebSocket } from './websocket/index.js';
import { initDatabase, getDatabaseStats, scheduleCleanupJob } from './database/index.js';
import { CORS_ORIGIN } from './config/env.js';
import { startWeatherPolling } from './services/weather/weatherService.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

console.log('\n Initializing database...');
initDatabase();

scheduleCleanupJob();
startWeatherPolling();

app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get('/', (req, res) => {
  const dbStats = getDatabaseStats();
  res.json({
    message: 'Digital Twin Đakovo Backend API',
    version: '1.0.0',
    database: {
      connected: true,
      size_mb: (dbStats.size / 1024 / 1024).toFixed(2),
      tables: dbStats.tables
    },
    endpoints: {
      health: '/api/health',
      locations: '/api/locations',
      data: '/api/data',
      history: '/api/history',
      events: '/api/events',
      admin: '/api/admin'
    }
  });
});
app.use('/api', apiRouter);
app.use('/api/admin', adminRouter);
app.use('/api/history', historyRouter);
app.use('/api/events', eventsRouter);

// Setup WebSocket
setupWebSocket(httpServer);

// Start server
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Digital Twin Đakovo Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`📊 Database ready with ${Object.keys(getDatabaseStats().tables).length} tables\n`);
});
