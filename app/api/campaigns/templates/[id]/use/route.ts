import { NextRequest, NextResponse } from 'next/server';
import { getTemplateById, incrementTemplateUseCount, getDMTemplateByCampaignTemplate } from '@/lib/database/template-queries';

/**
 * Use Template - Increment use count and return template data
 * POST /api/campaigns/templates/[id]/use
 *
 * This endpoint is called when a user clicks "Use Template" in the Template Library.
 * It increments the usage counter and returns the template data so the frontend can
 * redirect to DM Creative with the template pre-loaded.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the campaign template
    const template = getTemplateById(id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Increment use count
    incrementTemplateUseCount(id);

    // Get associated DM template (canvas data) if it exists
    const dmTemplate = getDMTemplateByCampaignTemplate(id);

    // Return template data for frontend to use
    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        templateData: template.template_data,
        // Include DM template ID for canvas editor
        dmTemplateId: dmTemplate?.id || null,
      },
      // Suggested redirect URL for frontend
      redirectUrl: `/dm-creative?templateId=${id}`,
    });
  } catch (error) {
    console.error('Error using template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to use template' },
      { status: 500 }
    );
  }
}
