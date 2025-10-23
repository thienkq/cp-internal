-- Drop existing constraints and indexes
DROP INDEX IF EXISTS "accounts_userId_idx";
DROP INDEX IF EXISTS "sessions_userId_idx";
DROP CONSTRAINT IF EXISTS "accounts_userId_fkey" ON "accounts";
DROP CONSTRAINT IF EXISTS "sessions_userId_fkey" ON "sessions";

-- Drop existing tables
DROP TABLE IF EXISTS "accounts";
DROP TABLE IF EXISTS "sessions";
DROP TABLE IF EXISTS "verification_tokens";

-- Recreate tables with correct types
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
	CONSTRAINT "accounts_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);

CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp NOT NULL
);

CREATE TABLE "verification_tokens" (
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_email_token_pk" PRIMARY KEY("email","token")
);

-- Add foreign keys
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes
CREATE INDEX "accounts_userId_idx" ON "accounts" USING btree ("userId");
CREATE INDEX "sessions_userId_idx" ON "sessions" USING btree ("userId");

