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
