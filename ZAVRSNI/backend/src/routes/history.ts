import express from 'express';
import {
  getSensorReadings,
  getLatestReading,
  getReadingsByType,
  getAggregatedReadings,
  getSensorStats,
  getReadingCount
} from '../database/index.js';

const router = express.Router();

/**
 * GET /api/history/sensor/:sensorId
 * Get historical data for a specific sensor
 */
router.get('/sensor/:sensorId', (req, res) => {
  try {
    const { sensorId } = req.params;
    const { from, to, limit, aggregation } = req.query;
    
    // Default to last 24 hours if not specified
    const now = Date.now();
    const fromTimestamp = from ? parseInt(from as string) : Math.floor(now / 1000) - 86400;
    const toTimestamp = to ? parseInt(to as string) : Math.floor(now / 1000);
    const maxLimit = limit ? parseInt(limit as string) : 1000;
    
    // If time range is > 7 days, use aggregated data
    const daysDiff = (toTimestamp - fromTimestamp) / 86400;
    
    let data;
    if (aggregation === '5min' || (daysDiff > 7 && daysDiff <= 30)) {
      data = getAggregatedReadings(sensorId, fromTimestamp, toTimestamp, '5min');
    } else if (aggregation === 'hourly' || daysDiff > 30) {
      data = getAggregatedReadings(sensorId, fromTimestamp, toTimestamp, 'hourly');
    } else {
      data = getSensorReadings(sensorId, fromTimestamp, toTimestamp, maxLimit);
    }
    
    res.json({
      sensor_id: sensorId,
      from: fromTimestamp,
      to: toTimestamp,
      count: data.length,
      aggregation: daysDiff > 30 ? 'hourly' : daysDiff > 7 ? '5min' : 'raw',
      data
    });
  } catch (error) {
    console.error('Error fetching sensor history:', error);
    res.status(500).json({ error: 'Failed to fetch sensor history' });
  }
});

/**
 * GET /api/history/sensor/:sensorId/latest
 * Get latest reading for a sensor
 */
router.get('/sensor/:sensorId/latest', (req, res) => {
  try {
    const { sensorId } = req.params;
    const data = getLatestReading(sensorId);
    
    if (!data) {
      return res.status(404).json({ error: 'No data found for this sensor' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching latest reading:', error);
    res.status(500).json({ error: 'Failed to fetch latest reading' });
  }
});

/**
 * GET /api/history/type/:sensorType
 * Get historical data for all sensors of a specific type
 */
router.get('/type/:sensorType', (req, res) => {
  try {
    const { sensorType } = req.params;
    const { from, to, limit } = req.query;
    
    const now = Date.now();
    const fromTimestamp = from ? parseInt(from as string) : Math.floor(now / 1000) - 86400;
    const toTimestamp = to ? parseInt(to as string) : Math.floor(now / 1000);
    const maxLimit = limit ? parseInt(limit as string) : 5000;
    
    const data = getReadingsByType(sensorType, fromTimestamp, toTimestamp, maxLimit);
    
    res.json({
      sensor_type: sensorType,
      from: fromTimestamp,
      to: toTimestamp,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Error fetching type history:', error);
    res.status(500).json({ error: 'Failed to fetch type history' });
  }
});

/**
 * GET /api/history/stats
 * Get overall statistics about stored data
 */
router.get('/stats', (req, res) => {
  try {
    const stats = getSensorStats();
    const totalReadings = getReadingCount();
    
    res.json({
      total_readings: totalReadings,
      by_type: stats,
      storage_info: {
        raw_data_retention_days: 7,
        aggregated_5min_retention_days: 30,
        aggregated_hourly_retention_days: 90
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/history/comparison
 * Compare data between two time periods (e.g., today vs yesterday)
 */
router.get('/comparison', (req, res) => {
  try {
    const { sensorId, period1Start, period1End, period2Start, period2End } = req.query;
    
    if (!sensorId || !period1Start || !period1End || !period2Start || !period2End) {
      return res.status(400).json({ 
        error: 'Missing required parameters: sensorId, period1Start, period1End, period2Start, period2End' 
      });
    }
    
    const period1Data = getSensorReadings(
      sensorId as string,
      parseInt(period1Start as string),
      parseInt(period1End as string),
      10000
    );
    
    const period2Data = getSensorReadings(
      sensorId as string,
      parseInt(period2Start as string),
      parseInt(period2End as string),
      10000
    );
    
    res.json({
      sensor_id: sensorId,
      period1: {
        from: period1Start,
        to: period1End,
        count: period1Data.length,
        data: period1Data
      },
      period2: {
        from: period2Start,
        to: period2End,
        count: period2Data.length,
        data: period2Data
      }
    });
  } catch (error) {
    console.error('Error fetching comparison:', error);
    res.status(500).json({ error: 'Failed to fetch comparison data' });
  }
});

export default router;
