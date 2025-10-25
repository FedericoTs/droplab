-- ============================================================================
-- PLANNING WORKSPACE DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0
-- Purpose: Enable AI-driven campaign planning with human oversight
-- Design Principles:
--   1. SIMPLICITY: Clear table relationships, intuitive column names
--   2. VISUAL REASONING: Store ALL AI reasoning data for UI display
--   3. AUDITABILITY: Track all changes (who, what, when, why)
--   4. PERFORMANCE: Denormalized for fast reads, indexed for queries
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE 1: campaign_plans
-- Purpose: Master plan metadata (one plan = one monthly deployment)
-- Simplicity: User sees this as "March 2025 Wave" or "Q1 Rollout"
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaign_plans (
  -- Identity
  id TEXT PRIMARY KEY, -- nanoid (e.g., 'plan_abc123def456')
  name TEXT NOT NULL, -- User-friendly name (e.g., "March 2025 DM Wave")
  description TEXT, -- Optional: "Spring campaign targeting West region"

  -- Status workflow (ULTRA-SIMPLE: Only 3 states)
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'approved' | 'executed'
  -- draft: User is editing
  -- approved: Locked for review, ready to execute
  -- executed: Orders created, plan is historical record

  -- Ownership & Collaboration (future: multi-user support)
  created_by TEXT, -- User ID or email (for now, can be null)

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')), -- ISO 8601
  updated_at TEXT NOT NULL DEFAULT (datetime('now')), -- Auto-updated on change
  approved_at TEXT, -- When status changed to 'approved'
  executed_at TEXT, -- When orders were generated

  -- Plan Summary (DENORMALIZED for performance - updated on plan changes)
  -- Why denormalize? Fast dashboard queries without JOINs
  total_stores INTEGER NOT NULL DEFAULT 0, -- How many stores in this plan
  total_quantity INTEGER NOT NULL DEFAULT 0, -- Sum of all quantities
  estimated_cost REAL NOT NULL DEFAULT 0, -- Sum of all costs ($)
  expected_conversions REAL NOT NULL DEFAULT 0, -- AI-predicted conversions
  avg_confidence REAL NOT NULL DEFAULT 0, -- Average AI confidence (0-100)

  -- Wave breakdown (JSON for flexibility)
  -- Example: [{"wave": "W1", "stores": 25, "cost": 1500}, {"wave": "W2", "stores": 22, "cost": 1625}]
  wave_summary TEXT, -- JSON array of wave summaries

  -- User notes
  notes TEXT, -- Free-form notes (e.g., "Targeting spring season, focus on West")

  -- Indexes for fast queries
  CHECK (status IN ('draft', 'approved', 'executed'))
);

CREATE INDEX IF NOT EXISTS idx_campaign_plans_status ON campaign_plans(status);
CREATE INDEX IF NOT EXISTS idx_campaign_plans_created_at ON campaign_plans(created_at);

