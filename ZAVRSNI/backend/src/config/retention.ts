// Retention Policy Configuration
// Defines how long data is kept at different resolutions

export const RETENTION_POLICY = {
  // Raw sensor data (full resolution)
  RAW_DATA_DAYS: 7,
  
  // 5-minute aggregated data
  AGGREGATED_5MIN_DAYS: 30,
  
  // Hourly aggregated data
  AGGREGATED_HOURLY_DAYS: 90,
  
  // Daily aggregated data (long-term storage)
  AGGREGATED_DAILY_YEARS: 1,
  
  // Cleanup runs daily at this hour (24h format)
  CLEANUP_HOUR: 3,
};

// Development mode - shorter retention for testing
export const RETENTION_POLICY_DEV = {
  RAW_DATA_DAYS: 1,
  AGGREGATED_5MIN_DAYS: 3,
  AGGREGATED_HOURLY_DAYS: 7,
  AGGREGATED_DAILY_YEARS: 1,
  CLEANUP_HOUR: 3,
};

// Use dev policy if NODE_ENV is 'development'
export const getRetentionPolicy = () => {
  return process.env.NODE_ENV === 'development' 
    ? RETENTION_POLICY_DEV 
    : RETENTION_POLICY;
};
