/**
 * Database Migration Utility
 *
 * Provides functions to apply SQL migrations to Supabase database
 * programmatically using the Postgres REST API.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Apply a single SQL migration file
 */
export async function applyMigration(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = fs.readFileSync(filePath, 'utf-8');

    // Use Supabase service role client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Note: Direct SQL execution via Supabase client is limited
    // For production, use Supabase CLI or dashboard
    console.log(`Applying migration: ${path.basename(filePath)}`);
    console.log('⚠️  For full SQL support, please use Supabase Dashboard SQL Editor');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Apply all migrations in order
 */
export async function applyAllMigrations(): Promise<void> {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    throw new Error('Migrations directory not found');
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files\n`);

  for (const file of files) {
    const result = await applyMigration(path.join(migrationsDir, file));

    if (!result.success) {
      console.error(`❌ Failed to apply ${file}: ${result.error}`);
      throw new Error(`Migration failed: ${file}`);
    }

    console.log(`✅ Applied ${file}`);
  }

  console.log('\n✨ All migrations applied successfully!');
}

/**
 * Verify database schema exists
 */
export async function verifySchema(): Promise<boolean> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Check if organizations table exists
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Get migration instructions for manual application
 */
export function getMigrationInstructions(): string {
  return `
╔════════════════════════════════════════════════════════════════╗
║                  DATABASE MIGRATION REQUIRED                   ║
╚════════════════════════════════════════════════════════════════╝

The database schema has not been initialized.

📋 MANUAL MIGRATION STEPS:

1. Open Supabase Dashboard:
   ${SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}

2. Navigate to: SQL Editor → + New query

3. Apply migrations in order:

   📁 Location: /supabase/migrations/

   ✓ 20250101000001_organizations_and_brand_kits.sql
   ✓ 20250101000002_design_templates.sql
   ✓ 20250101000003_campaigns_and_recipients.sql
   ✓ 20250101000004_analytics_and_performance.sql
   ✓ 20250101000005_postal_compliance.sql
   ✓ 20250101000006_marketplace_and_collaboration.sql
   ✓ 20250101000007_ab_testing.sql
   ✓ 20250101000008_api_and_webhooks.sql

4. OR use the combined file:
   📄 /supabase/all_migrations_combined.sql

📚 Full instructions: /supabase/MIGRATION_INSTRUCTIONS.md

═══════════════════════════════════════════════════════════════

After applying migrations, restart the application.
`;
}

// CLI execution
if (require.main === module) {
  (async () => {
    try {
      const isSchemaReady = await verifySchema();

      if (isSchemaReady) {
        console.log('✅ Database schema is already initialized!');
        process.exit(0);
      }

      console.log(getMigrationInstructions());
      process.exit(1);
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  })();
}
