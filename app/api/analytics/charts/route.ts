import { NextResponse } from "next/server";
import {
  getTimeSeriesAnalytics,
  getCampaignTimeSeriesAnalytics,
  getFunnelData,
  getCampaignsComparisonData,
} from "@/lib/database/tracking-queries";

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
        {
          success: false,
          error: "Missing 'type' parameter",
        },
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
          return NextResponse.json({ success: true, data });
        } else {
          const data = getTimeSeriesAnalytics(startDate, endDate);
          return NextResponse.json({ success: true, data });
        }

      case "funnel":
        const funnelData = getFunnelData(campaignId || undefined);
        return NextResponse.json({ success: true, data: funnelData });

      case "comparison":
        if (!campaignIds) {
          return NextResponse.json(
            {
              success: false,
              error: "Missing 'campaignIds' parameter for comparison",
            },
            { status: 400 }
          );
        }
        const ids = campaignIds.split(",");
        const comparisonData = getCampaignsComparisonData(ids);
        return NextResponse.json({ success: true, data: comparisonData });

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Invalid chart type: ${type}`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch chart data",
      },
      { status: 500 }
    );
  }
}
