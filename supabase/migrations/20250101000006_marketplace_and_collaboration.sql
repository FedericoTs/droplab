-- Migration 006: Marketplace & Collaboration
-- Template marketplace, ratings/reviews, team collaboration, and shared workspaces

-- Marketplace Templates (public templates available for purchase/use)
CREATE TABLE marketplace_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES design_templates(id) ON DELETE CASCADE,
  creator_organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Marketplace Listing
  listing_title TEXT NOT NULL,
  listing_description TEXT,
  category TEXT[], -- Array: ['real_estate', 'automotive', 'retail']
  tags TEXT[], -- Array: ['modern', 'minimalist', 'bold']

  -- Pricing
  price DECIMAL(8,2) NOT NULL DEFAULT 0.00, -- 0.00 = free
  pricing_model TEXT DEFAULT 'one_time' CHECK (pricing_model IN ('free', 'one_time', 'subscription')),
  license_type TEXT DEFAULT 'standard' CHECK (license_type IN ('personal', 'commercial', 'enterprise')),

  -- Performance Metrics (social proof)
  total_purchases INTEGER DEFAULT 0,
  total_uses INTEGER DEFAULT 0,
  avg_conversion_rate DECIMAL(5,2), -- Aggregated from users who share their stats
  avg_rating DECIMAL(3,2), -- 0.00 to 5.00

  -- Visibility
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false, -- Admin approval required
  featured_priority INTEGER DEFAULT 0, -- Higher = shown first

  -- Revenue Sharing
  creator_revenue_share DECIMAL(10,2) DEFAULT 0.00,
  platform_fee_percentage DECIMAL(5,2) DEFAULT 20.00, -- 20% platform fee

  -- Audit Trail
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_marketplace_templates_category ON marketplace_templates USING gin(category);
CREATE INDEX idx_marketplace_templates_tags ON marketplace_templates USING gin(tags);
CREATE INDEX idx_marketplace_templates_featured ON marketplace_templates(is_featured, featured_priority DESC);
CREATE INDEX idx_marketplace_templates_performance ON marketplace_templates(avg_conversion_rate DESC, total_uses DESC);

-- Full-text search
CREATE INDEX idx_marketplace_search ON marketplace_templates USING gin(
  to_tsvector('english', listing_title || ' ' || COALESCE(listing_description, '') || ' ' || array_to_string(tags, ' '))
);

-- Row-Level Security
ALTER TABLE marketplace_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved marketplace templates"
  ON marketplace_templates FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Creators can manage their marketplace listings"
  ON marketplace_templates FOR ALL
  USING (
    creator_organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Template Purchases (track who bought what)
CREATE TABLE template_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  marketplace_template_id UUID NOT NULL REFERENCES marketplace_templates(id),
  buyer_organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Purchase Details
  price_paid DECIMAL(8,2) NOT NULL,
  license_type TEXT NOT NULL,

  -- Payment
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,

  -- Audit Trail
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_purchases_marketplace ON template_purchases(marketplace_template_id);
CREATE INDEX idx_purchases_buyer ON template_purchases(buyer_organization_id);

-- Row-Level Security
ALTER TABLE template_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's purchases"
  ON template_purchases FOR SELECT
  USING (
    buyer_organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

-- Template Reviews (ratings and feedback)
CREATE TABLE template_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  marketplace_template_id UUID NOT NULL REFERENCES marketplace_templates(id) ON DELETE CASCADE,
  reviewer_organization_id UUID NOT NULL REFERENCES organizations(id),
  reviewer_user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Review Content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title TEXT,
  review_text TEXT,

  -- Verification
  is_verified_purchase BOOLEAN DEFAULT false, -- Did they actually buy it?

  -- Helpfulness
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(marketplace_template_id, reviewer_organization_id) -- One review per org
);

-- Indexes
CREATE INDEX idx_reviews_marketplace ON template_reviews(marketplace_template_id);
CREATE INDEX idx_reviews_rating ON template_reviews(rating DESC);

-- Row-Level Security
ALTER TABLE template_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews"
  ON template_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for purchased templates"
  ON template_reviews FOR INSERT
  WITH CHECK (
    reviewer_user_id = auth.uid() AND
    reviewer_organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own reviews"
  ON template_reviews FOR UPDATE
  USING (reviewer_user_id = auth.uid());

-- Trigger to update marketplace template rating
CREATE OR REPLACE FUNCTION update_marketplace_template_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE marketplace_templates
  SET avg_rating = (
    SELECT AVG(rating)::DECIMAL(3,2)
    FROM template_reviews
    WHERE marketplace_template_id = COALESCE(NEW.marketplace_template_id, OLD.marketplace_template_id)
  )
  WHERE id = COALESCE(NEW.marketplace_template_id, OLD.marketplace_template_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER review_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON template_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_template_rating();

-- Collaboration: Shared Workspaces
CREATE TABLE shared_workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Workspace Metadata
  name TEXT NOT NULL,
  description TEXT,
  color TEXT, -- Hex color for UI

  -- Access Control
  is_default BOOLEAN DEFAULT false, -- Default workspace for new members

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_workspaces_org ON shared_workspaces(organization_id);

-- Row-Level Security
ALTER TABLE shared_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspaces in their organization"
  ON shared_workspaces FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage workspaces"
  ON shared_workspaces FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Workspace Members (assign users to workspaces)
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES shared_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Member Role in Workspace
  workspace_role TEXT DEFAULT 'member' CHECK (workspace_role IN ('admin', 'editor', 'member', 'viewer')),

  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),

  UNIQUE(workspace_id, user_id)
);

-- Indexes
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

-- Row-Level Security
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace members in their workspaces"
  ON workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM shared_workspaces
      WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles
        WHERE user_id = auth.uid()
      )
    )
  );

-- Template-Workspace Association (organize templates by workspace)
CREATE TABLE workspace_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES shared_workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES design_templates(id) ON DELETE CASCADE,

  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),

  UNIQUE(workspace_id, template_id)
);

-- Indexes
CREATE INDEX idx_workspace_templates_workspace ON workspace_templates(workspace_id);
CREATE INDEX idx_workspace_templates_template ON workspace_templates(template_id);

-- Row-Level Security
ALTER TABLE workspace_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view templates in their workspace"
  ON workspace_templates FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Comments on Templates (collaboration feedback)
CREATE TABLE template_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES design_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Comment Content
  comment_text TEXT NOT NULL,
  parent_comment_id UUID REFERENCES template_comments(id), -- For threaded replies

  -- Positioning (for design annotations)
  canvas_position JSONB, -- { x, y } coordinates on canvas

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_comments_template ON template_comments(template_id, created_at DESC);
CREATE INDEX idx_comments_parent ON template_comments(parent_comment_id);

-- Row-Level Security
ALTER TABLE template_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on templates in their organization"
  ON template_comments FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM design_templates
      WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create comments on templates in their organization"
  ON template_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    template_id IN (
      SELECT id FROM design_templates
      WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles
        WHERE user_id = auth.uid()
      )
    )
  );

-- Updated_at triggers
CREATE TRIGGER update_marketplace_templates_updated_at
  BEFORE UPDATE ON marketplace_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_reviews_updated_at
  BEFORE UPDATE ON template_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_workspaces_updated_at
  BEFORE UPDATE ON shared_workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_comments_updated_at
  BEFORE UPDATE ON template_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
