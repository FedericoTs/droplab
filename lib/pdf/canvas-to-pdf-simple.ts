/**
 * Simple Canvas-to-PDF using proven Puppeteer pattern
 *
 * VERCEL SERVERLESS COMPATIBLE:
 * - Uses puppeteer-core + @sparticuz/chromium-min on Vercel
 * - Uses full puppeteer on local development
 * - Single browser instance per invocation (no pooling on serverless)
 *
 * KEY INSIGHT: Don't pass personalized canvas JSON to browser
 * Instead: Pass original template + recipient data, let browser personalize
 */

import type { Browser } from 'puppeteer-core'
import { jsPDF } from 'jspdf'
import { getFormat } from '@/lib/design/print-formats'
import { createServiceClient } from '@/lib/supabase/server'

// Browser instance management (single instance per invocation on serverless)
let browserInstance: Browser | null = null
let browserLock: Promise<Browser> | null = null

// ==================== PAGE POOL (PERFORMANCE OPTIMIZATION) ====================
import type { Page } from 'puppeteer-core'

/**
 * Page pool for reusing Puppeteer pages with pre-loaded Fabric.js
 * This avoids the expensive page creation + Fabric.js load for each PDF
 * Expected speedup: 12-15s/PDF → 3-5s/PDF (2-3x faster)
 */
const warmPagePool: Page[] = []
const MAX_WARM_PAGES = 3 // Match PDF_CONCURRENCY on Vercel

/**
 * HTML template for warm pages - Fabric.js pre-loaded
 */
function getWarmPageHTML(width: number, height: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=block" rel="stylesheet">
  <style>body{margin:0;padding:0;overflow:hidden}</style>
  <script src="https://cdn.jsdelivr.net/npm/fabric@6.7.1/dist/index.min.js"></script>
</head>
<body>
  <canvas id="canvas" width="${width}" height="${height}"></canvas>
  <script>
    // Wait for fonts then initialize
    document.fonts.ready.then(() => {
      window.fabricCanvas = new fabric.Canvas('canvas', {
        width: ${width},
        height: ${height},
        backgroundColor: '#ffffff',
        renderOnAddRemove: false,
      });
      window.fabricReady = true;
    });
    window.renderComplete = false;
    window.renderError = null;

    // Function to render canvas with new data (called from Puppeteer)
    window.renderCanvas = async function(templateJSON, recipientData, variableMappings) {
      window.renderComplete = false;
      window.renderError = null;

      try {
        const canvas = window.fabricCanvas;
        canvas.clear();
        canvas.backgroundColor = '#ffffff';

        await canvas.loadFromJSON(templateJSON);

        // Personalize text objects
        canvas.getObjects().forEach((obj) => {
          if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') {
            const originalText = obj.text || '';
            let text = originalText;

            if (variableMappings && variableMappings.length > 0) {
              variableMappings.forEach((m) => {
                if (!m.templateVariable || !m.recipientField) return;
                const v = m.templateVariable;
                const val = recipientData[m.recipientField] || '';
                text = text.split('{' + v + '}').join(val).split('{{' + v + '}}').join(val);
              });
            } else {
              const r = (t, v, val) => t.split('{' + v + '}').join(val).split('{{' + v + '}}').join(val);
              text = r(text, 'firstName', recipientData.name || recipientData.first_name || '');
              text = r(text, 'name', recipientData.name || recipientData.first_name || '');
              text = r(text, 'lastName', recipientData.lastname || recipientData.last_name || '');
              text = r(text, 'lastname', recipientData.lastname || recipientData.last_name || '');
              text = r(text, 'address', recipientData.address || recipientData.address_line1 || '');
              text = r(text, 'city', recipientData.city || '');
              text = r(text, 'zip', recipientData.zip || recipientData.zip_code || '');
              text = r(text, 'phone', recipientData.phone || '');
            }

            if (text !== originalText) {
              obj.set({ text });
              if (text.length > 0) {
                obj.setSelectionStyles({ fill: '#000000', textBackgroundColor: '' }, 0, text.length);
              }
            }
          }
        });

        canvas.renderAll();
        window.renderComplete = true;
        return true;
      } catch (err) {
        console.error('Render error:', err);
        window.renderError = err.message || 'Render failed';
        return false;
      }
    };
  </script>
