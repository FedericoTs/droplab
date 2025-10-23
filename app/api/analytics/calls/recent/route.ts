import { NextResponse } from "next/server";
import { getRecentCalls } from "@/lib/database/call-tracking-queries";

export async function GET() {
  try {
    const calls = getRecentCalls(50);

    return NextResponse.json({
      success: true,
      data: calls,
    });
  } catch (error) {
    console.error("Error fetching recent calls:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch recent calls",
      },
      { status: 500 }
    );
  }
}
