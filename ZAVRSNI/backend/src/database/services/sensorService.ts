import { getDatabase } from '../connection.js';
import type { 
  TrafficData, 
  EnvironmentData, 
  EnergyData, 
  ParkingData,
  TrafficLightData
} from '../../types/index.js';

type SensorReading = TrafficData | EnvironmentData | EnergyData | ParkingData | TrafficLightData;

interface BatchInsertResult {
  inserted: number;
  duration: number;
}

/**
 * Save sensor readings to database using batch insert (much faster!)
 */
export const saveSensorReadings = (readings: SensorReading[], sensorType: string): BatchInsertResult => {
  const startTime = Date.now();
  const db = getDatabase();
  
  // Prepare the insert statement
  const insert = db.prepare(`
    INSERT INTO sensor_readings (sensor_id, sensor_type, timestamp, data)
    VALUES (?, ?, ?, ?)
  `);
  
  // Use a transaction for batch insert (100x faster!)
  const insertMany = db.transaction((items: SensorReading[]) => {
    for (const reading of items) {
      insert.run(
        reading.sensorId,
        sensorType,
        // Store as unix seconds - every query/aggregation/retention cutoff in
        // this file and cleanupService.ts assumes seconds, but `reading.timestamp`
        // is `Date.now()` (milliseconds). Without this conversion, from/to
        // filters never match and old raw rows are never cleaned up.
        Math.floor(reading.timestamp / 1000),
        JSON.stringify(reading)
      );
    }
  });
  
  // Execute the transaction
  insertMany(readings);
  
  const duration = Date.now() - startTime;
  
  return {
    inserted: readings.length,
    duration
  };
};

/**
 * Get sensor readings for a specific sensor and time range
 */
export const getSensorReadings = (
  sensorId: string,
  fromTimestamp: number,
  toTimestamp: number,
  limit: number = 1000
) => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT id, sensor_id, sensor_type, timestamp, data, created_at
    FROM sensor_readings
    WHERE sensor_id = ?
      AND timestamp >= ?
      AND timestamp <= ?
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  
  const rows = stmt.all(sensorId, fromTimestamp, toTimestamp, limit);
  
  return rows.map((row: any) => ({
    ...row,
    data: JSON.parse(row.data)
  }));
};

/**
 * Get latest reading for a sensor
 */
export const getLatestReading = (sensorId: string) => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT id, sensor_id, sensor_type, timestamp, data, created_at
    FROM sensor_readings
    WHERE sensor_id = ?
    ORDER BY timestamp DESC
    LIMIT 1
  `);
  
  const row = stmt.get(sensorId) as any;
  
  if (!row) return null;
  
  return {
    ...row,
    data: JSON.parse(row.data)
  };
};

/**
 * Get readings for all sensors of a specific type within time range
 */
export const getReadingsByType = (
  sensorType: string,
  fromTimestamp: number,
  toTimestamp: number,
  limit: number = 5000
) => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT id, sensor_id, sensor_type, timestamp, data, created_at
    FROM sensor_readings
    WHERE sensor_type = ?
      AND timestamp >= ?
      AND timestamp <= ?
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  
  const rows = stmt.all(sensorType, fromTimestamp, toTimestamp, limit);
  
  return rows.map((row: any) => ({
    ...row,
    data: JSON.parse(row.data)
  }));
};

/**
 * Get aggregated data (for showing trends over longer periods)
 */
export const getAggregatedReadings = (
  sensorId: string,
  fromTimestamp: number,
  toTimestamp: number,
  interval: '5min' | 'hourly' | 'daily' = 'hourly'
) => {
  const db = getDatabase();
  const table = interval === '5min'
    ? 'sensor_readings_5min'
    : interval === 'daily'
      ? 'sensor_readings_daily'
      : 'sensor_readings_hourly';
  
  const stmt = db.prepare(`
    SELECT interval_start as timestamp, avg_value, min_value, max_value, count, data
    FROM ${table}
    WHERE sensor_id = ?
      AND interval_start >= ?
      AND interval_start <= ?
    ORDER BY interval_start DESC
  `);
  
  const rows = stmt.all(sensorId, fromTimestamp, toTimestamp);
  
  return rows.map((row: any) => ({
    ...row,
    data: row.data ? JSON.parse(row.data) : null
  }));
};

/**
 * Get overview statistics for all sensors
 */
export const getSensorStats = () => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT 
      sensor_type,
      COUNT(DISTINCT sensor_id) as sensor_count,
      COUNT(*) as reading_count,
      MIN(timestamp) as first_reading,
      MAX(timestamp) as last_reading
    FROM sensor_readings
    GROUP BY sensor_type
  `);
  
  return stmt.all();
};

/**
 * Delete old raw sensor readings (called by cleanup job)
 */
export const deleteOldReadings = (olderThanTimestamp: number): number => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    DELETE FROM sensor_readings
    WHERE timestamp < ?
  `);
  
  const result = stmt.run(olderThanTimestamp);
  
  return result.changes;
};

/**
 * Get count of readings in database
 */
export const getReadingCount = (): number => {
  const db = getDatabase();
  const result = db.prepare('SELECT COUNT(*) as count FROM sensor_readings').get() as { count: number };
  return result.count;
};
