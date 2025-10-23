import { NextResponse } from 'next/server';
import { getSystemTemplates, getAllTemplates } from '@/lib/database/template-queries';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/templates
 * Get all landing page templates
 */
export async function GET() {
  try {
    // Get all system templates (pre-built)
    const templates = getSystemTemplates();

    return NextResponse.json(
      successResponse(
        {
          templates,
          count: templates.length,
        },
        'Templates retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to fetch templates',
        'FETCH_ERROR'
      ),
      { status: 500 }
    );
  }
}
