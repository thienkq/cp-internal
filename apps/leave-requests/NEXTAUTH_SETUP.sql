-- ============================================================================
-- NextAuth.js Complete Database Setup
-- ============================================================================
-- This script sets up all tables and columns needed for NextAuth.js
-- with Drizzle adapter while keeping plural table names
-- ============================================================================

-- ============================================================================
-- 1. UPDATE USERS TABLE - Add NextAuth required columns
-- ============================================================================
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" text;

-- ============================================================================
-- 2. CREATE/UPDATE ACCOUNTS TABLE - OAuth provider accounts
-- ============================================================================
-- Drop if exists to ensure clean state
DROP TABLE IF EXISTS "accounts" CASCADE;

CREATE TABLE "accounts" (
  "userId" uuid NOT NULL,
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

CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- ============================================================================
-- 3. CREATE/UPDATE SESSIONS TABLE - User sessions
-- ============================================================================
-- Drop if exists to ensure clean state
DROP TABLE IF EXISTS "sessions" CASCADE;

CREATE TABLE "sessions" (
  "sessionToken" text PRIMARY KEY NOT NULL,
  "userId" uuid NOT NULL,
  "expires" timestamp NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- ============================================================================
-- 4. CREATE/UPDATE VERIFICATION_TOKENS TABLE - Email verification
-- ============================================================================
-- Drop if exists to ensure clean state
DROP TABLE IF EXISTS "verification_tokens" CASCADE;

CREATE TABLE "verification_tokens" (
  "identifier" text NOT NULL,
  "token" text NOT NULL,
  "expires" timestamp NOT NULL,
  PRIMARY KEY ("identifier", "token")
);

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- ✅ Users table:
--    - Added 'name' column (NextAuth adapter requirement)
--    - Added 'image' column (NextAuth adapter requirement)
--
-- ✅ Accounts table:
--    - userId: uuid (references users.id)
--    - type: text (e.g., 'oauth')
--    - provider: text (e.g., 'google')
--    - providerAccountId: text (Google's user ID)
--    - OAuth tokens and metadata
--    - Primary key: (provider, providerAccountId)
--    - Foreign key: userId -> users.id (CASCADE DELETE)
--
-- ✅ Sessions table:
--    - sessionToken: text (primary key, HTTP-only cookie)
--    - userId: uuid (references users.id)
--    - expires: timestamp (session expiration)
--    - Foreign key: userId -> users.id (CASCADE Delete)
--
-- ✅ Verification_tokens table:
--    - identifier: text (email address)
--    - token: text (verification token)
--    - expires: timestamp (token expiration)
--    - Primary key: (identifier, token)
--
-- ============================================================================
-- NEXTAUTH FLOW
-- ============================================================================
-- 1. User clicks "Sign in with Google"
-- 2. Redirected to Google OAuth
-- 3. Google redirects back with auth code
-- 4. NextAuth exchanges code for tokens
-- 5. signIn callback: Syncs user to 'users' table
-- 6. Account record created in 'accounts' table
-- 7. Session record created in 'sessions' table
-- 8. Session cookie set in browser
-- 9. Middleware validates session cookie
-- 10. User can access protected routes
-- ============================================================================

