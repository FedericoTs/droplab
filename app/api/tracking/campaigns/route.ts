import { NextResponse } from "next/server";
import { getAllCampaigns } from "@/lib/database/tracking-queries";

/**
 * GET /api/tracking/campaigns
 * Get all campaigns
 */
export async function GET() {
  try {
    const campaigns = getAllCampaigns();

    return NextResponse.json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch campaigns",
      },
      { status: 500 }
    );
  }
}
