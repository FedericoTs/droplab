/**
 * Server Instrumentation
 *
 * Runs once when the server starts (both dev and production)
 * Used for environment validation and startup tasks
 *
 * Reference: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */

import { initEnv } from './lib/config/env-validation';

export async function register() {
  // Only run on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Initializing server...');

    // Validate environment variables
    try {
      initEnv();
    } catch (error) {
      console.error('❌ Environment validation failed:', error);
      // Log which env vars are set for debugging
      console.error('Environment check:');
      console.error('  NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
      console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
      console.error('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');
      console.error('  NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL ? 'SET' : 'MISSING');
      console.error('  LANDING_PAGE_ENCRYPTION_KEY:', process.env.LANDING_PAGE_ENCRYPTION_KEY ? 'SET' : 'MISSING');
      // DO NOT exit - allow server to start so health endpoint can diagnose
      // Routes will handle missing env vars gracefully
      console.warn('⚠️ Server starting with incomplete configuration');
    }

    console.log('✅ Server initialization complete');
  }
}
