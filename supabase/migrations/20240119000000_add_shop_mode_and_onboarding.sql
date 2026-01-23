-- Add shop_mode and onboarding_completed_at to shops table

-- Create shop_mode enum if not exists
DO $$ BEGIN
  CREATE TYPE shop_mode AS ENUM ('quick', 'normal');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add shop_mode column (default to 'normal')
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS shop_mode shop_mode DEFAULT 'normal';

-- Add onboarding_completed_at column
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Create index for onboarding queries
CREATE INDEX IF NOT EXISTS idx_shops_onboarding_completed
ON shops(onboarding_completed_at);
