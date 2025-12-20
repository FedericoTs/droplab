/**
 * Supabase Middleware
 * Refreshes auth tokens for authenticated users
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, allow the request through
  // This prevents crashes when env vars are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Middleware] Missing Supabase environment variables');
    // For API routes, just pass through
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return supabaseResponse;
    }
    // For protected routes, we can't authenticate, so redirect to a simple error
    // But for now, just pass through to avoid blocking everything
    return supabaseResponse;
  }

  let user = null;

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error('[Middleware] Error in auth check:', error);
    // On error, allow API routes through (they have their own auth)
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return supabaseResponse;
    }
  }

  // Protected routes - redirect to login if not authenticated
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/lp/') &&
    !request.nextUrl.pathname.startsWith('/demo/') && // Public demo landing pages
    !request.nextUrl.pathname.startsWith('/api/admin') && // Allow admin API routes (temp - add auth later)
    !request.nextUrl.pathname.startsWith('/api/') && // Allow all API routes (they handle auth internally)
    request.nextUrl.pathname !== '/'
  ) {
    // User not authenticated and trying to access protected route
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // Authenticated users trying to access auth pages - redirect to dashboard
  // EXCEPT for /auth/reset-password (needed after password reset link) and /auth/confirm (token exchange)
  if (
    user &&
    request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/auth/reset-password') &&
    !request.nextUrl.pathname.startsWith('/auth/confirm')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
