/**
 * Health Check API
 * Diagnoses environment variables and database connectivity
 *
 * This endpoint is designed to NEVER crash - it wraps everything in try-catch
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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
      try {
        const value = process.env[envVar];
        if (value) {
          const safeValue = value.length > 12
            ? `${value.substring(0, 8)}...${value.slice(-4)}`
            : '***masked***';
          checks[envVar] = { status: 'ok', value: safeValue };
        } else {
          checks[envVar] = { status: 'missing' };
        }
      } catch (e: any) {
        checks[envVar] = { status: 'error', error: e.message };
      }
    }

    // Test Supabase connection (only if credentials exist)
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
        error: error.message || 'Unknown database error',
      };
    }

    // Overall status
    const allOk = Object.values(checks).every(
      (c) => c.status === 'ok' || c.status === 'skipped'
    );

    return NextResponse.json({
      status: allOk ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      checks,
    });
  } catch (outerError: any) {
    // This should NEVER happen, but just in case
    return NextResponse.json({
      status: 'critical_error',
      error: outerError.message || 'Unknown critical error',
      timestamp: new Date().toISOString(),
    });
  }
}
