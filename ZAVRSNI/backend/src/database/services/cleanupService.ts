import cron from 'node-cron';
import { getDatabase, vacuumDatabase, getDatabaseStats } from '../connection.js';
import { deleteOldReadings } from './sensorService.js';
import { deleteOldVehiclePositions } from './vehicleService.js';
import { getRetentionPolicy } from '../../config/retention.js';
import { getValueForAggregation } from '../schema.js';

/**
 * Aggregate raw sensor data into 5-minute intervals
 */
export const aggregateToFiveMinutes = (): number => {
  console.log('📊 Aggregating data to 5-minute intervals...');
  const db = getDatabase();
  const policy = getRetentionPolicy();
  
  // Calculate timestamp for 7 days ago
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (policy.RAW_DATA_DAYS * 86400);
  
  // Aggregate in 5-minute intervals (300 seconds)
  const stmt = db.prepare(`
    INSERT INTO sensor_readings_5min (sensor_id, sensor_type, interval_start, avg_value, min_value, max_value, count, data)
    SELECT 
      sensor_id,
      sensor_type,
      (timestamp / 300) * 300 as interval_start,
      AVG(CAST(json_extract(data, '$.vehicleCount') AS REAL)) as avg_value,
      MIN(CAST(json_extract(data, '$.vehicleCount') AS REAL)) as min_value,
      MAX(CAST(json_extract(data, '$.vehicleCount') AS REAL)) as max_value,
      COUNT(*) as count,
      NULL as data
    FROM sensor_readings
    WHERE timestamp < ?
      AND sensor_type = 'traffic'
      AND sensor_id NOT IN (
        SELECT sensor_id FROM sensor_readings_5min WHERE interval_start >= (? - 86400)
      )
    GROUP BY sensor_id, interval_start
  `);
  
  const result = stmt.run(cutoffTimestamp, cutoffTimestamp);
  
  console.log(`✅ Aggregated ${result.changes} 5-minute intervals`);
  return result.changes;
};

/**
 * Aggregate 5-minute data into hourly intervals
 */
export const aggregateToHourly = (): number => {
  console.log('📊 Aggregating data to hourly intervals...');
  const db = getDatabase();
  const policy = getRetentionPolicy();
  
  // Calculate timestamp for 30 days ago
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (policy.AGGREGATED_5MIN_DAYS * 86400);
  
  // Aggregate to hourly (3600 seconds)
  const stmt = db.prepare(`
    INSERT INTO sensor_readings_hourly (sensor_id, sensor_type, interval_start, avg_value, min_value, max_value, count, data)
    SELECT 
      sensor_id,
      sensor_type,
      (interval_start / 3600) * 3600 as interval_start,
      AVG(avg_value) as avg_value,
      MIN(min_value) as min_value,
      MAX(max_value) as max_value,
      SUM(count) as count,
      NULL as data
    FROM sensor_readings_5min
    WHERE interval_start < ?
      AND sensor_id NOT IN (
        SELECT sensor_id FROM sensor_readings_hourly WHERE interval_start >= (? - 86400)
      )
    GROUP BY sensor_id, (interval_start / 3600) * 3600
  `);
  
  const result = stmt.run(cutoffTimestamp, cutoffTimestamp);
  
  console.log(`✅ Aggregated ${result.changes} hourly intervals`);
  return result.changes;
};

/**
 * Aggregate hourly data into daily intervals (long-term retention)
 */
export const aggregateToDaily = (): number => {
  console.log('📊 Aggregating data to daily intervals...');
  const db = getDatabase();
  const policy = getRetentionPolicy();
  
  // Calculate timestamp for 90 days ago
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (policy.AGGREGATED_HOURLY_DAYS * 86400);
  
  // Aggregate to daily (86400 seconds)
  const stmt = db.prepare(`
    INSERT INTO sensor_readings_daily (sensor_id, sensor_type, interval_start, avg_value, min_value, max_value, count, data)
    SELECT 
      sensor_id,
      sensor_type,
      (interval_start / 86400) * 86400 as interval_start,
      AVG(avg_value) as avg_value,
      MIN(min_value) as min_value,
      MAX(max_value) as max_value,
      SUM(count) as count,
      NULL as data
    FROM sensor_readings_hourly
    WHERE interval_start < ?
      AND sensor_id NOT IN (
        SELECT sensor_id FROM sensor_readings_daily WHERE interval_start >= (? - 86400)
      )
    GROUP BY sensor_id, (interval_start / 86400) * 86400
  `);
  
  const result = stmt.run(cutoffTimestamp, cutoffTimestamp);
  
  console.log(`✅ Aggregated ${result.changes} daily intervals`);
  return result.changes;
};

/**
 * Delete old aggregated data based on retention policy
 */
