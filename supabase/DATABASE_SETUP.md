# Database Setup Guide

## Overview

This document describes the complete database architecture for the DropLab platform, a Fabric.js-based AI-powered direct mail design system.

## Architecture Principles

### 1. Multi-Tenancy
- **Organization-based isolation**: Every table has `organization_id`
- **Row-Level Security (RLS)**: PostgreSQL RLS policies enforce data isolation
- **User-Organization-Role mapping**: Flexible role-based access control

### 2. Data Integrity
- **Audit trails**: All tables have `created_at`, `updated_at`, `created_by`
- **Soft deletes**: `deleted_at` column for recovery
- **Foreign key constraints**: Maintain referential integrity
- **Automated triggers**: Auto-update timestamps, cascade updates

### 3. Performance
- **Strategic indexes**: B-tree and GIN indexes on frequently queried columns
- **JSONB for flexibility**: Fabric.js canvas, custom fields, event data
- **Denormalized stats**: `campaign_stats` table for fast dashboard queries
- **Materialized views**: Campaign performance aggregations

### 4. Scalability
- **JSONB storage**: Flexible schema evolution without migrations
- **Partitioning ready**: Event and log tables can be partitioned by date
- **Job queue**: Background processing with BullMQ/Redis
- **Webhook system**: Asynchronous external integrations

## Database Schema

### Core Tables (8 Migrations)

#### Migration 001: Organizations & Brand Kits
```
organizations (multi-tenant root)
├── id (PK)
├── name, slug, industry
├── subscription_tier, stripe_customer_id
└── RLS: Users see only their organization

brand_kits (visual identity + AI intelligence)
├── organization_id (FK)
├── primary_color, logo_url, fonts
├── brand_voice, target_audience (AI-extracted)
└── RLS: Organization members only

user_organization_roles (RBAC mapping)
├── user_id, organization_id
├── role: owner | admin | editor | viewer
└── RLS: Users see only their own roles
```

#### Migration 002: Design Templates (Fabric.js)
```
design_templates (core design storage)
├── fabric_json (JSONB) - Complete Fabric.js canvas state
├── variable_mappings (JSONB) - Index-based variable markers
├── background_image_url - Reusable AI-generated background
├── usage_count, conversion_rate (performance)
└── RLS: Organization + public marketplace templates

template_versions (revision history)
├── template_id, version_number
├── fabric_json snapshot
└── Automatic versioning on canvas changes
```

**Key Design Decision**: Variable mappings stored separately from `fabric_json` because Fabric.js v6 doesn't serialize custom properties via `toJSON()`.

#### Migration 003: Campaigns & Recipients (VDP Engine)
```
campaigns (direct mail campaigns)
├── template_id, organization_id
├── status: draft | scheduled | processing | sent
├── data_axle_audience_filter (targeting)
├── postgrid_batch_id (fulfillment)
└── RLS: Organization members only

recipients (personalized recipient data)
├── campaign_id, tracking_id (unique QR code)
├── first_name, last_name, address
├── custom_fields (JSONB) - VDP variables
├── qr_scanned, landing_page_visited, converted
└── RLS: Organization members only

campaign_stats (denormalized performance)
├── total_recipients, total_delivered
├── delivery_rate, response_rate, conversion_rate
├── total_revenue, ROI
└── Auto-updated via triggers
```

#### Migration 004: Analytics & Performance
```
events (granular interaction tracking)
├── event_type: qr_scan | landing_page_view | conversion
├── recipient_id, campaign_id
├── event_data (JSONB) - Flexible event details
└── Auto-updates recipient engagement flags

landing_pages (personalized landing page content)
├── recipient_id, brand_kit_id
├── headline, body_content, components (JSONB)
└── SEO metadata

elevenlabs_calls (voice AI integration)
├── elevenlabs_call_id, recipient_id
├── call_duration, transcript
├── sentiment_score, intent_detected
└── Conversion tracking

conversions (high-level conversion events)
├── conversion_type: appointment_booked | purchase_made
├── conversion_value
├── first_touch_event_id, last_touch_event_id (attribution)
└── Auto-updates recipient.converted flag
```

