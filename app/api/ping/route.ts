/**
 * Ultra-simple ping endpoint
 * No imports, no dependencies, just returns JSON
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    pong: true,
    timestamp: new Date().toISOString(),
  });
}
