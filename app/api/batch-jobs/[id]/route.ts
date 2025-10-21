/**
 * API Route: Get Batch Job Details
 *
 * GET /api/batch-jobs/[id]
 * Returns batch job details and status
 */

import { NextRequest, NextResponse } from "next/server";
import { getBatchJob, getBatchJobRecipients } from "@/lib/database/batch-job-queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get batch job from database
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

    // Get recipients if requested
    const includeRecipients = request.nextUrl.searchParams.get("includeRecipients") === "true";
    const recipients = includeRecipients ? getBatchJobRecipients(id) : undefined;

    return NextResponse.json({
      success: true,
      data: {
        ...batchJob,
        recipients,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching batch job:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch batch job",
      },
      { status: 500 }
    );
  }
}
