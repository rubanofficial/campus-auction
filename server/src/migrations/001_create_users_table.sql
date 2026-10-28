-- Migration: 001_create_users_table.sql
-- Description: Creates the users table with UUID primary key, constraints, and updated_at trigger

-- Enable pgcrypto extension for gen_random_uuid() fallback if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT chk_users_display_name CHECK (char_length(trim(display_name)) >= 2 AND char_length(display_name) <= 50),
  CONSTRAINT chk_users_email_lowercase CHECK (email = lower(trim(email))),
  CONSTRAINT chk_users_email_format CHECK (email LIKE '%_@_%._%'),
  CONSTRAINT chk_users_role CHECK (role IN ('student', 'admin'))
);

-- Trigger function to automatically maintain updated_at on record changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to users table
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
