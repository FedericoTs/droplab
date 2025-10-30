-- Migration 004: Design Assets Table (Images, Logos, Fonts, Icons)
-- Stores all uploaded and AI-generated assets used in design templates
-- Integrated with Supabase Storage for file hosting

-- Create design_assets table
CREATE TABLE IF NOT EXISTS design_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),

  -- Asset Metadata
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL, -- logo, image, font, icon, svg, background
  mime_type TEXT NOT NULL, -- image/png, image/jpeg, image/svg+xml, font/woff2, etc.
  file_size_bytes INTEGER NOT NULL,
  storage_url TEXT NOT NULL, -- Supabase Storage path: 'design-assets/{org_id}/{asset_id}.png'

  -- Image Dimensions (for images/photos)
  width_px INTEGER,
  height_px INTEGER,
  dpi INTEGER, -- Dots per inch (300 recommended for print quality)
  aspect_ratio NUMERIC(10,4), -- width/height for quick filtering

  -- Categorization & Organization
  tags TEXT[] DEFAULT ARRAY[]::TEXT[], -- Searchable tags: ['company-logo', 'header', 'blue']
  folder TEXT DEFAULT 'uncategorized', -- Folder path for organization: 'logos', 'backgrounds/real-estate'
  is_brand_asset BOOLEAN DEFAULT false, -- True for company logo, brand colors, etc.

  -- AI Analysis (for searchability and auto-tagging)
  ai_description TEXT, -- Claude-generated description: "Modern blue minimalist logo with geometric shapes"
  ai_suggested_tags TEXT[], -- AI-suggested tags for better search
  dominant_colors TEXT[], -- Hex codes extracted from image: ['#3B82F6', '#8B5CF6']
  ai_category TEXT, -- AI-detected category: 'logo', 'photo', 'illustration', 'texture'

  -- Usage Tracking
  usage_count INTEGER DEFAULT 0, -- How many templates use this asset
  last_used_at TIMESTAMPTZ,

  -- Source & Attribution
  source_type TEXT DEFAULT 'upload', -- upload, ai_generated, stock, url_import
  source_url TEXT, -- Original URL if imported
  ai_generation_prompt TEXT, -- DALL-E prompt if AI-generated
  ai_generation_cost NUMERIC(10,4), -- Cost if AI-generated

  -- License & Rights
  license_type TEXT DEFAULT 'owned', -- owned, stock, creative_commons, royalty_free
  license_details JSONB,
  copyright_holder TEXT,

  -- Status
  status TEXT DEFAULT 'active', -- active, archived, deleted
  archived_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_org ON design_assets(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assets_uploader ON design_assets(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_assets_type ON design_assets(organization_id, asset_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assets_folder ON design_assets(organization_id, folder) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assets_brand ON design_assets(organization_id, is_brand_asset) WHERE is_brand_asset = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assets_tags ON design_assets USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_assets_ai_tags ON design_assets USING GIN (ai_suggested_tags);
CREATE INDEX IF NOT EXISTS idx_assets_dominant_colors ON design_assets USING GIN (dominant_colors);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_assets_search
  ON design_assets USING GIN (
    to_tsvector('english',
      name || ' ' ||
      COALESCE(ai_description, '') || ' ' ||
      COALESCE(array_to_string(tags, ' '), '')
    )
  );

-- Enable Row-Level Security
ALTER TABLE design_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their organization's assets
CREATE POLICY "Users can view their organization's assets"
  ON design_assets FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can upload assets to their organization
CREATE POLICY "Users can upload assets"
  ON design_assets FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can update their own assets
CREATE POLICY "Users can update own assets"
  ON design_assets FOR UPDATE
  USING (
    uploaded_by = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    uploaded_by = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Admins can update any asset in their org
CREATE POLICY "Admins can update organization assets"
  ON design_assets FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- RLS Policy: Users can delete their own assets
CREATE POLICY "Users can delete own assets"
  ON design_assets FOR DELETE
  USING (
    uploaded_by = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_design_assets_updated_at
  BEFORE UPDATE ON design_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment asset usage count
CREATE OR REPLACE FUNCTION increment_asset_usage(asset_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE design_assets
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE id = asset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate storage usage for an organization
CREATE OR REPLACE FUNCTION get_organization_storage_usage(org_id UUID)
RETURNS BIGINT AS $$
DECLARE
  total_bytes BIGINT;
BEGIN
  SELECT COALESCE(SUM(file_size_bytes), 0)
  INTO total_bytes
  FROM design_assets
  WHERE organization_id = org_id
  AND deleted_at IS NULL;

  RETURN total_bytes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get storage usage in MB
CREATE OR REPLACE FUNCTION get_organization_storage_mb(org_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN ROUND(get_organization_storage_usage(org_id)::NUMERIC / 1024 / 1024, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if organization is within storage limit
CREATE OR REPLACE FUNCTION check_storage_limit(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_mb NUMERIC;
  limit_mb INTEGER;
BEGIN
  -- Get current usage
  current_mb := get_organization_storage_mb(org_id);

  -- Get limit from organization
  SELECT storage_limit_mb INTO limit_mb
  FROM organizations
  WHERE id = org_id;

  RETURN current_mb < limit_mb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE design_assets IS 'All uploaded and AI-generated assets (images, logos, fonts, icons) used in design templates. Integrated with Supabase Storage.';
COMMENT ON COLUMN design_assets.storage_url IS 'Supabase Storage path. Format: design-assets/{org_id}/{asset_id}.{ext}';
COMMENT ON COLUMN design_assets.dpi IS 'Dots per inch. 300 DPI recommended for print quality. 72 DPI for web.';
COMMENT ON COLUMN design_assets.ai_description IS 'Claude-generated description for better searchability and accessibility.';
COMMENT ON COLUMN design_assets.dominant_colors IS 'Array of hex color codes extracted from image. Used for color-based search and palette matching.';
COMMENT ON COLUMN design_assets.usage_count IS 'Number of templates using this asset. Helps identify popular assets and safe-to-delete candidates.';
COMMENT ON COLUMN design_assets.is_brand_asset IS 'Flag for company logo, brand colors, official fonts. These are protected and highlighted in asset library.';