</body>
</html>`
}

/**
 * Get a warm page from pool or create new one
 */
async function getWarmPage(browser: Browser, width: number, height: number): Promise<Page> {
  if (warmPagePool.length > 0) {
    const page = warmPagePool.pop()!
    await page.setViewport({ width, height, deviceScaleFactor: 2 })
    console.log(`⚡ [PDF] Reusing warm page (pool: ${warmPagePool.length} remaining)`)
    return page
  }

  console.log('🔥 [PDF] Creating warm page with pre-loaded Fabric.js...')
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: 2 })
  await page.setContent(getWarmPageHTML(width, height), { waitUntil: 'networkidle0', timeout: 60000 })
  await page.waitForFunction(() => (window as any).fabricReady, { timeout: 30000 })
  console.log('✅ [PDF] Warm page ready')
  return page
}

/**
 * Return page to pool for reuse
 */
async function releaseWarmPage(page: Page): Promise<void> {
  if (warmPagePool.length < MAX_WARM_PAGES && !isVercel()) {
    // Only pool pages on local dev (Vercel closes browser after each invocation)
    warmPagePool.push(page)
    console.log(`♻️ [PDF] Page returned to pool (pool: ${warmPagePool.length})`)
  } else {
    await page.close()
  }
}

/**
 * Detect if running on Vercel serverless
 */
function isVercel(): boolean {
  return !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME
}

/**
 * Get browser instance with Vercel detection
 * Uses puppeteer-core + @sparticuz/chromium-min on Vercel
 * Uses puppeteer (full) on local development
 */
async function getBrowserInstance(): Promise<Browser> {
  // If we already have an instance, return it
  if (browserInstance) {
    return browserInstance
  }

  // If browser is being launched, wait for it
  if (browserLock) {
    return browserLock
  }

  // Launch browser with lock to prevent race conditions
  browserLock = (async () => {
    try {
      if (isVercel()) {
        // Vercel serverless: Use chromium-min (131MB compressed)
        console.log('🚀 [PDF] Launching Chromium on Vercel...')
        const puppeteer = await import('puppeteer-core')
        const chromium = await import('@sparticuz/chromium-min')

        // Fetch the correct Chromium binary URL for this version
        const executablePath = await chromium.default.executablePath(
          'https://github.com/nicholasgriffintn/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar'
        )

        browserInstance = await puppeteer.default.launch({
          args: chromium.default.args,
          defaultViewport: { width: 1920, height: 1080 },
          executablePath,
          headless: chromium.default.headless,
        }) as Browser

        console.log('✅ [PDF] Chromium launched on Vercel')
      } else {
        // Local development: Use full puppeteer
        console.log('🚀 [PDF] Launching Puppeteer locally...')

        // Try puppeteer-core first, fall back to puppeteer if needed
        try {
          const puppeteer = await import('puppeteer-core')

          // Try to find local Chrome/Chromium installation
          const possiblePaths = [
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          ]

          let executablePath: string | undefined
          for (const path of possiblePaths) {
            try {
              const fs = await import('fs')
              if (fs.existsSync(path)) {
                executablePath = path
                break
              }
            } catch {
              // Continue to next path
            }
          }

          if (!executablePath) {
            throw new Error('No local Chrome/Chromium found')
          }

          browserInstance = await puppeteer.default.launch({
            headless: true,
            executablePath,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
          }) as Browser
        } catch (localError) {
          console.error('⚠️ [PDF] Failed to launch local Chrome:', localError)
          throw new Error('Failed to launch browser. Install Chrome locally for PDF generation.')
        }

        console.log('✅ [PDF] Browser launched locally')
      }

      return browserInstance!
    } catch (error) {
      browserLock = null
      throw error
    }
  })()

  return browserLock
}

async function releaseBrowserInstance(): Promise<void> {
  // On Vercel serverless, close browser after each use to free memory
  if (isVercel() && browserInstance) {
    try {
      await browserInstance.close()
    } catch (e) {
      console.warn('⚠️ [PDF] Error closing browser:', e)
    }
    browserInstance = null
    browserLock = null
    console.log('✅ [PDF] Browser closed')
  }
  // On local development, keep browser open for reuse
}

/**
 * Download Supabase image as base64 data URL
 */
async function downloadImageAsDataURL(url: string): Promise<string> {
  const match = url.match(/\/storage\/v1\/object\/(?:sign|public)\/([^/]+)\/(.+?)(?:\?|$)/)
  if (!match) throw new Error('Invalid Supabase Storage URL')

  const [, bucket, path] = match
  const supabase = createServiceClient()
  const { data, error } = await supabase.storage.from(bucket).download(path)

  if (error) throw new Error(`Storage error: ${error.message}`)
  if (!data) throw new Error('No data returned')

  const buffer = Buffer.from(await data.arrayBuffer())
  return `data:image/png;base64,${buffer.toString('base64')}`
}

/**
 * Pre-download all images in canvas JSON
 */
async function downloadCanvasImages(canvasJSON: any): Promise<any> {
  const parsed = typeof canvasJSON === 'string' ? JSON.parse(canvasJSON) : canvasJSON
  const images = parsed?.objects?.filter((obj: any) => obj.type === 'Image') || []

  if (images.length > 0) {
    console.log(`📥 [PDF] Downloading ${images.length} images...`)
    await Promise.all(
      images.map(async (obj: any) => {
        if (obj.src && obj.src.includes('supabase.co/storage')) {
          obj.src = await downloadImageAsDataURL(obj.src)
        }
      })
    )
    console.log('✅ [PDF] Images downloaded')
  }

  return parsed
}

/**
 * Create HTML with Fabric.js - uses ORIGINAL template, not personalized JSON
 * OPTIMIZATION: Preload fonts before canvas rendering for faster text layout
 */
function createHTML(templateJSON: string, recipientData: any, width: number, height: number, variableMappings?: any[]): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <!-- OPTIMIZATION: Preload fonts for faster rendering -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&display=block" rel="stylesheet">
  <style>
    body{margin:0;padding:0;overflow:hidden}
    /* Force fonts to load immediately */
    .font-preload{font-family:'Inter','Poppins','Roboto','Open Sans',sans-serif;visibility:hidden;position:absolute}
  </style>
</head>
<body>
  <div class="font-preload">Font Preloader</div>
  <canvas id="canvas" width="${width}" height="${height}"></canvas>

  <script>
    window.renderComplete = false;
    window.renderError = null;

    // CRITICAL: Declare variables outside try-catch for function scope
    let recipientData;
    let variableMappings;

    try {
      recipientData = ${JSON.stringify(recipientData)};
      variableMappings = ${JSON.stringify(variableMappings || [])};
    } catch (err) {
      console.error('❌ [Browser] Failed to parse data:', err);
      window.renderError = 'Failed to parse data: ' + err.message;
      throw err;
    }

    function loadFabric() {
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        // OPTIMIZATION: Load Fabric.js from local server (faster than CDN)
        // Fabric v6.7.1 to match editor version (package.json: ^6.7.1)
        // Fallback to CDN if local fails
        const baseUrl = '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}';
        s.src = baseUrl + '/fabric.min.js';
        s.onload = resolve;
        s.onerror = () => {
          // Fallback to CDN
          console.warn('Local Fabric.js failed, falling back to CDN');
          const fallbackScript = document.createElement('script');
          fallbackScript.src = 'https://cdn.jsdelivr.net/npm/fabric@6.7.1/dist/index.min.js';
          fallbackScript.onload = resolve;
          fallbackScript.onerror = () => {
            window.renderError = 'Failed to load Fabric.js';
            reject();
          };
          document.head.appendChild(fallbackScript);
        };
        document.head.appendChild(s);
      });
    }

    async function render() {
      try {
        // OPTIMIZATION: Wait for fonts to load before rendering (prevents FOUT)
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
          console.log('✅ Fonts loaded');
        }

        await loadFabric();

        // Fabric v6: Use Canvas class from fabric namespace
        const canvas = new fabric.Canvas('canvas', {
          width: ${width},
          height: ${height},
          backgroundColor: '#ffffff',
          renderOnAddRemove: false, // v6: Manual render control
        });

        const templateJSON = ${templateJSON};

        // Fabric v6: loadFromJSON() returns a Promise - await it directly
        // DO NOT use callback pattern (callbacks fire before objects load in v6)
        await canvas.loadFromJSON(templateJSON);

        // Personalize text objects (support both {var} and {{var}} syntax)
        let textObjectCount = 0;
        let replacementCount = 0;

        canvas.getObjects().forEach((obj, idx) => {
          if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') {
            textObjectCount++;
            const originalText = obj.text || '';
            let text = originalText;

            // DYNAMIC VARIABLE REPLACEMENT (mapping-based, not hardcoded)
            // User defines: {address} → "address_line1" via UI
            // We replace: {address} with recipientData.address_line1

            if (variableMappings && variableMappings.length > 0) {
              // Use user-defined mappings (Step 3 of campaign wizard)
              variableMappings.forEach((mapping) => {
                if (!mapping.templateVariable || !mapping.recipientField) return;

                // Escape special regex characters in variable name (simplified - no square brackets in variable names)
                // CRITICAL: Double-escape backslashes for template literal → HTML → JavaScript
                const escapedVar = mapping.templateVariable
                  .replace(/\\\\/g, '\\\\\\\\')    // Backslash: \\\\ in template literal → \\ in HTML → \ in regex
                  .replace(/\\./g, '\\\\.')        // Dot: \\. in template literal → \. in HTML
                  .replace(/\\*/g, '\\\\*')        // Asterisk
                  .replace(/\\+/g, '\\\\+')        // Plus
                  .replace(/\\?/g, '\\\\?')        // Question mark
                  .replace(/\\^/g, '\\\\^')        // Caret
                  .replace(/\\$/g, '\\\\$')        // Dollar
                  .replace(/\\{/g, '\\\\{')        // Left brace
                  .replace(/\\}/g, '\\\\}')        // Right brace
                  .replace(/\\(/g, '\\\\(')        // Left paren
                  .replace(/\\)/g, '\\\\)')        // Right paren
                  .replace(/\\|/g, '\\\\|');       // Pipe

                // Match {var} or {{var}} (case-insensitive)
                const pattern = new RegExp(\`\\\\{\\\\{?\${escapedVar}\\\\}?\\\\}\`, 'gi');

                // Get value from recipientData using the mapped field
                const value = recipientData[mapping.recipientField] || '';

                // Replace all occurrences
                text = text.replace(pattern, value);
              });
            } else {
              // FALLBACK: No mappings provided, use intelligent auto-detection
              // This handles templates created without variable mapping step
              text = text.replace(/\\{\\{?firstName\\}?\\}/gi, recipientData.name || recipientData.firstName || recipientData.first_name || '');
              text = text.replace(/\\{\\{?name\\}?\\}/gi, recipientData.name || recipientData.first_name || '');
              text = text.replace(/\\{\\{?lastName\\}?\\}/gi, recipientData.lastname || recipientData.lastName || recipientData.last_name || '');
              text = text.replace(/\\{\\{?lastname\\}?\\}/gi, recipientData.lastname || recipientData.last_name || '');
              text = text.replace(/\\{\\{?address\\}?\\}/gi, recipientData.address || recipientData.address_line1 || '');
              text = text.replace(/\\{\\{?city\\}?\\}/gi, recipientData.city || '');
              text = text.replace(/\\{\\{?zip\\}?\\}/gi, recipientData.zip || recipientData.zip_code || '');
              text = text.replace(/\\{\\{?phone\\}?\\}/gi, recipientData.phone || '');
            }

            if (text !== originalText) {
              replacementCount++;

              // Update text
              obj.set({ text });

              // CRITICAL: Clear purple chip styling from variable ranges
              // Fabric.js stores character-level styles separately from text
              // Reset to default black text with no background
              if (text.length > 0) {
                obj.setSelectionStyles(
                  {
                    fill: '#000000',           // Default black text
                    textBackgroundColor: '',   // Remove purple background
                  },
                  0,
                  text.length
                );
              }
            }
          }
        });

        canvas.renderAll();

        // Signal that rendering is complete
        window.renderComplete = true;
      } catch (err) {
        console.error('❌ [Browser] Render error:', err);
        console.error('❌ [Browser] Error stack:', err.stack);
        window.renderError = err.message || 'Render failed';
      }
    }

    // Start rendering
    render().catch(err => {
      console.error('❌ [Browser] Unhandled render error:', err);
      window.renderError = err.message || 'Unhandled render error';
    });
  </script>
</body>
</html>`
}

