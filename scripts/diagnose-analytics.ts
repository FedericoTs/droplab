#!/usr/bin/env npx tsx
/**
 * Analytics Diagnostics Script
 *
 * Checks database health, table structure, and data availability
 * for the Analytics page functionality.
 *
 * Run with: npx dotenv-cli -e .env.local -- npx tsx scripts/diagnose-analytics.ts
 */

import { createClient } from '@supabase/supabase-js';

// Use service role to bypass RLS for diagnostics
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 ANALYTICS DIAGNOSTICS');
  console.log('='.repeat(60));

  // 1. Test connection
  console.log('\n📡 1. Testing Database Connection...');
  try {
    const { data, error } = await supabase.from('organizations').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('   ✅ Database connection successful');
  } catch (err: any) {
    console.error('   ❌ Database connection failed:', err.message);
    return;
  }

  // 2. Check critical tables exist and count rows
  console.log('\n📊 2. Checking Core Tables...');
  const tables = [
    'organizations',
    'user_profiles',
    'campaigns',
    'campaign_recipients',
    'events',
    'conversions',
    'landing_pages',
    'elevenlabs_calls',
    'dm_templates'
  ];

  const tableCounts: Record<string, number> = {};

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ⚠️  ${table}: Error - ${error.message}`);
      } else {
        tableCounts[table] = count || 0;
        const status = count && count > 0 ? '✅' : '⚠️ ';
        console.log(`   ${status} ${table}: ${count || 0} rows`);
      }
    } catch (err: any) {
      console.log(`   ❌ ${table}: ${err.message}`);
    }
  }

  // 3. Check organizations
  console.log('\n🏢 3. Organizations...');
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, billing_status, created_at')
    .limit(5);

  if (orgs && orgs.length > 0) {
    for (const org of orgs) {
      console.log(`   📌 ${org.name} (${org.id.substring(0, 8)}...) - ${org.billing_status || 'no billing'}`);
    }
  } else {
    console.log('   ⚠️  No organizations found');
  }

  // 4. Check users via auth.users
  console.log('\n👤 4. Auth Users...');
  const { data: authData } = await supabase.auth.admin.listUsers();
  if (authData?.users && authData.users.length > 0) {
    console.log(`   Found ${authData.users.length} auth users`);
    for (const user of authData.users.slice(0, 3)) {
      console.log(`   👤 ${user.email} (${user.id.substring(0, 8)}...)`);
    }
  }

  // 5. Check campaigns
  console.log('\n📧 5. Campaigns...');
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, status, organization_id, total_recipients, created_at')
    .limit(5);

  if (campaigns && campaigns.length > 0) {
    for (const camp of campaigns) {
      console.log(`   📨 ${camp.name} | Status: ${camp.status || 'draft'} | Recipients: ${camp.total_recipients || 0}`);
    }
  } else {
    console.log('   ⚠️  No campaigns found - this is why analytics shows no data!');
  }

  // 6. Check events
  console.log('\n📈 6. Events Table...');
  const { data: events } = await supabase
    .from('events')
    .select('id, event_type, campaign_id, tracking_code, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (events && events.length > 0) {
    console.log(`   Found ${tableCounts['events']} total events`);
    const eventTypes = [...new Set(events.map(e => e.event_type))];
    console.log(`   Event types: ${eventTypes.join(', ')}`);
    for (const evt of events) {
      const date = new Date(evt.created_at).toLocaleDateString();
      console.log(`   📊 ${evt.event_type} | Campaign: ${evt.campaign_id?.substring(0,8) || 'none'} | ${date}`);
    }
  } else {
    console.log('   ⚠️  No events found - no tracking data recorded');
  }

  // 7. Check conversions
  console.log('\n🎯 7. Conversions Table...');
  const { data: conversions } = await supabase
    .from('conversions')
    .select('id, conversion_type, campaign_id, tracking_code, conversion_value, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (conversions && conversions.length > 0) {
    console.log(`   Found ${tableCounts['conversions']} total conversions`);
    for (const conv of conversions) {
      const date = new Date(conv.created_at).toLocaleDateString();
      console.log(`   🎯 ${conv.conversion_type} | Value: $${conv.conversion_value || 0} | ${date}`);
    }
  } else {
    console.log('   ⚠️  No conversions found');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));

  const issues: string[] = [];

  if (tableCounts['organizations'] === 0) issues.push('No organizations - create one first');
  if (tableCounts['user_profiles'] === 0) issues.push('No user profiles - users not synced to profiles');
  if (tableCounts['campaigns'] === 0) issues.push('No campaigns - analytics needs campaigns');
  if (tableCounts['events'] === 0) issues.push('No events - no tracking data recorded');
  if (tableCounts['conversions'] === 0) issues.push('No conversions - no conversion tracking');

  if (issues.length === 0) {
    console.log('\n✅ All systems operational! Analytics should work.');
    console.log('\n   If analytics still shows no data:');
    console.log('   1. Check browser console for errors');
    console.log('   2. Ensure you are logged in');
    console.log('   3. Visit /api/analytics/overview directly to test');
  } else {
    console.log('\n⚠️  Issues found:');
    for (const issue of issues) {
      console.log(`   • ${issue}`);
    }
  }

  console.log('\n');
}

main().catch(console.error);
