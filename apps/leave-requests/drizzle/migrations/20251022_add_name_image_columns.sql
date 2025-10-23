-- ============================================================================
-- NextAuth.js Integration - Complete Schema Update
-- ============================================================================
-- This migration updates the database schema to support NextAuth.js with
-- the Drizzle adapter while keeping plural table names (users, accounts, sessions)
-- ============================================================================

-- Step 1: Add NextAuth required columns to users table
-- ============================================================================
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" text;

-- Step 2: Update verification_tokens table to use 'identifier' instead of 'email'
-- ============================================================================
-- The NextAuth Drizzle adapter expects 'identifier' column instead of 'email'
-- Create new table with correct schema
CREATE TABLE "verification_tokens_new" (
  "identifier" text NOT NULL,
  "token" text NOT NULL,
  "expires" timestamp NOT NULL,
  PRIMARY KEY ("identifier", "token")
);

-- Copy existing data if any (map email to identifier)
INSERT INTO "verification_tokens_new" ("identifier", "token", "expires")
SELECT "email", "token", "expires" FROM "verification_tokens"
ON CONFLICT DO NOTHING;

-- Drop old table and rename new one
DROP TABLE IF EXISTS "verification_tokens";
ALTER TABLE "verification_tokens_new" RENAME TO "verification_tokens";

-- ============================================================================
-- Summary of Changes
-- ============================================================================
-- 1. Added 'name' column to users table (NextAuth adapter requirement)
-- 2. Added 'image' column to users table (NextAuth adapter requirement)
-- 3. Updated verification_tokens table:
--    - Renamed 'email' column to 'identifier'
--    - Preserved all existing data
-- 4. Existing tables (accounts, sessions) already have correct schema:
--    - accounts: userId (uuid), type, provider, providerAccountId, etc.
--    - sessions: sessionToken, userId (uuid), expires
-- ============================================================================

