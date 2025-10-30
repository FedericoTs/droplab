-- Migration 002: User Profiles Table (Extends Supabase Auth)
-- Links Supabase Auth users to organizations with roles and permissions
-- One user can only belong to ONE organization (enforced at application level)

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

  -- Granular Permissions (boolean flags for fine-grained control)
  can_create_designs BOOLEAN DEFAULT true,
  can_send_campaigns BOOLEAN DEFAULT false,
  can_manage_billing BOOLEAN DEFAULT false,
  can_invite_users BOOLEAN DEFAULT false,
  can_approve_designs BOOLEAN DEFAULT false,
  can_manage_templates BOOLEAN DEFAULT true,
  can_access_analytics BOOLEAN DEFAULT true,

  -- User Preferences
  ui_preferences JSONB DEFAULT '{}'::jsonb,
  -- Example: { "theme": "dark", "editor_shortcuts": { "save": "ctrl+s" }, "default_canvas_size": "postcard_6x4" }

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_org ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active ON user_profiles(last_active_at DESC);

-- Enable Row-Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view profiles in their organization
CREATE POLICY "Users can view profiles in their organization"
  ON user_profiles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- RLS Policy: Owners and admins can update other users in their org
CREATE POLICY "Owners and admins can update users in their organization"
  ON user_profiles FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- RLS Policy: Only organization owners can delete users
CREATE POLICY "Owners can delete users in their organization"
  ON user_profiles FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user_profile when auth.users is created
-- This ensures every authenticated user has a profile
-- Note: Organization assignment happens at signup via application logic
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called from application code after organization is created
  -- We don't auto-create here because we need organization_id first
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
-- Note: Disabled for now - we'll handle user_profile creation in signup flow
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION handle_new_user();

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

-- Helper function to get user's organization
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

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'Extends auth.users with organization membership and role-based permissions. One user = one organization.';
COMMENT ON COLUMN user_profiles.role IS 'Primary role: owner (full access), admin (most access), designer (create/edit), viewer (read-only)';
COMMENT ON COLUMN user_profiles.ui_preferences IS 'JSONB object with UI preferences: theme, shortcuts, default sizes, etc.';
COMMENT ON COLUMN user_profiles.notification_preferences IS 'JSONB object controlling email and in-app notification settings.';

-- Permission roles reference guide
COMMENT ON COLUMN user_profiles.can_create_designs IS 'Permission to create new design templates';
COMMENT ON COLUMN user_profiles.can_send_campaigns IS 'Permission to send campaigns (expensive operation)';
COMMENT ON COLUMN user_profiles.can_manage_billing IS 'Permission to update billing, credits, subscriptions';
COMMENT ON COLUMN user_profiles.can_invite_users IS 'Permission to invite new team members';
COMMENT ON COLUMN user_profiles.can_approve_designs IS 'Permission to approve designs for sending';
