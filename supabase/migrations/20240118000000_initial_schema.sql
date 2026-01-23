-- BillSnap Initial Schema
-- Creates tables for shops, receipts, and preset_items

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create store_type enum
CREATE TYPE store_type AS ENUM ('clothing', 'food', 'general', 'service');

-- Create receipt_status enum
CREATE TYPE receipt_status AS ENUM ('paid', 'pending', 'refunded');

-- ============================================
-- SHOPS TABLE
-- ============================================
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact TEXT,
  promptpay_id TEXT,
  logo_url TEXT,
  is_pro BOOLEAN DEFAULT FALSE,
  receipts_this_month INTEGER DEFAULT 0,
  store_type store_type DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX idx_shops_user_id ON shops(user_id);

-- ============================================
-- RECEIPTS TABLE
-- ============================================
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  vat DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  customer_name TEXT,
  status receipt_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for receipts
CREATE INDEX idx_receipts_shop_id ON receipts(shop_id);
CREATE INDEX idx_receipts_created_at ON receipts(created_at DESC);
CREATE INDEX idx_receipts_status ON receipts(status);

-- ============================================
-- PRESET_ITEMS TABLE
-- ============================================
CREATE TABLE preset_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for preset items
CREATE INDEX idx_preset_items_shop_id ON preset_items(shop_id);
CREATE INDEX idx_preset_items_category ON preset_items(category);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR SHOPS
-- ============================================

-- Users can view their own shops
CREATE POLICY "Users can view own shops"
  ON shops FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create shops
CREATE POLICY "Users can create shops"
  ON shops FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own shops
CREATE POLICY "Users can update own shops"
  ON shops FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own shops
CREATE POLICY "Users can delete own shops"
  ON shops FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES FOR RECEIPTS
-- ============================================

-- Users can view receipts for their shops
CREATE POLICY "Users can view own receipts"
  ON receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = receipts.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- Users can create receipts for their shops
CREATE POLICY "Users can create receipts"
  ON receipts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = receipts.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- Users can update receipts for their shops
CREATE POLICY "Users can update own receipts"
  ON receipts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = receipts.shop_id
      AND shops.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = receipts.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- Users can delete receipts for their shops
CREATE POLICY "Users can delete own receipts"
  ON receipts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = receipts.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES FOR PRESET_ITEMS
-- ============================================

-- Users can view preset items for their shops
CREATE POLICY "Users can view own preset items"
  ON preset_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = preset_items.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- Users can create preset items for their shops
CREATE POLICY "Users can create preset items"
  ON preset_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = preset_items.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- Users can update preset items for their shops
CREATE POLICY "Users can update own preset items"
  ON preset_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = preset_items.shop_id
      AND shops.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = preset_items.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- Users can delete preset items for their shops
CREATE POLICY "Users can delete own preset items"
  ON preset_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = preset_items.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to increment receipts_this_month counter
CREATE OR REPLACE FUNCTION increment_monthly_receipts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE shops
  SET receipts_this_month = receipts_this_month + 1
  WHERE id = NEW.shop_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment counter on new receipt
CREATE TRIGGER on_receipt_created
  AFTER INSERT ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION increment_monthly_receipts();

-- Function to reset monthly counters (run via cron job on 1st of month)
CREATE OR REPLACE FUNCTION reset_monthly_receipts()
RETURNS void AS $$
BEGIN
  UPDATE shops SET receipts_this_month = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
