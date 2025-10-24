/**
 * Batch Processing Orchestrator
 *
 * Coordinates batch job processing: rendering, PDF generation, progress tracking, notifications
 */

import { renderTemplateToImage } from "./canvas-renderer-puppeteer";
import { generateDirectMailPDF } from "@/lib/pdf-generator";
import {
  getBatchJob,
  updateBatchJobStatus,
  updateBatchJobProgress,
  setBatchJobOutputZip,
  createBatchJobRecipient,
  updateBatchJobRecipientStatus,
  addBatchJobProgress,
} from "@/lib/database/batch-job-queries";
import { sendBatchCompleteEmail, sendBatchFailedEmail } from "@/lib/email/email-service";
import type { BatchJobPayload } from "@/lib/queue/batch-job-queue";
import type { DirectMailData } from "@/types/dm-creative";
import { BATCH_OUTPUT_DIR, BATCH_CHUNK_SIZE } from "@/lib/queue/config";
import * as fs from "fs";
import * as path from "path";

/**
 * Create output directory for batch job
 */
function ensureBatchOutputDir(batchJobId: string): string {
  const outputDir = path.join(BATCH_OUTPUT_DIR, batchJobId);

  if (!fs.existsSync(BATCH_OUTPUT_DIR)) {
    fs.mkdirSync(BATCH_OUTPUT_DIR, { recursive: true });
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return outputDir;
}

/**
 * Create ZIP archive of batch PDFs
 */
async function createBatchZip(batchJobId: string, pdfPaths: string[]): Promise<string> {
  const archiver = await import("archiver");
  const outputDir = ensureBatchOutputDir(batchJobId);
  const zipPath = path.join(outputDir, `batch-${batchJobId}.zip`);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver.default("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`✅ ZIP created: ${archive.pointer()} bytes`);
      resolve(zipPath);
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add all PDFs to archive
    for (const pdfPath of pdfPaths) {
      const filename = path.basename(pdfPath);
      archive.file(pdfPath, { name: filename });
    }

    archive.finalize();
  });
}

/**
 * Process a single batch job
 */
