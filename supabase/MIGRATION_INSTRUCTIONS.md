# Database Migration Instructions

## Overview

This directory contains 8 SQL migration files that establish the complete database schema for the DropLab Fabric.js-based design platform.

## Migration Files (Apply in Order)

1. **20250101000001_organizations_and_brand_kits.sql**
   - Organizations table (multi-tenancy root)
   - Brand kits (visual identity + AI-extracted intelligence)
   - User-organization-role mapping
   - Row-Level Security (RLS) policies

2. **20250101000002_design_templates.sql**
   - Design templates (Fabric.js canvas storage)
   - Template versions (revision history)
   - JSONB storage for canvas state and variable mappings

3. **20250101000003_campaigns_and_recipients.sql**
   - Campaigns (direct mail campaigns)
   - Recipients (personalized recipient data with VDP fields)
   - Campaign statistics (denormalized performance metrics)

4. **20250101000004_analytics_and_performance.sql**
   - Events (granular interaction tracking)
   - Landing pages (personalized landing page content)
   - ElevenLabs calls integration
   - Conversions tracking

5. **20250101000005_postal_compliance.sql**
   - Postal compliance rules
   - Address validations (CASS certification)
   - Design compliance checks
   - USPS size standards reference data

6. **20250101000006_marketplace_and_collaboration.sql**
   - Marketplace templates (public template store)
   - Template purchases and reviews
   - Shared workspaces and collaboration
   - Template comments

7. **20250101000007_ab_testing.sql**
   - A/B tests configuration
   - Test variants
   - Statistical significance calculations
   - Results tracking

8. **20250101000008_api_and_webhooks.sql**
   - API keys management
   - Webhook endpoints
   - External integrations
   - Job queue for background processing

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to: **SQL Editor** → **+ New query**
3. Copy the contents of each migration file (in order)
4. Paste into the SQL editor
5. Click **Run** to execute
6. Verify success before proceeding to next migration
7. Repeat for all 8 migrations

**Dashboard URL:**
```
https://supabase.com/dashboard/project/egccqmlhzqiirovstpal/sql
```

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link to your project
supabase link --project-ref egccqmlhzqiirovstpal

# Run all migrations
supabase db push

# Or run individually
psql $DATABASE_URL < supabase/migrations/20250101000001_organizations_and_brand_kits.sql
```

### Option 3: Combined SQL File

A combined SQL file with all migrations is available:
```bash
cat supabase/migrations/*.sql > supabase/all_migrations.sql
```

Then execute via dashboard or CLI.

## Verification Steps

After applying all migrations:

### 1. Check Tables Created
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- `organizations`
- `brand_kits`
- `user_organization_roles`
- `design_templates`
- `template_versions`
- `campaigns`
- `recipients`
- `campaign_stats`
- `events`
- `landing_pages`
- `elevenlabs_calls`
- `conversions`
- `postal_compliance_rules`
- `address_validations`
- `design_compliance_checks`
- `usps_size_standards`
- `marketplace_templates`
- `template_purchases`
- `template_reviews`
- `shared_workspaces`
- `workspace_members`
- `workspace_templates`
- `template_comments`
- `ab_tests`
- `ab_test_variants`
- `ab_test_results`
- `ab_test_assignments`
- `api_keys`
- `api_request_logs`
- `webhook_endpoints`
- `webhook_deliveries`
- `external_integrations`
- `job_queue`

### 2. Verify RLS Policies
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 3. Test Multi-Tenancy

Create a test organization and user:
```sql
-- Create test organization
SELECT create_organization_with_owner(
  'Test Organization',
  'test-org',
  auth.uid()  -- Your user ID from auth.users
);

-- Verify isolation
SELECT * FROM organizations;  -- Should only see your organization
```

### 4. Test Template Storage
```sql
-- Insert test template
INSERT INTO design_templates (
  organization_id,
  name,
  category,
  dimensions_width,
  dimensions_height,
  fabric_json,
  variable_mappings
) VALUES (
  (SELECT id FROM organizations LIMIT 1),
  'Test Postcard',
  'postcard',
  1800,
  1200,
  '{"version":"6.0.0","objects":[]}'::jsonb,
  '{}'::jsonb
);

-- Verify insertion
SELECT id, name, category FROM design_templates;
```

## Rollback (If Needed)

To rollback all migrations:
```sql
-- WARNING: This will delete all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

## Common Issues

### Issue: "relation already exists"
**Solution:** Migration was already applied. Check existing tables:
```sql
\dt public.*
```

### Issue: "permission denied"
**Solution:** Ensure you're using the service_role key or have sufficient permissions.

### Issue: RLS policies preventing access
**Solution:** Verify you have a user_organization_role entry:
```sql
SELECT * FROM user_organization_roles WHERE user_id = auth.uid();
```

## Next Steps

After successful migration:

1. ✅ Update master plan checkboxes in `FABRIC_DESIGN_PLATFORM_MASTER_PLAN.md`
2. ✅ Begin Phase 0, Atom 0.2: Setup Fabric.js client-side
3. ✅ Test basic CRUD operations with the new schema
4. ✅ Create seed data for development/testing

## Support

If you encounter issues:
1. Check Supabase Dashboard → Logs for error details
2. Review migration SQL for syntax errors
3. Verify environment variables are set correctly
4. Consult Supabase documentation: https://supabase.com/docs
