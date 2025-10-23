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

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = (searchParams.get("sortBy") || "conversion_rate") as
      | "conversion_rate"
      | "conversions_count"
      | "recipients_count";

    // Get top performing stores
    const stores = retail.getTopPerformingStores(limit, sortBy);

    return NextResponse.json(
      successResponse(
        {
          stores,
          count: stores.length,
        },
        "Top performing stores retrieved successfully"
      )
    );
  } catch (error: unknown) {
    console.error("Error fetching top stores:", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to fetch top stores";

    return NextResponse.json(
      errorResponse(errorMessage, "FETCH_ERROR"),
      { status: 500 }
    );
  }
}
