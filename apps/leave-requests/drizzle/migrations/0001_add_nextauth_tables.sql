-- Add emailVerified column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" timestamp;

-- Create accounts table for OAuth providers
CREATE TABLE IF NOT EXISTS "accounts" (
  "userId" text NOT NULL,
  "type" text NOT NULL,
  "provider" text NOT NULL,
  "providerAccountId" text NOT NULL,
  "refresh_token" text,
  "access_token" text,
  "expires_at" integer,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text,
  PRIMARY KEY ("provider", "providerAccountId"),
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create index on userId for accounts table
CREATE INDEX IF NOT EXISTS "accounts_userId_idx" ON "accounts"("userId");

-- Create sessions table for session management
CREATE TABLE IF NOT EXISTS "sessions" (
  "sessionToken" text NOT NULL PRIMARY KEY,
  "userId" text NOT NULL,
  "expires" timestamp NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create index on userId for sessions table
CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId");

-- Create verification_tokens table for email verification
CREATE TABLE IF NOT EXISTS "verification_tokens" (
  "email" text NOT NULL,
  "token" text NOT NULL,
  "expires" timestamp NOT NULL,
  PRIMARY KEY ("email", "token")
);

