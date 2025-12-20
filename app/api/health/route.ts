/**
 * Health Check API
 * Diagnoses environment variables and database connectivity
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, { status: string; value?: string; error?: string }> = {};

  // Check environment variables
  const envVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ELEVENLABS_API_KEY',
    'OPENAI_API_KEY',
    'STRIPE_SECRET_KEY',
  ];

  for (const envVar of envVars) {
    const value = process.env[envVar];
    checks[envVar] = {
      status: value ? 'ok' : 'missing',
      value: value ? `${value.substring(0, 8)}...${value.slice(-4)}` : undefined,
    };
  }

  // Test Supabase connection
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { count, error } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      if (error) {
        checks['database_connection'] = {
          status: 'error',
          error: error.message,
        };
      } else {
        checks['database_connection'] = {
          status: 'ok',
          value: `${count} organizations found`,
        };
      }
    } else {
      checks['database_connection'] = {
        status: 'skipped',
        error: 'Missing Supabase credentials',
      };
    }
  } catch (error: any) {
    checks['database_connection'] = {
      status: 'error',
      error: error.message,
    };
  }

  // Overall status
  const allOk = Object.values(checks).every(
    (c) => c.status === 'ok' || c.status === 'skipped'
  );

  return NextResponse.json({
    status: allOk ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
  });
}
