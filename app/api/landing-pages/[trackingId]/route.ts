import { NextRequest, NextResponse } from 'next/server';
import { getLandingPageByTrackingId } from '@/lib/database/tracking-queries';

/**
 * GET /api/landing-pages/[trackingId]
 * Get landing page data by tracking ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;
    const landingPage = getLandingPageByTrackingId(trackingId);

    if (!landingPage) {
      return NextResponse.json(
        {
          success: false,
          error: 'Landing page not found',
        },
        { status: 404 }
      );
    }

    // Parse page_data JSON
    const parsedData = JSON.parse(landingPage.page_data);

    // Add campaign_id to the response so the redirect can work
    return NextResponse.json({
      success: true,
      data: {
        ...parsedData,
        campaignId: landingPage.campaign_id, // Add campaign ID for redirect
      },
    });
  } catch (error) {
    console.error('Error fetching landing page:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch landing page',
      },
      { status: 500 }
    );
  }
}
