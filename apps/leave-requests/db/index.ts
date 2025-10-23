import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Global singleton pattern for connection pooling
let globalPool: Pool | null = null;
let globalDb: NodePgDatabase | null = null;

function createPool(): Pool {
  // Get DATABASE_URL at runtime, not at module load time
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    throw new Error("Missing DATABASE_URL environment variable for Postgres");
  }
  
  return new Pool({
    connectionString: DATABASE_URL,
    max: 20,                    // Maximum connections in pool
    min: 5,                     // Minimum connections to maintain
    idleTimeoutMillis: 30000,   // Close idle connections after 30s
    connectionTimeoutMillis: 2000, // Timeout for getting connection
  });
}

export function getPool(): Pool {
  // In development, use global to prevent connection leaks during hot reloads
  if (process.env.NODE_ENV === 'development') {
    if (!(global as any).__pg_pool) {
      (global as any).__pg_pool = createPool();
    }
    return (global as any).__pg_pool;
  }

  // In production, use module-level singleton
  if (!globalPool) {
    globalPool = createPool();
  }
  return globalPool;
}

export function getDb(): NodePgDatabase {
  // Same pattern for Drizzle instance
  if (process.env.NODE_ENV === 'development') {
    if (!(global as any).__drizzle_db) {
      const pool = getPool();
      (global as any).__drizzle_db = drizzle(pool);
    }
    return (global as any).__drizzle_db;
  }

  if (!globalDb) {
    const pool = getPool();
    globalDb = drizzle(pool);
  }
  return globalDb;
}

// Build-time safe database getter
export function getDbSafe(): NodePgDatabase | null {
  try {
    return getDb();
  } catch (error) {
    // During build time, return null if database connection fails
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      return null;
    }
    throw error;
  }
}

// Optional: Graceful shutdown helper
export async function closePool(): Promise<void> {
  const pool = process.env.NODE_ENV === 'development' 
    ? (global as any).__pg_pool 
    : globalPool;
    
  if (pool) {
    await pool.end();
    if (process.env.NODE_ENV === 'development') {
      (global as any).__pg_pool = null;
      (global as any).__drizzle_db = null;
    } else {
      globalPool = null;
      globalDb = null;
    }
  }
}

// Usage example:
// const db = getDb();
// const result = await db.select().from(users);