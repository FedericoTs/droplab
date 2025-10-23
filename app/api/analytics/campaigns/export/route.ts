import { NextResponse } from "next/server";
import { getAllCampaignsWithStats } from "@/lib/database/tracking-queries";
import { generateAllCampaignsCSV } from "@/lib/export/csv-exporter";
import { errorResponse } from "@/lib/utils/api-response";

// GET: Export all campaigns overview
export async function GET() {
  try {
    const campaigns = getAllCampaignsWithStats();
    const csvContent = generateAllCampaignsCSV(campaigns);
    const filename = `all_campaigns_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting campaigns:", error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : "Failed to export campaigns data",
        "EXPORT_ERROR"
      ),
      { status: 500 }
    );
  }
}
