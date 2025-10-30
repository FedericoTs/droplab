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
