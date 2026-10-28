-- Migration: 003_create_bids_table.sql
-- Description: Creates the bids table with foreign keys to auctions and users, amount constraints, and indexing for newest-first history retrieval

CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT chk_bids_amount CHECK (amount > 0)
);

-- Indexes for performance
-- 1. Retrieving bid history for an auction, ordered by newest first
CREATE INDEX IF NOT EXISTS idx_bids_auction_id_created_at ON bids (auction_id, created_at DESC);

-- 2. Querying bids placed by a specific student/bidder
CREATE INDEX IF NOT EXISTS idx_bids_bidder_id ON bids (bidder_id, created_at DESC);

