/**
 * Migration Runner Script
 * Applies SQL migrations to Supabase database
 *
 * Usage: npx tsx scripts/run-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client (service role has full permissions)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ensures migrations run in order

  console.log(`📁 Found ${migrationFiles.length} migration files\n`);

  let successCount = 0;
  let failureCount = 0;

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`📝 Running migration: ${file}`);

    try {
      // Execute SQL using Supabase RPC
      // Note: For complex migrations with multiple statements, we need to use the REST API directly
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

      if (error) {
        // If exec_sql doesn't exist, try executing via REST API
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ query: sql })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      }

      console.log(`   ✅ Success\n`);
      successCount++;
    } catch (err: any) {
      console.error(`   ❌ Failed: ${err.message}\n`);
      failureCount++;

      // Continue with other migrations even if one fails
      // This allows fixing issues incrementally
    }
  }

  console.log('═══════════════════════════════════════════════');
  console.log(`✨ Migration Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);
  console.log(`   📊 Total: ${migrationFiles.length}`);
  console.log('═══════════════════════════════════════════════\n');

  if (failureCount > 0) {
    console.log('⚠️  Some migrations failed. Please check the errors above.');
    console.log('💡 You can also run migrations manually via Supabase Dashboard:');
    console.log(`   ${SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}/sql\n`);
    process.exit(1);
  } else {
    console.log('🎉 All migrations completed successfully!\n');
    process.exit(0);
  }
}

// Execute migrations
runMigrations().catch(err => {
  console.error('❌ Migration runner failed:', err);
  process.exit(1);
});
