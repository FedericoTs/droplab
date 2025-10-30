-- ============================================================================
-- SEED DATA FOR DROPLAB SUPABASE DATABASE
-- ============================================================================
-- This script creates test organizations and prepares for user creation
-- Run this in Supabase Dashboard SQL Editor: https://supabase.com/dashboard/project/egccqmlhzqiirovstpal/sql/new
--
-- IMPORTANT: After running this script, you must create auth users manually via Supabase Auth UI
-- Then run the second part of this script to link users to organizations
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE ORGANIZATIONS
-- ============================================================================

-- Organization 1: Acme Corporation (Enterprise)
INSERT INTO organizations (
  id,
  name,
  slug,
  plan_tier,
  billing_status,
  brand_primary_color,
  brand_secondary_color,
  brand_accent_color,
  brand_font_headline,
  brand_font_body,
  brand_voice_guidelines,
  monthly_design_limit,
  monthly_sends_limit,
  storage_limit_mb,
  credits
) VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Acme Corporation',
  'acme-corp',
  'enterprise',
  'active',
  '#FF0000',
  '#000000',
  '#FFCC00',
  'Roboto',
  'Open Sans',
  '{"tone": "professional", "style": "bold", "keywords": ["innovation", "quality", "reliable"]}'::jsonb,
  1000,
  100000,
  10000,
  1000.00
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  plan_tier = EXCLUDED.plan_tier,
  credits = EXCLUDED.credits;

-- Organization 2: TechStart Inc (Professional)
INSERT INTO organizations (
  id,
  name,
  slug,
  plan_tier,
  billing_status,
  brand_primary_color,
  brand_secondary_color,
  brand_accent_color,
  brand_font_headline,
  brand_font_body,
  brand_voice_guidelines,
  monthly_design_limit,
  monthly_sends_limit,
  storage_limit_mb,
  credits
) VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  'TechStart Inc',
  'techstart',
  'professional',
  'active',
  '#3B82F6',
  '#8B5CF6',
  '#F59E0B',
  'Inter',
  'Inter',
  '{"tone": "modern", "style": "friendly", "keywords": ["innovation", "startup", "growth"]}'::jsonb,
  500,
  10000,
  5000,
  500.00
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  plan_tier = EXCLUDED.plan_tier,
  credits = EXCLUDED.credits;

