/**
 * Email Confirmation Route Handler
 *
 * Handles email confirmation links from Supabase:
 * - Password reset (type=recovery)
 * - Email confirmation (type=signup)
 * - Magic link login (type=magiclink)
 * - Email change (type=email_change)
 *
 * Supabase sends links like:
 * https://yoursite.com/auth/confirm?token_hash=xxx&type=recovery
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  // Log for debugging
  console.log('[Auth Confirm] Received request:', { token_hash: token_hash?.slice(0, 10) + '...', type });

  if (!token_hash || !type) {
    console.error('[Auth Confirm] Missing token_hash or type');
    return NextResponse.redirect(
      new URL('/auth/login?error=Invalid+confirmation+link', requestUrl.origin)
    );
  }

  try {
    const supabase = await createClient();

    // Verify the OTP token
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });

    if (error) {
      console.error('[Auth Confirm] Token verification failed:', error.message);
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }

    console.log('[Auth Confirm] Token verified successfully for user:', data.user?.email);

    // Redirect based on the type of confirmation
    switch (type) {
      case 'recovery':
        // Password reset - redirect to reset password page
        console.log('[Auth Confirm] Redirecting to password reset page');
        return NextResponse.redirect(
          new URL('/auth/reset-password', requestUrl.origin)
        );

      case 'signup':
      case 'magiclink':
        // Email confirmation or magic link - redirect to dashboard
        console.log('[Auth Confirm] Redirecting to dashboard');
        return NextResponse.redirect(
          new URL(next, requestUrl.origin)
        );

      case 'email_change':
        // Email change confirmation - redirect to settings with success message
        console.log('[Auth Confirm] Email change confirmed, redirecting to settings');
        return NextResponse.redirect(
          new URL('/settings?message=Email+updated+successfully', requestUrl.origin)
        );

      default:
        // Unknown type - redirect to dashboard
        console.log('[Auth Confirm] Unknown type, redirecting to dashboard');
        return NextResponse.redirect(
          new URL(next, requestUrl.origin)
        );
    }
  } catch (err) {
    console.error('[Auth Confirm] Unexpected error:', err);
    return NextResponse.redirect(
      new URL('/auth/login?error=An+unexpected+error+occurred', requestUrl.origin)
    );
  }
}
