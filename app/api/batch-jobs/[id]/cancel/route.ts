/**
 * POST /api/batch-jobs/[id]/cancel - Cancel a running batch job
 */

import { NextRequest, NextResponse } from "next/server";
import { updateBatchJobStatus, getBatchJob } from "@/lib/database/batch-job-queries";
import { cancelBatchJob } from "@/lib/queue/batch-job-queue";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if job exists in database
    const job = getBatchJob(id);
    if (!job) {
      return NextResponse.json(
        { success: false, error: "Batch job not found in database" },
        { status: 404 }
      );
    }

    // Only allow canceling pending/processing jobs
    if (job.status !== "pending" && job.status !== "processing") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot cancel ${job.status} job. Only pending or processing jobs can be cancelled.`
        },
        { status: 400 }
      );
    }

    // Update database status FIRST
    const dbUpdated = updateBatchJobStatus(id, "cancelled");
    if (!dbUpdated) {
      return NextResponse.json(
        { success: false, error: "Failed to update database status" },
        { status: 500 }
      );
    }

    console.log(`✅ Database updated: Job ${id} marked as cancelled`);

    // Try to remove from BullMQ queue (best effort - job may already be processing)
    try {
      const queueRemoved = await cancelBatchJob(id);
      if (queueRemoved) {
        console.log(`✅ Removed job ${id} from BullMQ queue`);
      } else {
        console.warn(`⚠️  Job ${id} not found in queue (may already be processing or completed)`);
      }
    } catch (queueError) {
      // Non-critical - database is already updated, worker will check status
      console.warn(`⚠️  Could not remove job from queue (non-critical):`, queueError);
    }

    return NextResponse.json({
      success: true,
      message: "Batch job cancelled successfully",
      note: "Job marked as cancelled. If already processing, it will stop at next checkpoint.",
    });
  } catch (error) {
    console.error("❌ Error cancelling batch job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel batch job" },
      { status: 500 }
    );
  }
}
