/**
 * Redis and BullMQ Configuration
 *
 * Central configuration for job queue system
 */

import type { ConnectionOptions } from "bullmq";

// Redis connection configuration
export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
};

// Queue configuration
export const BATCH_QUEUE_NAME = "batch-dm-generation";

// Worker configuration
export const WORKER_CONCURRENCY = parseInt(
  process.env.BATCH_WORKER_CONCURRENCY || "4"
);

// Batch processing configuration
export const BATCH_THRESHOLD = parseInt(
  process.env.BATCH_THRESHOLD || "100"
);

// Output configuration
export const BATCH_OUTPUT_DIR =
  process.env.BATCH_OUTPUT_DIR || "./batch-output";

// Retention configuration (days to keep old batches)
export const BATCH_RETENTION_DAYS = parseInt(
  process.env.BATCH_RETENTION_DAYS || "30"
);

// Job retry configuration
export const JOB_ATTEMPTS = 3; // Retry failed jobs 3 times
export const JOB_BACKOFF = {
  type: "exponential" as const,
  delay: 5000, // Start with 5 second delay, exponentially increase
};

// Progress update interval (milliseconds)
export const PROGRESS_UPDATE_INTERVAL = 2000; // Update progress every 2 seconds

// Puppeteer configuration
export const PUPPETEER_OPTIONS = {
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage", // Overcome limited resource problems
    "--disable-gpu",
  ],
};

// PDF generation configuration
export const PDF_OPTIONS = {
  format: "letter" as const,
  printBackground: true,
  margin: {
    top: "0",
    bottom: "0",
    left: "0",
    right: "0",
  },
};

// Memory management
export const BATCH_CHUNK_SIZE = 100; // Process recipients in chunks of 100
export const MAX_PUPPETEER_INSTANCES = 4; // Reuse browser instances

/**
 * Check if Redis is configured and accessible
 */
export async function checkRedisConnection(): Promise<boolean> {
  try {
    const { default: Redis } = await import("ioredis");
    const redis = new Redis(redisConnection);
    const pong = await redis.ping();
    await redis.quit();
    return pong === "PONG";
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
    console.error("   Make sure Redis is running: sudo service redis-server start");
    return false;
  }
}

/**
 * Get queue configuration for BullMQ
 */
export function getQueueConfig() {
  return {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: JOB_ATTEMPTS,
      backoff: JOB_BACKOFF,
      removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 1000, // Keep last 1000 completed jobs
      },
      removeOnFail: false, // Keep failed jobs for debugging
    },
  };
}
