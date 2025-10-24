/**
 * High-Performance Canvas Renderer using Puppeteer-cluster
 *
 * Provides 4-8x speedup through parallel browser context processing
 * Efficiently manages browser instances and memory
 */

import { Cluster } from 'puppeteer-cluster';
import type { Page } from 'puppeteer';
import { getDMTemplate } from '@/lib/database/template-queries';
import { PUPPETEER_OPTIONS } from '@/lib/queue/config';

/**
 * Recipient data for template rendering
 */
export interface RecipientRenderData {
  name: string;
  lastname: string;
  address?: string;
  city?: string;
  zip?: string;
  message: string;
  phoneNumber: string;
  qrCodeDataUrl: string;
  companyName: string;
  logoUrl?: string;
  primaryColor?: string;
  textColor?: string;
}

/**
 * Cluster task data
 */
interface ClusterTaskData {
  templateId: string;
  recipient: RecipientRenderData;
  baseUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  templateJSON: string;
  variableMappings: string;
  backgroundImage: string;
}

/**
 * Create HTML page with Fabric.js for server-side rendering
 */
function createCanvasHTML(
  templateJSON: string,
  variableMappings: string,
  recipientData: RecipientRenderData,
  canvasWidth: number,
  canvasHeight: number,
  baseUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    #canvas-container {
      width: ${canvasWidth}px;
      height: ${canvasHeight}px;
    }
  </style>