#### Migration 005: Postal Compliance
```
postal_compliance_rules (configurable validation)
├── rule_type: address_validation | usps_regulations | text_size
├── validation_criteria (JSONB)
└── Org-specific rules

address_validations (CASS certification)
├── original_address → validated_address
├── is_deliverable, validation_status
├── ncoa_match (National Change of Address)
└── USPS delivery point barcode

design_compliance_checks (AI-powered validation)
├── template_id, check_type
├── violation_description, suggested_fix
├── ai_confidence_score
└── violation_location (JSONB) - Canvas coordinates

usps_size_standards (reference data)
├── mail_class: postcard | letter | flat
├── min/max dimensions, weight
└── Pre-seeded with USPS standards
```

#### Migration 006: Marketplace & Collaboration
```
marketplace_templates (public template store)
├── template_id, creator_organization_id
├── price, license_type
├── avg_conversion_rate, avg_rating (social proof)
├── is_featured, is_approved
└── RLS: Public read, creator write

template_purchases (transaction history)
├── marketplace_template_id, buyer_organization_id
├── price_paid, stripe_payment_intent_id
└── License tracking

template_reviews (ratings & feedback)
├── rating (1-5), review_text
├── is_verified_purchase
├── helpful_count
└── Auto-updates marketplace template avg_rating

shared_workspaces (team collaboration)
├── organization_id, name, color
└── Workspace-based template organization

workspace_members (access control)
├── workspace_id, user_id
├── workspace_role: admin | editor | member | viewer
└── Fine-grained permissions

template_comments (design annotations)
├── template_id, user_id
├── comment_text, parent_comment_id (threaded)
├── canvas_position (JSONB) - x, y coordinates
└── Real-time collaboration
```

#### Migration 007: A/B Testing
```
ab_tests (experiment configuration)
├── test_type: template | copy | landing_page | send_time
├── test_metric: response_rate | conversion_rate
├── traffic_allocation (JSONB) - % per variant
├── confidence_level, required_p_value
├── winning_variant_id, statistical_significance
└── Two-proportion z-test for significance

ab_test_variants (versions being tested)
├── ab_test_id, variant_name
├── is_control, template_id, copy_text
└── Campaign association

ab_test_results (aggregated performance)
├── variant_id
├── total_recipients, response_rate, conversion_rate
├── lift_percentage, is_statistically_significant
└── Auto-updated from recipient data

ab_test_assignments (recipient → variant mapping)
├── ab_test_id, variant_id, recipient_id
└── Random assignment with traffic allocation
```

#### Migration 008: API Keys & Webhooks
```
api_keys (developer API access)
├── organization_id, key_hash (SHA-256)
├── scopes: ['read', 'write', 'campaigns:create']
├── rate_limit_per_hour, rate_limit_per_day
├── total_requests, last_used_at
└── validate_api_key() function with rate limiting

api_request_logs (usage monitoring)
├── api_key_id, endpoint, method
├── request_body, response_status, response_time_ms
└── Debugging and analytics

webhook_endpoints (outgoing event notifications)
├── url, subscribed_events
├── secret_key (HMAC signing)
├── max_retries, retry_backoff_seconds
└── trigger_webhook() function

webhook_deliveries (delivery tracking)
├── webhook_endpoint_id, event_type, event_data
├── attempt_number, status, http_status
└── Automatic retry with exponential backoff

external_integrations (third-party credentials)
├── provider: data_axle | postgrid | stripe | openai
├── credentials (JSONB, encrypted at app level)
└── last_sync_at, last_error

job_queue (background processing)
├── job_type: campaign_generation | batch_render | ai_background
├── status: pending | processing | completed | failed
├── progress (0-100), result (JSONB)
└── Integrates with BullMQ/Redis
```

## Key Functions & Triggers

