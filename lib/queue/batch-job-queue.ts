/**
 * Batch Job Queue Management
 *
 * Handles job queue operations using BullMQ
 */

import type { Queue, Job } from "bullmq";
import { BATCH_QUEUE_NAME, getQueueConfig } from "./config";

// Job payload interface
export interface BatchJobPayload {
  batchJobId: string;
  campaignId: string;
  templateId?: string;
  recipients: Array<{
    recipientId: string;
    trackingId: string;
    name: string;
    lastname: string;
    address?: string;
    city?: string;
    zip?: string;
    message: string;
    phoneNumber: string;
    qrCodeDataUrl: string;
    landingPageUrl: string;
  }>;
  userEmail?: string;
  settings: {
    companyName: string;
    industry?: string;
    brandVoice?: string;
  };
}

// Singleton queue instance
let queueInstance: Queue<BatchJobPayload> | null = null;

/**
 * Get or create batch job queue instance
 */
export async function getBatchJobQueue(): Promise<Queue<BatchJobPayload>> {
  if (queueInstance) {
    return queueInstance;
  }

  try {
    const { Queue } = await import("bullmq");
    queueInstance = new Queue<BatchJobPayload>(
      BATCH_QUEUE_NAME,
      getQueueConfig()
    );

    console.log("✅ Batch job queue initialized");
    return queueInstance;
  } catch (error) {
    console.error("❌ Failed to initialize batch job queue:", error);
    throw new Error("BullMQ not available. Please install: npm install bullmq ioredis");
  }
}

/**
 * Add a batch job to the queue
 */
export async function addBatchJob(
  payload: BatchJobPayload
): Promise<Job<BatchJobPayload>> {
  const queue = await getBatchJobQueue();

  const job = await queue.add(
    "process-batch", // Job name
    payload,
    {
      jobId: payload.batchJobId, // Use batch job ID as job ID for tracking
      priority: payload.recipients.length > 10000 ? 10 : 1, // Higher priority for smaller batches
      attempts: 1, // Disable automatic retries - user can manually retry via UI
      removeOnComplete: false, // Keep completed jobs for status checking
      removeOnFail: false, // Keep failed jobs for debugging
    }
  );

  console.log(`✅ Batch job added to queue: ${payload.batchJobId}`);
  return job;
}

/**
 * Get job status from queue
 */
export async function getBatchJobStatus(
  jobId: string
): Promise<{
  state: string;
  progress?: number;
  failedReason?: string;
  finishedOn?: number;
}> {
  const queue = await getBatchJobQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    return { state: "not-found" };
  }

  const state = await job.getState();
  const progress = job.progress;
  const failedReason = job.failedReason;
  const finishedOn = job.finishedOn;

  return {
    state,
    progress: typeof progress === "number" ? progress : undefined,
    failedReason,
    finishedOn,
  };
}

/**
 * Cancel a batch job
 */
export async function cancelBatchJob(jobId: string): Promise<boolean> {
  try {
    const queue = await getBatchJobQueue();
    const job = await queue.getJob(jobId);

    if (!job) {
      return false;
    }

    await job.remove();
    console.log(`✅ Batch job cancelled: ${jobId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to cancel job ${jobId}:`, error);
    return false;
  }
}

/**
 * Retry a failed batch job
 */
export async function retryBatchJob(jobId: string): Promise<boolean> {
  try {
    const queue = await getBatchJobQueue();
    const job = await queue.getJob(jobId);

    if (!job) {
      return false;
    }

    await job.retry();
    console.log(`✅ Batch job retried: ${jobId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to retry job ${jobId}:`, error);
    return false;
  }
}

/**
 * Get queue metrics
 */
export async function getQueueMetrics(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const queue = await getBatchJobQueue();

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

/**
 * Clean up old completed jobs
 */
export async function cleanupOldJobs(olderThanMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  const queue = await getBatchJobQueue();

  await queue.clean(olderThanMs, 1000, "completed");
  await queue.clean(olderThanMs, 1000, "failed");

  console.log(`✅ Cleaned up jobs older than ${olderThanMs}ms`);
}

/**
 * Close queue connection (for graceful shutdown)
 */
export async function closeBatchJobQueue(): Promise<void> {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
    console.log("✅ Batch job queue closed");
  }
}
