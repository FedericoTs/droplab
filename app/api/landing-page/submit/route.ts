import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/connection';

/**
 * POST /api/landing-page/submit
 * Handle form submissions from campaign landing pages
 *
 * Supports both:
 * - Personalized submissions (with tracking_id)
 * - Generic submissions (campaign-level only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaign_id, tracking_id, mode, formData } = body as {
      campaign_id: string;
      tracking_id?: string;
      mode: 'personalized' | 'generic';
      formData: {
        name: string;
        email: string;
        phone: string;
        preferredDate?: string;
        message?: string;
      };
    };

    // Validate required fields
    if (!campaign_id || !formData.name || !formData.email || !formData.phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const now = new Date().toISOString();

    if (mode === 'personalized' && tracking_id) {
      // Personalized submission - create conversion record
      db.prepare(`
        INSERT INTO conversions (
          id, tracking_id, conversion_type, conversion_data, created_at
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        submissionId,
        tracking_id,
        'form_submission',
        JSON.stringify(formData),
        now
      );

      console.log(`✅ Personalized form submission recorded: ${tracking_id}`);
    } else {
      // Generic submission - log for now (could create a generic submissions table in future)
      console.log(`✅ Generic form submission for campaign ${campaign_id}:`, formData);
      // TODO: Create generic_submissions table for campaign-level tracking
    }

    return NextResponse.json({
      success: true,
      message: 'Form submitted successfully',
      submissionId,
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    );
  }
}
