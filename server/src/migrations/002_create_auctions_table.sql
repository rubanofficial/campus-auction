-- Migration: 002_create_auctions_table.sql
-- Description: Creates auctions table with foreign keys to users, status/outcome constraints, and performance indexes

CREATE TABLE IF NOT EXISTS auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL,
  category VARCHAR(30) NOT NULL,
  description TEXT NOT NULL,
  condition VARCHAR(20) NOT NULL,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  starting_price INTEGER NOT NULL,
  min_bid_increment INTEGER NOT NULL,
  current_price INTEGER NOT NULL,
  current_leader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  bid_count INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ends_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  outcome VARCHAR(20) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT chk_auctions_title_length CHECK (char_length(trim(title)) >= 3 AND char_length(title) <= 120),
  CONSTRAINT chk_auctions_description_length CHECK (char_length(trim(description)) >= 5),
  CONSTRAINT chk_auctions_category CHECK (category IN ('cycle', 'calculator', 'books', 'electronics', 'other')),
  CONSTRAINT chk_auctions_condition CHECK (condition IN ('like_new', 'good', 'fair')),
  CONSTRAINT chk_auctions_images_array CHECK (jsonb_typeof(images) = 'array'),
  CONSTRAINT chk_auctions_starting_price CHECK (starting_price > 0),
  CONSTRAINT chk_auctions_min_bid_increment CHECK (min_bid_increment > 0),
  CONSTRAINT chk_auctions_current_price CHECK (current_price >= starting_price),
  CONSTRAINT chk_auctions_bid_count CHECK (bid_count >= 0),
  CONSTRAINT chk_auctions_time_window CHECK (ends_at > starts_at),
  CONSTRAINT chk_auctions_status CHECK (status IN ('draft', 'active', 'ended', 'cancelled')),
  CONSTRAINT chk_auctions_outcome CHECK (outcome IS NULL OR outcome IN ('sold', 'unsold', 'cancelled'))
);

-- Indexes for performance
-- 1. Browsing active auctions by closing time
CREATE INDEX IF NOT EXISTS idx_auctions_status_ends_at ON auctions (status, ends_at ASC);

-- 2. Seller-owned auction queries
CREATE INDEX IF NOT EXISTS idx_auctions_seller_id ON auctions (seller_id, created_at DESC);

-- 3. Leader bids / active winning queries
CREATE INDEX IF NOT EXISTS idx_auctions_current_leader ON auctions (current_leader_id) WHERE current_leader_id IS NOT NULL;

-- 4. Category-filtered browsing
CREATE INDEX IF NOT EXISTS idx_auctions_category_status ON auctions (category, status);

-- Trigger to automatically maintain updated_at on record modifications
DROP TRIGGER IF EXISTS trg_auctions_updated_at ON auctions;
CREATE TRIGGER trg_auctions_updated_at
BEFORE UPDATE ON auctions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
