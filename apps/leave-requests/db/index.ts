import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
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
  
  console.log("Creating database pool with URL:", DATABASE_URL.replace(/:[^:]*@/, ':***@')); // Log URL without password
  
  return new Pool({
    connectionString: DATABASE_URL,
    max: 3,                     // Very low max connections for serverless
    min: 0,                     // No minimum connections for serverless
    idleTimeoutMillis: 10000,   // Short idle timeout for serverless
    connectionTimeoutMillis: 5000, // Very long connection timeout for network latency
    // Serverless optimizations
    allowExitOnIdle: true,      // Allow process to exit when idle
    // Additional serverless optimizations
    // keepAlive: true,            // Keep connections alive
    // keepAliveInitialDelayMillis: 0, // Start keep-alive immediately
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

// Add connection health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    console.log("Database health check passed");
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

// Warm up database connection for serverless environments
export async function warmUpConnection(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    try {
      console.log("Warming up database connection for serverless...");
      const db = getDb();
      // Execute a simple query to establish connection
      await db.execute(sql`SELECT 1`);
      console.log("Database connection warmed up successfully");
    } catch (error) {
      console.error("Failed to warm up database connection:", error);
      // Don't throw error, just log it
    }
  }
}

// Add retry logic for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw new Error(`Database operation failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
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