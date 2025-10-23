import { NextResponse } from "next/server";
import { getSankeyChartData } from "@/lib/database/tracking-queries";

export async function GET() {
  try {
    const data = getSankeyChartData();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching Sankey chart data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch Sankey chart data",
      },
      { status: 500 }
    );
  }
}
