-- Migration 002: Design Templates (Fabric.js Canvas Storage)
-- Core template system for AI-powered direct mail designs

CREATE TABLE design_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template Metadata
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('postcard', 'letter', 'flyer', 'brochure', 'custom')),
  dimensions_width INTEGER NOT NULL, -- in pixels (e.g., 6" x 4" = 1800 x 1200 at 300 DPI)
  dimensions_height INTEGER NOT NULL,

  -- Fabric.js Canvas State (CRITICAL)
  fabric_json JSONB NOT NULL, -- Complete Fabric.js canvas.toJSON() output
  variable_mappings JSONB, -- Index-based map: { "0": { variableType: "logo", isReusable: true }, ... }

  -- AI-Generated Background
  background_image_url TEXT, -- Supabase Storage path for reusable AI background
  background_prompt TEXT, -- Original DALL-E prompt for regeneration

  -- Template Performance & Analytics
  usage_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2), -- Percentage (e.g., 3.45 for 3.45%)
  avg_response_time DECIMAL(8,2), -- Average hours to first response

  -- Preview & Thumbnail
  preview_image_url TEXT, -- 800x600 preview for gallery
  thumbnail_url TEXT, -- 200x150 thumbnail for lists

  -- Template Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  is_public BOOLEAN DEFAULT false, -- Marketplace visibility

  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_templates_org ON design_templates(organization_id);
CREATE INDEX idx_templates_category ON design_templates(category);
CREATE INDEX idx_templates_status ON design_templates(status);
CREATE INDEX idx_templates_public ON design_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_templates_performance ON design_templates(conversion_rate DESC, usage_count DESC);

-- Full-text search on template names and descriptions
CREATE INDEX idx_templates_search ON design_templates USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Row-Level Security
ALTER TABLE design_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates from their organization"
  ON design_templates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
    OR is_public = true -- Anyone can view public marketplace templates
  );

CREATE POLICY "Users can create templates in their organization"
  ON design_templates FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Users can update their organization's templates"
  ON design_templates FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Users can delete their organization's templates"
  ON design_templates FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Template Versions (for revision history and rollback)
CREATE TABLE template_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES design_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,

  -- Snapshot of template state
  fabric_json JSONB NOT NULL,
  variable_mappings JSONB,
  background_image_url TEXT,

  -- Change metadata
  change_description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(template_id, version_number)
);

CREATE INDEX idx_template_versions_template ON template_versions(template_id, version_number DESC);

ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of their organization's templates"
  ON template_versions FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM design_templates
      WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles
        WHERE user_id = auth.uid()
      )
    )
  );

-- Trigger to increment version number automatically
CREATE OR REPLACE FUNCTION create_template_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Only create version if fabric_json changed
  IF OLD.fabric_json IS DISTINCT FROM NEW.fabric_json THEN
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
    FROM template_versions
    WHERE template_id = NEW.id;

    INSERT INTO template_versions (
      template_id,
      version_number,
      fabric_json,
      variable_mappings,
      background_image_url,
      created_by
    ) VALUES (
      NEW.id,
      next_version,
      NEW.fabric_json,
      NEW.variable_mappings,
      NEW.background_image_url,
      NEW.created_by
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER template_version_trigger
  AFTER UPDATE ON design_templates
  FOR EACH ROW
  EXECUTE FUNCTION create_template_version();

-- Updated_at trigger
CREATE TRIGGER update_design_templates_updated_at
  BEFORE UPDATE ON design_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE design_templates
  SET usage_count = usage_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;
