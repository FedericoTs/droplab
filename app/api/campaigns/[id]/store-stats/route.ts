import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

// Dynamic import of retail queries (optional feature)
function getRetailQueries() {
  try {
    return require("@/lib/database/retail-queries");
  } catch (e) {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await context.params;

    // Check if retail module is available
    const retail = getRetailQueries();

    if (!retail) {
      // Retail module not enabled, return empty result
      return NextResponse.json(
        successResponse([], "Retail module not enabled")
      );
    }

    // Get deployment stats for this campaign
    const stats = retail.getDeploymentStats(campaignId);

    return NextResponse.json(
      successResponse(stats, "Store stats retrieved successfully")
    );
  } catch (error: unknown) {
    console.error("Error fetching store stats:", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to fetch store stats";

    return NextResponse.json(
      errorResponse(errorMessage, "FETCH_ERROR"),
      { status: 500 }
    );
  }
}
