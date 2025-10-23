import { NextRequest, NextResponse } from 'next/server';
import {
  getTemplateById,
  deleteTemplate,
  updateTemplate,
  incrementTemplateUseCount,
} from '@/lib/database/campaign-management';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/campaigns/templates/[id]
 * Get a specific template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = getTemplateById(id);

    if (!template) {
      return NextResponse.json(
        errorResponse('Template not found', 'TEMPLATE_NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse(
        {
          ...template,
          template_data: JSON.parse(template.template_data),
        },
        "Template retrieved successfully"
      )
    );
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      errorResponse('Failed to fetch template', 'FETCH_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/campaigns/templates/[id]
 * Update a template
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, category, templateData } = body;

    const success = updateTemplate(id, {
      name,
      description,
      category,
      templateData,
    });

    if (!success) {
      return NextResponse.json(
        errorResponse(
          'Failed to update template (template not found or is a system template)',
          'UPDATE_FAILED'
        ),
        { status: 400 }
      );
    }

    return NextResponse.json(
      successResponse(null, 'Template updated successfully')
    );
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      errorResponse('Failed to update template', 'UPDATE_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/campaigns/templates/[id]
 * Delete a template (system templates are protected)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = deleteTemplate(id);

    if (!success) {
      return NextResponse.json(
        errorResponse(
          'Failed to delete template (template not found or is a system template)',
          'DELETE_FAILED'
        ),
        { status: 400 }
      );
    }

    return NextResponse.json(
      successResponse(null, 'Template deleted successfully')
    );
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      errorResponse('Failed to delete template', 'DELETE_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/campaigns/templates/[id]/use
 * Increment template use count
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    incrementTemplateUseCount(id);

    return NextResponse.json(
      successResponse(null, 'Template use count incremented')
    );
  } catch (error) {
    console.error('Error incrementing template use count:', error);
    return NextResponse.json(
      errorResponse('Failed to increment template use count', 'INCREMENT_ERROR'),
      { status: 500 }
    );
  }
}
