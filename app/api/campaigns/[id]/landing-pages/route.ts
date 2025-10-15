import { NextRequest, NextResponse } from 'next/server';
import { getLandingPagesByCampaign } from '@/lib/database/tracking-queries';

/**
 * GET /api/campaigns/[id]/landing-pages
 * Get all landing pages for a specific campaign
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const landingPages = getLandingPagesByCampaign(campaignId);

    // Parse page_data JSON for each landing page
    const parsedPages = landingPages.map((page) => ({
      ...page,
      page_data: JSON.parse(page.page_data),
    }));

    return NextResponse.json({
      success: true,
      data: parsedPages,
    });
  } catch (error) {
    console.error('Error fetching landing pages:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch landing pages',
      },
      { status: 500 }
    );
  }
}
