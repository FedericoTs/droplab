-- Migration 001: Organizations & Brand Kits
-- Creates multi-tenant foundation with organization management and brand identity storage

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table (multi-tenancy root)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  industry TEXT,
  website_url TEXT,
  logo_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Brand Kits table (visual identity + AI-extracted brand intelligence)
CREATE TABLE brand_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,

  -- Visual Identity
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  heading_font TEXT,
  body_font TEXT,
  logo_storage_path TEXT, -- Supabase Storage path

  -- AI-Extracted Brand Intelligence
  brand_voice TEXT,
  brand_tone TEXT,
  target_audience TEXT,
  key_phrases TEXT[], -- Array of characteristic phrases
  brand_values TEXT[], -- Array of core values

  -- Landing Page Template
  landing_page_template TEXT, -- Template identifier

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,

  UNIQUE(organization_id, name)
);

-- Indexes for performance
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_stripe_customer ON organizations(stripe_customer_id);
CREATE INDEX idx_brand_kits_org ON brand_kits(organization_id);
CREATE INDEX idx_brand_kits_primary ON brand_kits(organization_id, is_primary) WHERE is_primary = true;

-- Row-Level Security (RLS) Policies

-- Organizations: Users can only see their own organization
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can update their organization"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Brand Kits: Users can only access brand kits from their organization
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view brand kits from their organization"
  ON brand_kits FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create brand kits in their organization"
  ON brand_kits FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Users can update brand kits in their organization"
  ON brand_kits FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Users can delete brand kits in their organization"
  ON brand_kits FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- User-Organization-Role mapping (for RLS)
CREATE TABLE user_organization_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_user_org_roles_user ON user_organization_roles(user_id);
CREATE INDEX idx_user_org_roles_org ON user_organization_roles(organization_id);

ALTER TABLE user_organization_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own organization roles"
  ON user_organization_roles FOR SELECT
  USING (user_id = auth.uid());

-- Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_kits_updated_at
  BEFORE UPDATE ON brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_organization_roles_updated_at
  BEFORE UPDATE ON user_organization_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create organization and assign owner role
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  org_name TEXT,
  org_slug TEXT,
  user_id UUID
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create organization
  INSERT INTO organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO new_org_id;

  -- Assign owner role
  INSERT INTO user_organization_roles (user_id, organization_id, role)
  VALUES (user_id, new_org_id, 'owner');

  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
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
-- Migration 003: Campaigns & Recipients (VDP Engine)
-- Variable Data Printing system for personalized direct mail at scale

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES design_templates(id),

  -- Campaign Metadata
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT CHECK (campaign_type IN ('postcard', 'letter', 'catalog', 'selfmailer')),

  -- Scheduling
  scheduled_launch_date TIMESTAMPTZ,
  actual_launch_date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'processing', 'sent', 'completed', 'paused', 'canceled')),

  -- Budget & Cost Tracking
  budget_total DECIMAL(10,2),
  cost_per_piece DECIMAL(6,2),
  estimated_total_cost DECIMAL(10,2),
  actual_total_cost DECIMAL(10,2),

  -- Targeting (Data Axle integration)
  data_axle_audience_filter JSONB, -- Stored filter criteria for re-use
  data_axle_count_estimate INTEGER,

  -- Performance Goals
  target_response_rate DECIMAL(5,2),
  target_conversions INTEGER,

  -- Fulfillment (PostGrid integration)
  postgrid_template_id TEXT,
  postgrid_batch_id TEXT,
  print_status TEXT CHECK (print_status IN ('pending', 'processing', 'printed', 'shipped', 'delivered', 'failed')),

  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_campaigns_org ON campaigns(organization_id);
