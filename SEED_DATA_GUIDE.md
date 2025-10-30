# Seed Data Setup Guide

**Status**: Phase 1 Foundation Complete - Database Ready for Testing

This guide explains how to create test data in your Supabase database for development and testing.

---

## 🎯 Overview

You'll create:
- **3 Organizations**: Acme Corp (Enterprise), TechStart (Professional), Local Bakery (Free)
- **6 Test Users**: 2 users per organization (Owner and Admin roles)
- **Complete Permissions**: Fully configured RBAC with granular permissions

---

## 📋 Prerequisites

1. ✅ Supabase project created (`egccqmlhzqiirovstpal`)
2. ✅ Database schema deployed (all 4 foundation tables exist)
3. ✅ Environment variables configured (`.env.local`)

Verify prerequisites:
```bash
curl -s http://localhost:3000/api/admin/verify-schema | python3 -m json.tool
```

Should return: `"database_ready": true`

---

## 🚀 Step-by-Step Instructions

### Step 1: Create Organizations (SQL)

1. Open Supabase Dashboard SQL Editor:
   ```
   https://supabase.com/dashboard/project/egccqmlhzqiirovstpal/sql/new
   ```

2. Copy and paste **PART 1** from `supabase/seed-data.sql`

3. Click **RUN** (bottom right corner)

4. **Verify** organizations created:
   ```sql
   SELECT name, slug, plan_tier, credits
   FROM organizations
   WHERE slug IN ('acme-corp', 'techstart', 'local-bakery');
   ```

   **Expected Output**:
   | name | slug | plan_tier | credits |
   |------|------|-----------|---------|
   | Acme Corporation | acme-corp | enterprise | 1000.00 |
   | TechStart Inc | techstart | professional | 500.00 |
   | Local Bakery | local-bakery | free | 50.00 |

---

### Step 2: Create Auth Users (Supabase Dashboard UI)

1. Navigate to **Auth > Users**:
   ```
   https://supabase.com/dashboard/project/egccqmlhzqiirovstpal/auth/users
   ```

2. Click **"Add user"** (top right)

3. Create **6 users** with these exact credentials:

   | Email | Password | Name (User Metadata) |
   |-------|----------|---------------------|
   | owner@acme-corp.test | Test123456! | Acme Owner |
   | admin@acme-corp.test | Test123456! | Acme Admin |
   | owner@techstart.test | Test123456! | TechStart Owner |
   | admin@techstart.test | Test123456! | TechStart Admin |
   | owner@local-bakery.test | Test123456! | Bakery Owner |
   | admin@local-bakery.test | Test123456! | Bakery Admin |

4. **Important**: For each user, check **"Auto Confirm User"** to skip email verification

