/**
 * API Route: Download Batch Job Results
 *
 * GET /api/batch-jobs/[id]/download
 * Downloads the ZIP file containing all generated PDFs
 */

import { NextRequest, NextResponse } from "next/server";
import { getBatchJob } from "@/lib/database/batch-job-queries";
import * as fs from "fs";
import * as path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get batch job
    const batchJob = getBatchJob(id);

    if (!batchJob) {
      return NextResponse.json(
        {
          success: false,
          error: "Batch job not found",
        },
        { status: 404 }
      );
    }

    // Check if job is completed
    if (batchJob.status !== "completed") {
      return NextResponse.json(
        {
          success: false,
          error: `Batch job is not completed yet. Current status: ${batchJob.status}`,
        },
        { status: 400 }
      );
    }

    // Check if ZIP file exists
    if (!batchJob.output_zip_path) {
      return NextResponse.json(
        {
          success: false,
          error: "ZIP file not found for this batch job",
        },
        { status: 404 }
      );
    }

    const zipPath = batchJob.output_zip_path;

    if (!fs.existsSync(zipPath)) {
      return NextResponse.json(
        {
          success: false,
          error: "ZIP file has been deleted or moved",
        },
        { status: 404 }
      );
    }

    // Read ZIP file
    const fileBuffer = fs.readFileSync(zipPath);
    const fileName = path.basename(zipPath);

    // Return ZIP file as download
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("❌ Error downloading batch results:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to download batch results",
      },
      { status: 500 }
    );
  }
}
