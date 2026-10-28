-- Migration: 006_add_seller_decision_to_auctions.sql
-- Description: Adds 'accepted' and 'rejected' to chk_auctions_outcome constraint and adds decision_at column

-- 1. Drop existing outcome constraint
ALTER TABLE auctions DROP CONSTRAINT IF EXISTS chk_auctions_outcome;

-- 2. Add updated outcome constraint allowing 'accepted' (reserved awaiting handover) and 'rejected'
ALTER TABLE auctions ADD CONSTRAINT chk_auctions_outcome
  CHECK (outcome IS NULL OR outcome IN ('accepted', 'rejected', 'sold', 'unsold', 'cancelled'));

-- 3. Add decision_at column to record seller decision timestamp
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS decision_at TIMESTAMPTZ DEFAULT NULL;

-- 4. Create index on outcome for fast activity and winner lookups
CREATE INDEX IF NOT EXISTS idx_auctions_outcome ON auctions (outcome);

