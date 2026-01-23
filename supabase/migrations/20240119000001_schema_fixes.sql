-- Schema Fixes for BillSnap
-- Adds missing store_type values, shop_mode column, and onboarding tracking

-- ============================================
-- ADD MISSING STORE_TYPE VALUES
-- ============================================

-- Add new store types
ALTER TYPE store_type ADD VALUE IF NOT EXISTS 'street_food';
ALTER TYPE store_type ADD VALUE IF NOT EXISTS 'drinks';
ALTER TYPE store_type ADD VALUE IF NOT EXISTS 'grocery';
ALTER TYPE store_type ADD VALUE IF NOT EXISTS 'market';
ALTER TYPE store_type ADD VALUE IF NOT EXISTS 'beauty';
ALTER TYPE store_type ADD VALUE IF NOT EXISTS 'electronics';
ALTER TYPE store_type ADD VALUE IF NOT EXISTS 'repair';

-- ============================================
-- ADD SHOP_MODE ENUM AND COLUMN
-- ============================================

-- Create shop_mode enum for quick vs normal mode
DO $$ BEGIN
  CREATE TYPE shop_mode AS ENUM ('quick', 'normal');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add shop_mode column to shops table (defaults to normal)
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_mode shop_mode DEFAULT 'normal';

-- ============================================
-- ADD ONBOARDING TRACKING
-- ============================================

-- Add timestamp to track when onboarding was completed
ALTER TABLE shops ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Create index for onboarding queries
CREATE INDEX IF NOT EXISTS idx_shops_onboarding ON shops(onboarding_completed_at) WHERE onboarding_completed_at IS NOT NULL;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN shops.shop_mode IS 'Quick mode for street vendors (amount only), Normal mode for detailed receipts';
COMMENT ON COLUMN shops.onboarding_completed_at IS 'Timestamp when user completed onboarding flow';
