import { NextResponse } from 'next/server';
import { getSystemTemplates, getAllTemplates } from '@/lib/database/template-queries';

/**
 * GET /api/templates
 * Get all landing page templates
 */
export async function GET() {
  try {
    // Get all system templates (pre-built)
    const templates = getSystemTemplates();

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
