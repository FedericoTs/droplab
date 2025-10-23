import { NextRequest, NextResponse } from 'next/server';
import {
  getAllTemplates,
  createCampaignTemplate,
  initializeSystemTemplates,
} from '@/lib/database/campaign-management';
import { copyAssets } from '@/lib/database/asset-management';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/campaigns/templates
 * Get all campaign templates
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize system templates if needed
    initializeSystemTemplates();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;

    const templates = getAllTemplates(category);

    return NextResponse.json(
      successResponse(
        templates.map((t) => ({
          ...t,
          template_data: JSON.parse(t.template_data),
        })),
        "Templates retrieved successfully"
      )
    );
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      errorResponse('Failed to fetch templates', 'FETCH_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/campaigns/templates
 * Create a new campaign template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, templateData, campaignId } = body;

    if (!name || !templateData) {
      return NextResponse.json(
        errorResponse('Name and template data are required', 'MISSING_FIELDS'),
        { status: 400 }
      );
    }

    const template = createCampaignTemplate({
      name,
      description,
      category: category || 'general',
      templateData,
      isSystemTemplate: false,
    });

    // Copy assets from campaign if campaignId provided
    if (campaignId) {
      try {
        copyAssets({
          sourceCampaignId: campaignId,
          targetTemplateId: template.id,
        });
      } catch (error) {
        console.error('Error copying campaign assets to template:', error);
        // Continue anyway - template is created, just without assets
      }
    }

    return NextResponse.json(
      successResponse(
        {
          ...template,
          template_data: JSON.parse(template.template_data),
        },
        'Template created successfully'
      )
    );
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      errorResponse('Failed to create template', 'CREATE_ERROR'),
      { status: 500 }
    );
  }
}