export async function processBatchJob(payload: BatchJobPayload): Promise<void> {
  const { batchJobId, templateId, recipients, userEmail, settings } = payload;

  console.log(`🚀 Processing batch job: ${batchJobId}`);
  console.log(`📊 Recipients: ${recipients.length}`);
  console.log(`📋 Template: ${templateId || "No template"}`);

  // Update job status to processing
  updateBatchJobStatus(batchJobId, "processing", {
    startedAt: new Date().toISOString(),
  });

  const outputDir = ensureBatchOutputDir(batchJobId);
  const pdfPaths: string[] = [];
  let successCount = 0;
  let failedCount = 0;

  try {
    // Create batch job recipient records
    const recipientRecords = recipients.map((recipient) =>
      createBatchJobRecipient({
        batchJobId,
        recipientId: recipient.recipientId,
      })
    );

    console.log(`✅ Created ${recipientRecords.length} recipient records`);

    // Process recipients in chunks (memory optimization)
    for (let i = 0; i < recipients.length; i += BATCH_CHUNK_SIZE) {
      const chunk = recipients.slice(i, i + BATCH_CHUNK_SIZE);

      console.log(`📦 Processing chunk ${Math.floor(i / BATCH_CHUNK_SIZE) + 1}`);

      for (const recipient of chunk) {
        const recipientRecord = recipientRecords.find(
          (r) => r.recipient_id === recipient.recipientId
        );

        if (!recipientRecord) continue;

        try {
          // Update recipient status to processing
          updateBatchJobRecipientStatus(recipientRecord.id, "processing");

          let creativeImageUrl: string;

          if (templateId) {
            // TEMPLATE MODE: Render with Puppeteer
            console.log(`🎨 Rendering template for ${recipient.name}...`);

            creativeImageUrl = await renderTemplateToImage(templateId, {
              name: recipient.name,
              lastname: recipient.lastname,
              address: recipient.address,
              city: recipient.city,
              zip: recipient.zip,
              message: recipient.message,
              phoneNumber: recipient.phoneNumber,
              qrCodeDataUrl: recipient.qrCodeDataUrl,
              companyName: settings.companyName,
            });
          } else {
            // NO TEMPLATE MODE: Use basic generation (fallback)
            console.warn(`⚠️ No template provided, using basic generation`);
            // This would need the basic DM generation logic
            throw new Error("Template is required for batch processing");
          }

          // Generate PDF
          const dmData: DirectMailData = {
            trackingId: recipient.trackingId,
            recipient: {
              name: recipient.name,
              lastname: recipient.lastname,
              address: recipient.address || '',
              city: recipient.city,
              zip: recipient.zip,
            },
            message: recipient.message,
            qrCodeDataUrl: recipient.qrCodeDataUrl,
            landingPageUrl: recipient.landingPageUrl,
            creativeImageUrl,
            createdAt: new Date().toISOString(),
            companyName: settings.companyName,
          };

          const pdfBlob = await generateDirectMailPDF(dmData, settings.companyName);

          // Save PDF to disk
          const pdfPath = path.join(
            outputDir,
            `dm-${recipient.name}-${recipient.lastname}-${recipient.trackingId}.pdf`
          );

          const buffer = await pdfBlob.arrayBuffer();
          fs.writeFileSync(pdfPath, Buffer.from(buffer));

          pdfPaths.push(pdfPath);
          successCount++;

          // Update recipient status to completed
          updateBatchJobRecipientStatus(recipientRecord.id, "completed", {
            pdfPath,
          });

          console.log(`✅ Generated PDF for ${recipient.name} ${recipient.lastname}`);
        } catch (error) {
          failedCount++;

          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.error(`❌ Failed to process ${recipient.name}:`, errorMessage);

          // Update recipient status to failed
          updateBatchJobRecipientStatus(recipientRecord.id, "failed", {
            errorMessage,
          });
        }

        // Update progress
        const processedCount = successCount + failedCount;
        const progressPercent = (processedCount / recipients.length) * 100;

        updateBatchJobProgress(batchJobId, {
          processedCount,
          successCount,
          failedCount,
        });

        addBatchJobProgress({
          batchJobId,
          progressPercent,
          message: `Processing ${recipient.name} ${recipient.lastname}`,
        });

        console.log(`📊 Progress: ${processedCount}/${recipients.length} (${progressPercent.toFixed(1)}%)`);
      }

      // Small delay between chunks to avoid overwhelming system
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Create ZIP archive
    console.log("📦 Creating ZIP archive...");
    const zipPath = await createBatchZip(batchJobId, pdfPaths);

    // Update job with ZIP path
    setBatchJobOutputZip(batchJobId, zipPath);

    // Mark job as completed
    updateBatchJobStatus(batchJobId, "completed", {
      completedAt: new Date().toISOString(),
    });

    console.log(`✅ Batch job completed: ${successCount} success, ${failedCount} failed`);

    // Send completion email
    if (userEmail) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await sendBatchCompleteEmail({
        userEmail,
        batchJobId,
        campaignName: payload.campaignId,
        totalRecipients: recipients.length,
        successCount,
        failedCount,
        downloadUrl: `${baseUrl}/api/batch-jobs/${batchJobId}/download`,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Batch job failed:`, error);

    // Mark job as failed
    updateBatchJobStatus(batchJobId, "failed", {
      errorMessage,
      completedAt: new Date().toISOString(),
    });

    // Send failure email
    if (userEmail) {
      await sendBatchFailedEmail({
        userEmail,
        batchJobId,
        campaignName: payload.campaignId,
        totalRecipients: recipients.length,
        processedCount: successCount + failedCount,
        errorMessage,
      });
    }

    throw error;
  }
}

/**
 * Cleanup old batch files (retention policy)
 */
export async function cleanupOldBatchFiles(retentionDays: number = 30): Promise<void> {
  if (!fs.existsSync(BATCH_OUTPUT_DIR)) return;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const batches = fs.readdirSync(BATCH_OUTPUT_DIR);

  for (const batchDir of batches) {
    const batchPath = path.join(BATCH_OUTPUT_DIR, batchDir);
    const stats = fs.statSync(batchPath);

    if (stats.isDirectory() && stats.mtime < cutoffDate) {
      console.log(`🗑️ Cleaning up old batch: ${batchDir}`);
      fs.rmSync(batchPath, { recursive: true, force: true });
    }
  }

  console.log(`✅ Cleaned up batches older than ${retentionDays} days`);
}
