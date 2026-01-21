-- Migration: Add Auth.js v5 tables for OTP, OAuth, and Passkey authentication
-- Run this migration on existing databases that already have the base tables

-- Accounts table - Links OAuth provider accounts (GitHub, etc.) to users
CREATE TABLE IF NOT EXISTS "accounts" (
  "user_id" integer NOT NULL,
  "type" varchar(255) NOT NULL,
  "provider" varchar(255) NOT NULL,
  "provider_account_id" varchar(255) NOT NULL,
  "refresh_token" text,
  "access_token" text,
  "expires_at" integer,
  "token_type" varchar(255),
  "scope" varchar(255),
  "id_token" text,
  "session_state" varchar(255),
  CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);

-- Sessions table - Stores database sessions (not JWT)
CREATE TABLE IF NOT EXISTS "sessions" (
  "session_token" varchar(255) PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "expires" timestamp NOT NULL
);

-- Verification tokens table - Used for Email OTP codes
CREATE TABLE IF NOT EXISTS "verification_tokens" (
  "identifier" varchar(255) NOT NULL,
  "token" varchar(255) NOT NULL,
  "expires" timestamp NOT NULL,
  CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);

-- Authenticators table - Stores WebAuthn credentials (passkeys)
CREATE TABLE IF NOT EXISTS "authenticators" (
  "credential_id" varchar(255) NOT NULL,
  "user_id" integer NOT NULL,
  "provider_account_id" varchar(255) NOT NULL,
  "credential_public_key" text NOT NULL,
  "counter" integer NOT NULL,
  "credential_device_type" varchar(32) NOT NULL,
  "credential_backed_up" boolean NOT NULL,
  "transports" varchar(255),
  CONSTRAINT "authenticators_user_id_credential_id_pk" PRIMARY KEY("user_id","credential_id"),
  CONSTRAINT "authenticators_credential_id_unique" UNIQUE("credential_id")
);

-- Add email_verified column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "email_verified" timestamp;
  END IF;
END $$;

-- Foreign key constraints
ALTER TABLE "accounts"
  ADD CONSTRAINT "accounts_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "sessions"
  ADD CONSTRAINT "sessions_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "authenticators"
  ADD CONSTRAINT "authenticators_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE cascade ON UPDATE no action;