-- Organization 3: Local Bakery (Free/Trial)
INSERT INTO organizations (
  id,
  name,
  slug,
  plan_tier,
  billing_status,
  brand_primary_color,
  brand_secondary_color,
  brand_accent_color,
  brand_font_headline,
  brand_font_body,
  brand_voice_guidelines,
  monthly_design_limit,
  monthly_sends_limit,
  storage_limit_mb,
  credits
) VALUES (
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Local Bakery',
  'local-bakery',
  'free',
  'trialing',
  '#FFA07A',
  '#8B4513',
  '#FFD700',
  'Georgia',
  'Georgia',
  '{"tone": "warm", "style": "friendly", "keywords": ["fresh", "homemade", "community"]}'::jsonb,
  100,
  1000,
  1000,
  50.00
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  plan_tier = EXCLUDED.plan_tier,
  credits = EXCLUDED.credits;

-- Verify organizations created
SELECT
  name,
  slug,
  plan_tier,
  credits,
  created_at
FROM organizations
WHERE slug IN ('acme-corp', 'techstart', 'local-bakery')
ORDER BY created_at;

-- ============================================================================
-- PART 2: CREATE AUTH USERS (MANUAL STEP - DO THIS VIA SUPABASE DASHBOARD)
-- ============================================================================
--
-- Navigate to: https://supabase.com/dashboard/project/egccqmlhzqiirovstpal/auth/users
-- Click "Add user" and create these 6 users:
--
-- 1. owner@acme-corp.test | Password: Test123456! | Name: Acme Owner
-- 2. admin@acme-corp.test | Password: Test123456! | Name: Acme Admin
-- 3. owner@techstart.test | Password: Test123456! | Name: TechStart Owner
-- 4. admin@techstart.test | Password: Test123456! | Name: TechStart Admin
-- 5. owner@local-bakery.test | Password: Test123456! | Name: Bakery Owner
-- 6. admin@local-bakery.test | Password: Test123456! | Name: Bakery Admin
--
-- After creating users, note their UUIDs and run PART 3 below
--
-- ============================================================================

-- ============================================================================
-- PART 3: CREATE USER PROFILES (RUN AFTER AUTH USERS ARE CREATED)
-- ============================================================================
--
-- IMPORTANT: Replace the UUID placeholders below with actual user IDs from auth.users
-- You can get user IDs by running: SELECT id, email FROM auth.users;
--
-- Example of how to link users (REPLACE UUIDs WITH ACTUAL VALUES):
--
-- -- Get user IDs first
-- SELECT id, email, raw_user_meta_data->>'full_name' as name
-- FROM auth.users
-- WHERE email LIKE '%@acme-corp.test'
--    OR email LIKE '%@techstart.test'
--    OR email LIKE '%@local-bakery.test'
-- ORDER BY email;
--
-- -- Then create user profiles (EXAMPLE - REPLACE UUIDs)
-- INSERT INTO user_profiles (
--   id,
--   organization_id,
--   full_name,
--   role,
--   can_create_designs,
--   can_send_campaigns,
--   can_manage_billing,
--   can_invite_users,
--   can_approve_designs,
--   can_manage_templates,
--   can_access_analytics
-- ) VALUES
-- -- Acme Corp users
-- ('REPLACE-WITH-OWNER-ACME-UUID', '11111111-1111-1111-1111-111111111111', 'Acme Owner', 'owner', true, true, true, true, true, true, true),
-- ('REPLACE-WITH-ADMIN-ACME-UUID', '11111111-1111-1111-1111-111111111111', 'Acme Admin', 'admin', true, true, false, true, true, true, true),
--
-- -- TechStart users
-- ('REPLACE-WITH-OWNER-TECHSTART-UUID', '22222222-2222-2222-2222-222222222222', 'TechStart Owner', 'owner', true, true, true, true, true, true, true),
-- ('REPLACE-WITH-ADMIN-TECHSTART-UUID', '22222222-2222-2222-2222-222222222222', 'TechStart Admin', 'admin', true, true, false, true, true, true, true),
--
-- -- Local Bakery users
-- ('REPLACE-WITH-OWNER-BAKERY-UUID', '33333333-3333-3333-3333-333333333333', 'Bakery Owner', 'owner', true, true, true, true, true, true, true),
-- ('REPLACE-WITH-ADMIN-BAKERY-UUID', '33333333-3333-3333-3333-333333333333', 'Bakery Admin', 'admin', true, true, false, true, true, true, true)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check organizations
SELECT
  id,
  name,
  slug,
  plan_tier,
  billing_status,
  credits,
  brand_primary_color,
  monthly_design_limit,
  created_at
FROM organizations
WHERE slug IN ('acme-corp', 'techstart', 'local-bakery')
ORDER BY name;

-- Check auth users (after PART 2)
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email LIKE '%@acme-corp.test'
   OR email LIKE '%@techstart.test'
   OR email LIKE '%@local-bakery.test'
ORDER BY email;

-- Check user profiles (after PART 3)
SELECT
  up.id,
  up.full_name,
  up.role,
  o.name as organization,
  o.slug as org_slug,
  up.can_create_designs,
  up.can_send_campaigns,
  up.can_manage_billing,
  up.created_at
FROM user_profiles up
JOIN organizations o ON up.organization_id = o.id
WHERE o.slug IN ('acme-corp', 'techstart', 'local-bakery')
ORDER BY o.name, up.role;

-- Check RLS is working (this should only return data for the logged-in user's org)
-- Run this query while logged in as different users to test isolation
SELECT
  o.name as my_organization,
  o.plan_tier,
  o.credits,
  COUNT(up.id) as team_members
FROM organizations o
LEFT JOIN user_profiles up ON o.id = up.organization_id
WHERE o.id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
GROUP BY o.id, o.name, o.plan_tier, o.credits;

-- ============================================================================
-- CLEANUP (IF NEEDED)
-- ============================================================================

-- To remove all seed data:
-- DELETE FROM user_profiles WHERE organization_id IN (
--   SELECT id FROM organizations WHERE slug IN ('acme-corp', 'techstart', 'local-bakery')
-- );
--
-- DELETE FROM organizations WHERE slug IN ('acme-corp', 'techstart', 'local-bakery');
--
-- Then manually delete auth users via Supabase Dashboard

-- ============================================================================
-- TEST CREDENTIALS
-- ============================================================================
--
-- After completing all 3 parts, you can log in with:
--
-- Acme Corporation:
--   owner@acme-corp.test / Test123456!
--   admin@acme-corp.test / Test123456!
--
-- TechStart Inc:
--   owner@techstart.test / Test123456!
--   admin@techstart.test / Test123456!
--
-- Local Bakery:
--   owner@local-bakery.test / Test123456!
--   admin@local-bakery.test / Test123456!
--
-- ============================================================================
