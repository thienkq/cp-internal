#!/usr/bin/env tsx

/**
 * Script to insert the initial migration record into Drizzle's migrations table
 * This is needed for production deployments where the database already exists
 * and we don't want to run the actual migration SQL.
 *
 * Usage:
 *   pnpm tsx scripts/insert-initial-migration-record-simple.ts
 *   or
 *   npm run tsx scripts/insert-initial-migration-record-simple.ts
 */

import { config } from "dotenv";
import { Pool } from "pg";

// Load environment variables from .env file
config();

// hash value from drizzle/migrations/20250910143627_initial_migration_from_supabase.sql
// const fs = require("fs");
// const crypto = require("crypto");
// const sql = fs.readFileSync(filePath, "utf8");
// const hash = crypto.createHash("sha256").update(sql).digest("hex");
const MIGRATION_NAME = "91c55d154826c4d89f378e9a3c11206f3ca081c2c6f9fd42111b203e2b79fdf0";

async function insertInitialMigrationRecord() {

  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  console.log("🚀 Starting initial migration record insertion...");
  console.log(`📝 Migration: ${MIGRATION_NAME}`);

  // Create database connection
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  try {
    // Check if the migration record already exists
    const existingMigration = await pool.query(
      `
      SELECT id FROM drizzle.__drizzle_migrations 
      WHERE hash = $1
    `,
      [MIGRATION_NAME],
    );

    if (existingMigration.rows.length > 0) {
      console.log("✅ Migration record already exists in the database");
      console.log("ℹ️  No action needed");
      return;
    }

    // Insert the migration record with migration name as hash
    await pool.query(
      `
      INSERT INTO drizzle.__drizzle_migrations (
        hash,
        created_at
      ) VALUES (
        $1, $2
      )
    `,
      [MIGRATION_NAME, Date.now()],
    );

    console.log("✅ Successfully inserted initial migration record");
    console.log("🎉 Database is now ready for future migrations");
  } catch (error) {
    console.error("❌ Error inserting migration record:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
insertInitialMigrationRecord().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
