import { NextRequest, NextResponse } from 'next/server';
import { createCanvasSession } from '@/lib/database/canvas-queries';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      campaignId,
      backgroundImage,
      qrCodeDataUrl,
      trackingId,
      landingPageUrl,
      recipientName,
      recipientLastname,
      recipientAddress,
      recipientCity,
      recipientZip,
      message,
      companyName,
      campaignName,
      logoUrl,
      primaryColor,
      textColor,
      canvasWidth,
      canvasHeight,
      phoneNumber,
      dmTemplateId, // NEW: Optional template ID for loading saved designs
    } = body;

    // Validate required fields
    if (!campaignId || !backgroundImage || !qrCodeDataUrl || !trackingId || !landingPageUrl ||
        !recipientName || !recipientLastname || !message || !companyName ||
        !canvasWidth || !canvasHeight || !phoneNumber) {
      return NextResponse.json(
        errorResponse('Missing required fields', 'MISSING_FIELDS'),
        { status: 400 }
      );
    }

    const sessionId = createCanvasSession({
      campaignId,
      backgroundImage,
      qrCodeDataUrl,
      trackingId,
      landingPageUrl,
      recipientName,
      recipientLastname,
      recipientAddress: recipientAddress || '',
      recipientCity: recipientCity || '',
      recipientZip: recipientZip || '',
      message,
      companyName,
      campaignName,
      logoUrl,
      primaryColor,
      textColor,
      canvasWidth,
      canvasHeight,
      phoneNumber,
      dmTemplateId, // NEW: Pass template ID to session
    });

    console.log(`✅ Canvas session created: ${sessionId}`);

    return NextResponse.json(
      successResponse({ sessionId }, 'Canvas session created successfully')
    );
  } catch (error) {
    console.error('Error creating canvas session:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to create session',
        'CREATE_ERROR'
      ),
      { status: 500 }
    );
  }
}