export const deleteOldAggregatedData = (): number => {
  console.log('🗑️  Deleting old aggregated data...');
  const db = getDatabase();
  const policy = getRetentionPolicy();
  
  let totalDeleted = 0;
  
  // Delete old 5-minute aggregated data (older than 30 days)
  const cutoff5min = Math.floor(Date.now() / 1000) - (policy.AGGREGATED_5MIN_DAYS * 86400);
  const stmt5min = db.prepare('DELETE FROM sensor_readings_5min WHERE interval_start < ?');
  const result5min = stmt5min.run(cutoff5min);
  totalDeleted += result5min.changes;
  console.log(`  Deleted ${result5min.changes} old 5-minute records`);
  
  // Delete old hourly aggregated data (older than 90 days)
  const cutoffHourly = Math.floor(Date.now() / 1000) - (policy.AGGREGATED_HOURLY_DAYS * 86400);
  const stmtHourly = db.prepare('DELETE FROM sensor_readings_hourly WHERE interval_start < ?');
  const resultHourly = stmtHourly.run(cutoffHourly);
  totalDeleted += resultHourly.changes;
  console.log(`  Deleted ${resultHourly.changes} old hourly records`);
  
  // Delete old daily aggregated data (older than AGGREGATED_DAILY_YEARS)
  const cutoffDaily = Math.floor(Date.now() / 1000) - (policy.AGGREGATED_DAILY_YEARS * 365 * 86400);
  const stmtDaily = db.prepare('DELETE FROM sensor_readings_daily WHERE interval_start < ?');
  const resultDaily = stmtDaily.run(cutoffDaily);
  totalDeleted += resultDaily.changes;
  console.log(`  Deleted ${resultDaily.changes} old daily records`);
  
  return totalDeleted;
};

/**
 * Run full cleanup job (aggregate + delete)
 */
export const runCleanupJob = async (): Promise<void> => {
  console.log('\n🧹 ============================================');
  console.log('🧹 Starting scheduled cleanup job...');
  console.log('🧹 ============================================\n');
  
  const startTime = Date.now();
  const policy = getRetentionPolicy();
  
  try {
    // Step 1: Get stats before cleanup
    const statsBefore = getDatabaseStats();
    console.log(`📦 Database size before: ${(statsBefore.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📊 Raw readings: ${statsBefore.tables.sensor_readings || 0}`);
    
    // Step 2: Aggregate old data
    const aggregated5min = aggregateToFiveMinutes();
    const aggregatedHourly = aggregateToHourly();
    const aggregatedDaily = aggregateToDaily();
    
    // Step 3: Delete old raw sensor data
    const rawCutoff = Math.floor(Date.now() / 1000) - (policy.RAW_DATA_DAYS * 86400);
    const deletedSensors = deleteOldReadings(rawCutoff);
    console.log(`🗑️  Deleted ${deletedSensors} old sensor readings (older than ${policy.RAW_DATA_DAYS} days)`);
    
    // Step 4: Delete old vehicle positions
    const vehicleCutoff = Math.floor(Date.now() / 1000) - (policy.RAW_DATA_DAYS * 86400);
    const deletedVehicles = deleteOldVehiclePositions(vehicleCutoff);
    console.log(`🗑️  Deleted ${deletedVehicles} old vehicle positions`);
    
    // Step 5: Delete old aggregated data
    const deletedAggregated = deleteOldAggregatedData();
    
    // Step 6: Vacuum to reclaim disk space
    vacuumDatabase();
    
    // Step 7: Get stats after cleanup
    const statsAfter = getDatabaseStats();
    const spaceSaved = statsBefore.size - statsAfter.size;
    
    console.log(`\n✅ Cleanup completed in ${Date.now() - startTime}ms`);
    console.log(`📦 Database size after: ${(statsAfter.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`💾 Space reclaimed: ${(spaceSaved / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📊 Raw readings: ${statsAfter.tables.sensor_readings || 0}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
  
  console.log('\n🧹 ============================================\n');
};

/**
 * Schedule automatic cleanup job
 * Runs daily at configured hour (default: 3:00 AM)
 */
export const scheduleCleanupJob = (): void => {
  const policy = getRetentionPolicy();
  const cronExpression = `0 ${policy.CLEANUP_HOUR} * * *`; // Daily at specified hour
  
  console.log(`⏰ Scheduling daily cleanup job at ${policy.CLEANUP_HOUR}:00`);
  
  cron.schedule(cronExpression, () => {
    runCleanupJob();
  });
  
  console.log('✅ Cleanup job scheduled successfully!');
};

/**
 * Run cleanup immediately (for manual trigger or testing)
 */
export const runCleanupNow = async (): Promise<void> => {
  await runCleanupJob();
};