</head>
<body>
  <div id="canvas-container">
    <canvas id="canvas" width="${canvasWidth}" height="${canvasHeight}"></canvas>
  </div>

  <script>
    // Error handling
    window.renderComplete = false;
    window.renderError = null;
    window.fabricLoaded = false;

    // Load Fabric.js dynamically from Next.js server
    function loadFabricJS() {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '${baseUrl}/fabric.min.js';
        script.onload = () => {
          window.fabricLoaded = true;
          resolve();
        };
        script.onerror = (error) => {
          const errorMsg = 'Failed to load Fabric.js from ' + script.src;
          window.renderError = errorMsg;
          reject(new Error(errorMsg));
        };
        document.head.appendChild(script);
      });
    }

    // Recipient data injected from server (properly escaped for JavaScript)
    const recipientData = ${JSON.stringify(recipientData)};
    const templateJSON = ${JSON.stringify(templateJSON)};  // Inject as string
    const variableMappings = ${JSON.stringify(variableMappings || '{}')};

    // Main initialization function
    async function initializeAndRender() {
      try {
        await loadFabricJS();

        const canvas = new fabric.Canvas('canvas', {
          width: ${canvasWidth},
          height: ${canvasHeight},
          backgroundColor: '#ffffff'
        });

        await renderTemplate(canvas);
      } catch (error) {
        window.renderError = error.message || 'Unknown initialization error';
      }
    }

    // Load template and apply variables
    async function renderTemplate(canvas) {
      try {
        const templateObj = typeof templateJSON === 'string' ? JSON.parse(templateJSON) : templateJSON;
        const mappingsObj = typeof variableMappings === 'string' ? JSON.parse(variableMappings) : variableMappings;

        await canvas.loadFromJSON(templateObj);

        const objects = canvas.getObjects();
        const mappings = mappingsObj || {};

        // Apply variable mappings to canvas objects by index
        Object.entries(mappings).forEach(([indexStr, mapping]) => {
          const idx = parseInt(indexStr);
          if (idx >= 0 && idx < objects.length) {
            const obj = objects[idx];

            // Restore markers
            if (mapping.variableType) obj.variableType = mapping.variableType;
            if (mapping.isReusable !== undefined) obj.isReusable = mapping.isReusable;
            if (mapping.displayName) obj.displayName = mapping.displayName;
            if (mapping.category) obj.category = mapping.category;
            if (mapping.isVisible !== undefined) obj.visible = mapping.isVisible;
            if (mapping.isLocked !== undefined) {
              obj.lockMovementX = mapping.isLocked;
              obj.lockMovementY = mapping.isLocked;
              obj.lockRotation = mapping.isLocked;
              obj.lockScalingX = mapping.isLocked;
              obj.lockScalingY = mapping.isLocked;
              obj.selectable = !mapping.isLocked;
              obj.evented = !mapping.isLocked;
            }
          }
        });

        await updateTemplateVariables(canvas, recipientData, objects);
        window.renderComplete = true;
      } catch (error) {
        window.renderError = error.message;
      }
    }

    // Update template variables with recipient data
    async function updateTemplateVariables(canvas, data, objects) {
      const replacements = [];

      console.log('DEBUG: Updating template variables with recipient data, objects count:', objects.length);

      for (const obj of objects) {
        const varType = obj.variableType;
        const isReusable = obj.isReusable === true; // Only skip if explicitly true

        console.log('DEBUG: Object type=' + obj.type + ', varType=' + varType + ', isReusable=' + obj.isReusable + ' (treating as: ' + isReusable + ')');

        if (!varType || isReusable) {
          console.log('DEBUG: Skipping object (no varType or isReusable=true)');
          continue;
        }

        // TEXT REPLACEMENTS
        if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') {
          switch (varType) {
            case 'message':
              obj.set({ text: data.message });
              break;
            case 'recipientName':
              obj.set({ text: \`\${data.name} \${data.lastname}\` });
              break;
            case 'recipientAddress':
              const address = \`\${data.address || ''}, \${data.city || ''}, \${data.zip || ''}\`.trim();
              obj.set({ text: address });
              break;
            case 'phoneNumber':
              // Only replace if phoneNumber is provided in CSV
              if (data.phoneNumber && data.phoneNumber.trim()) {
                console.log('DEBUG: Replacing phoneNumber with:', data.phoneNumber);
                obj.set({ text: \`📞 \${data.phoneNumber}\` });
              } else {
                console.log('DEBUG: No phoneNumber provided, keeping template default');
              }
              break;
          }
        }

        // QR CODE REPLACEMENT
        if (varType === 'qrCode' && obj.type === 'image') {
          const oldQRDisplayWidth = (obj.width || 150) * (obj.scaleX || 1);
          const oldQRDisplayHeight = (obj.height || 150) * (obj.scaleY || 1);
          const oldQRDisplaySize = Math.min(oldQRDisplayWidth, oldQRDisplayHeight);

          const replacement = fabric.FabricImage.fromURL(data.qrCodeDataUrl, { crossOrigin: 'anonymous' })
            .then((newQR) => {
              const qrNaturalSize = newQR.width || 300;
              const properScale = oldQRDisplaySize / qrNaturalSize;

              newQR.set({
                left: obj.left,
                top: obj.top,
                scaleX: properScale,
                scaleY: properScale,
                angle: obj.angle || 0,
                variableType: 'qrCode',
                isReusable: false,
              });

              canvas.remove(obj);
              canvas.add(newQR);
            })
            .catch((err) => {
              console.error('QR replacement error:', err);
            });

          replacements.push(replacement);
        }
      }

      await Promise.all(replacements);
      canvas.renderAll();
    }

    // Start initialization and rendering
    initializeAndRender();
  </script>
</body>
</html>
  `;
}

/**
 * Cluster task function - renders a single template
 */
async function renderTask({ page, data }: { page: Page; data: ClusterTaskData }): Promise<string> {
  const { templateJSON, variableMappings, recipient, canvasWidth, canvasHeight, baseUrl } = data;

  // Set viewport to canvas size
  await page.setViewport({
    width: canvasWidth,
    height: canvasHeight,
    deviceScaleFactor: 2, // High DPI for quality
  });

  // Create HTML with Fabric.js and template
  const html = createCanvasHTML(
    templateJSON,
    variableMappings,
    recipient,
    canvasWidth,
    canvasHeight,
    baseUrl
  );

  // Load HTML in page (use 'load' instead of 'networkidle0' to avoid hanging on slow/stuck network requests)
  await page.setContent(html, { waitUntil: 'load', timeout: 300000 });

  // Wait for rendering to complete
  await page.waitForFunction(
    () => window.renderComplete || window.renderError,
    { timeout: 300000 }
  );

  // Check for render errors
  const renderError = await page.evaluate(() => window.renderError);
  if (renderError) {
    throw new Error(`Template render failed: ${renderError}`);
  }

  // Take screenshot of canvas element
  const canvasElement = await page.$('#canvas');
  if (!canvasElement) {
    throw new Error('Canvas element not found');
  }

  const imageBuffer = await canvasElement.screenshot({
    type: 'png',
    omitBackground: false,
  });

  // Convert to base64 data URL
  const base64Image = (imageBuffer as Buffer).toString('base64');
  return `data:image/png;base64,${base64Image}`;
}

/**
 * Batch render multiple recipients using cluster (parallel processing)
 */
export async function renderBatchTemplatesCluster(
  templateId: string,
  recipients: RecipientRenderData[],
  onProgress?: (current: number, total: number, success: number, failed: number) => void
): Promise<Map<number, string>> {
  // Fetch template from database once
  const template = getDMTemplate(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  console.log(`📋 Rendering ${recipients.length} templates with cluster`);
  console.log(`🖼️  Template: ${template.name} (${template.canvasWidth}x${template.canvasHeight})`);

  // Get base URL for Fabric.js loading
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Determine concurrency based on CPU cores
  const concurrency = parseInt(process.env.BATCH_WORKER_CONCURRENCY || '4');
  console.log(`🚀 Cluster concurrency: ${concurrency}`);

  // Create cluster
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT, // Efficient: single browser, multiple contexts
    maxConcurrency: concurrency,
    puppeteerOptions: PUPPETEER_OPTIONS,
    timeout: 360000, // 6 minutes per task (WSL2 + large templates need extra time)
    retryLimit: 1,
    retryDelay: 1000,
  });

  // Set up task handler
  await cluster.task(renderTask);

  // Results map
  const results = new Map<number, string>();
  let completed = 0;
  let success = 0;
  let failed = 0;

  // Timeout wrapper to prevent cluster.execute() from hanging forever
  const executeWithTimeout = <T>(promise: Promise<T>, timeoutMs: number, taskIndex: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Task ${taskIndex} timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  };

  // Queue all recipients with individual error handling
  const promises = recipients.map((recipient, index) => {
    const taskData: ClusterTaskData = {
      templateId,
      recipient,
      baseUrl,
      canvasWidth: template.canvasWidth,
      canvasHeight: template.canvasHeight,
      templateJSON: template.canvasJSON,
      variableMappings: template.variableMappings || '{}',
      backgroundImage: template.backgroundImage,
    };

    // Log task start for debugging
    console.log(`🔵 Queuing task ${index}/${recipients.length - 1}: ${recipient.name}`);

    // Execute with 6min 20sec timeout (cluster timeout is 6 min, this is safety net)
    return executeWithTimeout(cluster.execute(taskData), 380000, index)
      .then((imageDataUrl) => {
        // Success
        console.log(`✅ Task ${index} completed: ${recipient.name}`);
        results.set(index, imageDataUrl);
        completed++;
        success++;
        onProgress?.(completed, recipients.length, success, failed);
      })
      .catch((error) => {
        // Failure - log but continue processing others
        console.error(`❌ Failed to render recipient ${index} (${recipient.name}):`, error.message);
        results.set(index, ''); // Empty string indicates failure
        completed++;
        failed++;
        onProgress?.(completed, recipients.length, success, failed);
      });
  });

  // Wait for all tasks to complete (successes + failures)
  await Promise.all(promises);

  // Close cluster
  await cluster.idle();
  await cluster.close();

  console.log(`✅ Cluster rendering complete: ${success} success, ${failed} failed out of ${recipients.length} total`);

  // If all failed, throw error
  if (success === 0 && recipients.length > 0) {
    throw new Error('All renders failed - check logs for details');
  }

  return results;
}

/**
 * Single template render (for testing or small batches)
 */
export async function renderTemplateToImageCluster(
  templateId: string,
  recipientData: RecipientRenderData
): Promise<string> {
  const results = await renderBatchTemplatesCluster(templateId, [recipientData]);
  const imageUrl = results.get(0);
  if (!imageUrl) {
    throw new Error('Failed to render template');
  }
  return imageUrl;
}

// Add type declarations for window globals
declare global {
  interface Window {
    renderComplete?: boolean;
    renderError?: string;
    fabricLoaded?: boolean;
  }
}
