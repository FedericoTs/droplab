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

export async function GET(request: NextRequest) {
  try {
    const retail = getRetailQueries();

    if (!retail) {
      return NextResponse.json(
        errorResponse("Retail module not enabled", "MODULE_NOT_ENABLED")
      );
    }

    // Get regional performance
    const regions = retail.getRegionalPerformance();

    return NextResponse.json(
      successResponse(
        {
          regions,
          count: regions.length,
        },
        "Regional performance retrieved successfully"
      )
    );
  } catch (error: unknown) {
    console.error("Error fetching regional performance:", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to fetch regional performance";

    return NextResponse.json(
      errorResponse(errorMessage, "FETCH_ERROR"),
      { status: 500 }
    );
  }
}
