import { NextResponse } from "next/server";
import {
  getTimeSeriesAnalytics,
  getCampaignTimeSeriesAnalytics,
  getFunnelData,
  getCampaignsComparisonData,
} from "@/lib/database/tracking-queries";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

// GET: Get analytics chart data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const campaignId = searchParams.get("campaignId");
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const campaignIds = searchParams.get("campaignIds");

    if (!type) {
      return NextResponse.json(
        errorResponse("Missing 'type' parameter", "MISSING_TYPE"),
        { status: 400 }
      );
    }

    switch (type) {
      case "timeseries":
        if (campaignId) {
          const data = getCampaignTimeSeriesAnalytics(
            campaignId,
            startDate,
            endDate
          );
          return NextResponse.json(
            successResponse(data, "Campaign timeseries data retrieved successfully")
          );
        } else {
          const data = getTimeSeriesAnalytics(startDate, endDate);
          return NextResponse.json(
            successResponse(data, "Timeseries data retrieved successfully")
          );
        }

      case "funnel":
        const funnelData = getFunnelData(campaignId || undefined);
        return NextResponse.json(
          successResponse(funnelData, "Funnel data retrieved successfully")
        );

      case "comparison":
        if (!campaignIds) {
          return NextResponse.json(
            errorResponse("Missing 'campaignIds' parameter for comparison", "MISSING_CAMPAIGN_IDS"),
            { status: 400 }
          );
        }
        const ids = campaignIds.split(",");
        const comparisonData = getCampaignsComparisonData(ids);
        return NextResponse.json(
          successResponse(comparisonData, "Comparison data retrieved successfully")
        );

      default:
        return NextResponse.json(
          errorResponse(`Invalid chart type: ${type}`, "INVALID_TYPE"),
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : "Failed to fetch chart data",
        "FETCH_ERROR"
      ),
      { status: 500 }
    );
  }
}
