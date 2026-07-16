import { getDatabase } from '../connection.js';

export interface VehiclePosition {
  vehicle_id: string;
  vehicle_type: 'bus' | 'taxi' | 'truck' | 'emergency' | 'maintenance';
  lat: number;
  lng: number;
  speed?: number;
  bearing?: number;
  timestamp: number;
  data?: any; // Additional metadata (passengers, status, etc.)
}

/**
 * Save vehicle positions to database (batch insert)
 */
export const saveVehiclePositions = (positions: VehiclePosition[]) => {
  const startTime = Date.now();
  const db = getDatabase();
  
  const insert = db.prepare(`
    INSERT INTO vehicle_positions (vehicle_id, vehicle_type, lat, lng, speed, bearing, timestamp, data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertMany = db.transaction((items: VehiclePosition[]) => {
    for (const pos of items) {
      insert.run(
        pos.vehicle_id,
        pos.vehicle_type,
        pos.lat,
        pos.lng,
        pos.speed || null,
        pos.bearing || null,
        pos.timestamp,
        pos.data ? JSON.stringify(pos.data) : null
      );
    }
  });
  
  insertMany(positions);
  
  return {
    inserted: positions.length,
    duration: Date.now() - startTime
  };
};

/**
 * Get vehicle position history
 */
export const getVehicleHistory = (
  vehicleId: string,
  fromTimestamp: number,
  toTimestamp: number,
  limit: number = 1000
) => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT vehicle_id, vehicle_type, lat, lng, speed, bearing, timestamp, data
    FROM vehicle_positions
    WHERE vehicle_id = ?
      AND timestamp >= ?
      AND timestamp <= ?
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  
  const rows = stmt.all(vehicleId, fromTimestamp, toTimestamp, limit);
  
  return rows.map((row: any) => ({
    ...row,
    data: row.data ? JSON.parse(row.data) : null
  }));
};

/**
 * Get latest positions for all vehicles
 */
export const getLatestVehiclePositions = () => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT v1.*
    FROM vehicle_positions v1
    INNER JOIN (
      SELECT vehicle_id, MAX(timestamp) as max_timestamp
      FROM vehicle_positions
      GROUP BY vehicle_id
    ) v2 ON v1.vehicle_id = v2.vehicle_id AND v1.timestamp = v2.max_timestamp
    ORDER BY v1.timestamp DESC
  `);
  
  const rows = stmt.all();
  
  return rows.map((row: any) => ({
    ...row,
    data: row.data ? JSON.parse(row.data) : null
  }));
};

/**
 * Delete old vehicle positions
 */
export const deleteOldVehiclePositions = (olderThanTimestamp: number): number => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    DELETE FROM vehicle_positions
    WHERE timestamp < ?
  `);
  
  const result = stmt.run(olderThanTimestamp);
  return result.changes;
};
