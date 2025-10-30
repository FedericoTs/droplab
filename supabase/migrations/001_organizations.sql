-- Migration 001: Organizations Table (Multi-Tenancy Root)
-- This is the foundation table that all other tables reference
-- Every organization is completely isolated via Row-Level Security

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-safe identifier (e.g., 'acme-corp')

  -- Subscription & Billing
  plan_tier TEXT NOT NULL DEFAULT 'free', -- free, starter, professional, enterprise
  billing_status TEXT NOT NULL DEFAULT 'active', -- active, past_due, cancelled, trialing
  trial_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE, -- For Stripe integration (Phase 9)
  stripe_subscription_id TEXT,

  -- Brand Kit (stored at org level for reuse across all templates)
  brand_logo_url TEXT,
  brand_primary_color TEXT DEFAULT '#3B82F6', -- Blue
  brand_secondary_color TEXT DEFAULT '#8B5CF6', -- Purple
  brand_accent_color TEXT DEFAULT '#F59E0B', -- Orange
  brand_font_headline TEXT DEFAULT 'Inter',
  brand_font_body TEXT DEFAULT 'Inter',
  brand_voice_guidelines JSONB DEFAULT '{}'::jsonb, -- AI copywriting guidance

  -- Usage Limits (enforced by application logic)
  monthly_design_limit INTEGER DEFAULT 100,
  monthly_sends_limit INTEGER DEFAULT 1000,
  storage_limit_mb INTEGER DEFAULT 1000,

  -- Credits for Data Axle contact purchases (Phase 5)
  credits NUMERIC(12,2) DEFAULT 0.00,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_plan_tier ON organizations(plan_tier);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON organizations(stripe_customer_id);

-- Enable Row-Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own organization
-- This prevents User A from seeing User B's organization data
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Owners and admins can update their organization
CREATE POLICY "Owners and admins can update their organization"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Updated_at trigger function (reusable across all tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE organizations IS 'Multi-tenant organization root. All other tables reference this via organization_id with RLS policies.';
COMMENT ON COLUMN organizations.slug IS 'URL-safe identifier for organization (e.g., acme-corp). Used in URLs and subdomains.';
COMMENT ON COLUMN organizations.brand_voice_guidelines IS 'JSONB object with AI copywriting guidelines: { "tone": "professional", "keywords": ["quality", "innovation"], "avoid": ["cheap"] }';
COMMENT ON COLUMN organizations.credits IS 'Prepaid credits for Data Axle contact purchases. $1 credit = 1 contact at $0.25/contact wholesale.';
