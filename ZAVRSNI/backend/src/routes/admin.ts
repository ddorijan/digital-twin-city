import { Router, Request, Response } from 'express';
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

// Auth routes (no middleware needed)
router.post('/login', login);
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
    
    // Validation
    if (!sensor.id || !sensor.name || !sensor.lat || !sensor.lng || !sensor.type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
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
