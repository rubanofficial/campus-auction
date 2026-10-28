-- Migration: 004_create_notifications_table.sql
-- Description: Creates notifications table for persistent in-app notifications with user indexing

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'new_auction',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Avoid duplicate notifications for the same user, auction, and notification type
  CONSTRAINT uq_notifications_user_auction_type UNIQUE (user_id, auction_id, type)
);

-- Index for retrieving a user's notifications in newest-first order
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

-- Index for filtering unread notifications for badge counts
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read)
  WHERE is_read = false;

