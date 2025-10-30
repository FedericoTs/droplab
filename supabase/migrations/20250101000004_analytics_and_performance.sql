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