export interface PDFResult {
  buffer: Buffer
  fileName: string
  fileSizeBytes: number
  metadata: {
    format: string
    widthInches: number
    heightInches: number
    widthPixels: number
    heightPixels: number
    dpi: number
    pages: number
  }
}

/**
 * Render a canvas to PNG image using Puppeteer + Fabric.js
 * OPTIMIZED: Uses warm page pool for 2-3x speedup on local dev
 *
 * @param canvasJSON - Fabric.js canvas JSON (template, not personalized)
 * @param recipientData - Data for variable replacement
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @param browser - Puppeteer browser instance
 * @returns Base64 PNG image data
 */
async function renderCanvasToImage(
  canvasJSON: any,
  recipientData: {
    // Legacy fields
    name?: string; lastname?: string; address?: string; city?: string; zip?: string;
    // Database schema fields
    first_name?: string; last_name?: string; email?: string; phone?: string;
    address_line1?: string; address_line2?: string; state?: string; zip_code?: string; country?: string;
  },
  width: number,
  height: number,
  browser: Browser,
  variableMappings?: any[]  // User-defined variable mappings (templateVariable → recipientField)
): Promise<string> {
  const startTime = Date.now()

  // Download images (replace Supabase signed URLs with data URLs)
  const processedTemplate = await downloadCanvasImages(canvasJSON)

  // Try to use warm page pool for faster rendering
  const useWarmPage = warmPagePool.length > 0 || !isVercel()
  const page = useWarmPage
    ? await getWarmPage(browser, width, height)
    : await browser.newPage()

  try {
    if (useWarmPage && (page as any).__warmPage !== false) {
      // FAST PATH: Use warm page with pre-loaded Fabric.js
      const success = await page.evaluate(
        async (templateJSON: any, recipientData: any, variableMappings: any[]) => {
          return await (window as any).renderCanvas(templateJSON, recipientData, variableMappings)
        },
        processedTemplate,
        recipientData,
        variableMappings || []
      )

      if (!success) {
        const error = await page.evaluate(() => (window as any).renderError)
        throw new Error(`Render failed: ${error}`)
      }
    } else {
      // COLD PATH: Full page setup (first run or Vercel)
      await page.setViewport({ width, height, deviceScaleFactor: 2 })

      const templateString = JSON.stringify(processedTemplate)
      const html = createHTML(templateString, recipientData, width, height, variableMappings)

      page.on('console', (msg: any) => {
        if (msg.type() === 'error') console.error(`  [Browser] ${msg.text()}`)
      })

      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 })
      await page.waitForFunction(() => window.renderComplete || window.renderError, { timeout: 60000 })

      const renderComplete = await page.evaluate(() => (window as any).renderComplete)
      const error = await page.evaluate(() => (window as any).renderError)

      if (!renderComplete && error) {
        throw new Error(`Render failed: ${error}`)
      }
    }

    // Screenshot canvas element
    const canvasEl = await page.$('#canvas')
    if (!canvasEl) throw new Error('Canvas element not found')

    const imgBuffer = await canvasEl.screenshot({ type: 'png', omitBackground: false })
    const elapsed = Date.now() - startTime

    console.log(`⚡ [PDF] Canvas rendered in ${elapsed}ms`)

    return (imgBuffer as Buffer).toString('base64')
  } finally {
    if (useWarmPage) {
      await releaseWarmPage(page)
    } else {
      await page.close()
    }
  }
}

