// Database Schema for Digital Twin Đakovo
// SQLite tables for storing sensor readings, events, and historical data

export const SCHEMA = `
-- ============================================================================
-- SENSOR READINGS (Raw Data - 7 days retention)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sensor_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id TEXT NOT NULL,
  sensor_type TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  data TEXT NOT NULL,  -- JSON data specific to sensor type
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_lookup 
  ON sensor_readings(sensor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp 
  ON sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_type 
  ON sensor_readings(sensor_type, timestamp DESC);

-- ============================================================================
-- VEHICLE POSITIONS (Real-time tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  speed REAL,
  bearing REAL,
  timestamp INTEGER NOT NULL,
  data TEXT,  -- Additional JSON data (passengers, status, etc.)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicle_positions_lookup 
  ON vehicle_positions(vehicle_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_positions_timestamp 
  ON vehicle_positions(timestamp DESC);

-- ============================================================================
-- AGGREGATED DATA - 5 MINUTE (30 days retention)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sensor_readings_5min (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id TEXT NOT NULL,
  sensor_type TEXT NOT NULL,
  interval_start INTEGER NOT NULL,  -- Unix timestamp aligned to 5-min
  avg_value REAL,
  min_value REAL,
  max_value REAL,
  count INTEGER,
  data TEXT,  -- JSON with aggregated metrics
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sensor_5min_lookup 
  ON sensor_readings_5min(sensor_id, interval_start DESC);

-- ============================================================================
-- AGGREGATED DATA - HOURLY (90 days retention)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sensor_readings_hourly (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id TEXT NOT NULL,
  sensor_type TEXT NOT NULL,
  interval_start INTEGER NOT NULL,  -- Unix timestamp aligned to hour
  avg_value REAL,
  min_value REAL,
  max_value REAL,
  count INTEGER,
  data TEXT,  -- JSON with aggregated metrics
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sensor_hourly_lookup 
  ON sensor_readings_hourly(sensor_id, interval_start DESC);

-- ============================================================================
-- AGGREGATED DATA - DAILY (long-term retention, default 1 year)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sensor_readings_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id TEXT NOT NULL,
  sensor_type TEXT NOT NULL,
  interval_start INTEGER NOT NULL,  -- Unix timestamp aligned to day (UTC)
  avg_value REAL,
  min_value REAL,
  max_value REAL,
  count INTEGER,
  data TEXT,  -- JSON with aggregated metrics
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sensor_daily_lookup 
  ON sensor_readings_daily(sensor_id, interval_start DESC);

-- ============================================================================
-- CITY EVENTS (Incidents, road works, floods, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS city_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,  -- 'accident', 'road-work', 'flood', 'event', 'maintenance'
  title TEXT NOT NULL,
  description TEXT,
  lat REAL,
  lng REAL,
  severity TEXT DEFAULT 'low',  -- 'low', 'medium', 'high', 'critical'
  status TEXT DEFAULT 'active',  -- 'active', 'resolved', 'monitoring'
  affected_area TEXT,  -- JSON with polygon or radius
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  metadata TEXT  -- Additional JSON data
);

CREATE INDEX IF NOT EXISTS idx_events_status 
  ON city_events(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type 
  ON city_events(event_type, created_at DESC);

-- ============================================================================
-- ALERTS (System-generated warnings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id TEXT,
  alert_type TEXT NOT NULL,  -- 'high_pollution', 'traffic_jam', 'parking_full', etc.
  severity TEXT DEFAULT 'warning',  -- 'info', 'warning', 'critical'
  message TEXT NOT NULL,
  threshold_value REAL,
  actual_value REAL,
  acknowledged BOOLEAN DEFAULT 0,
  acknowledged_at DATETIME,
  acknowledged_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT  -- Additional JSON data
);

CREATE INDEX IF NOT EXISTS idx_alerts_unacknowledged 
  ON alerts(acknowledged, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_sensor 
  ON alerts(sensor_id, created_at DESC);

-- ============================================================================
-- SYSTEM METRICS (Performance monitoring)
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_type TEXT NOT NULL,  -- 'db_size', 'insert_rate', 'active_sensors', etc.
  value REAL NOT NULL,
  timestamp INTEGER NOT NULL,
  metadata TEXT,  -- Additional JSON data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_metrics_type 
  ON system_metrics(metric_type, timestamp DESC);
`;

// Helper function to extract numeric value from sensor data for aggregation
export const getValueForAggregation = (sensorType: string, data: any): number | null => {
  switch (sensorType) {
    case 'traffic':
      return data.vehicleCount || null;
    case 'environment':
      return data.airQuality?.aqi || data.temperature || null;
    case 'energy':
      return data.consumption || null;
    case 'parking':
      return data.occupiedSpaces || null;
    default:
      return null;
  }
};
