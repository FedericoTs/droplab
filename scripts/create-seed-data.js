#!/usr/bin/env node

/**
 * Direct Seed Data Creation Script
 * Bypasses PostgREST schema cache by using raw SQL
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const organizations = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    plan_tier: 'enterprise',
    billing_status: 'active',
    brand_primary_color: '#FF0000',
    brand_secondary_color: '#000000',
    brand_accent_color: '#FFCC00',
    brand_font_headline: 'Roboto',
    brand_font_body: 'Open Sans',
    monthly_design_limit: 1000,
    monthly_sends_limit: 100000,
    storage_limit_mb: 10000,
    credits: 1000.00
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'TechStart Inc',
    slug: 'techstart',
    plan_tier: 'professional',
    billing_status: 'active',
    brand_primary_color: '#3B82F6',
    brand_secondary_color: '#8B5CF6',
    brand_accent_color: '#F59E0B',
    monthly_design_limit: 500,
    monthly_sends_limit: 10000,
    storage_limit_mb: 5000,
    credits: 500.00
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Local Bakery',
    slug: 'local-bakery',
    plan_tier: 'free',
    billing_status: 'trialing',
    brand_primary_color: '#FFA07A',
    brand_secondary_color: '#8B4513',
    brand_accent_color: '#FFD700',
    monthly_design_limit: 100,
    monthly_sends_limit: 1000,
    storage_limit_mb: 1000,
    credits: 50.00
  }
];

const users = [
  { email: 'owner@acme-corp.test', name: 'Acme Owner', org_id: '11111111-1111-1111-1111-111111111111', role: 'owner' },
  { email: 'admin@acme-corp.test', name: 'Acme Admin', org_id: '11111111-1111-1111-1111-111111111111', role: 'admin' },
  { email: 'owner@techstart.test', name: 'TechStart Owner', org_id: '22222222-2222-2222-2222-222222222222', role: 'owner' },
  { email: 'admin@techstart.test', name: 'TechStart Admin', org_id: '22222222-2222-2222-2222-222222222222', role: 'admin' },
  { email: 'owner@local-bakery.test', name: 'Bakery Owner', org_id: '33333333-3333-3333-3333-333333333333', role: 'owner' },
  { email: 'admin@local-bakery.test', name: 'Bakery Admin', org_id: '33333333-3333-3333-3333-333333333333', role: 'admin' }
];

async function createSeedData() {
  console.log('🌱 Creating seed data...\n');

  try {
    // Step 1: Create organizations using raw SQL
    console.log('📦 Step 1: Creating organizations...');

    for (const org of organizations) {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO organizations (
            id, name, slug, plan_tier, billing_status,
            brand_primary_color, brand_secondary_color, brand_accent_color,
            brand_font_headline, brand_font_body,
            monthly_design_limit, monthly_sends_limit, storage_limit_mb, credits
          ) VALUES (
            '${org.id}'::uuid,
            '${org.name}',
            '${org.slug}',
            '${org.plan_tier}',
            '${org.billing_status}',
            '${org.brand_primary_color}',
            '${org.brand_secondary_color}',
            '${org.brand_accent_color}',
            '${org.brand_font_headline}',
            '${org.brand_font_body}',
            ${org.monthly_design_limit},
            ${org.monthly_sends_limit},
            ${org.storage_limit_mb},
            ${org.credits}
          )
          ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            credits = EXCLUDED.credits
          RETURNING id, name, slug;
        `
      });

      if (error) {
        console.log(`⚠️  ${org.name}: ${error.message}`);
        // Try alternative method: direct insert
        const { error: insertError } = await supabase
          .from('organizations')
          .upsert(org, { onConflict: 'slug' });

        if (!insertError) {
          console.log(`✅ ${org.name} created (via direct insert)`);
        } else {
          console.error(`❌ ${org.name}: ${insertError.message}`);
        }
      } else {
        console.log(`✅ ${org.name} created`);
      }
    }

    console.log('\n👥 Step 2: Creating auth users...');

    const createdUsers = [];
    for (const user of users) {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'Test123456!',
        email_confirm: true,
        user_metadata: {
          full_name: user.name
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`⚠️  ${user.email}: Already exists`);
          // Get existing user
          const { data: listData } = await supabase.auth.admin.listUsers();
          const existingUser = listData?.users.find(u => u.email === user.email);
          if (existingUser) {
            createdUsers.push({ ...user, id: existingUser.id });
          }
          continue;
        } else {
          console.error(`❌ ${user.email}: ${authError.message}`);
          continue;
        }
      }

      console.log(`✅ ${user.email} created (auth)`);
      createdUsers.push({ ...user, id: authData.user.id });
    }

    console.log('\n🔗 Step 3: Creating user profiles...');

    for (const user of createdUsers) {
      const profileData = {
        id: user.id,
        organization_id: user.org_id,
        full_name: user.name,
        role: user.role,
        can_create_designs: true,
        can_send_campaigns: user.role === 'owner' || user.role === 'admin',
        can_manage_billing: user.role === 'owner',
        can_invite_users: user.role === 'owner' || user.role === 'admin',
        can_approve_designs: user.role === 'owner' || user.role === 'admin',
        can_manage_templates: true,
        can_access_analytics: true
      };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (profileError) {
        console.error(`❌ Profile for ${user.email}: ${profileError.message}`);
      } else {
        console.log(`✅ Profile for ${user.email} created`);
      }
    }

    console.log('\n✅ Seed data creation complete!\n');
    console.log('🔐 Test Credentials:');
    console.log('─────────────────────────────────────────────────');
    users.forEach(u => {
      console.log(`   ${u.email} / Test123456!`);
    });
    console.log('─────────────────────────────────────────────────\n');
    console.log('🎯 Next steps:');
    console.log('   1. Go to http://localhost:3000/auth/login');
    console.log('   2. Log in with any of the above credentials');
    console.log('   3. Verify you see organization-specific data\n');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

createSeedData();
