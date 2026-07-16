import { getDatabase } from '../connection.js';

export interface CityEvent {
  id?: number;
  event_type: 'accident' | 'road-work' | 'flood' | 'event' | 'maintenance';
  title: string;
  description?: string;
  lat?: number;
  lng?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'active' | 'resolved' | 'monitoring';
  affected_area?: any;
  metadata?: any;
}

export interface Alert {
  id?: number;
  sensor_id?: string;
  alert_type: string;
  severity?: 'info' | 'warning' | 'critical';
  message: string;
  threshold_value?: number;
  actual_value?: number;
  metadata?: any;
}

/**
 * Create a new city event
 */
export const createEvent = (event: CityEvent): number => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    INSERT INTO city_events (
      event_type, title, description, lat, lng, severity, status, affected_area, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    event.event_type,
    event.title,
    event.description || null,
    event.lat || null,
    event.lng || null,
    event.severity || 'low',
    event.status || 'active',
    event.affected_area ? JSON.stringify(event.affected_area) : null,
    event.metadata ? JSON.stringify(event.metadata) : null
  );
  
  return result.lastInsertRowid as number;
};

/**
 * Get all active events
 */
export const getActiveEvents = () => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT *
    FROM city_events
    WHERE status = 'active'
    ORDER BY severity DESC, created_at DESC
  `);
  
  const rows = stmt.all();
  
  return rows.map((row: any) => ({
    ...row,
    affected_area: row.affected_area ? JSON.parse(row.affected_area) : null,
    metadata: row.metadata ? JSON.parse(row.metadata) : null
  }));
};

/**
 * Get events by type
 */
export const getEventsByType = (eventType: string) => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT *
    FROM city_events
    WHERE event_type = ?
    ORDER BY created_at DESC
    LIMIT 100
  `);
  
  const rows = stmt.all(eventType);
  
  return rows.map((row: any) => ({
    ...row,
    affected_area: row.affected_area ? JSON.parse(row.affected_area) : null,
    metadata: row.metadata ? JSON.parse(row.metadata) : null
  }));
};

/**
 * Resolve an event
 */
export const resolveEvent = (eventId: number): boolean => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    UPDATE city_events
    SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  const result = stmt.run(eventId);
  return result.changes > 0;
};

/**
 * Create a new alert
 */
export const createAlert = (alert: Alert): number => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    INSERT INTO alerts (
      sensor_id, alert_type, severity, message, threshold_value, actual_value, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    alert.sensor_id || null,
    alert.alert_type,
    alert.severity || 'warning',
    alert.message,
    alert.threshold_value || null,
    alert.actual_value || null,
    alert.metadata ? JSON.stringify(alert.metadata) : null
  );
  
  return result.lastInsertRowid as number;
};

/**
 * Get all unacknowledged alerts
 */
export const getUnacknowledgedAlerts = () => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT *
    FROM alerts
    WHERE acknowledged = 0
    ORDER BY severity DESC, created_at DESC
  `);
  
  const rows = stmt.all();
  
  return rows.map((row: any) => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null
  }));
};

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = (alertId: number, acknowledgedBy?: string): boolean => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    UPDATE alerts
    SET acknowledged = 1, 
        acknowledged_at = CURRENT_TIMESTAMP,
        acknowledged_by = ?
    WHERE id = ?
  `);
  
  const result = stmt.run(acknowledgedBy || null, alertId);
  return result.changes > 0;
};

/**
 * Get recent alerts (for dashboard)
 */
export const getRecentAlerts = (limit: number = 50) => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT *
    FROM alerts
    ORDER BY created_at DESC
    LIMIT ?
  `);
  
  const rows = stmt.all(limit);
  
  return rows.map((row: any) => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null
  }));
};
