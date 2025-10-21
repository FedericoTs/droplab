/**
 * Background Worker Process
 *
 * Listens to job queue and processes batch jobs in the background.
 * Run this as a separate Node process: npm run worker
 */

// Load environment variables from .env.local (manual implementation)
import * as fs from "fs";
import * as path from "path";

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env.local");

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith("#")) continue;

      // Parse KEY=VALUE
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, ""); // Remove quotes

        // Only set if not already defined
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }

    console.log("✅ Loaded environment variables from .env.local");
  } else {
    console.warn("⚠️ .env.local file not found - using system environment variables");
  }
}

// Load .env.local on startup
loadEnvFile();

import { Worker } from "bullmq";
import type { Job } from "bullmq";
import { BATCH_QUEUE_NAME, getQueueConfig, WORKER_CONCURRENCY } from "./config";
import type { BatchJobPayload } from "./batch-job-queue";
import { processBatchJobOptimized } from "../batch-processor/batch-orchestrator-optimized";
import { closeEmailService } from "../email/email-service";

// Worker instance
let workerInstance: Worker<BatchJobPayload> | null = null;

/**
 * Create and start the background worker
 */
export async function startBatchWorker(): Promise<void> {
  if (workerInstance) {
    console.log("⚠️ Worker already running");
    return;
  }

  console.log("🚀 Starting batch worker...");
  console.log(`📊 Concurrency: ${WORKER_CONCURRENCY}`);

  workerInstance = new Worker<BatchJobPayload>(
    BATCH_QUEUE_NAME,
    async (job: Job<BatchJobPayload>) => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🔄 Processing job: ${job.id}`);
      console.log(`📋 Campaign: ${job.data.campaignId}`);
      console.log(`👥 Recipients: ${job.data.recipients.length}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      try {
        // Process the batch job with OPTIMIZED parallel rendering
        await processBatchJobOptimized(job.data);

        console.log(`\n✅ Job ${job.id} completed successfully`);
        return { success: true, jobId: job.id };
      } catch (error) {
        console.error(`\n❌ Job ${job.id} failed:`, error);
        throw error; // Will be handled by BullMQ retry logic
      }
    },
    {
      ...getQueueConfig(),
      concurrency: WORKER_CONCURRENCY,
    }
  );

  // Worker event handlers
  workerInstance.on("completed", (job) => {
    console.log(`\n✅ Job ${job.id} completed`);
  });

  workerInstance.on("failed", (job, err) => {
    console.error(`\n❌ Job ${job?.id} failed:`, err.message);
  });

  workerInstance.on("error", (err) => {
    console.error("❌ Worker error:", err);
  });

  workerInstance.on("active", (job) => {
    console.log(`\n🔄 Job ${job.id} started processing`);
  });

  console.log("✅ Batch worker started successfully");
  console.log("👀 Waiting for jobs...\n");
}

/**
 * Stop the background worker gracefully
 */
export async function stopBatchWorker(): Promise<void> {
  if (!workerInstance) {
    return;
  }

  console.log("\n🛑 Stopping batch worker...");

  try {
    await workerInstance.close();
    workerInstance = null;

    // Cleanup resources
    await closeEmailService();

    console.log("✅ Batch worker stopped gracefully");
  } catch (error) {
    console.error("❌ Error stopping worker:", error);
  }
}

/**
 * Handle graceful shutdown on process termination
 */
function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
    await stopBatchWorker();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

/**
 * Main entry point when run as standalone process
 */
if (require.main === module) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🤖 BATCH WORKER - Marketing AI Platform");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log(`🖥️  Node version: ${process.version}`);
  console.log(`📍 Working directory: ${process.cwd()}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Check environment variables
  console.log("🔍 Checking environment configuration...");
  const redisHost = process.env.REDIS_HOST || "localhost";
  const redisPort = process.env.REDIS_PORT || "6379";

  console.log(`   Redis: ${redisHost}:${redisPort}`);
  console.log(`   SMTP: ${process.env.SMTP_HOST || "not configured"}`);
  console.log(`   Output Dir: ${process.env.BATCH_OUTPUT_DIR || "./batch-output"}`);
  console.log(`   Concurrency: ${process.env.BATCH_WORKER_CONCURRENCY || "4"}\n`);

  // Setup graceful shutdown
  setupGracefulShutdown();

  // Start the worker
  startBatchWorker().catch((error) => {
    console.error("\n❌ Failed to start worker:", error);
    console.error("\n💡 Troubleshooting:");
    console.error("   1. Check Redis is running: redis-cli ping");
    console.error("   2. Start Redis: sudo service redis-server start");
    console.error("   3. Check .env.local exists with REDIS_HOST=localhost");
    process.exit(1);
  });

  // Keep process alive
  setInterval(() => {
    // Heartbeat - shows worker is still running
  }, 60000);
}

export default { startBatchWorker, stopBatchWorker };
