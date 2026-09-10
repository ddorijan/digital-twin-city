import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware, login, logout } from '../middleware/auth.js';
import {
  getAllSensors,
  getSensorById,
  addSensor,
  updateSensor,
  deleteSensor
} from '../services/storage/sensorStorage.js';
import { getDatabaseStats, runCleanupNow, getSensorStats, getReadingCount } from '../database/index.js';
import type { SensorLocation } from '../types/index.js';

const router = Router();

const SENSOR_TYPES = new Set(['traffic', 'environment', 'energy', 'parking', 'traffic-light']);

// Reject malformed sensor payloads before they reach storage/DB
const validateSensor = (body: any): string | null => {
  if (!body || typeof body !== 'object') return 'Invalid request body';
  if (typeof body.id !== 'string' || !body.id.trim()) return 'id is required';
  if (typeof body.name !== 'string' || !body.name.trim()) return 'name is required';
  if (typeof body.lat !== 'number' || !Number.isFinite(body.lat) || body.lat < -90 || body.lat > 90) {
    return 'lat must be a finite number between -90 and 90';
  }
  if (typeof body.lng !== 'number' || !Number.isFinite(body.lng) || body.lng < -180 || body.lng > 180) {
    return 'lng must be a finite number between -180 and 180';
  }
  if (typeof body.type !== 'string' || !SENSOR_TYPES.has(body.type)) {
    return `type must be one of: ${[...SENSOR_TYPES].join(', ')}`;
  }
  return null;
};

// Limit brute-force attempts against the admin password
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later' }
});

// Auth routes (no middleware needed)
router.post('/login', loginLimiter, login);
router.post('/logout', logout);

// Protected admin routes
router.get('/sensors', authMiddleware, (req: Request, res: Response) => {
  try {
    const sensors = getAllSensors();
    res.json({
      success: true,
      data: sensors,
      count: sensors.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sensors'
    });
  }
});

router.get('/sensors/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const sensor = getSensorById(req.params.id);
    if (sensor) {
      res.json({
        success: true,
        data: sensor
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Sensor not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sensor'
    });
  }
});

router.post('/sensors', authMiddleware, (req: Request, res: Response) => {
  try {
    const sensor: SensorLocation = req.body;

    const validationError = validateSensor(sensor);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }
    
    const success = addSensor(sensor);
    if (success) {
      res.status(201).json({
        success: true,
        message: 'Sensor added successfully',
        data: sensor
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Sensor with this ID already exists'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding sensor'
    });
  }
});

router.put('/sensors/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const sensor: SensorLocation = req.body;

    const validationError = validateSensor(sensor);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const success = updateSensor(req.params.id, sensor);
    
    if (success) {
      res.json({
        success: true,
        message: 'Sensor updated successfully',
        data: sensor
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Sensor not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating sensor'
    });
  }
});

router.delete('/sensors/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const success = deleteSensor(req.params.id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Sensor deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Sensor not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting sensor'
    });
  }
});

// Database management routes
router.get('/database/stats', authMiddleware, (req: Request, res: Response) => {
  try {
    const dbStats = getDatabaseStats();
    const sensorStats = getSensorStats();
    const totalReadings = getReadingCount();
    
    res.json({
      success: true,
      data: {
        file: dbStats.filepath,
        size_bytes: dbStats.size,
        size_mb: (dbStats.size / 1024 / 1024).toFixed(2),
        tables: dbStats.tables,
        sensor_stats: sensorStats,
        total_readings: totalReadings
      }
    });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching database statistics'
    });
  }
});

router.post('/database/cleanup', authMiddleware, async (req: Request, res: Response) => {
  try {
    console.log('🧹 Manual cleanup triggered by admin');
    await runCleanupNow();
    
    const dbStats = getDatabaseStats();
    
    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      data: {
        size_mb: (dbStats.size / 1024 / 1024).toFixed(2),
        tables: dbStats.tables
      }
    });
  } catch (error) {
    console.error('Error running cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Error running database cleanup'
    });
  }
});

export default router;