5. After creating all 6 users, **copy their UUIDs** (you'll need them for Step 3)

   Run this query to get UUIDs:
   ```sql
   SELECT id, email, raw_user_meta_data->>'full_name' as name
   FROM auth.users
   WHERE email LIKE '%@acme-corp.test'
      OR email LIKE '%@techstart.test'
      OR email LIKE '%@local-bakery.test'
   ORDER BY email;
   ```

---

### Step 3: Create User Profiles (SQL)

1. Copy the template below and **replace the UUIDs** with actual user IDs from Step 2

2. Paste into SQL Editor and **RUN**:

```sql
-- Link auth users to organizations via user_profiles
INSERT INTO user_profiles (
  id,
  organization_id,
  full_name,
  role,
  can_create_designs,
  can_send_campaigns,
  can_manage_billing,
  can_invite_users,
  can_approve_designs,
  can_manage_templates,
  can_access_analytics
) VALUES
-- Acme Corp (Enterprise) - Organization ID: 11111111-1111-1111-1111-111111111111
('REPLACE-WITH-owner@acme-corp.test-UUID', '11111111-1111-1111-1111-111111111111', 'Acme Owner', 'owner', true, true, true, true, true, true, true),
('REPLACE-WITH-admin@acme-corp.test-UUID', '11111111-1111-1111-1111-111111111111', 'Acme Admin', 'admin', true, true, false, true, true, true, true),

-- TechStart Inc (Professional) - Organization ID: 22222222-2222-2222-2222-222222222222
('REPLACE-WITH-owner@techstart.test-UUID', '22222222-2222-2222-2222-222222222222', 'TechStart Owner', 'owner', true, true, true, true, true, true, true),
('REPLACE-WITH-admin@techstart.test-UUID', '22222222-2222-2222-2222-222222222222', 'TechStart Admin', 'admin', true, true, false, true, true, true, true),

-- Local Bakery (Free) - Organization ID: 33333333-3333-3333-3333-333333333333
('REPLACE-WITH-owner@local-bakery.test-UUID', '33333333-3333-3333-3333-333333333333', 'Bakery Owner', 'owner', true, true, true, true, true, true, true),
('REPLACE-WITH-admin@local-bakery.test-UUID', '33333333-3333-3333-3333-333333333333', 'Bakery Admin', 'admin', true, true, false, true, true, true, true)
ON CONFLICT (id) DO NOTHING;
```

3. **Verify** user profiles created:
   ```sql
   SELECT
     up.full_name,
     up.role,
     o.name as organization,
     up.can_manage_billing,
     up.created_at
   FROM user_profiles up
   JOIN organizations o ON up.organization_id = o.id
   ORDER BY o.name, up.role;
   ```

   **Expected**: 6 rows (2 users per organization)

---

## ✅ Verification & Testing

### Test 1: Verify All Data

Run this comprehensive check:

```sql
-- Summary of all seed data
SELECT
  o.name as organization,
  o.plan_tier,
  o.credits,
  COUNT(up.id) as users,
  STRING_AGG(up.full_name || ' (' || up.role || ')', ', ') as team
FROM organizations o
LEFT JOIN user_profiles up ON o.id = up.organization_id
WHERE o.slug IN ('acme-corp', 'techstart', 'local-bakery')
GROUP BY o.id, o.name, o.plan_tier, o.credits
ORDER BY o.name;
```

**Expected Output**:
| organization | plan_tier | credits | users | team |
|--------------|-----------|---------|-------|------|
| Acme Corporation | enterprise | 1000.00 | 2 | Acme Owner (owner), Acme Admin (admin) |
| Local Bakery | free | 50.00 | 2 | Bakery Owner (owner), Bakery Admin (admin) |
| TechStart Inc | professional | 500.00 | 2 | TechStart Owner (owner), TechStart Admin (admin) |

---

### Test 2: Test Multi-Tenant Isolation (RLS)

1. **Log in** as `owner@acme-corp.test` / `Test123456!`
2. Go to http://localhost:3000/dashboard
3. **Verify** you see: "Acme Corporation" organization data
4. **Log out** and log in as `owner@techstart.test`
5. **Verify** you see: "TechStart Inc" organization data
6. **Verify** you DO NOT see Acme Corp data

This confirms Row-Level Security is working correctly!

---

### Test 3: Test Role-Based Permissions

Run this query while logged in as **admin user**:

```sql
SELECT
  can_create_designs,
  can_send_campaigns,
  can_manage_billing,  -- Should be FALSE for admin
  can_invite_users,
  can_approve_designs
FROM user_profiles
WHERE id = auth.uid();
```

**Expected** for admin: `can_manage_billing = false`

**Expected** for owner: `can_manage_billing = true`

---

## 🧪 Test Credentials

Use these credentials to log in at http://localhost:3000/auth/login:

### Acme Corporation (Enterprise)
- **Owner**: `owner@acme-corp.test` / `Test123456!`
  - Full access including billing management
  - 1000 credits available
- **Admin**: `admin@acme-corp.test` / `Test123456!`
  - Cannot manage billing
  - Can send campaigns and invite users

### TechStart Inc (Professional)
- **Owner**: `owner@techstart.test` / `Test123456!`
  - Full access including billing management
  - 500 credits available
- **Admin**: `admin@techstart.test` / `Test123456!`
  - Cannot manage billing
  - Can send campaigns and invite users

### Local Bakery (Free Tier)
- **Owner**: `owner@local-bakery.test` / `Test123456!`
  - Full access including billing management
  - 50 credits available (trial)
- **Admin**: `admin@local-bakery.test` / `Test123456!`
  - Cannot manage billing
  - Limited features (free tier)

---

## 🧹 Cleanup (Optional)

To remove all seed data:

```sql
-- 1. Delete user profiles
DELETE FROM user_profiles WHERE organization_id IN (
  SELECT id FROM organizations WHERE slug IN ('acme-corp', 'techstart', 'local-bakery')
);

-- 2. Delete organizations
DELETE FROM organizations WHERE slug IN ('acme-corp', 'techstart', 'local-bakery');

-- 3. Manually delete auth users via Supabase Dashboard Auth UI
```

---

## 🐛 Troubleshooting

### Issue: "User already exists" error
**Solution**: User was created in a previous run. Either:
- Delete the user via Auth UI and recreate
- Skip that user and continue

### Issue: "Foreign key constraint" error when creating user_profile
**Solution**: User UUID doesn't match auth.users. Double-check:
```sql
SELECT id, email FROM auth.users WHERE email = 'owner@acme-corp.test';
```

### Issue: Can't see organization data after login
**Possible causes**:
1. User profile not created → Check `user_profiles` table
2. Wrong organization_id → Verify `organization_id` matches
3. RLS policy blocking access → Check if you're logged in correctly

**Debug query** (run while logged in):
```sql
SELECT
  auth.uid() as my_user_id,
  up.organization_id,
  o.name as my_organization
FROM user_profiles up
JOIN organizations o ON up.organization_id = o.id
WHERE up.id = auth.uid();
```

---

## 🎉 Success!

If all verification tests pass, you now have:

✅ 3 fully configured multi-tenant organizations
✅ 6 test users with role-based permissions
✅ Row-Level Security (RLS) enforcing data isolation
✅ Complete brand kits for each organization
✅ Credits allocated for Data Axle contact purchases

**Next Steps**:
- Update dashboard to display organization branding
- Test template creation with different users
- Begin Phase 2: Fabric.js Design Engine

---

**Questions or Issues?**
Check the main transformation plan: `DROPLAB_TRANSFORMATION_PLAN.md`
Database queries reference: `lib/database/supabase-queries.ts`
TypeScript types: `lib/database/types.ts`
