import { NextRequest, NextResponse } from "next/server";
import { getCampaignAnalytics } from "@/lib/database/tracking-queries";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

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
        errorResponse("Missing campaign ID", "MISSING_CAMPAIGN_ID"),
        { status: 400 }
      );
    }

    const analytics = getCampaignAnalytics(campaignId);

    if (!analytics) {
      return NextResponse.json(
        errorResponse("Campaign not found", "CAMPAIGN_NOT_FOUND"),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse(analytics, "Campaign analytics retrieved successfully")
    );
  } catch (error) {
    console.error("Error fetching campaign analytics:", error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : "Failed to fetch analytics",
        "FETCH_ERROR"
      ),
      { status: 500 }
    );
  }
}
