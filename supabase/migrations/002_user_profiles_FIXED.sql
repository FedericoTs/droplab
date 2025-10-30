-- Migration 002: User Profiles Table (FIXED RLS - No Infinite Recursion)
-- Links Supabase Auth users to organizations with roles and permissions

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- User Information
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  job_title TEXT,
  department TEXT,

  -- Role-Based Access Control (RBAC)
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, designer, viewer

  -- Granular Permissions
  can_create_designs BOOLEAN DEFAULT true,
  can_send_campaigns BOOLEAN DEFAULT false,
  can_manage_billing BOOLEAN DEFAULT false,
  can_invite_users BOOLEAN DEFAULT false,
  can_approve_designs BOOLEAN DEFAULT false,
  can_manage_templates BOOLEAN DEFAULT true,
  can_access_analytics BOOLEAN DEFAULT true,

  -- User Preferences
  ui_preferences JSONB DEFAULT '{}'::jsonb,
  notification_preferences JSONB DEFAULT '{
    "email_campaign_complete": true,
    "email_campaign_failed": true,
    "email_low_credits": true,
    "in_app_notifications": true
  }'::jsonb,

  -- Activity Tracking
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_org ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active ON user_profiles(last_active_at DESC);

-- Helper function MUST be created BEFORE RLS policies!
-- This function runs with SECURITY DEFINER (bypasses RLS) to avoid infinite recursion
CREATE OR REPLACE FUNCTION get_user_organization(user_id UUID)
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id
  FROM user_profiles
  WHERE id = user_id;

  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
  user_id UUID,
  permission_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN;
BEGIN
  EXECUTE format(
    'SELECT %I FROM user_profiles WHERE id = $1',
    permission_name
  ) INTO has_permission USING user_id;

  RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(
  user_id UUID,
  required_roles TEXT[]
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM user_profiles
  WHERE id = user_id;

  RETURN user_role = ANY(required_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row-Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ✅ FIXED RLS Policy: Users can view profiles in their organization
-- Uses SECURITY DEFINER function to avoid infinite recursion
CREATE POLICY "Users can view profiles in their organization"
  ON user_profiles FOR SELECT
  USING (organization_id = get_user_organization(auth.uid()));

-- ✅ FIXED RLS Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ✅ FIXED RLS Policy: Owners and admins can update users in their org
CREATE POLICY "Owners and admins can update users in their organization"
  ON user_profiles FOR UPDATE
  USING (
    organization_id = get_user_organization(auth.uid())
    AND user_has_role(auth.uid(), ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    organization_id = get_user_organization(auth.uid())
    AND user_has_role(auth.uid(), ARRAY['owner', 'admin'])
  );

-- ✅ FIXED RLS Policy: Only organization owners can delete users
CREATE POLICY "Owners can delete users in their organization"
  ON user_profiles FOR DELETE
  USING (
    organization_id = get_user_organization(auth.uid())
    AND user_has_role(auth.uid(), ARRAY['owner'])
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE user_profiles IS 'Extends auth.users with organization membership. One user = one organization.';
COMMENT ON FUNCTION get_user_organization(UUID) IS 'SECURITY DEFINER function to get user org (bypasses RLS to avoid infinite recursion)';
COMMENT ON FUNCTION user_has_role(UUID, TEXT[]) IS 'SECURITY DEFINER function to check if user has specific role';
