import Database from 'better-sqlite3';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import { SCHEMA } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file path
const DB_DIR = join(__dirname, '../../data');
const DB_PATH = join(DB_DIR, 'city.db');

let db: Database.Database | null = null;

/**
 * Initialize database connection and create tables
 */
export const initDatabase = (): Database.Database => {
  console.log('🗄️  Initializing SQLite database...');
  
  // Ensure data directory exists
  if (!existsSync(DB_DIR)) {
    console.log('📁 Creating data directory...');
    mkdirSync(DB_DIR, { recursive: true });
  }
  
  // Create/open database
  db = new Database(DB_PATH, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
  });
  
  console.log(`📂 Database file: ${DB_PATH}`);
  
  // Enable WAL mode for better concurrent performance
  db.pragma('journal_mode = WAL');
  
  // Set cache size (in pages, negative = KB)
  db.pragma('cache_size = -64000'); // 64MB cache
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create tables
  console.log('📊 Creating database schema...');
  db.exec(SCHEMA);
  
  console.log('✅ Database initialized successfully!');
  
  // Log database info
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log(`📋 Tables created: ${tables.map((t: any) => t.name).join(', ')}`);
  
  return db;
};

/**
 * Get database instance (initializes if not already done)
 */
export const getDatabase = (): Database.Database => {
  if (!db) {
    return initDatabase();
  }
  return db;
};

/**
 * Close database connection
 */
export const closeDatabase = (): void => {
  if (db) {
    console.log('🔒 Closing database connection...');
    db.close();
    db = null;
  }
};

/**
 * Get database statistics
 */
export const getDatabaseStats = () => {
  const database = getDatabase();
  
  const stats = {
    filepath: DB_PATH,
    size: 0,
    tables: {} as Record<string, number>,
    lastVacuum: null as string | null,
  };
  
  try {
    // Get file size
    if (existsSync(DB_PATH)) {
      const fileStats = fs.statSync(DB_PATH);
      stats.size = fileStats.size;
    }

    // Get row counts for each table
    const tables = ['sensor_readings', 'vehicle_positions', 'sensor_readings_5min', 
                    'sensor_readings_hourly', 'sensor_readings_daily', 'city_events', 'alerts', 'system_metrics'];
    
    for (const table of tables) {
      try {
        const result = database.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
        stats.tables[table] = result.count;
      } catch (e) {
        stats.tables[table] = 0;
      }
    }
  } catch (error) {
    console.error('Error getting database stats:', error);
  }
  
  return stats;
};

/**
 * Vacuum database to reclaim space
 */
export const vacuumDatabase = (): void => {
  console.log('🧹 Running VACUUM to reclaim disk space...');
  const database = getDatabase();
  database.exec('VACUUM');
  console.log('✅ VACUUM completed');
};

// Graceful shutdown
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});
