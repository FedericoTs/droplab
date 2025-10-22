import { NextRequest, NextResponse } from 'next/server';
import { encryptRecipientId } from '@/lib/landing-page/encryption';
import { getRecipientById } from '@/lib/database/campaign-landing-page-queries';

/**
 * POST /api/landing-page/encrypt-recipient
 * Generate encrypted recipient token for QR code
 *
 * This is used when creating QR codes for campaign landing pages
 * Returns encrypted token that can be used in URL: /lp/campaign/{campaignId}?r={token}
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipient_id, campaign_id } = body as {
      recipient_id: string;
      campaign_id: string;
    };

    // Validate input
    if (!recipient_id || !campaign_id) {
      return NextResponse.json(
        { error: 'Missing required fields: recipient_id, campaign_id' },
        { status: 400 }
      );
    }

    // Verify recipient exists and belongs to campaign
    const recipient = getRecipientById(recipient_id);

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    if (recipient.campaign_id !== campaign_id) {
      return NextResponse.json(
        { error: 'Recipient does not belong to this campaign' },
        { status: 400 }
      );
    }

    // Generate encrypted token
    const encryptedToken = encryptRecipientId(recipient_id, campaign_id);

    // Generate full landing page URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const landingPageUrl = `${baseUrl}/lp/campaign/${campaign_id}?r=${encryptedToken}`;

    return NextResponse.json({
      success: true,
      encrypted_token: encryptedToken,
      landing_page_url: landingPageUrl,
      recipient: {
        id: recipient.id,
        name: recipient.name,
        lastname: recipient.lastname,
        campaign_id: recipient.campaign_id,
      },
    });
  } catch (error) {
    console.error('Error encrypting recipient ID:', error);
    return NextResponse.json(
      { error: 'Failed to encrypt recipient ID' },
      { status: 500 }
    );
  }
}
