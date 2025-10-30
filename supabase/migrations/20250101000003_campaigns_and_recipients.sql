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
