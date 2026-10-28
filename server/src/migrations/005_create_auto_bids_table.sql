-- Migration: 005_create_auto_bids_table.sql
-- Description: Creates the auto_bids table for automated proxy bidding

CREATE TABLE IF NOT EXISTS auto_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  max_amount INTEGER NOT NULL CHECK (max_amount > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Prevent duplicate configurations for the same student on the same auction
  CONSTRAINT uq_auto_bids_auction_user UNIQUE (auction_id, user_id)
);

-- Index to quickly query active auto-bids for an auction during bid resolution
CREATE INDEX IF NOT EXISTS idx_auto_bids_auction_active
  ON auto_bids (auction_id, is_active)
  WHERE is_active = true;

-- Attach existing trigger function to maintain updated_at timestamp
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS trg_auto_bids_updated_at ON auto_bids;
    CREATE TRIGGER trg_auto_bids_updated_at
    BEFORE UPDATE ON auto_bids
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

