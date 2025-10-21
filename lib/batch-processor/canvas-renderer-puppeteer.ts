/**
 * Server-Side Canvas Renderer using Puppeteer
 *
 * Renders DM templates server-side for batch processing.
 * Uses the same Fabric.js logic as the canvas editor to ensure pixel-perfect rendering.
 */

import type { Browser, Page } from "puppeteer";
import { getDMTemplate } from "@/lib/database/template-queries";
import { PUPPETEER_OPTIONS } from "@/lib/queue/config";

// Browser instance pool for reuse (memory optimization)
let browserInstance: Browser | null = null;
let browserRefCount = 0;

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
 * Get or create browser instance (reuse across renders)
 */
async function getBrowserInstance(): Promise<Browser> {
  if (browserInstance) {
    browserRefCount++;
    return browserInstance;
  }

  const puppeteer = await import("puppeteer");
  browserInstance = await puppeteer.default.launch(PUPPETEER_OPTIONS);
  browserRefCount = 1;

  console.log("✅ Puppeteer browser launched");
  return browserInstance;
}

/**
 * Release browser instance (close when no longer needed)
 */
async function releaseBrowserInstance(): Promise<void> {
  browserRefCount--;

  if (browserRefCount <= 0 && browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    browserRefCount = 0;
    console.log("✅ Puppeteer browser closed");
  }
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
        // Use absolute URL to Next.js server
        script.src = '${baseUrl}/fabric.min.js';
        script.onload = () => {
          console.log('✅ Fabric.js loaded successfully');
          window.fabricLoaded = true;
          resolve();
        };
        script.onerror = (error) => {
          const errorMsg = 'Failed to load Fabric.js from ' + script.src;
          console.error(errorMsg, error);
          window.renderError = errorMsg;
          reject(new Error(errorMsg));
        };
        document.head.appendChild(script);
      });
    }

    // Recipient data injected from server (properly escaped for JavaScript)
    const recipientData = ${JSON.stringify(recipientData)};
    const templateJSON = ${JSON.stringify(templateJSON)};  // Inject as string, will be parsed below
    const variableMappings = ${JSON.stringify(variableMappings || '{}')};  // Inject as string

    // Main initialization function
    async function initializeAndRender() {
      try {
        // Load Fabric.js first (from Next.js server)
        console.log('Loading Fabric.js from server: ${baseUrl}/fabric.min.js');
        await loadFabricJS();

        // Initialize Fabric canvas
        console.log('Initializing Fabric canvas...');
        const canvas = new fabric.Canvas('canvas', {
          width: ${canvasWidth},
          height: ${canvasHeight},
          backgroundColor: '#ffffff'
        });

        // Load template and apply variables
        await renderTemplate(canvas);
      } catch (error) {
        console.error('Fatal initialization error:', error);
        window.renderError = error.message || 'Unknown initialization error';
      }
    }

    // Load template and apply variables
    async function renderTemplate(canvas) {
      try {
        console.log('Loading template canvas...');
        console.log('Template JSON type:', typeof templateJSON);
        console.log('Template JSON length:', templateJSON.length);

        // Parse JSON strings to objects
        const templateObj = typeof templateJSON === 'string' ? JSON.parse(templateJSON) : templateJSON;
        const mappingsObj = typeof variableMappings === 'string' ? JSON.parse(variableMappings) : variableMappings;

        await canvas.loadFromJSON(templateObj);

        console.log('Applying variable mappings...');
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

        console.log('Updating recipient data...');
        await updateTemplateVariables(canvas, recipientData, objects);

        console.log('Rendering complete!');
        window.renderComplete = true;
      } catch (error) {
        console.error('Render error:', error);
        window.renderError = error.message;
      }
    }

    // Update template variables with recipient data
    async function updateTemplateVariables(canvas, data, objects) {
      const replacements = [];

      for (const obj of objects) {
        const varType = obj.variableType;
        const isReusable = obj.isReusable;

        if (!varType || isReusable) continue;

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
              obj.set({ text: \`📞 \${data.phoneNumber}\` });
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
 * Render template with recipient data to PNG image
 */
export async function renderTemplateToImage(
  templateId: string,
  recipientData: RecipientRenderData
): Promise<string> {
  const browser = await getBrowserInstance();
  const page = await browser.newPage();

  try {
    // Fetch template from database
    const template = getDMTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    console.log(`📋 Rendering template: ${template.name}`);

    // Set viewport to canvas size
    await page.setViewport({
      width: template.canvasWidth,
      height: template.canvasHeight,
      deviceScaleFactor: 2, // High DPI for quality
    });

    // Get base URL for Fabric.js loading
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create HTML with Fabric.js and template
    const html = createCanvasHTML(
      template.canvasJSON,
      template.variableMappings || '{}',
      recipientData,
      template.canvasWidth,
      template.canvasHeight,
      baseUrl
    );

    // Enable console log forwarding from page to Node
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.error(`[Puppeteer Error] ${text}`);
      } else {
        console.log(`[Puppeteer] ${text}`);
      }
    });

    // Load HTML in page (increased timeout for large templates)
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 90000 }); // 90 seconds

    console.log('⏳ Waiting for canvas render to complete...');

    // Wait for rendering to complete (increased timeout for CDN load)
    await page.waitForFunction(
      () => window.renderComplete || window.renderError,
      { timeout: 60000 } // 60 seconds to account for CDN loading
    );

    // Check for render errors
    const renderError = await page.evaluate(() => window.renderError);
    if (renderError) {
      throw new Error(`Template render failed: ${renderError}`);
    }

    console.log('✅ Canvas render complete');

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
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    console.log(`✅ Template rendered successfully`);
    return dataUrl;
  } catch (error) {
    console.error('❌ Template rendering failed:', error);
    throw error;
  } finally {
    await page.close();
  }
}

/**
 * Batch render multiple recipients (optimized)
 */
export async function* renderBatchTemplates(
  templateId: string,
  recipients: RecipientRenderData[],
  onProgress?: (current: number, total: number) => void
): AsyncGenerator<{ index: number; imageDataUrl: string; recipient: RecipientRenderData }> {
  try {
    await getBrowserInstance(); // Initialize browser once

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];

      try {
        const imageDataUrl = await renderTemplateToImage(templateId, recipient);

        onProgress?.(i + 1, recipients.length);

        yield {
          index: i,
          imageDataUrl,
          recipient,
        };
      } catch (error) {
        console.error(`❌ Failed to render recipient ${i}:`, error);
        throw error;
      }
    }
  } finally {
    await releaseBrowserInstance(); // Close browser when done
  }
}

/**
 * Cleanup function for graceful shutdown
 */
export async function cleanup(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    browserRefCount = 0;
  }
}

// Add type declarations for window globals
declare global {
  interface Window {
    renderComplete?: boolean;
    renderError?: string;
  }
}
