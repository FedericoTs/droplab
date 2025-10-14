import { NextRequest, NextResponse } from "next/server";
import { getCampaignAnalytics } from "@/lib/database/tracking-queries";

/**
 * GET /api/tracking/analytics/[campaignId]
 * Get campaign analytics and performance metrics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: "Missing campaign ID" },
        { status: 400 }
      );
    }

    const analytics = getCampaignAnalytics(campaignId);

    if (!analytics) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching campaign analytics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch analytics",
      },
      { status: 500 }
    );
  }
}
