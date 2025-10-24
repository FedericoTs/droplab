/**
 * OPTIMIZED Batch Processing Orchestrator
 *
 * Performance improvements:
 * - Parallel rendering using puppeteer-cluster (4-8x speedup)
 * - OR Persistent page rendering (10-12x speedup) - opt-in via env var
 * - Aspect ratio preservation in PDF output
 * - Batch rendering before PDF generation
 *
 * Expected performance:
 * - Cluster mode: 150 DMs in 2-4 minutes (vs 15 minutes baseline)
 * - Persistent mode: 150 DMs in 45-60 seconds (3x faster than cluster)
 */

import { renderBatchTemplatesCluster } from "./canvas-renderer-cluster";
import { renderBatchTemplatesPersistent } from "./canvas-renderer-persistent";
import { generateDirectMailPDFImproved } from "@/lib/pdf-generator-improved";
import { getDMTemplate } from "@/lib/database/template-queries";
import {
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
import { BATCH_OUTPUT_DIR } from "@/lib/queue/config";
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
 * OPTIMIZED: Process batch job with parallel rendering
 */
export async function processBatchJobOptimized(payload: BatchJobPayload): Promise<void> {
  const { batchJobId, templateId, recipients, userEmail, settings } = payload;

  console.log(`\n🚀 [OPTIMIZED] Processing batch job: ${batchJobId}`);
  console.log(`📊 Recipients: ${recipients.length}`);
  console.log(`📋 Template: ${templateId || "No template"}`);

  if (!templateId) {
    throw new Error("Template is required for batch processing");
  }

  // Update job status to processing
  updateBatchJobStatus(batchJobId, "processing", {
    startedAt: new Date().toISOString(),
  });

  // Get template dimensions for PDF aspect ratio
  const template = getDMTemplate(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const templateDimensions = {
    width: template.canvasWidth,
    height: template.canvasHeight,
  };

  console.log(`📐 Template dimensions: ${templateDimensions.width}x${templateDimensions.height}`);

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

    // ==================== PHASE 1: PARALLEL RENDERING ====================
    console.log(`\n🎨 Phase 1: Rendering ${recipients.length} templates in parallel...`);
    const renderStartTime = Date.now();

    // Prepare recipient data for rendering
    const recipientDataList = recipients.map((recipient) => ({
      name: recipient.name,
      lastname: recipient.lastname,
      address: recipient.address,
      city: recipient.city,
      zip: recipient.zip,
      message: recipient.message,
      phoneNumber: recipient.phoneNumber,
      qrCodeDataUrl: recipient.qrCodeDataUrl,
      companyName: settings.companyName,
    }));

    // Progress callback for both renderers
    const progressCallback = (current: number, total: number, success: number, failed: number) => {
      // Update database progress during rendering phase
      const progressPercent = (current / total) * 50; // Rendering is 50% of total work

      updateBatchJobProgress(batchJobId, {
        processedCount: current,
        successCount: success,
        failedCount: failed,
      });

      addBatchJobProgress({
        batchJobId,
        progressPercent,
        message: `Rendered ${current}/${total} templates (✅ ${success} success, ❌ ${failed} failed)`,
      });

      console.log(`🎨 Rendered: ${current}/${total} (${((current / total) * 100).toFixed(1)}%) - ✅ ${success} success, ❌ ${failed} failed`);
    };

    // Choose renderer: Persistent (fast) or Cluster (stable)
    const USE_PERSISTENT = process.env.USE_PERSISTENT_RENDERING === 'true';
    let renderedImages: Map<number, string>;

    if (USE_PERSISTENT) {
      console.log(`⚡ Using PERSISTENT renderer (3x faster)`);

      try {
        // Try persistent renderer (page reuse)
        renderedImages = await renderBatchTemplatesPersistent(
          templateId,
          recipientDataList,
          progressCallback
        );
        console.log(`✅ Persistent rendering succeeded`);
      } catch (error) {
        // Fallback to cluster renderer on any error
        console.warn(`⚠️  Persistent rendering failed, falling back to cluster:`, error);
        console.log(`🔄 Using CLUSTER renderer (fallback)`);

        renderedImages = await renderBatchTemplatesCluster(
          templateId,
          recipientDataList,
          progressCallback
        );
      }
    } else {
      // Default: Cluster renderer (stable, well-tested)
      console.log(`🔄 Using CLUSTER renderer (default)`);

      renderedImages = await renderBatchTemplatesCluster(
        templateId,
        recipientDataList,
        progressCallback
      );
    }

    const renderDuration = ((Date.now() - renderStartTime) / 1000).toFixed(1);
    console.log(`✅ Phase 1 complete: ${renderedImages.size} templates rendered in ${renderDuration}s`);
    console.log(`⚡ Average: ${(renderedImages.size / parseFloat(renderDuration)).toFixed(1)} templates/sec\n`);

    // ==================== PHASE 2: PDF GENERATION ====================
    console.log(`📄 Phase 2: Generating ${recipients.length} PDFs...`);
    const pdfStartTime = Date.now();

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const recipientRecord = recipientRecords[i];
      const creativeImageUrl = renderedImages.get(i);

      if (!creativeImageUrl) {
        failedCount++;
        updateBatchJobRecipientStatus(recipientRecord.id, "failed", {
          errorMessage: "Rendering failed",
        });
        continue;
      }

      try {
        // Update recipient status to processing
        updateBatchJobRecipientStatus(recipientRecord.id, "processing");

        // Generate PDF with improved aspect ratio handling
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

        const pdfBlob = await generateDirectMailPDFImproved(
          dmData,
          settings.companyName,
          templateDimensions // Pass template dimensions for aspect ratio
        );

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
      } catch (error) {
        failedCount++;

        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`❌ Failed to generate PDF for ${recipient.name}:`, errorMessage);

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
        message: `Generating PDF for ${recipient.name} ${recipient.lastname}`,
      });

      if (processedCount % 10 === 0 || processedCount === recipients.length) {
        console.log(`📄 Generated: ${processedCount}/${recipients.length} PDFs (${progressPercent.toFixed(1)}%)`);
      }
    }

    const pdfDuration = ((Date.now() - pdfStartTime) / 1000).toFixed(1);
    console.log(`✅ Phase 2 complete: ${successCount} PDFs generated in ${pdfDuration}s\n`);

    // ==================== PHASE 3: ZIP CREATION ====================
    console.log("📦 Phase 3: Creating ZIP archive...");
    const zipPath = await createBatchZip(batchJobId, pdfPaths);

    // Update job with ZIP path
    setBatchJobOutputZip(batchJobId, zipPath);

    // Mark job as completed
    updateBatchJobStatus(batchJobId, "completed", {
      completedAt: new Date().toISOString(),
    });

    const totalDuration = ((Date.now() - renderStartTime) / 1000 / 60).toFixed(1);
    console.log(`\n✅ Batch job completed in ${totalDuration} minutes`);
    console.log(`📊 Success: ${successCount}, Failed: ${failedCount}`);
    console.log(`⚡ Throughput: ${(successCount / (parseFloat(totalDuration) * 60)).toFixed(1)} DMs/sec`);

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
    console.error(`\n❌ Batch job failed:`, error);

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