CREATE INDEX idx_campaigns_template ON campaigns(template_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_launch_date ON campaigns(scheduled_launch_date);

-- Row-Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaigns from their organization"
  ON campaigns FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create campaigns in their organization"
  ON campaigns FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Users can update their organization's campaigns"
  ON campaigns FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Users can delete their organization's campaigns"
  ON campaigns FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Recipients table (VDP personalization data)
CREATE TABLE recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Recipient Identity (PII)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email TEXT,
  phone TEXT,

  -- Mailing Address
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT DEFAULT 'US',

  -- Personalization Variables (VDP fields)
  custom_fields JSONB, -- e.g., { "discount_code": "SAVE20", "expiration_date": "2025-12-31" }

  -- Tracking
  tracking_id TEXT UNIQUE NOT NULL, -- Unique QR code identifier
  landing_page_url TEXT, -- Generated landing page URL

  -- Delivery Status
  mail_status TEXT DEFAULT 'pending' CHECK (mail_status IN ('pending', 'printed', 'shipped', 'delivered', 'returned', 'failed')),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Engagement Tracking (linked to analytics)
  qr_scanned BOOLEAN DEFAULT false,
  qr_scan_count INTEGER DEFAULT 0,
  first_scan_at TIMESTAMPTZ,
  landing_page_visited BOOLEAN DEFAULT false,
  converted BOOLEAN DEFAULT false,
  conversion_value DECIMAL(10,2),

  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_recipients_campaign ON recipients(campaign_id);
CREATE INDEX idx_recipients_tracking ON recipients(tracking_id);
CREATE INDEX idx_recipients_email ON recipients(email);
CREATE INDEX idx_recipients_mail_status ON recipients(mail_status);
CREATE INDEX idx_recipients_engagement ON recipients(qr_scanned, landing_page_visited, converted);

-- Row-Level Security
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recipients from their organization's campaigns"
  ON recipients FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create recipients in their organization's campaigns"
  ON recipients FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

CREATE POLICY "Users can update recipients in their organization's campaigns"
  ON recipients FOR UPDATE
  USING (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

CREATE POLICY "Users can delete recipients in their organization's campaigns"
  ON recipients FOR DELETE
  USING (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- Campaign statistics view (denormalized for performance)
CREATE TABLE campaign_stats (
  campaign_id UUID PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Counts
  total_recipients INTEGER DEFAULT 0,
  total_printed INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_returned INTEGER DEFAULT 0,

  -- Engagement
  total_qr_scans INTEGER DEFAULT 0,
  unique_scanners INTEGER DEFAULT 0,
  total_landing_page_visits INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,

  -- Rates (%)
  delivery_rate DECIMAL(5,2),
  response_rate DECIMAL(5,2),
  conversion_rate DECIMAL(5,2),

  -- Revenue
  total_revenue DECIMAL(12,2),
  roi DECIMAL(8,2), -- Return on investment %

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update campaign stats (called after recipient updates)
CREATE OR REPLACE FUNCTION update_campaign_stats(p_campaign_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO campaign_stats (campaign_id, total_recipients, total_delivered, total_qr_scans, unique_scanners, total_conversions, total_revenue)
  SELECT
    p_campaign_id,
    COUNT(*),
    COUNT(*) FILTER (WHERE mail_status = 'delivered'),
    SUM(qr_scan_count),
    COUNT(*) FILTER (WHERE qr_scanned = true),
    COUNT(*) FILTER (WHERE converted = true),
    SUM(conversion_value)
  FROM recipients
  WHERE campaign_id = p_campaign_id
  ON CONFLICT (campaign_id) DO UPDATE SET
    total_recipients = EXCLUDED.total_recipients,
    total_delivered = EXCLUDED.total_delivered,
    total_qr_scans = EXCLUDED.total_qr_scans,
    unique_scanners = EXCLUDED.unique_scanners,
    total_conversions = EXCLUDED.total_conversions,
    total_revenue = EXCLUDED.total_revenue,
    delivery_rate = CASE
      WHEN EXCLUDED.total_recipients > 0
      THEN (EXCLUDED.total_delivered::DECIMAL / EXCLUDED.total_recipients * 100)
      ELSE 0
    END,
    response_rate = CASE
      WHEN EXCLUDED.total_delivered > 0
      THEN (EXCLUDED.unique_scanners::DECIMAL / EXCLUDED.total_delivered * 100)
      ELSE 0
    END,
    conversion_rate = CASE
      WHEN EXCLUDED.unique_scanners > 0
      THEN (EXCLUDED.total_conversions::DECIMAL / EXCLUDED.unique_scanners * 100)
      ELSE 0
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update campaign stats
CREATE OR REPLACE FUNCTION trigger_update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_campaign_stats(COALESCE(NEW.campaign_id, OLD.campaign_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipient_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON recipients
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_campaign_stats();

-- Updated_at triggers
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipients_updated_at
  BEFORE UPDATE ON recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- Migration 004: Analytics & Performance Tracking
-- Event tracking, landing page analytics, conversion funnels, and ElevenLabs call integration

-- Events table (granular tracking for all user interactions)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES recipients(id) ON DELETE CASCADE,

  -- Event Classification
  event_type TEXT NOT NULL CHECK (event_type IN (
    'qr_scan',
    'landing_page_view',
    'form_submission',
    'button_click',
    'video_play',
    'phone_call',
    'email_click',
    'conversion'
  )),
  event_name TEXT NOT NULL,

  -- Event Context
  event_data JSONB, -- Flexible storage for event-specific data
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_org ON events(organization_id);
CREATE INDEX idx_events_campaign ON events(campaign_id);
CREATE INDEX idx_events_recipient ON events(recipient_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created ON events(created_at DESC);

-- Row-Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events from their organization"
  ON events FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public events can be inserted" -- For landing page tracking
  ON events FOR INSERT
  WITH CHECK (true); -- API key validation handled at application level

-- Landing Pages table (personalized landing page content)
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,

  -- Landing Page Content
  template_name TEXT,
  headline TEXT,
  subheadline TEXT,
  body_content TEXT,
  cta_text TEXT,
  cta_url TEXT,

  -- Branding (from brand_kits)
  brand_kit_id UUID REFERENCES brand_kits(id),

  -- Custom Components (JSONB for flexibility)
  components JSONB, -- Array of component definitions

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_landing_pages_org ON landing_pages(organization_id);
CREATE INDEX idx_landing_pages_campaign ON landing_pages(campaign_id);
CREATE INDEX idx_landing_pages_recipient ON landing_pages(recipient_id);

-- Row-Level Security
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view landing pages from their organization"
  ON landing_pages FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create landing pages in their organization"
  ON landing_pages FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

-- ElevenLabs Call Tracking (integrate voice AI with campaigns)
CREATE TABLE elevenlabs_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id),
  recipient_id UUID REFERENCES recipients(id),

  -- ElevenLabs Metadata
  elevenlabs_call_id TEXT UNIQUE NOT NULL,
  agent_id TEXT NOT NULL,

  -- Call Details
  phone_number TEXT NOT NULL,
  call_duration INTEGER, -- seconds
  call_status TEXT CHECK (call_status IN ('initiated', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer', 'busy')),
  call_recording_url TEXT,
  transcript TEXT,

  -- AI Analysis
  sentiment_score DECIMAL(3,2), -- -1.00 to 1.00 (negative to positive)
  intent_detected TEXT, -- e.g., "appointment_request", "complaint", "inquiry"
  key_topics TEXT[], -- Array of extracted topics

  -- Conversion Tracking
  converted BOOLEAN DEFAULT false,
  conversion_value DECIMAL(10,2),

  -- Timing
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Raw API Response (for debugging)
  raw_data JSONB
);

-- Indexes
CREATE INDEX idx_calls_org ON elevenlabs_calls(organization_id);
CREATE INDEX idx_calls_campaign ON elevenlabs_calls(campaign_id);
CREATE INDEX idx_calls_recipient ON elevenlabs_calls(recipient_id);
CREATE INDEX idx_calls_status ON elevenlabs_calls(call_status);
CREATE INDEX idx_calls_phone ON elevenlabs_calls(phone_number);

-- Row-Level Security
ALTER TABLE elevenlabs_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calls from their organization"
  ON elevenlabs_calls FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert calls" -- For ElevenLabs webhook
  ON elevenlabs_calls FOR INSERT
  WITH CHECK (true);

-- Conversion Tracking (high-level conversion events)
CREATE TABLE conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,

  -- Conversion Details
  conversion_type TEXT NOT NULL CHECK (conversion_type IN (
    'appointment_booked',
    'form_submitted',
    'purchase_made',
    'call_completed',
    'email_reply',
    'custom'
  )),
  conversion_value DECIMAL(10,2),
  conversion_data JSONB, -- Additional conversion metadata

  -- Attribution
  source TEXT, -- 'qr_code', 'landing_page', 'phone_call', 'email'
  first_touch_event_id UUID REFERENCES events(id),
  last_touch_event_id UUID REFERENCES events(id),

  -- Timing
  converted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversions_org ON conversions(organization_id);
CREATE INDEX idx_conversions_campaign ON conversions(campaign_id);
CREATE INDEX idx_conversions_recipient ON conversions(recipient_id);
CREATE INDEX idx_conversions_type ON conversions(conversion_type);

-- Row-Level Security
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversions from their organization"
  ON conversions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public conversions can be inserted" -- For landing page forms
  ON conversions FOR INSERT
  WITH CHECK (true);

-- Trigger to update recipient engagement on new conversion
CREATE OR REPLACE FUNCTION update_recipient_on_conversion()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recipients
  SET
    converted = true,
    conversion_value = COALESCE(conversion_value, 0) + COALESCE(NEW.conversion_value, 0)
  WHERE id = NEW.recipient_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversion_recipient_trigger
  AFTER INSERT ON conversions
  FOR EACH ROW
  EXECUTE FUNCTION update_recipient_on_conversion();

-- Trigger to update recipient on QR scan
CREATE OR REPLACE FUNCTION update_recipient_on_qr_scan()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'qr_scan' AND NEW.recipient_id IS NOT NULL THEN
    UPDATE recipients
    SET
      qr_scanned = true,
      qr_scan_count = qr_scan_count + 1,
      first_scan_at = COALESCE(first_scan_at, NEW.created_at)
    WHERE id = NEW.recipient_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_qr_scan_trigger
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_recipient_on_qr_scan();

-- Trigger to update recipient on landing page visit
CREATE OR REPLACE FUNCTION update_recipient_on_landing_visit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'landing_page_view' AND NEW.recipient_id IS NOT NULL THEN
    UPDATE recipients
    SET landing_page_visited = true
    WHERE id = NEW.recipient_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_landing_visit_trigger
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_recipient_on_landing_visit();

-- Updated_at trigger
CREATE TRIGGER update_landing_pages_updated_at
  BEFORE UPDATE ON landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- View for campaign performance dashboard
CREATE VIEW campaign_performance AS
SELECT
  c.id AS campaign_id,
  c.name AS campaign_name,
  c.organization_id,
  cs.total_recipients,
  cs.total_delivered,
  cs.total_qr_scans,
  cs.unique_scanners,
  cs.total_conversions,
  cs.total_revenue,
  cs.delivery_rate,
  cs.response_rate,
  cs.conversion_rate,
  cs.roi,
  COUNT(DISTINCT e.id) FILTER (WHERE e.event_type = 'landing_page_view') AS landing_page_views,
  COUNT(DISTINCT ec.id) AS total_calls,
  AVG(ec.call_duration) AS avg_call_duration
FROM campaigns c
LEFT JOIN campaign_stats cs ON c.id = cs.campaign_id
LEFT JOIN events e ON c.id = e.campaign_id
LEFT JOIN elevenlabs_calls ec ON c.id = ec.campaign_id
GROUP BY c.id, c.name, c.organization_id, cs.total_recipients, cs.total_delivered,
         cs.total_qr_scans, cs.unique_scanners, cs.total_conversions, cs.total_revenue,
         cs.delivery_rate, cs.response_rate, cs.conversion_rate, cs.roi;
-- Migration 005: Postal Compliance Rules
-- USPS validation, address verification, CASS certification, and compliance checks

-- Postal Compliance Rules (configurable per organization)
CREATE TABLE postal_compliance_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Rule Configuration
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'address_validation',
    'cass_certification',
    'ncoa_processing', -- National Change of Address
    'usps_regulations',
    'text_size',
    'color_contrast',
    'barcode_placement',
    'custom'
  )),
  is_enabled BOOLEAN DEFAULT true,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('error', 'warning', 'info')),

  -- Rule Logic (JSONB for flexibility)
  validation_criteria JSONB NOT NULL,
  error_message TEXT,

  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_compliance_rules_org ON postal_compliance_rules(organization_id);
CREATE INDEX idx_compliance_rules_type ON postal_compliance_rules(rule_type);

-- Row-Level Security
ALTER TABLE postal_compliance_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's compliance rules"
  ON postal_compliance_rules FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage compliance rules"
  ON postal_compliance_rules FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Address Validation Results (cached USPS/PostGrid validations)
CREATE TABLE address_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES recipients(id) ON DELETE CASCADE,

  -- Original Address
  original_address_line1 TEXT NOT NULL,
  original_address_line2 TEXT,
  original_city TEXT NOT NULL,
  original_state TEXT NOT NULL,
  original_zip_code TEXT NOT NULL,

  -- Validated Address (CASS certified)
  validated_address_line1 TEXT,
  validated_address_line2 TEXT,
  validated_city TEXT,
  validated_state TEXT,
  validated_zip_code TEXT,
  validated_zip_plus4 TEXT,

  -- Validation Status
  is_valid BOOLEAN NOT NULL,
  is_deliverable BOOLEAN,
  validation_status TEXT CHECK (validation_status IN (
    'valid',
    'invalid',
    'corrected',
    'undeliverable',
    'po_box',
    'military',
    'vacant'
  )),

  -- USPS Data
  delivery_point_barcode TEXT,
  carrier_route TEXT,
  congressional_district TEXT,
  residential_indicator BOOLEAN,

  -- NCOA (National Change of Address)
  ncoa_match BOOLEAN DEFAULT false,
  ncoa_new_address TEXT,
  ncoa_move_date DATE,

  -- API Response
  validation_provider TEXT, -- 'usps', 'postgrid', 'smarty_streets'
  raw_response JSONB,

  -- Timing
  validated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_address_validations_recipient ON address_validations(recipient_id);
CREATE INDEX idx_address_validations_status ON address_validations(validation_status);

-- Design Compliance Checks (AI-powered validation results)
CREATE TABLE design_compliance_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES design_templates(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Check Metadata
  check_type TEXT NOT NULL,
  check_status TEXT NOT NULL CHECK (check_status IN ('passed', 'failed', 'warning')),

  -- Compliance Details
  rule_id UUID REFERENCES postal_compliance_rules(id),
  violation_description TEXT,
  suggested_fix TEXT,

  -- AI Analysis
  ai_confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  ai_model_used TEXT, -- e.g., 'claude-3-opus-20240229'

  -- Location in Design (for highlighting in editor)
  violation_location JSONB, -- { x, y, width, height } or Fabric.js object ID

  -- Audit Trail
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_design_checks_template ON design_compliance_checks(template_id);
CREATE INDEX idx_design_checks_org ON design_compliance_checks(organization_id);
CREATE INDEX idx_design_checks_status ON design_compliance_checks(check_status);

-- Row-Level Security
ALTER TABLE design_compliance_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view compliance checks for their organization's templates"
  ON design_compliance_checks FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

-- USPS Size Standards (reference data)
CREATE TABLE usps_size_standards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mail_class TEXT NOT NULL, -- 'postcard', 'letter', 'flat', 'package'
  category TEXT NOT NULL, -- 'first_class', 'marketing_mail', 'standard'

  -- Dimensions (inches)
  min_height DECIMAL(5,2),
  max_height DECIMAL(5,2),
  min_width DECIMAL(5,2),
  max_width DECIMAL(5,2),
  min_thickness DECIMAL(5,3),
  max_thickness DECIMAL(5,3),

  -- Weight (ounces)
  max_weight DECIMAL(6,2),

  -- Pricing
  base_cost DECIMAL(6,2),

  -- Reference
  usps_reference_url TEXT,
  effective_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed USPS size standards (common mail classes)
INSERT INTO usps_size_standards (mail_class, category, min_height, max_height, min_width, max_width, min_thickness, max_thickness, max_weight, base_cost) VALUES
('postcard', 'first_class', 3.5, 4.25, 5.0, 6.0, 0.007, 0.016, 1.0, 0.56),
('postcard', 'marketing_mail', 3.5, 6.0, 5.0, 11.5, 0.007, 0.016, 3.3, 0.19),
('letter', 'first_class', 3.5, 6.125, 5.0, 11.5, 0.007, 0.25, 3.5, 0.73),
('letter', 'marketing_mail', 3.5, 6.125, 5.0, 11.5, 0.007, 0.25, 3.3, 0.285),
('flat', 'first_class', 6.125, 12.0, 11.5, 15.0, 0.25, 0.75, 13.0, 1.50),
('flat', 'marketing_mail', 6.125, 12.0, 11.5, 15.0, 0.25, 0.75, 16.0, 1.00);

-- Function to validate template against USPS standards
CREATE OR REPLACE FUNCTION validate_template_usps_compliance(
  p_template_id UUID,
  p_width_inches DECIMAL,
  p_height_inches DECIMAL,
  p_mail_class TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_standard RECORD;
  v_result JSONB;
  v_violations TEXT[] := '{}';
BEGIN
  -- Find matching USPS standard
  SELECT * INTO v_standard
  FROM usps_size_standards
  WHERE mail_class = p_mail_class
  ORDER BY effective_date DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'No USPS standard found for mail class');
  END IF;

  -- Check dimensions
  IF p_width_inches < v_standard.min_width THEN
    v_violations := array_append(v_violations, format('Width %.2f" is below minimum %.2f"', p_width_inches, v_standard.min_width));
  END IF;

  IF p_width_inches > v_standard.max_width THEN
    v_violations := array_append(v_violations, format('Width %.2f" exceeds maximum %.2f"', p_width_inches, v_standard.max_width));
  END IF;

  IF p_height_inches < v_standard.min_height THEN
    v_violations := array_append(v_violations, format('Height %.2f" is below minimum %.2f"', p_height_inches, v_standard.min_height));
  END IF;

  IF p_height_inches > v_standard.max_height THEN
    v_violations := array_append(v_violations, format('Height %.2f" exceeds maximum %.2f"', p_height_inches, v_standard.max_height));
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'valid', array_length(v_violations, 1) IS NULL,
    'violations', v_violations,
    'standard', row_to_json(v_standard)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger
CREATE TRIGGER update_postal_compliance_rules_updated_at
  BEFORE UPDATE ON postal_compliance_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
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
-- Migration 007: A/B Testing System
-- Multi-variant testing for templates, copy, and campaign strategies

CREATE TABLE ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Test Metadata
  test_name TEXT NOT NULL,
  description TEXT,
  hypothesis TEXT, -- What are we testing? e.g., "Red CTA button increases conversions by 15%"

  -- Test Configuration
  test_type TEXT NOT NULL CHECK (test_type IN ('template', 'copy', 'landing_page', 'send_time', 'audience')),
  test_metric TEXT NOT NULL CHECK (test_metric IN ('response_rate', 'conversion_rate', 'revenue_per_recipient', 'qr_scan_rate')),

  -- Traffic Allocation
  traffic_allocation JSONB NOT NULL, -- { "variant_a": 50, "variant_b": 50 } percentages must sum to 100
  min_sample_size INTEGER DEFAULT 100, -- Minimum recipients per variant before declaring winner

  -- Statistical Significance
  confidence_level DECIMAL(4,2) DEFAULT 95.00, -- 95% confidence
  required_p_value DECIMAL(5,4) DEFAULT 0.05, -- p < 0.05

  -- Test Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'canceled')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Winner Declaration
  winning_variant_id UUID, -- References ab_test_variants(id)
  winner_declared_at TIMESTAMPTZ,
  statistical_significance BOOLEAN,
  p_value DECIMAL(6,5),

  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_ab_tests_org ON ab_tests(organization_id);
CREATE INDEX idx_ab_tests_status ON ab_tests(status);

-- Row-Level Security
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view A/B tests in their organization"
  ON ab_tests FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create A/B tests in their organization"
  ON ab_tests FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Users can update A/B tests in their organization"
  ON ab_tests FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

-- A/B Test Variants (different versions being tested)
CREATE TABLE ab_test_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ab_test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,

  -- Variant Metadata
  variant_name TEXT NOT NULL, -- 'Control', 'Variant A', 'Variant B'
  variant_label TEXT NOT NULL, -- 'A', 'B', 'C'
  is_control BOOLEAN DEFAULT false,

  -- Variant Configuration (what's different)
  template_id UUID REFERENCES design_templates(id),
  copy_text TEXT,
  landing_page_id UUID REFERENCES landing_pages(id),
  send_time_offset INTEGER, -- Hours from base send time

  -- Campaign Association
  campaign_id UUID REFERENCES campaigns(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_variants_test ON ab_test_variants(ab_test_id);
CREATE INDEX idx_variants_campaign ON ab_test_variants(campaign_id);

-- Row-Level Security
ALTER TABLE ab_test_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view variants for their organization's A/B tests"
  ON ab_test_variants FOR SELECT
  USING (
    ab_test_id IN (
      SELECT id FROM ab_tests
      WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles
        WHERE user_id = auth.uid()
      )
    )
  );

-- A/B Test Results (aggregated performance per variant)
CREATE TABLE ab_test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ab_test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES ab_test_variants(id) ON DELETE CASCADE,

  -- Sample Size
  total_recipients INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,

  -- Performance Metrics
  total_responses INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0.00,

  -- Calculated Rates
  response_rate DECIMAL(5,2), -- Percentage
  conversion_rate DECIMAL(5,2), -- Percentage
  revenue_per_recipient DECIMAL(10,2),

  -- Statistical Metrics
  standard_error DECIMAL(8,6),
  confidence_interval_lower DECIMAL(5,2),
  confidence_interval_upper DECIMAL(5,2),

  -- Comparison to Control
  lift_percentage DECIMAL(6,2), -- % improvement over control
  is_statistically_significant BOOLEAN,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_results_test ON ab_test_results(ab_test_id);
CREATE INDEX idx_results_variant ON ab_test_results(variant_id);

-- Row-Level Security
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view results for their organization's A/B tests"
  ON ab_test_results FOR SELECT
  USING (
    ab_test_id IN (
      SELECT id FROM ab_tests
      WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles
        WHERE user_id = auth.uid()
      )
    )
  );

-- Recipient-Variant Assignment (which recipient got which variant)
CREATE TABLE ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ab_test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES ab_test_variants(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,

  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(ab_test_id, recipient_id) -- Each recipient assigned to one variant per test
);

-- Indexes
CREATE INDEX idx_assignments_test ON ab_test_assignments(ab_test_id);
CREATE INDEX idx_assignments_variant ON ab_test_assignments(variant_id);
CREATE INDEX idx_assignments_recipient ON ab_test_assignments(recipient_id);

-- Function to calculate A/B test statistical significance (two-proportion z-test)
CREATE OR REPLACE FUNCTION calculate_ab_test_significance(
  p_ab_test_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_control RECORD;
  v_variant RECORD;
  v_pooled_proportion DECIMAL;
  v_standard_error DECIMAL;
  v_z_score DECIMAL;
  v_p_value DECIMAL;
BEGIN
  -- Get control variant metrics
  SELECT
    variant_id,
    total_delivered,
    total_conversions,
    CASE WHEN total_delivered > 0 THEN total_conversions::DECIMAL / total_delivered ELSE 0 END AS conversion_rate
  INTO v_control
  FROM ab_test_results atr
  JOIN ab_test_variants atv ON atr.variant_id = atv.id
  WHERE atr.ab_test_id = p_ab_test_id AND atv.is_control = true
  LIMIT 1;

  -- Calculate for each variant compared to control
  FOR v_variant IN
    SELECT
      variant_id,
      total_delivered,
      total_conversions,
      CASE WHEN total_delivered > 0 THEN total_conversions::DECIMAL / total_delivered ELSE 0 END AS conversion_rate
    FROM ab_test_results atr
    JOIN ab_test_variants atv ON atr.variant_id = atv.id
    WHERE atr.ab_test_id = p_ab_test_id AND atv.is_control = false
  LOOP
    -- Calculate pooled proportion
    v_pooled_proportion := (v_control.total_conversions + v_variant.total_conversions)::DECIMAL /
                           (v_control.total_delivered + v_variant.total_delivered);

    -- Calculate standard error
    v_standard_error := SQRT(
      v_pooled_proportion * (1 - v_pooled_proportion) *
      ((1::DECIMAL / v_control.total_delivered) + (1::DECIMAL / v_variant.total_delivered))
    );

    -- Calculate z-score
    IF v_standard_error > 0 THEN
      v_z_score := (v_variant.conversion_rate - v_control.conversion_rate) / v_standard_error;

      -- Approximate p-value (two-tailed) - simplified for demonstration
      v_p_value := 2 * (1 - (1 + erf(ABS(v_z_score) / SQRT(2))) / 2);

      -- Update results
      UPDATE ab_test_results
      SET
        standard_error = v_standard_error,
        lift_percentage = ((v_variant.conversion_rate - v_control.conversion_rate) / v_control.conversion_rate * 100),
        is_statistically_significant = (v_p_value < 0.05),
        updated_at = NOW()
      WHERE variant_id = v_variant.variant_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update A/B test results (aggregate from recipients)
CREATE OR REPLACE FUNCTION update_ab_test_results(p_ab_test_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update results for each variant
  INSERT INTO ab_test_results (ab_test_id, variant_id, total_recipients, total_delivered, total_responses, total_conversions, total_revenue)
  SELECT
    p_ab_test_id,
    ata.variant_id,
    COUNT(r.id),
    COUNT(r.id) FILTER (WHERE r.mail_status = 'delivered'),
    COUNT(r.id) FILTER (WHERE r.qr_scanned = true OR r.landing_page_visited = true),
    COUNT(r.id) FILTER (WHERE r.converted = true),
    SUM(r.conversion_value)
  FROM ab_test_assignments ata
  JOIN recipients r ON ata.recipient_id = r.id
  WHERE ata.ab_test_id = p_ab_test_id
  GROUP BY ata.variant_id
  ON CONFLICT (variant_id) DO UPDATE SET
    total_recipients = EXCLUDED.total_recipients,
    total_delivered = EXCLUDED.total_delivered,
    total_responses = EXCLUDED.total_responses,
    total_conversions = EXCLUDED.total_conversions,
    total_revenue = EXCLUDED.total_revenue,
    response_rate = CASE
      WHEN EXCLUDED.total_delivered > 0
      THEN (EXCLUDED.total_responses::DECIMAL / EXCLUDED.total_delivered * 100)
      ELSE 0
    END,
    conversion_rate = CASE
      WHEN EXCLUDED.total_responses > 0
      THEN (EXCLUDED.total_conversions::DECIMAL / EXCLUDED.total_responses * 100)
      ELSE 0
    END,
    revenue_per_recipient = CASE
      WHEN EXCLUDED.total_recipients > 0
      THEN (EXCLUDED.total_revenue / EXCLUDED.total_recipients)
      ELSE 0
    END,
    updated_at = NOW();

  -- Calculate statistical significance
  PERFORM calculate_ab_test_significance(p_ab_test_id);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update A/B test results when recipients are updated
CREATE OR REPLACE FUNCTION trigger_update_ab_test_results()
RETURNS TRIGGER AS $$
DECLARE
  v_ab_test_id UUID;
BEGIN
  -- Find associated A/B test
  SELECT ab_test_id INTO v_ab_test_id
  FROM ab_test_assignments
  WHERE recipient_id = COALESCE(NEW.id, OLD.id)
  LIMIT 1;

  IF v_ab_test_id IS NOT NULL THEN
    PERFORM update_ab_test_results(v_ab_test_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipient_ab_test_trigger
  AFTER INSERT OR UPDATE ON recipients
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_ab_test_results();

-- Updated_at triggers
CREATE TRIGGER update_ab_tests_updated_at
  BEFORE UPDATE ON ab_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function: erf (error function) for p-value calculation
CREATE OR REPLACE FUNCTION erf(x DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
  a1 CONSTANT DECIMAL := 0.254829592;
  a2 CONSTANT DECIMAL := -0.284496736;
  a3 CONSTANT DECIMAL := 1.421413741;
  a4 CONSTANT DECIMAL := -1.453152027;
  a5 CONSTANT DECIMAL := 1.061405429;
  p CONSTANT DECIMAL := 0.3275911;
  sign INTEGER;
  t DECIMAL;
  y DECIMAL;
BEGIN
  sign := CASE WHEN x < 0 THEN -1 ELSE 1 END;
  x := ABS(x);

  t := 1.0 / (1.0 + p * x);
  y := 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * exp(-x * x);

  RETURN sign * y;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
-- Migration 008: API Keys & Webhooks
-- Developer API, webhook integrations, and external service connections

-- API Keys (for developer access to platform)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Key Metadata
  key_name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of actual key
  key_prefix TEXT NOT NULL, -- First 8 chars for identification (e.g., "pk_live_")

  -- Permissions
  scopes TEXT[] DEFAULT '{read}', -- Array: ['read', 'write', 'campaigns:create', 'templates:read']
  is_active BOOLEAN DEFAULT true,

  -- Usage Limits
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,

  -- Usage Tracking
  last_used_at TIMESTAMPTZ,
  total_requests INTEGER DEFAULT 0,

  -- Security
  expires_at TIMESTAMPTZ,
  allowed_ips TEXT[], -- Optional IP whitelist

  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

-- Row-Level Security
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view API keys in their organization"
  ON api_keys FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage API keys"
  ON api_keys FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- API Request Logs (for debugging and monitoring)
CREATE TABLE api_request_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Request Details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  request_headers JSONB,
  request_body JSONB,

  -- Response Details
  response_status INTEGER NOT NULL,
  response_body JSONB,
  response_time_ms INTEGER, -- Milliseconds

  -- Client Info
  ip_address INET,
  user_agent TEXT,

  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_logs_key ON api_request_logs(api_key_id);
CREATE INDEX idx_api_logs_org ON api_request_logs(organization_id);
CREATE INDEX idx_api_logs_endpoint ON api_request_logs(endpoint);
CREATE INDEX idx_api_logs_created ON api_request_logs(created_at DESC);

-- Partitioning by month for performance (optional, can be enabled later)
-- CREATE INDEX idx_api_logs_created_monthly ON api_request_logs(created_at) WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);

-- Webhooks (outgoing event notifications)
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Endpoint Configuration
  url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,

  -- Events to Subscribe
  subscribed_events TEXT[] NOT NULL, -- e.g., ['campaign.completed', 'recipient.converted', 'template.published']

  -- Security
  secret_key TEXT NOT NULL, -- HMAC signing secret
  verify_ssl BOOLEAN DEFAULT true,

  -- Retry Configuration
  max_retries INTEGER DEFAULT 3,
  retry_backoff_seconds INTEGER DEFAULT 60,

  -- Usage Stats
  last_triggered_at TIMESTAMPTZ,
  total_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,

  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_webhooks_org ON webhook_endpoints(organization_id);
CREATE INDEX idx_webhooks_active ON webhook_endpoints(is_active) WHERE is_active = true;

-- Row-Level Security
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view webhooks in their organization"
  ON webhook_endpoints FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage webhooks"
  ON webhook_endpoints FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Webhook Delivery Logs (track webhook attempts)
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Event Details
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,

  -- Delivery Attempt
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retrying')),

  -- HTTP Details
  http_status INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,

  -- Error Handling
  error_message TEXT,
  next_retry_at TIMESTAMPTZ,

  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_deliveries_webhook ON webhook_deliveries(webhook_endpoint_id);
CREATE INDEX idx_deliveries_org ON webhook_deliveries(organization_id);
CREATE INDEX idx_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_deliveries_retry ON webhook_deliveries(next_retry_at) WHERE status = 'retrying';

-- External Integrations (third-party API credentials)
CREATE TABLE external_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Integration Type
  provider TEXT NOT NULL CHECK (provider IN (
    'data_axle',
    'postgrid',
    'stripe',
    'openai',
    'elevenlabs',
    'sendgrid',
    'twilio',
    'salesforce',
    'hubspot',
    'google_analytics',
    'custom'
  )),
  integration_name TEXT NOT NULL,

  -- Credentials (encrypted at application level)
  credentials JSONB NOT NULL, -- { api_key: "...", api_secret: "...", ... }

  -- Configuration
  config JSONB, -- Provider-specific settings

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,

  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_integrations_org ON external_integrations(organization_id);
CREATE INDEX idx_integrations_provider ON external_integrations(provider);

-- Row-Level Security
ALTER TABLE external_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view integrations in their organization"
  ON external_integrations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage integrations"
  ON external_integrations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Job Queue (for background processing with BullMQ/Redis)
CREATE TABLE job_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Job Details
  job_type TEXT NOT NULL CHECK (job_type IN (
    'campaign_generation',
    'batch_render',
    'ai_background_generation',
    'address_validation',
    'webhook_delivery',
    'analytics_aggregation',
    'template_conversion',
    'data_export'
  )),
  job_data JSONB NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'canceled')),
  progress INTEGER DEFAULT 0, -- 0-100 percentage
  result JSONB,
  error_message TEXT,

  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Retry Logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_jobs_org ON job_queue(organization_id);
CREATE INDEX idx_jobs_status ON job_queue(status);
CREATE INDEX idx_jobs_type ON job_queue(job_type);
CREATE INDEX idx_jobs_retry ON job_queue(next_retry_at) WHERE status = 'failed' AND retry_count < max_retries;

-- Row-Level Security
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view jobs in their organization"
  ON job_queue FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

-- Function to trigger webhook on event
CREATE OR REPLACE FUNCTION trigger_webhook(
  p_organization_id UUID,
  p_event_type TEXT,
  p_event_data JSONB
)
RETURNS VOID AS $$
DECLARE
  v_webhook RECORD;
BEGIN
  -- Find active webhooks subscribed to this event
  FOR v_webhook IN
    SELECT id, url, secret_key
    FROM webhook_endpoints
    WHERE organization_id = p_organization_id
      AND is_active = true
      AND p_event_type = ANY(subscribed_events)
  LOOP
    -- Queue webhook delivery
    INSERT INTO webhook_deliveries (
      webhook_endpoint_id,
      organization_id,
      event_type,
      event_data,
      status
    ) VALUES (
      v_webhook.id,
      p_organization_id,
      p_event_type,
      p_event_data,
      'pending'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment API key usage
CREATE OR REPLACE FUNCTION increment_api_key_usage(p_key_hash TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE api_keys
  SET
    total_requests = total_requests + 1,
    last_used_at = NOW()
  WHERE key_hash = p_key_hash;
END;
$$ LANGUAGE plpgsql;

-- Function to validate API key and check rate limits
CREATE OR REPLACE FUNCTION validate_api_key(p_key_hash TEXT)
RETURNS JSONB AS $$
DECLARE
  v_key RECORD;
  v_hourly_requests INTEGER;
  v_daily_requests INTEGER;
BEGIN
  -- Get API key
  SELECT * INTO v_key
  FROM api_keys
  WHERE key_hash = p_key_hash
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (revoked_at IS NULL);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired API key');
  END IF;

  -- Check hourly rate limit
  SELECT COUNT(*) INTO v_hourly_requests
  FROM api_request_logs
  WHERE api_key_id = v_key.id
    AND created_at > NOW() - INTERVAL '1 hour';

  IF v_hourly_requests >= v_key.rate_limit_per_hour THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Hourly rate limit exceeded');
  END IF;

  -- Check daily rate limit
  SELECT COUNT(*) INTO v_daily_requests
  FROM api_request_logs
  WHERE api_key_id = v_key.id
    AND created_at > NOW() - INTERVAL '1 day';

  IF v_daily_requests >= v_key.rate_limit_per_day THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Daily rate limit exceeded');
  END IF;

  -- Valid key
  RETURN jsonb_build_object(
    'valid', true,
    'organization_id', v_key.organization_id,
    'scopes', v_key.scopes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated_at triggers
CREATE TRIGGER update_webhook_endpoints_updated_at
  BEFORE UPDATE ON webhook_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_integrations_updated_at
  BEFORE UPDATE ON external_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Cleanup old logs (optional maintenance function)
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM api_request_logs
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM webhook_deliveries
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
    AND status IN ('success', 'failed');

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
