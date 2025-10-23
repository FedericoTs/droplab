import { NextResponse } from "next/server";
import { getAllCallMetrics } from "@/lib/database/call-tracking-queries";

export async function GET() {
  try {
    const metrics = getAllCallMetrics();

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Error fetching call metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch call metrics",
      },
      { status: 500 }
    );
  }
}