### Automatic Triggers
- `update_updated_at_column()` - Auto-update `updated_at` on all tables
- `create_template_version()` - Create version snapshot on template changes
- `update_recipient_on_qr_scan()` - Update recipient flags on QR scan event
- `update_recipient_on_conversion()` - Update recipient on conversion
- `trigger_update_campaign_stats()` - Recalculate campaign stats on recipient changes
- `update_marketplace_template_rating()` - Recalculate avg rating on review changes

### Helper Functions
- `create_organization_with_owner()` - Create org + assign owner role
- `increment_template_usage()` - Track template usage count
- `update_campaign_stats()` - Aggregate campaign performance
- `validate_template_usps_compliance()` - Check USPS size standards
- `calculate_ab_test_significance()` - Two-proportion z-test
- `validate_api_key()` - Check API key validity and rate limits
- `trigger_webhook()` - Queue webhook delivery
- `cleanup_old_logs()` - Maintenance function for log rotation

## Row-Level Security (RLS) Policies

All tables have RLS enabled with policies based on `user_organization_roles`:

### Standard Policies
```sql
-- SELECT: View data from your organization
CREATE POLICY "Users can view their organization's data"
  ON table_name FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Create data in your organization (editors+)
CREATE POLICY "Users can create in their organization"
  ON table_name FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

-- UPDATE: Modify data in your organization (editors+)
CREATE POLICY "Users can update their organization's data"
  ON table_name FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

-- DELETE: Remove data (admins only)
CREATE POLICY "Admins can delete their organization's data"
  ON table_name FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

### Special Cases
- **Public marketplace templates**: Anyone can view, creator can edit
- **Events/conversions**: Public insert (API key validated at app level)
- **Webhooks**: System can insert for external webhooks

## Indexes Strategy

### Performance Indexes
- **Foreign keys**: All FK columns indexed (auto-created by Postgres)
- **Frequently filtered**: `status`, `created_at`, `organization_id`
- **Full-text search**: GIN indexes on text columns with `to_tsvector()`
- **JSONB queries**: GIN indexes on JSONB columns for fast lookups
- **Composite indexes**: Multi-column indexes for common query patterns

### Example Indexes
```sql
-- Standard foreign key lookup
CREATE INDEX idx_campaigns_org ON campaigns(organization_id);

-- Status filtering
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- Time-based queries
CREATE INDEX idx_events_created ON events(created_at DESC);

-- Full-text search
CREATE INDEX idx_templates_search ON design_templates
  USING gin(to_tsvector('english', name || ' ' || description));

-- JSONB queries
CREATE INDEX idx_marketplace_templates_tags ON marketplace_templates
  USING gin(tags);

-- Partial indexes (WHERE clause for efficiency)
CREATE INDEX idx_templates_public ON design_templates(is_public)
  WHERE is_public = true;
