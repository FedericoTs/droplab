import { NextRequest, NextResponse } from 'next/server';
import {
  getCampaignLandingPage,
  getCampaignLandingPageConfig,
  upsertCampaignLandingPage,
  getCampaign,
  type CampaignLandingPageConfig,
} from '@/lib/database/campaign-landing-page-queries';

/**
 * GET /api/campaigns/[id]/landing-page
 * Fetch campaign landing page configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    // Check if campaign exists
    const campaign = getCampaign(campaignId);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Fetch landing page config
    const landingPage = getCampaignLandingPage(campaignId);

    if (!landingPage) {
      return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
    }

    // Parse and return config
    const config = JSON.parse(landingPage.page_config);

    return NextResponse.json({
      ...landingPage,
      page_config: config, // Return parsed config
    });
  } catch (error) {
    console.error('Error fetching campaign landing page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch landing page' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/campaigns/[id]/landing-page
 * Create campaign landing page configuration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    // Check if campaign exists
    const campaign = getCampaign(campaignId);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { config, templateId } = body as {
      config: CampaignLandingPageConfig;
      templateId?: string;
    };

    // Validate config
    if (!config.title || !config.message || !config.companyName) {
      return NextResponse.json(
        { error: 'Missing required config fields: title, message, companyName' },
        { status: 400 }
      );
    }

    // Create landing page
    const landingPage = upsertCampaignLandingPage(campaignId, config, templateId);

    return NextResponse.json({
      ...landingPage,
      page_config: JSON.parse(landingPage.page_config),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign landing page:', error);
    return NextResponse.json(
      { error: 'Failed to create landing page' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/campaigns/[id]/landing-page
 * Update campaign landing page configuration
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    // Check if campaign exists
    const campaign = getCampaign(campaignId);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check if landing page exists
    const existing = getCampaignLandingPage(campaignId);
    if (!existing) {
      return NextResponse.json(
        { error: 'Landing page not found. Use POST to create.' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { config, templateId } = body as {
      config: Partial<CampaignLandingPageConfig>;
      templateId?: string;
    };

    // Merge with existing config
    const existingConfig = JSON.parse(existing.page_config) as CampaignLandingPageConfig;
    const updatedConfig = { ...existingConfig, ...config };

    // Update landing page
    const landingPage = upsertCampaignLandingPage(
      campaignId,
      updatedConfig,
      templateId !== undefined ? templateId : existing.campaign_template_id || undefined
    );

    return NextResponse.json({
      ...landingPage,
      page_config: JSON.parse(landingPage.page_config),
    });
  } catch (error) {
    console.error('Error updating campaign landing page:', error);
    return NextResponse.json(
      { error: 'Failed to update landing page' },
      { status: 500 }
    );
  }
}