-- ----------------------------------------------------------------------------
-- TABLE 2: plan_items
-- Purpose: Store-level planning data (one row = one store's recommendation)
-- Simplicity: User sees this as "STR-001 gets Spring Sale campaign, 100 pieces"
-- Visual Reasoning: ALL AI data preserved for display
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_items (
  -- Identity
  id TEXT PRIMARY KEY, -- nanoid
  plan_id TEXT NOT NULL, -- FK to campaign_plans

  -- Store reference
  store_id TEXT NOT NULL, -- FK to retail_stores (from existing table)
  store_number TEXT NOT NULL, -- Denormalized for quick display (e.g., "STR-001")
  store_name TEXT NOT NULL, -- Denormalized (e.g., "San Francisco Downtown")

  -- Current decision (what user has chosen)
  campaign_id TEXT NOT NULL, -- FK to campaigns (which campaign assigned)
  campaign_name TEXT NOT NULL, -- Denormalized (e.g., "Spring Sale 2025")
  quantity INTEGER NOT NULL, -- How many pieces (e.g., 100)
  unit_cost REAL NOT NULL DEFAULT 0.05, -- Cost per piece (default $0.05)
  total_cost REAL NOT NULL, -- quantity * unit_cost (denormalized)

  -- Wave assignment (ULTRA-SIMPLE: Just a string tag)
  wave TEXT, -- e.g., 'W1', 'W2', 'W3', or NULL (unassigned)
  wave_name TEXT, -- e.g., 'Week 1 (Mar 1-7)' (denormalized for display)

  -- Include/Exclude (SIMPLICITY: Boolean is clearer than status enum)
  is_included BOOLEAN NOT NULL DEFAULT 1, -- 1 = included, 0 = excluded/skipped
  exclude_reason TEXT, -- If excluded, why? (e.g., "New store, insufficient data")

  -- User override tracking (AUDITABILITY)
  is_overridden BOOLEAN NOT NULL DEFAULT 0, -- Did user change AI recommendation?
  override_notes TEXT, -- User's explanation (e.g., "Florida prefers spring themes")

  -- ========================================================================
  -- AI RECOMMENDATION DATA (VISUAL REASONING)
  -- ========================================================================
  -- This is the ORIGINAL AI recommendation, preserved forever
  -- User can see "AI suggested X, but you chose Y"

  ai_recommended_campaign_id TEXT, -- Original AI suggestion
  ai_recommended_campaign_name TEXT, -- Denormalized
  ai_recommended_quantity INTEGER, -- Original AI quantity

  -- Overall confidence (SIMPLICITY: Single 0-100 score)
  ai_confidence REAL, -- 0-100 (e.g., 85.5 means "85.5% confident")
  ai_confidence_level TEXT, -- 'high' (>75) | 'medium' (50-75) | 'low' (<50)

  -- Score breakdown (VISUAL REASONING: Show 4 key factors)
  -- Each score is 0-100, user sees bar charts
  ai_score_store_performance REAL, -- How well this store converts historically
  ai_score_creative_performance REAL, -- How well this campaign works at similar stores
  ai_score_geographic_fit REAL, -- Regional/demographic alignment
  ai_score_timing_alignment REAL, -- Seasonal/calendar fit

  -- Reasoning (VISUAL: Show as bullet points in UI)
  -- Stored as JSON array: ["Strong historical performance", "High regional fit", etc.]
  ai_reasoning TEXT, -- JSON array of strings (3-5 reasons)

  -- Risk factors (VISUAL: Show as warning badges)
  -- Stored as JSON array: ["Low historical data", "Recent underperformance", etc.]
  ai_risk_factors TEXT, -- JSON array of strings (0-3 risks)

  -- Expected outcome (VISUAL: Show as prediction)
  ai_expected_conversion_rate REAL, -- Predicted % (e.g., 2.5 means "2.5% conversion")
  ai_expected_conversions REAL, -- Predicted count (e.g., 2.5 conversions)

  -- Auto-approval status (SIMPLICITY: Was this auto-approved by AI?)
  ai_auto_approved BOOLEAN, -- 1 = AI said "auto-approve", 0 = "needs review"
  ai_status_reason TEXT, -- Why? (e.g., "High confidence, proven track record")

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- Constraints
  FOREIGN KEY (plan_id) REFERENCES campaign_plans(id) ON DELETE CASCADE,
  CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
  CHECK (ai_confidence_level IN ('high', 'medium', 'low')),
  CHECK (ai_score_store_performance >= 0 AND ai_score_store_performance <= 100),
  CHECK (ai_score_creative_performance >= 0 AND ai_score_creative_performance <= 100),
  CHECK (ai_score_geographic_fit >= 0 AND ai_score_geographic_fit <= 100),
  CHECK (ai_score_timing_alignment >= 0 AND ai_score_timing_alignment <= 100)
);

CREATE INDEX IF NOT EXISTS idx_plan_items_plan_id ON plan_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_store_id ON plan_items(store_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_wave ON plan_items(wave);
CREATE INDEX IF NOT EXISTS idx_plan_items_is_included ON plan_items(is_included);

-- ----------------------------------------------------------------------------
-- TABLE 3: plan_waves
-- Purpose: Wave definitions (optional table for structured wave metadata)
-- Simplicity: User sees "Week 1: Mar 1-7, 25 stores, $1,500"
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_waves (
  -- Identity
  id TEXT PRIMARY KEY, -- nanoid
  plan_id TEXT NOT NULL, -- FK to campaign_plans

  -- Wave metadata
  wave_code TEXT NOT NULL, -- 'W1', 'W2', 'W3', etc.
  wave_name TEXT NOT NULL, -- 'Week 1', 'Week 2', etc.
  wave_description TEXT, -- 'March 1-7: West Region rollout'

  -- Timing
  start_date TEXT, -- ISO 8601 date (e.g., '2025-03-01')
  end_date TEXT, -- ISO 8601 date (e.g., '2025-03-07')

  -- Budget (optional)
  budget_allocated REAL, -- Max budget for this wave

  -- Summary (DENORMALIZED - updated when plan_items change)
  stores_count INTEGER NOT NULL DEFAULT 0,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  total_cost REAL NOT NULL DEFAULT 0,

  -- Ordering (for display)
  display_order INTEGER NOT NULL DEFAULT 0, -- Sort waves: W1=1, W2=2, etc.

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- Constraints
  FOREIGN KEY (plan_id) REFERENCES campaign_plans(id) ON DELETE CASCADE,
  UNIQUE (plan_id, wave_code) -- No duplicate wave codes per plan
);

CREATE INDEX IF NOT EXISTS idx_plan_waves_plan_id ON plan_waves(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_waves_display_order ON plan_waves(display_order);

-- ----------------------------------------------------------------------------
-- TABLE 4: plan_activity_log (Optional - for audit trail)
-- Purpose: Track every change to plans (who changed what, when, why)
-- Simplicity: User rarely sees this directly, but powers "Change History" view
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_activity_log (
  -- Identity
  id TEXT PRIMARY KEY, -- nanoid
  plan_id TEXT NOT NULL, -- FK to campaign_plans

  -- What happened?
  action TEXT NOT NULL, -- 'created' | 'edited' | 'approved' | 'executed' | 'item_changed'
  entity_type TEXT NOT NULL, -- 'plan' | 'plan_item' | 'wave'
  entity_id TEXT, -- ID of affected entity (e.g., plan_item.id)

  -- Details (JSON for flexibility)
  -- Example: {"field": "campaign_id", "old": "camp_123", "new": "camp_456", "reason": "User override"}
  change_details TEXT, -- JSON object

  -- Who & When
  user_id TEXT, -- Who made the change (for future multi-user)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- User note
  notes TEXT, -- Optional explanation

  FOREIGN KEY (plan_id) REFERENCES campaign_plans(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_plan_activity_log_plan_id ON plan_activity_log(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_activity_log_created_at ON plan_activity_log(created_at);

-- ============================================================================
-- VIEWS FOR SIMPLIFIED QUERIES
-- ============================================================================

-- View: plan_summary
-- Purpose: Get plan overview with all aggregated data (PERFORMANCE OPTIMIZATION)
-- User benefit: One query to show plan dashboard
CREATE VIEW IF NOT EXISTS plan_summary AS
SELECT
  p.id,
  p.name,
  p.description,
  p.status,
  p.created_at,
  p.total_stores,
  p.total_quantity,
  p.estimated_cost,
  p.expected_conversions,
  p.avg_confidence,

  -- Count breakdowns (VISUAL: Show stats)
  COUNT(CASE WHEN pi.is_included = 1 THEN 1 END) as included_stores,
  COUNT(CASE WHEN pi.is_included = 0 THEN 1 END) as excluded_stores,
  COUNT(CASE WHEN pi.is_overridden = 1 THEN 1 END) as overridden_stores,
  COUNT(CASE WHEN pi.ai_auto_approved = 1 THEN 1 END) as auto_approved_stores,

  -- Wave count
  COUNT(DISTINCT pi.wave) as waves_count,

  -- Confidence breakdown (VISUAL: Show confidence distribution)
  COUNT(CASE WHEN pi.ai_confidence_level = 'high' THEN 1 END) as high_confidence_stores,
  COUNT(CASE WHEN pi.ai_confidence_level = 'medium' THEN 1 END) as medium_confidence_stores,
  COUNT(CASE WHEN pi.ai_confidence_level = 'low' THEN 1 END) as low_confidence_stores

FROM campaign_plans p
LEFT JOIN plan_items pi ON p.id = pi.plan_id
GROUP BY p.id;

-- View: plan_item_with_store_details
-- Purpose: Get plan items with full store context (DENORMALIZATION for UX)
-- User benefit: See store details without extra queries
CREATE VIEW IF NOT EXISTS plan_item_with_store_details AS
SELECT
  pi.*,

  -- Store details (from retail_stores table)
  rs.city,
  rs.state,
  rs.region,
  rs.address,

  -- Override indicator (VISUAL: Show badges)
  CASE
    WHEN pi.is_overridden = 1 THEN 'User Override'
    WHEN pi.ai_auto_approved = 1 THEN 'Auto-Approved'
    ELSE 'AI Recommended'
  END as recommendation_source

FROM plan_items pi
LEFT JOIN retail_stores rs ON pi.store_id = rs.id;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- (Commented out - uncomment for development/testing)
/*
-- Sample plan
INSERT INTO campaign_plans (id, name, description, status, total_stores, total_quantity, estimated_cost)
VALUES ('plan_test_001', 'March 2025 DM Wave', 'Spring campaign targeting West region', 'draft', 2, 250, 12.50);

-- Sample plan items
INSERT INTO plan_items (
  id, plan_id, store_id, store_number, store_name,
  campaign_id, campaign_name, quantity, unit_cost, total_cost,
  wave, is_included,
  ai_recommended_campaign_id, ai_recommended_campaign_name, ai_recommended_quantity,
  ai_confidence, ai_confidence_level,
  ai_score_store_performance, ai_score_creative_performance, ai_score_geographic_fit, ai_score_timing_alignment,
  ai_reasoning, ai_risk_factors, ai_expected_conversion_rate, ai_expected_conversions,
  ai_auto_approved
) VALUES (
  'item_test_001', 'plan_test_001', 'store_001', 'STR-001', 'San Francisco Downtown',
  'camp_spring_001', 'Spring Sale 2025', 100, 0.05, 5.00,
  'W1', 1,
  'camp_spring_001', 'Spring Sale 2025', 100,
  85.5, 'high',
  90.0, 78.0, 88.0, 85.0,
  '["Strong historical performance (4.2% conversion)", "High regional fit for spring themes", "Similar stores show 85% success rate"]',
  '[]',
  3.5, 3.5,
  1
);

INSERT INTO plan_items (
  id, plan_id, store_id, store_number, store_name,
  campaign_id, campaign_name, quantity, unit_cost, total_cost,
  wave, is_included, is_overridden, override_notes,
  ai_recommended_campaign_id, ai_recommended_campaign_name, ai_recommended_quantity,
  ai_confidence, ai_confidence_level,
  ai_score_store_performance, ai_score_creative_performance, ai_score_geographic_fit, ai_score_timing_alignment,
  ai_reasoning, ai_risk_factors, ai_expected_conversion_rate, ai_expected_conversions,
  ai_auto_approved
) VALUES (
  'item_test_002', 'plan_test_001', 'store_002', 'STR-002', 'Los Angeles Westside',
  'camp_summer_001', 'Summer Fun 2025', 150, 0.05, 7.50,
  'W1', 1, 1, 'Florida prefers spring themes year-round based on regional manager feedback',
  'camp_spring_001', 'Spring Sale 2025', 100,
  78.0, 'high',
  82.0, 75.0, 90.0, 65.0,
  '["Good historical performance (3.1% conversion)", "Strong geographic fit", "Timing aligns with seasonal trends"]',
  '["Recent slight underperformance (-5% vs expected)"]',
  2.8, 4.2,
  1
);

-- Sample waves
INSERT INTO plan_waves (id, plan_id, wave_code, wave_name, start_date, end_date, stores_count, total_quantity, total_cost, display_order)
VALUES ('wave_test_001', 'plan_test_001', 'W1', 'Week 1', '2025-03-01', '2025-03-07', 2, 250, 12.50, 1);
*/

-- ============================================================================
-- SCHEMA VALIDATION QUERIES (for testing)
-- ============================================================================

-- Check table creation
-- SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'plan%';

-- Check indexes
-- SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_plan%';

-- Check views
-- SELECT name FROM sqlite_master WHERE type='view' AND name LIKE 'plan%';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
