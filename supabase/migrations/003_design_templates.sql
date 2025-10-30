-- Migration 003: Design Templates Table (Fabric.js Canvas Storage)
-- Stores reusable direct mail design templates with variable data printing (VDP) support
-- Critical: Variable mappings stored SEPARATELY from canvas_json (Fabric.js v6 limitation)

-- Create design_templates table
CREATE TABLE IF NOT EXISTS design_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Template Metadata
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT, -- 400x400 preview image (Supabase Storage)
  tags TEXT[] DEFAULT ARRAY[]::TEXT[], -- Searchable tags: ['real-estate', 'postcard', 'modern']

  -- Fabric.js Canvas State (Complete canvas JSON from toJSON())
  canvas_json JSONB NOT NULL,
  canvas_width INTEGER NOT NULL, -- Pixels at 300 DPI (e.g., 1800 for 6" width)
  canvas_height INTEGER NOT NULL,

  -- CRITICAL: Variable Mappings (Stored Separately)
  -- Fabric.js v6 does NOT serialize custom properties via toJSON()
  -- We store variable markers separately and apply them on load
  -- Structure: { "0": { "variableType": "recipientName", "isReusable": false }, "1": { "variableType": "logo", "isReusable": true } }
  -- Key = canvas object index (0, 1, 2, ...), Value = variable metadata
  variable_mappings JSONB DEFAULT '{}'::jsonb,

  -- Format & Physical Dimensions
  format_type TEXT NOT NULL DEFAULT 'postcard_4x6',
  -- Options: postcard_4x6, postcard_6x9, postcard_6x11, letter_8.5x11, selfmailer_11x17, doorhanger_4x11
  format_width_inches NUMERIC(5,3) NOT NULL DEFAULT 6.000, -- Physical print width
  format_height_inches NUMERIC(5,3) NOT NULL DEFAULT 4.000, -- Physical print height
  postal_country TEXT DEFAULT 'US', -- US, CA, UK, AU

  -- Postal Compliance (Phase 4)
  compliance_validated BOOLEAN DEFAULT false,
  compliance_issues JSONB DEFAULT '[]'::jsonb,
  -- Example: [{ "type": "address_block_missing", "severity": "error", "message": "..." }, { "type": "barcode_clearance", "severity": "warning" }]
  last_compliance_check_at TIMESTAMPTZ,

  -- AI-Generated Background (Reused for all recipients - cost optimization)
  background_image_url TEXT, -- AI-generated background via DALL-E
  background_generation_prompt TEXT,
  background_cost NUMERIC(10,4) DEFAULT 0.0000, -- Track AI generation cost ($0.04-0.08 per image)

  -- Template Marketplace (Phase 7)
  is_public BOOLEAN DEFAULT false, -- Public in marketplace vs private to organization
  marketplace_category TEXT, -- real_estate, retail, healthcare, automotive, nonprofit, generic
  marketplace_subcategory TEXT, -- open_house, sale_announcement, new_listing
  marketplace_price NUMERIC(10,2) DEFAULT 0.00, -- Price for others to purchase ($0 = free)
  marketplace_license_type TEXT DEFAULT 'single_use', -- single_use, unlimited, commercial
  marketplace_rating NUMERIC(3,2), -- Average rating 1.00-5.00
  marketplace_total_ratings INTEGER DEFAULT 0,
  marketplace_featured BOOLEAN DEFAULT false, -- Featured in marketplace

  -- Network Effects Data (Performance tracking feeds AI recommendations)
  usage_count INTEGER DEFAULT 0, -- How many campaigns have used this template
  total_campaigns_using INTEGER DEFAULT 0,
  avg_response_rate NUMERIC(5,2), -- Average response rate across all campaigns using this template
  avg_conversion_rate NUMERIC(5,2), -- Average conversion rate
  total_recipients_reached INTEGER DEFAULT 0, -- Total mail pieces sent using this template

  -- Version Control (for template variations)
  parent_template_id UUID REFERENCES design_templates(id) ON DELETE SET NULL,
  version_number INTEGER DEFAULT 1,
  is_latest_version BOOLEAN DEFAULT true,

  -- Status & Lifecycle
  status TEXT DEFAULT 'draft', -- draft, active, archived, deleted
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete for audit trail
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_templates_org ON design_templates(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_templates_creator ON design_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_format ON design_templates(organization_id, format_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_templates_status ON design_templates(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_templates_tags ON design_templates USING GIN (tags);

-- Marketplace indexes (for public templates)
CREATE INDEX IF NOT EXISTS idx_templates_marketplace
  ON design_templates(is_public, marketplace_category, marketplace_rating DESC)
  WHERE is_public = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_templates_marketplace_featured
  ON design_templates(marketplace_featured, marketplace_rating DESC)
  WHERE is_public = true AND marketplace_featured = true AND deleted_at IS NULL;

-- Performance tracking index (for AI recommendations)
CREATE INDEX IF NOT EXISTS idx_templates_performance
  ON design_templates(avg_response_rate DESC NULLS LAST, avg_conversion_rate DESC NULLS LAST)
  WHERE deleted_at IS NULL;

-- Full-text search index on template content
CREATE INDEX IF NOT EXISTS idx_templates_search
  ON design_templates USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- GIN index for JSONB queries on canvas_json
CREATE INDEX IF NOT EXISTS idx_templates_canvas_json ON design_templates USING GIN (canvas_json);

-- GIN index for variable_mappings
CREATE INDEX IF NOT EXISTS idx_templates_variable_mappings ON design_templates USING GIN (variable_mappings);

-- Enable Row-Level Security
ALTER TABLE design_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their organization's templates + public marketplace templates
CREATE POLICY "Users can view accessible templates"
  ON design_templates FOR SELECT
  USING (
    (
      -- Own organization's templates
      organization_id IN (
        SELECT organization_id
        FROM user_profiles
        WHERE id = auth.uid()
      )
    )
    OR
    (
      -- Public marketplace templates
      is_public = true AND status = 'active' AND deleted_at IS NULL
    )
  );

-- RLS Policy: Designers can create templates in their organization
CREATE POLICY "Designers can create templates"
  ON design_templates FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
      AND can_create_designs = true
    )
  );

-- RLS Policy: Users can update their own templates
CREATE POLICY "Users can update own templates"
  ON design_templates FOR UPDATE
  USING (
    created_by = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Admins can update any template in their org
CREATE POLICY "Admins can update organization templates"
  ON design_templates FOR UPDATE
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

-- RLS Policy: Owners can delete templates (soft delete)
CREATE POLICY "Owners can delete templates"
  ON design_templates FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_design_templates_updated_at
  BEFORE UPDATE ON design_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment template usage count when used in campaign
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE design_templates
  SET
    usage_count = usage_count + 1,
    total_campaigns_using = total_campaigns_using + 1,
    updated_at = NOW()
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update template performance metrics (called when campaign completes)
CREATE OR REPLACE FUNCTION update_template_performance(
  template_id UUID,
  new_response_rate NUMERIC,
  new_conversion_rate NUMERIC,
  recipients_count INTEGER
)
RETURNS VOID AS $$
DECLARE
  current_avg_response NUMERIC;
  current_avg_conversion NUMERIC;
  current_total_recipients INTEGER;
BEGIN
  -- Get current values
  SELECT
    COALESCE(avg_response_rate, 0),
    COALESCE(avg_conversion_rate, 0),
    COALESCE(total_recipients_reached, 0)
  INTO
    current_avg_response,
    current_avg_conversion,
    current_total_recipients
  FROM design_templates
  WHERE id = template_id;

  -- Calculate weighted average (more recipients = more weight)
  UPDATE design_templates
  SET
    avg_response_rate = (
      (current_avg_response * current_total_recipients + new_response_rate * recipients_count) /
      (current_total_recipients + recipients_count)
    ),
    avg_conversion_rate = (
      (current_avg_conversion * current_total_recipients + new_conversion_rate * recipients_count) /
      (current_total_recipients + recipients_count)
    ),
    total_recipients_reached = current_total_recipients + recipients_count,
    updated_at = NOW()
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE design_templates IS 'Reusable Fabric.js design templates with VDP support. Variable mappings stored separately from canvas_json (Fabric.js v6 limitation).';
COMMENT ON COLUMN design_templates.canvas_json IS 'Complete Fabric.js canvas state from toJSON(). Contains all objects, layers, positions, styles.';
COMMENT ON COLUMN design_templates.variable_mappings IS 'Separate storage for variable markers. Structure: {"objectIndex": {"variableType": "name", "isReusable": false}}';
COMMENT ON COLUMN design_templates.format_type IS 'Physical mail format: postcard_4x6, postcard_6x9, letter_8.5x11, selfmailer_11x17, doorhanger_4x11';
COMMENT ON COLUMN design_templates.compliance_issues IS 'Array of validation issues: [{"type": "address_block_missing", "severity": "error", "message": "..."}]';
COMMENT ON COLUMN design_templates.background_image_url IS 'AI-generated background image (DALL-E). Reused for all recipients to save cost.';
COMMENT ON COLUMN design_templates.avg_response_rate IS 'Network effects: Average response rate across all campaigns. Feeds AI recommendations.';
