import { NextRequest, NextResponse } from 'next/server';
import {
  getAllTemplates,
  createCampaignTemplate,
  initializeSystemTemplates,
} from '@/lib/database/campaign-management';

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

    return NextResponse.json({
      success: true,
      data: templates.map((t) => ({
        ...t,
        template_data: JSON.parse(t.template_data),
      })),
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch templates',
      },
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
    const { name, description, category, templateData } = body;

    if (!name || !templateData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and template data are required',
        },
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

    return NextResponse.json({
      success: true,
      data: {
        ...template,
        template_data: JSON.parse(template.template_data),
      },
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create template',
      },
      { status: 500 }
    );
  }
}