```

## Data Flow Examples

### 1. Campaign Creation → Fulfillment
```
1. User creates campaign (campaigns)
2. User uploads recipient CSV (recipients)
3. System assigns tracking IDs
4. Background job generates personalized DMs (job_queue)
5. System validates addresses (address_validations)
6. System sends to PostGrid (external_integrations)
7. PostGrid prints and ships
8. System updates recipient.mail_status
9. Campaign stats auto-update via trigger
```

### 2. QR Code Scan → Conversion
```
1. Recipient scans QR code
2. Landing page loads (landing_pages)
3. Event logged (events, type: qr_scan)
4. Trigger updates recipient.qr_scanned = true
5. Recipient fills form
6. Conversion created (conversions)
7. Trigger updates recipient.converted = true
8. Campaign stats recalculated
9. Webhook fired to external CRM
```

### 3. Template Marketplace Purchase
```
1. User browses marketplace (marketplace_templates)
2. User views template reviews (template_reviews)
3. User purchases template (template_purchases)
4. Stripe payment processed
5. Template copied to buyer's organization (design_templates)
6. Creator revenue share calculated
7. Template usage_count incremented
```

## Testing the Schema

### 1. Create Test Organization
```sql
SELECT create_organization_with_owner(
  'ACME Corp',
  'acme-corp',
  auth.uid()
);
```

### 2. Create Test Template
```sql
INSERT INTO design_templates (
  organization_id,
  name,
  category,
  dimensions_width,
  dimensions_height,
  fabric_json,
  variable_mappings
) VALUES (
  (SELECT id FROM organizations WHERE slug = 'acme-corp'),
  'Holiday Postcard',
  'postcard',
  1800,
  1200,
  '{"version":"6.0.0","objects":[{"type":"textbox","text":"Hello {{recipientName}}"}]}'::jsonb,
  '{"0":{"variableType":"message","isReusable":false}}'::jsonb
);
```

### 3. Create Test Campaign
```sql
INSERT INTO campaigns (
  organization_id,
  template_id,
  name,
  status
) VALUES (
  (SELECT id FROM organizations WHERE slug = 'acme-corp'),
  (SELECT id FROM design_templates WHERE name = 'Holiday Postcard'),
  'Holiday 2025 Campaign',
  'draft'
);
```

### 4. Add Test Recipients
```sql
INSERT INTO recipients (
  campaign_id,
  first_name,
  last_name,
  address_line1,
  city,
  state,
  zip_code,
  tracking_id
) VALUES
  ((SELECT id FROM campaigns WHERE name = 'Holiday 2025 Campaign'),
   'John', 'Doe', '123 Main St', 'Springfield', 'IL', '62701', 'TR_test_001'),
  ((SELECT id FROM campaigns WHERE name = 'Holiday 2025 Campaign'),
   'Jane', 'Smith', '456 Elm St', 'Chicago', 'IL', '60601', 'TR_test_002');
```

### 5. Log Test Event
```sql
INSERT INTO events (
  organization_id,
  campaign_id,
  recipient_id,
  event_type,
  event_name
) VALUES (
  (SELECT id FROM organizations WHERE slug = 'acme-corp'),
  (SELECT id FROM campaigns WHERE name = 'Holiday 2025 Campaign'),
  (SELECT id FROM recipients WHERE tracking_id = 'TR_test_001'),
  'qr_scan',
  'QR Code Scanned'
);

-- Verify recipient was auto-updated
SELECT qr_scanned, qr_scan_count FROM recipients WHERE tracking_id = 'TR_test_001';
-- Should show: qr_scanned = true, qr_scan_count = 1
```

## Maintenance

### Cleanup Old Logs
```sql
SELECT cleanup_old_logs(90); -- Delete logs older than 90 days
```

### Vacuum and Analyze
```sql
VACUUM ANALYZE;
```

### Check Table Sizes
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Security Checklist

- [x] RLS enabled on all public tables
- [x] Service role key stored securely (never in client code)
- [x] API keys hashed with SHA-256
- [x] Webhook secrets for HMAC verification
- [x] External integration credentials encrypted at application level
- [x] User authentication via Supabase Auth
- [x] Role-based access control (RBAC)
- [x] Audit trails on all sensitive operations
- [x] Soft deletes for data recovery

## Next Steps

After applying migrations:

1. ✅ Update `FABRIC_DESIGN_PLATFORM_MASTER_PLAN.md` checkboxes
2. ✅ Setup Fabric.js client-side (Atom 0.2)
3. ✅ Setup Fabric.js server-side (Atom 0.3)
4. ✅ Create database query abstractions (`lib/database/`)
5. ✅ Implement authentication flows
6. ✅ Build template editor UI
7. ✅ Integrate Data Axle API
8. ✅ Integrate PostGrid fulfillment
9. ✅ Setup Stripe billing

## Resources

- **Supabase Documentation**: https://supabase.com/docs
- **PostgreSQL RLS**: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- **Fabric.js Documentation**: http://fabricjs.com/docs/
- **Master Plan**: `../FABRIC_DESIGN_PLATFORM_MASTER_PLAN.md`