/**
 * Create a blank white page image as base64 PNG
 * Used when no custom back page is provided (backwards compatibility)
 *
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns Base64 PNG image data
 */
function createBlankPageImage(width: number, height: number): string {
  // Create minimal SVG for blank white page
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#ffffff"/>
  </svg>`

  // Convert to base64 (SVG as data URL works in jsPDF)
  const base64 = Buffer.from(svg).toString('base64')
  return base64
}

/**
 * Convert canvas to PDF with optional front and back pages
 *
 * @param frontCanvasJSON - Front page canvas JSON (REQUIRED)
 * @param backCanvasJSON - Back page canvas JSON (OPTIONAL - null = blank white page)
 * @param recipientData - Data for personalization { name, lastname, address, city, zip }
 * @param formatType - Print format (e.g., 'postcard_4x6')
 * @param fileName - Output filename
 *
 * BACKWARDS COMPATIBLE:
 * - Old signature: convertCanvasToPDF(canvasJSON, recipientData, formatType, fileName)
 *   → Treats first arg as frontCanvasJSON, second arg type-checks to recipientData
 * - New signature: convertCanvasToPDF(frontJSON, backJSON, recipientData, formatType, fileName)
 *   → Both front and back canvases rendered separately
 */
export async function convertCanvasToPDF(
  frontCanvasJSON: any,
  backCanvasJSON: any | null | { name?: string; lastname?: string },  // null OR recipientData (for backwards compat)
  recipientData: {
    // Legacy fields
    name?: string; lastname?: string; address?: string; city?: string; zip?: string;
    // Database schema fields
    first_name?: string; last_name?: string; email?: string; phone?: string;
    address_line1?: string; address_line2?: string; state?: string; zip_code?: string; country?: string;
  } | string,  // recipientData OR formatType (for backwards compat)
  formatType?: string,
  fileName: string = 'design',
  variableMappings?: any[]  // Variable mappings from campaign (templateVariable → recipientField)
): Promise<PDFResult> {
  // BACKWARDS COMPATIBILITY DETECTION
  // Old signature: (canvasJSON, recipientData, formatType, fileName)
  // New signature: (frontJSON, backJSON, recipientData, formatType, fileName)
  //
  // Detection: If 2nd arg has recipient properties (name/lastname/address),
  // it's old signature → shift arguments
  let actualFrontCanvas: any
  let actualBackCanvas: any | null
  let actualRecipientData: any
  let actualFormatType: string
  let actualFileName: string

  if (
    backCanvasJSON &&
    typeof backCanvasJSON === 'object' &&
    ('name' in backCanvasJSON || 'lastname' in backCanvasJSON || 'address' in backCanvasJSON) &&
    typeof recipientData === 'string'
  ) {
    // OLD SIGNATURE DETECTED: (frontCanvas, recipientData, formatType, fileName)
    console.log('📌 [PDF] Old signature detected (backwards compatibility mode)')
    actualFrontCanvas = frontCanvasJSON
    actualBackCanvas = null  // No back page in old signature
    actualRecipientData = backCanvasJSON  // 2nd arg is recipientData
    actualFormatType = recipientData as string  // 3rd arg is formatType
    actualFileName = formatType || fileName
  } else {
    // NEW SIGNATURE: (frontCanvas, backCanvas, recipientData, formatType, fileName)
    actualFrontCanvas = frontCanvasJSON
    actualBackCanvas = backCanvasJSON
    actualRecipientData = recipientData
    actualFormatType = formatType as string
    actualFileName = fileName
  }
  console.log(`🖼️ [PDF] Converting ${actualBackCanvas ? 'front + custom back' : 'front + blank back'} for ${actualRecipientData.name || 'recipient'}...`)

  const browser = await getBrowserInstance()

  try {
    const format = getFormat(actualFormatType)
    console.log(`📐 [PDF] Format: ${format.widthPixels}×${format.heightPixels}px`)

    // RENDER FRONT PAGE (required)
    console.log('🎨 [PDF] Rendering front page...')
    const frontImageBase64 = await renderCanvasToImage(
      actualFrontCanvas,
      actualRecipientData,
      format.widthPixels,
      format.heightPixels,
      browser,
      variableMappings  // Pass variable mappings for dynamic replacement
    )
    console.log('✅ [PDF] Front page rendered')

    // RENDER BACK PAGE (custom or blank)
    let backImageBase64: string
    if (actualBackCanvas) {
      console.log('🎨 [PDF] Rendering custom back page...')
      backImageBase64 = await renderCanvasToImage(
        actualBackCanvas,
        actualRecipientData,
        format.widthPixels,
        format.heightPixels,
        browser,
        variableMappings  // Pass variable mappings for back page too
      )
      console.log('✅ [PDF] Custom back page rendered')
    } else {
      console.log('📄 [PDF] Creating blank back page (PostGrid address block)...')
      backImageBase64 = createBlankPageImage(format.widthPixels, format.heightPixels)
      console.log('✅ [PDF] Blank back page created')
    }

    // CREATE PDF WITH BOTH PAGES
    console.log('📄 [PDF] Assembling 2-page PDF...')
    const orientation = format.widthInches > format.heightInches ? 'landscape' : 'portrait'

    // Canvas pixels already include bleed (e.g., 1875×1275px = 6.25"×4.25" at 300 DPI)
    const pdfWidth = format.widthPixels / format.dpi      // 1875/300 = 6.25"
    const pdfHeight = format.heightPixels / format.dpi    // 1275/300 = 4.25"

    const pdf = new jsPDF({
      orientation,
      unit: 'in',
      format: [pdfWidth, pdfHeight],
      compress: true,
    })

    console.log(`📏 [PDF] Dimensions: ${pdfWidth}" × ${pdfHeight}" (trim: ${format.widthInches}" × ${format.heightInches}", bleed: ${format.bleedInches}")`)

    // PAGE 1: Front design (personalized)
    pdf.addImage(`data:image/png;base64,${frontImageBase64}`, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')

    // PAGE 2: Back design (custom or blank)
    pdf.addPage([pdfWidth, pdfHeight], orientation)
    if (actualBackCanvas) {
      // Custom back page with design
      pdf.addImage(`data:image/png;base64,${backImageBase64}`, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
    } else {
      // Blank white back page (for PostGrid address overlay)
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F')
    }

    console.log(`✅ [PDF] 2-page PDF created (front + ${actualBackCanvas ? 'custom back' : 'blank back'})`)

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    console.log(`✅ [PDF] Complete: ${(pdfBuffer.length / 1024).toFixed(2)} KB (2 pages)`)

    return {
      buffer: pdfBuffer,
      fileName: `${actualFileName}.pdf`,
      fileSizeBytes: pdfBuffer.length,
      metadata: {
        format: actualFormatType,
        widthInches: pdfWidth,   // PDF dimensions include bleed
        heightInches: pdfHeight,
        widthPixels: format.widthPixels,
        heightPixels: format.heightPixels,
        dpi: format.dpi,
        pages: 2,  // Front + back (PostGrid requirement)
      },
    }
  } catch (error) {
    console.error('❌ [PDF] Failed:', error)
    throw error
  } finally {
    await releaseBrowserInstance()
  }
}

export async function cleanup(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
    browserLock = null
  }
}
