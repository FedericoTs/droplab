import { NextRequest, NextResponse } from 'next/server';
import {
  bulkUpdateCampaignStatus,
  bulkArchiveCampaigns,
  bulkPermanentlyDeleteCampaigns,
} from '@/lib/database/campaign-management';

/**
 * POST /api/campaigns/bulk
 * Perform bulk operations on campaigns
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, campaignIds } = body;

    if (!action || !campaignIds || !Array.isArray(campaignIds)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Action and campaign IDs array are required',
        },
        { status: 400 }
      );
    }

    if (campaignIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No campaigns selected',
        },
        { status: 400 }
      );
    }

    let count = 0;
    let message = '';

    switch (action) {
      case 'activate':
        count = bulkUpdateCampaignStatus(campaignIds, 'active');
        message = `${count} campaign(s) activated`;
        break;

      case 'pause':
        count = bulkUpdateCampaignStatus(campaignIds, 'paused');
        message = `${count} campaign(s) paused`;
        break;

      case 'complete':
        count = bulkUpdateCampaignStatus(campaignIds, 'completed');
        message = `${count} campaign(s) marked as completed`;
        break;

      case 'archive':
        count = bulkArchiveCampaigns(campaignIds);
        message = `${count} campaign(s) archived`;
        break;

      case 'delete':
        count = bulkPermanentlyDeleteCampaigns(campaignIds);
        message = `${count} campaign(s) permanently deleted`;
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Must be: activate, pause, complete, archive, or delete',
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: { count },
      message,
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform bulk operation',
      },
      { status: 500 }
    );
  }
}
