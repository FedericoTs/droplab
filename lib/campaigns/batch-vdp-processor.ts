/**
 * Batch VDP Processor
 *
 * Orchestrates the entire campaign generation workflow:
 * 1. Load campaign, template, and recipient data
 * 2. For each recipient: personalize canvas, generate QR, export PDF
 * 3. Upload PDFs to Supabase Storage
 * 4. Save campaign_recipients records with tracking codes
 * 5. Update campaign status and progress
 *
 * Phase 3A: Client-Side MVP (100 recipients max)
 * Uses client-side PDF export for simplicity and speed
 */

import { nanoid } from 'nanoid'
import { personalizeCanvasWithRecipient } from './personalization-engine'
import { convertCanvasToPDF } from '@/lib/pdf/canvas-to-pdf-simple'
import {
  convertCanvasToPDFOptimized,
  initializePagePool,
  cleanupPagePool,
} from '@/lib/pdf/canvas-to-pdf-optimized'
import {
  generatePdfWithPdfme,
  batchGeneratePdfsWithPdfme,
  fabricTosPdfmeTemplate,
  type PdfmeRecipientData,
} from '@/lib/pdf/pdfme-generator'
// Ultra-Fast PDF Generation (50-100ms per PDF vs 3-5s with Puppeteer)
import { prerenderTemplate, type BaseTemplateResult } from '@/lib/pdf/template-prerenderer'
import { getCachedBasePDF, cacheBasePDF } from '@/lib/pdf/template-cache'
import { overlayWithDynamicPositions, type RecipientData as OverlayRecipientData } from '@/lib/pdf/variable-overlay'
import { type VariableMappings as ExtractorMappings } from '@/lib/pdf/position-extractor'
import { createServiceClient } from '@/lib/supabase/server'
import type {
  Campaign,
  CampaignRecipient,
  Recipient,
  DesignTemplate,
} from '@/lib/database/types'
import { getFrontSurface, getBackSurface } from '@/lib/database/types'
import {
  getCampaignById,
  updateCampaignStatus,
  createCampaignRecipient,
  createCampaignRecipientsBulk,
  createLandingPage,
} from '@/lib/database/campaign-supabase-queries'

// ==================== IMAGE PRE-CACHING (Phase B2) ====================

/**
 * OPTIMIZATION: Pre-cache all images in a canvas JSON
 * Downloads Supabase images once and converts to base64 data URLs
 * This eliminates repeated network requests per recipient
 */
interface ImageCache {
  [url: string]: string; // Original URL -> Base64 data URL
}

/**
 * Download a single image from Supabase Storage and convert to base64
 */
async function downloadImageAsDataURL(url: string): Promise<string> {
  try {
    // Handle Supabase Storage URLs
    const match = url.match(/\/storage\/v1\/object\/(?:sign|public)\/([^/]+)\/(.+?)(?:\?|$)/)
    if (!match) {
      // Not a Supabase URL, try direct fetch
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const buffer = Buffer.from(await response.arrayBuffer())
      const contentType = response.headers.get('content-type') || 'image/png'
      return `data:${contentType};base64,${buffer.toString('base64')}`
    }

    const [, bucket, path] = match
    const supabase = createServiceClient()
    const { data, error } = await supabase.storage.from(bucket).download(path)

    if (error) throw new Error(`Storage error: ${error.message}`)
    if (!data) throw new Error('No data returned')

    const buffer = Buffer.from(await data.arrayBuffer())
    return `data:image/png;base64,${buffer.toString('base64')}`
  } catch (err) {
    console.warn(`⚠️ [ImageCache] Failed to cache image ${url}:`, err)
    return url // Return original URL as fallback
  }
}

/**
 * Extract all image URLs from a canvas JSON object
 */
function extractImageUrls(canvasJSON: any): string[] {
  const urls: string[] = []
  const parsed = typeof canvasJSON === 'string' ? JSON.parse(canvasJSON) : canvasJSON

  if (!parsed?.objects) return urls

  for (const obj of parsed.objects) {
    if (obj.type === 'Image' && obj.src) {
      // Only cache external URLs, skip already-cached data URLs
      if (!obj.src.startsWith('data:')) {
        urls.push(obj.src)
      }
    }
    // Handle background images
    if (obj.backgroundImage?.src && !obj.backgroundImage.src.startsWith('data:')) {
      urls.push(obj.backgroundImage.src)
    }
  }

  // Also check canvas-level background
  if (parsed.backgroundImage?.src && !parsed.backgroundImage.src.startsWith('data:')) {
    urls.push(parsed.backgroundImage.src)
  }

  return [...new Set(urls)] // Remove duplicates
}

/**
 * Pre-cache all images from multiple canvas JSONs
 * Returns a cache map of original URL -> base64 data URL
 */
async function preCacheImages(canvasJSONs: any[]): Promise<ImageCache> {
  const cache: ImageCache = {}
  const allUrls: string[] = []

  // Collect all unique image URLs from all canvases
  for (const canvasJSON of canvasJSONs) {
    if (canvasJSON) {
      allUrls.push(...extractImageUrls(canvasJSON))
    }
  }

  const uniqueUrls = [...new Set(allUrls)]

  if (uniqueUrls.length === 0) {
    console.log('📷 [ImageCache] No images to pre-cache')
    return cache
  }

  console.log(`📷 [ImageCache] Pre-caching ${uniqueUrls.length} images...`)
  const startTime = Date.now()

  // Download all images in parallel (with concurrency limit)
  const CONCURRENT_DOWNLOADS = 5
  for (let i = 0; i < uniqueUrls.length; i += CONCURRENT_DOWNLOADS) {
    const batch = uniqueUrls.slice(i, i + CONCURRENT_DOWNLOADS)
    const results = await Promise.all(
      batch.map(async (url) => {
        const dataUrl = await downloadImageAsDataURL(url)
        return { url, dataUrl }
      })
    )
    for (const { url, dataUrl } of results) {
      cache[url] = dataUrl
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`✅ [ImageCache] Pre-cached ${uniqueUrls.length} images in ${duration}s`)

  return cache
}

/**
 * Apply image cache to a canvas JSON, replacing URLs with data URLs
 */
function applyImageCache(canvasJSON: any, cache: ImageCache): any {
  const parsed = typeof canvasJSON === 'string' ? JSON.parse(canvasJSON) : { ...canvasJSON }

  if (!parsed?.objects) return parsed

  // Deep clone to avoid mutating original
  const cloned = JSON.parse(JSON.stringify(parsed))

  for (const obj of cloned.objects) {
    if (obj.type === 'Image' && obj.src && cache[obj.src]) {
      obj.src = cache[obj.src]
    }
    if (obj.backgroundImage?.src && cache[obj.backgroundImage.src]) {
      obj.backgroundImage.src = cache[obj.backgroundImage.src]
    }
  }

  // Also apply to canvas-level background
  if (cloned.backgroundImage?.src && cache[cloned.backgroundImage.src]) {
    cloned.backgroundImage.src = cache[cloned.backgroundImage.src]
  }

  return cloned
}

// ==================== TYPES ====================

export interface VDPProgress {
  current: number
  total: number
  percentage: number
  currentRecipient: string | null
  status: 'initializing' | 'processing' | 'completed' | 'failed'
  errors: Array<{
    recipientId: string
    recipientName: string
    error: string
  }>
}

export interface VDPResult {
  success: boolean
  campaignId: string
  totalRecipients: number
  successCount: number
  failureCount: number
  errors: VDPProgress['errors']
  duration: number
  // Chunking support
  isComplete: boolean
  processedInChunk: number
  remainingRecipients: number
}

// Maximum recipients to process per API call (to stay under 60s timeout)
// Each PDF takes ~10-15s on Vercel, so 2 PDFs = ~30s (safe margin)
// With Ultra-Fast mode: 50-100ms per PDF, so 50 PDFs = ~5s (can increase CHUNK_SIZE)
const CHUNK_SIZE = 2

// ==================== FEATURE FLAGS ====================

/**
 * ULTRA-FAST PDF GENERATION MODE
 *
 * When enabled:
 * - Template is pre-rendered ONCE to a base PDF (10-15s, cached)
 * - Variable data is overlaid using pdf-lib (50-100ms per recipient)
 * - 30-50x faster than Puppeteer rendering per recipient
 *
 * Requirements:
 * - Template must have variable_mappings defined
 * - Supabase Storage bucket 'base-pdfs' must exist
 * - Database migration 035_template_pdf_cache must be applied
 *
 * Set to false to use legacy Puppeteer rendering for all PDFs
 */
const USE_ULTRA_FAST_PDF = process.env.ULTRA_FAST_PDF !== 'false' // Default: enabled

// ==================== HELPERS ====================

/**
 * Load all recipients for a recipient list
 */
async function getRecipientsByListId(recipientListId: string): Promise<Recipient[]> {
  const supabase = createServiceClient()

  const { data: recipients, error } = await supabase
    .from('recipients')
    .select('*')
    .eq('recipient_list_id', recipientListId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ [getRecipientsByListId] Error:', error)
    throw new Error(`Failed to fetch recipients: ${error.message}`)
  }

  return recipients || []
}

/**
 * Load design template by ID
 */
async function getTemplateById(
  templateId: string,
  organizationId: string
): Promise<DesignTemplate | null> {
  const supabase = createServiceClient()

  const { data: template, error } = await supabase
    .from('design_templates')
    .select('*')
    .eq('id', templateId)
    .eq('organization_id', organizationId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('❌ [getTemplateById] Error:', error)
    throw new Error(`Failed to fetch template: ${error.message}`)
  }

  return template
}

/**
 * Upload PDF blob to Supabase Storage
 */
async function uploadPersonalizedPDF(
  campaignId: string,
  recipientId: string,
  pdfData: Blob | Buffer
): Promise<string> {
  const supabase = createServiceClient()

  const fileName = `${campaignId}/${recipientId}.pdf`

  // Upload to Supabase Storage (accepts both Blob and Buffer)
  const { data, error } = await supabase.storage
    .from('personalized-pdfs')
    .upload(fileName, pdfData, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: true, // Overwrite if exists
    })

  if (error) {
    console.error('❌ [uploadPersonalizedPDF] Error:', error)
    throw new Error(`Failed to upload PDF: ${error.message}`)
  }

  // Generate signed URL (7-day expiration)
  const { data: signedUrlData } = await supabase.storage
    .from('personalized-pdfs')
    .createSignedUrl(fileName, 604800) // 7 days

  if (!signedUrlData?.signedUrl) {
    throw new Error('Failed to generate signed URL for PDF')
  }

  console.log('✅ [uploadPersonalizedPDF] PDF uploaded:', fileName)
  return signedUrlData.signedUrl
}

/**
 * OPTIMIZATION: Upload multiple PDFs in parallel batches
 * Uploads in batches of PARALLEL_UPLOAD_BATCH_SIZE to avoid overwhelming the network
 */
const PARALLEL_UPLOAD_BATCH_SIZE = 10; // Upload 10 PDFs at a time

interface PendingUpload {
  campaignId: string;
  recipientId: string;
  buffer: Buffer;
  index: number;
}

async function uploadPDFsBatch(
  pendingUploads: PendingUpload[],
  onProgress?: (completed: number, total: number) => void
): Promise<Map<number, string>> {
  const results = new Map<number, string>();
  let completed = 0;

  console.log(`📤 [uploadPDFsBatch] Starting parallel upload of ${pendingUploads.length} PDFs in batches of ${PARALLEL_UPLOAD_BATCH_SIZE}...`);
  const uploadStartTime = Date.now();

  // Process in batches
  for (let i = 0; i < pendingUploads.length; i += PARALLEL_UPLOAD_BATCH_SIZE) {
    const batch = pendingUploads.slice(i, Math.min(i + PARALLEL_UPLOAD_BATCH_SIZE, pendingUploads.length));

    const batchPromises = batch.map(async (upload) => {
      try {
        const pdfUrl = await uploadPersonalizedPDF(upload.campaignId, upload.recipientId, upload.buffer);
        results.set(upload.index, pdfUrl);
        completed++;
        onProgress?.(completed, pendingUploads.length);
        return { index: upload.index, success: true, url: pdfUrl };
      } catch (error) {
        console.error(`❌ [uploadPDFsBatch] Failed to upload PDF for recipient ${upload.recipientId}:`, error);
        results.set(upload.index, ''); // Empty string indicates failure
        completed++;
        onProgress?.(completed, pendingUploads.length);
        return { index: upload.index, success: false, url: '' };
      }
    });

    // Wait for this batch to complete before starting next batch
    await Promise.all(batchPromises);
  }

  const uploadDuration = ((Date.now() - uploadStartTime) / 1000).toFixed(1);
  console.log(`✅ [uploadPDFsBatch] Parallel upload complete: ${results.size} PDFs in ${uploadDuration}s`);
  console.log(`⚡ [uploadPDFsBatch] Average: ${(results.size / parseFloat(uploadDuration)).toFixed(1)} uploads/sec`);

  return results;
}

// ==================== MAIN PROCESSOR ====================

/**
 * Process entire campaign batch
 * Generates personalized designs for all recipients
 *
 * @param campaignId - Campaign UUID
 * @param organizationId - Organization UUID (for auth verification)
 * @param onProgress - Optional callback for real-time progress updates
 * @returns VDP result summary
 */
export async function processCampaignBatch(
  campaignId: string,
  organizationId: string,
  onProgress?: (progress: VDPProgress) => void
): Promise<VDPResult> {
  const startTime = Date.now()

  const progress: VDPProgress = {
    current: 0,
    total: 0,
    percentage: 0,
    currentRecipient: null,
    status: 'initializing',
    errors: [],
  }

  try {
    console.log('🚀 [processCampaignBatch] Starting batch VDP for campaign:', campaignId)

    // ==================== STEP 1: Load Campaign Data ====================
    onProgress?.({ ...progress, status: 'initializing' })

    const campaign = await getCampaignById(campaignId, organizationId)
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`)
    }

    if (!campaign.recipient_list_id) {
      throw new Error('Campaign has no recipient list')
    }

    if (!campaign.template_id) {
      throw new Error('Campaign has no template')
    }

    console.log('📋 [processCampaignBatch] Campaign loaded:', campaign.name)

    // Update campaign status to 'sending'
    await updateCampaignStatus(campaignId, organizationId, 'sending')

    // ==================== STEP 2: Load Template ====================
    const template = await getTemplateById(campaign.template_id, organizationId)
    if (!template) {
      throw new Error(`Template not found: ${campaign.template_id}`)
    }

    console.log('🎨 [processCampaignBatch] Template loaded:', template.name)

    // 🔍 DEBUG: Log template structure
    console.log('🔍 [processCampaignBatch] Template structure:', {
      id: template.id,
      hasSurfaces: !!template.surfaces,
      surfaceCount: template.surfaces?.length || 0,
      surfaceSides: template.surfaces?.map(s => s.side) || [],
      hasLegacyCanvasJSON: !!template.canvas_json,
    })

    // Load front and back surfaces from template
    const frontSurface = getFrontSurface(template)
    const backSurface = getBackSurface(template)

    console.log('🔍 [processCampaignBatch] Surface extraction:', {
      hasFront: !!frontSurface,
      hasBack: !!backSurface,
      frontObjects: frontSurface?.canvas_json?.objects?.length || 0,
      backObjects: backSurface?.canvas_json?.objects?.length || 0,
      frontMappings: Object.keys(frontSurface?.variable_mappings || {}).length,
      backMappings: Object.keys(backSurface?.variable_mappings || {}).length,
    })

    if (!frontSurface) {
      throw new Error('Template has no front surface')
    }

    const frontCanvasJSON = frontSurface.canvas_json
    const backCanvasJSON = backSurface?.canvas_json || null

    // CRITICAL: User-defined mappings from Step 3 MUST take priority!
    // Campaign snapshot contains the manual {variable} → [field] associations
    const variableMappings = campaign.variable_mappings_snapshot
                          || frontSurface.variable_mappings
                          || template.variable_mappings

    // 🔍 DEBUG: Log actual canvas JSON structure
    console.log('🔍 [processCampaignBatch] Front canvas JSON structure:', {
      hasObjects: !!frontCanvasJSON?.objects,
      objectCount: frontCanvasJSON?.objects?.length || 0,
      objectTypes: frontCanvasJSON?.objects?.map((o: any) => o.type) || [],
      firstObject: frontCanvasJSON?.objects?.[0] ? {
        type: frontCanvasJSON.objects[0].type,
        hasText: 'text' in frontCanvasJSON.objects[0],
        text: frontCanvasJSON.objects[0].text || 'NO TEXT PROPERTY',
      } : 'NO OBJECTS',
    })

    // Determine which source was actually used
    let mappingSource = 'none';
    if (campaign.variable_mappings_snapshot) {
      mappingSource = 'campaign_snapshot (user-defined)';
    } else if (frontSurface.variable_mappings) {
      mappingSource = 'front_surface (template metadata)';
    } else if (template.variable_mappings) {
      mappingSource = 'template (legacy)';
    }

    console.log('🔍 [processCampaignBatch] Variable mappings source:', {
      source: mappingSource,
      fromCampaign: !!campaign.variable_mappings_snapshot,
      fromFrontSurface: !!frontSurface.variable_mappings,
      fromTemplate: !!template.variable_mappings,
      mappingCount: Array.isArray(variableMappings) ? variableMappings.length : Object.keys(variableMappings || {}).length,
      mappings: variableMappings,
    })

    if (backCanvasJSON) {
      console.log('📄 [processCampaignBatch] Template has custom back page ✅')
    } else {
      console.log('📄 [processCampaignBatch] Template uses blank back page (PostGrid address block)')
    }

    // ==================== STEP 2.5: Pre-cache Template Images (Phase B2) ====================
    // OPTIMIZATION: Download all template images ONCE and convert to base64
    // This eliminates redundant network requests per recipient (saves ~100-500ms each)
    console.log('📷 [processCampaignBatch] Phase B2: Pre-caching template images...')
    const imageCacheStartTime = Date.now()

    const imageCache = await preCacheImages([frontCanvasJSON, backCanvasJSON])

    // Apply pre-cached images to canvas JSONs
    const preCachedFrontCanvasJSON = Object.keys(imageCache).length > 0
      ? applyImageCache(frontCanvasJSON, imageCache)
      : frontCanvasJSON
    const preCachedBackCanvasJSON = backCanvasJSON && Object.keys(imageCache).length > 0
      ? applyImageCache(backCanvasJSON, imageCache)
      : backCanvasJSON

    const imageCacheDuration = ((Date.now() - imageCacheStartTime) / 1000).toFixed(1)
    console.log(`✅ [processCampaignBatch] Image pre-caching complete in ${imageCacheDuration}s`)

    // ==================== STEP 3: Load Recipients ====================
    const allRecipients = await getRecipientsByListId(campaign.recipient_list_id)
    if (allRecipients.length === 0) {
      throw new Error('No recipients found in list')
    }

    console.log(`👥 [processCampaignBatch] Loaded ${allRecipients.length} total recipients`)

    // ==================== STEP 3.1: Filter Already-Processed Recipients (Chunking) ====================
    // Check which recipients have already been processed
    const supabase = createServiceClient()
    const { data: existingRecipients, error: existingError } = await supabase
      .from('campaign_recipients')
      .select('recipient_id')
      .eq('campaign_id', campaignId)

    if (existingError) {
      console.warn('⚠️ [processCampaignBatch] Could not check existing recipients:', existingError)
    }

    const processedIds = new Set(existingRecipients?.map(r => r.recipient_id) || [])
    const pendingRecipients = allRecipients.filter(r => !processedIds.has(r.id))

    console.log(`📊 [processCampaignBatch] Progress: ${processedIds.size}/${allRecipients.length} already processed, ${pendingRecipients.length} pending`)

    // If all recipients are already processed, return completed
    if (pendingRecipients.length === 0) {
      console.log('✅ [processCampaignBatch] All recipients already processed!')

      await updateCampaignStatus(campaignId, organizationId, 'completed')

      return {
        success: true,
        campaignId,
        totalRecipients: allRecipients.length,
        successCount: processedIds.size,
        failureCount: 0,
        errors: [],
        duration: (Date.now() - startTime) / 1000,
        isComplete: true,
        processedInChunk: 0,
        remainingRecipients: 0,
      }
    }

    // ==================== STEP 3.2: Limit to CHUNK_SIZE Recipients ====================
    // Only process CHUNK_SIZE recipients per API call to stay under Vercel's 60s timeout
    const recipients = pendingRecipients.slice(0, CHUNK_SIZE)
    const remainingAfterChunk = pendingRecipients.length - recipients.length

    console.log(`⚡ [processCampaignBatch] Processing chunk: ${recipients.length} recipients (${remainingAfterChunk} remaining after this chunk)`)

    progress.total = allRecipients.length
    progress.current = processedIds.size // Start from already-processed count
    progress.status = 'processing'
    onProgress?.(progress)

    // ==================== STEP 3.5: Determine PDF Generation Mode ====================
    const isVercel = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME

    // Check if we can use Ultra-Fast PDF mode
    // Requirements: feature flag enabled AND variable mappings exist
    const hasVariableMappings = frontSurface?.variable_mappings &&
                                Object.keys(frontSurface.variable_mappings).length > 0
    const useUltraFastPDF = USE_ULTRA_FAST_PDF && hasVariableMappings

    // Legacy modes (only used if ultra-fast is disabled)
    const usePdfme = false // Disabled - @pdfme cannot render Fabric.js designs
    const useOptimizedPDF = !useUltraFastPDF && !isVercel && recipients.length >= 3

    // ==================== STEP 3.6: Ultra-Fast PDF - Pre-render Template (ONCE) ====================
    let basePdfData: {
      pdfBuffer: Buffer
      variablePositions: import('@/lib/pdf/position-extractor').ExtractedPositions
    } | null = null

    if (useUltraFastPDF) {
      console.log('⚡ [processCampaignBatch] Ultra-Fast PDF mode enabled!')
      console.log('   📋 Variable mappings found:', Object.keys(frontSurface.variable_mappings || {}).length)

      // Convert variable mappings to ExtractorMappings format
      const extractorMappings: ExtractorMappings = {}
      if (frontSurface.variable_mappings) {
        Object.entries(frontSurface.variable_mappings).forEach(([idx, mapping]: [string, any]) => {
          extractorMappings[idx] = {
            variableType: mapping.variableType || mapping.type,
            isReusable: mapping.isReusable ?? false,
          }
        })
      }

      // Step 1: Check cache for pre-rendered base PDF
      console.log('🔍 [processCampaignBatch] Checking template cache...')
      const cacheResult = await getCachedBasePDF(
        template.id,
        'front',
        frontCanvasJSON
      )

      if (cacheResult.hit && cacheResult.data) {
        console.log('✅ [processCampaignBatch] Cache HIT! Using pre-rendered base PDF')
        console.log(`   📊 Cache stats: ${cacheResult.data.hitCount} previous hits`)
        basePdfData = {
          pdfBuffer: cacheResult.data.pdfBuffer,
          variablePositions: cacheResult.data.variablePositions,
        }
      } else {
        // Step 2: Pre-render template (one-time operation)
        console.log('📭 [processCampaignBatch] Cache MISS - pre-rendering template...')
        console.log('   ⏱️ This takes 10-15s but only happens ONCE per template')

        const prerenderResult = await prerenderTemplate(
          preCachedFrontCanvasJSON, // Use pre-cached images
          template.format_type,
          extractorMappings
        )

        if (!prerenderResult.variablePositions) {
          console.warn('⚠️ [processCampaignBatch] Pre-rendering did not extract positions, falling back to legacy mode')
        } else {
          basePdfData = {
            pdfBuffer: prerenderResult.pdfBuffer,
            variablePositions: prerenderResult.variablePositions,
          }

          // Step 3: Cache for future use
          console.log('💾 [processCampaignBatch] Caching base PDF for future batches...')
          const cacheStoreResult = await cacheBasePDF(
            template.id,
            'front',
            frontCanvasJSON,
            prerenderResult.pdfBuffer,
            prerenderResult.variablePositions,
            template.format_type
          )

          if (cacheStoreResult.success) {
            console.log('✅ [processCampaignBatch] Base PDF cached successfully')
          } else {
            console.warn('⚠️ [processCampaignBatch] Failed to cache base PDF:', cacheStoreResult.error)
          }
        }
      }
    }

    // ==================== STEP 3.7: Initialize Page Pool (Legacy Mode) ====================
    // Only needed for legacy Puppeteer rendering
    if (!useUltraFastPDF || !basePdfData) {
      if (useOptimizedPDF) {
        console.log('🚀 [processCampaignBatch] Initializing optimized PDF page pool...')
        await initializePagePool(Math.min(4, recipients.length)) // Max 4 concurrent pages
      } else if (isVercel) {
        console.log('☁️ [processCampaignBatch] Running on Vercel - using simple PDF generator')
      } else {
        console.log('📄 [processCampaignBatch] Using standard PDF generator')
      }
    }

    // ==================== STEP 4: Process Each Recipient (PDF Generation) ====================
    const pdfModeDescription = basePdfData
      ? '⚡ ultra-fast overlay'
      : usePdfme
        ? '@pdfme'
        : useOptimizedPDF
          ? 'optimized Puppeteer'
          : 'standard Puppeteer'
    console.log(`🎨 [processCampaignBatch] Phase 1: Generating ${recipients.length} PDFs (${pdfModeDescription})...`)
    const pdfGenStartTime = Date.now()

    let successCount = 0
    let failureCount = 0

    // OPTIMIZATION: Collect recipients for bulk database insert (Phase 2.3)
    const recipientBulkData: Array<{
      campaignId: string;
      recipientId: string;
      personalizedCanvasJson: any;
      trackingCode: string;
      qrCodeUrl: string;
      personalizedPdfUrl: string;
      landingPageUrl: string;
    }> = [];

    // OPTIMIZATION: Collect PDF buffers for parallel upload (Phase B1)
    const pendingUploads: PendingUpload[] = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i]
      const recipientName = `${recipient.first_name} ${recipient.last_name}`

      progress.current = i + 1
      progress.currentRecipient = recipientName
      // Adjust percentage: PDF generation is 70% of work, upload is 30%
      progress.percentage = Math.round((progress.current / progress.total) * 70)
      onProgress?.(progress)

      console.log(`  [${i + 1}/${recipients.length}] Processing ${recipientName}...`)

      try {
        // Generate unique tracking code
        const trackingCode = nanoid(12)

        // Generate unique QR code URL for tracking
        const qrCodeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/lp/campaign/${campaignId}?r=${encodeURIComponent(recipient.id)}&t=${trackingCode}`

        // Prepare recipient data (match database schema exactly)
        const recipientData = {
          // Legacy field names (for backwards compatibility)
          name: recipient.first_name,
          lastname: recipient.last_name,
          address: recipient.address_line1 || '',
          city: recipient.city,
          zip: recipient.zip_code,

          // Database schema field names (for variable mappings)
          // Convert null to undefined for type compatibility
          first_name: recipient.first_name,
          last_name: recipient.last_name,
          email: recipient.email ?? undefined,
          phone: recipient.phone ?? undefined,
          address_line1: recipient.address_line1 || '',
          address_line2: recipient.address_line2 ?? undefined,
          state: recipient.state,
          zip_code: recipient.zip_code,
          country: recipient.country,
        }

        // ==================== PERSONALIZE CANVAS (QR CODES + VARIABLES) ====================
        // OPTIMIZATION: Use pre-cached canvas JSONs with embedded base64 images (Phase B2)
        let personalizedFrontCanvasJSON = preCachedFrontCanvasJSON
        if (frontSurface.variable_mappings && Object.keys(frontSurface.variable_mappings).length > 0) {
          personalizedFrontCanvasJSON = await personalizeCanvasWithRecipient(
            preCachedFrontCanvasJSON,
            frontSurface.variable_mappings,
            recipient,
            campaignId
          )
        }

        // Step 2: Personalize back canvas if it exists and has variable mappings
        let personalizedBackCanvasJSON = preCachedBackCanvasJSON
        if (backSurface && preCachedBackCanvasJSON && backSurface.variable_mappings && Object.keys(backSurface.variable_mappings).length > 0) {
          personalizedBackCanvasJSON = await personalizeCanvasWithRecipient(
            preCachedBackCanvasJSON,
            backSurface.variable_mappings,
            recipient,
            campaignId
          )
        }

        // ==================== GENERATE PDF WITH PERSONALIZED CANVASES ====================
        let personalizedPDFBuffer: Buffer

        // ULTRA-FAST PATH: Use pre-rendered base PDF + overlay (50-100ms per PDF)
        if (basePdfData) {
          try {
            // Convert recipient data to overlay format
            const overlayRecipientData: OverlayRecipientData = {
              name: recipient.first_name,
              firstName: recipient.first_name,
              first_name: recipient.first_name,
              lastName: recipient.last_name,
              last_name: recipient.last_name,
              lastname: recipient.last_name,
              address: recipient.address_line1 || '',
              address_line1: recipient.address_line1 || '',
              address_line2: recipient.address_line2 ?? undefined,
              city: recipient.city,
              state: recipient.state,
              zip: recipient.zip_code,
              zip_code: recipient.zip_code,
              phone: recipient.phone ?? undefined,
              email: recipient.email ?? undefined,
            }

            // Generate personalized PDF using ultra-fast overlay
            personalizedPDFBuffer = await overlayWithDynamicPositions(basePdfData.pdfBuffer, {
              positions: basePdfData.variablePositions,
              recipientData: overlayRecipientData,
              qrCodeUrl: qrCodeUrl,
              campaignId,
              recipientId: recipient.id,
            })

            console.log(`    ⚡ Ultra-fast overlay: ${recipientName} (${(personalizedPDFBuffer.length / 1024).toFixed(1)} KB)`)
          } catch (ultraFastError) {
            // Fall back to Puppeteer if ultra-fast fails
            console.warn(`    ⚠️ Ultra-fast overlay failed for ${recipientName}, falling back to Puppeteer:`, ultraFastError)
            const pdfResult = await convertCanvasToPDF(
              personalizedFrontCanvasJSON,
              personalizedBackCanvasJSON,
              recipientData,
              template.format_type,
              `${campaign.name}-${recipient.id}`,
              campaign.variable_mappings_snapshot
            )
            personalizedPDFBuffer = pdfResult.buffer
          }
        } else if (usePdfme) {
          // @pdfme path: 10-100ms per PDF
          try {
            // Convert Fabric.js canvas to @pdfme template format
            const pdfmeTemplateData = fabricTosPdfmeTemplate(
              personalizedFrontCanvasJSON,
              template.format_type
            )

            // Prepare recipient data for @pdfme (matches PdfmeRecipientData interface)
            const pdfmeRecipientData: PdfmeRecipientData = {
              name: recipient.first_name,
              firstName: recipient.first_name,
              first_name: recipient.first_name,
              lastName: recipient.last_name,
              last_name: recipient.last_name,
              lastname: recipient.last_name,
              address: recipient.address_line1 || '',
              address_line1: recipient.address_line1 || '',
              city: recipient.city,
              state: recipient.state,
              zip: recipient.zip_code,
              zip_code: recipient.zip_code,
              phone: recipient.phone || undefined,
              trackingCode,
              trackingUrl: qrCodeUrl,
            }

            // Convert variable mappings to @pdfme format
            const pdfmeVariableMappings = Array.isArray(campaign.variable_mappings_snapshot)
              ? campaign.variable_mappings_snapshot.map((m: any) => ({
                  templateVariable: m.templateVariable || m.variable,
                  recipientField: m.recipientField || m.field,
                }))
              : undefined

            const pdfBytes = await generatePdfWithPdfme({
              formatType: template.format_type,
              recipientData: pdfmeRecipientData,
              templateData: pdfmeTemplateData,
              variableMappings: pdfmeVariableMappings,
            })

            personalizedPDFBuffer = Buffer.from(pdfBytes)
            console.log(`    ⚡ @pdfme: ${recipientName} (${(pdfBytes.length / 1024).toFixed(1)} KB)`)
          } catch (pdfmeError) {
            // Fall back to Puppeteer if @pdfme fails (complex template)
            console.warn(`    ⚠️ @pdfme failed for ${recipientName}, falling back to Puppeteer:`, pdfmeError)
            const pdfResult = await convertCanvasToPDF(
              personalizedFrontCanvasJSON,
              personalizedBackCanvasJSON,
              recipientData,
              template.format_type,
              `${campaign.name}-${recipient.id}`,
              campaign.variable_mappings_snapshot
            )
            personalizedPDFBuffer = pdfResult.buffer
          }
        } else {
          // Standard Puppeteer path: 3-5s per PDF
          const pdfResult = useOptimizedPDF
            ? await convertCanvasToPDFOptimized(
                personalizedFrontCanvasJSON,
                personalizedBackCanvasJSON,
                recipientData,
                template.format_type,
                `${campaign.name}-${recipient.id}`,
                campaign.variable_mappings_snapshot
              )
            : await convertCanvasToPDF(
                personalizedFrontCanvasJSON,
                personalizedBackCanvasJSON,
                recipientData,
                template.format_type,
                `${campaign.name}-${recipient.id}`,
                campaign.variable_mappings_snapshot
              )
          personalizedPDFBuffer = pdfResult.buffer
        }

        // OPTIMIZATION: Collect PDF buffer for parallel upload later
        const landingPageUrl = `/lp/campaign/${campaignId}?r=${encodeURIComponent(recipient.id)}&t=${trackingCode}`;

        pendingUploads.push({
          campaignId,
          recipientId: recipient.id,
          buffer: personalizedPDFBuffer,
          index: i,
        });

        // Store data for bulk insert (will be updated with PDF URL after upload)
        recipientBulkData.push({
          campaignId,
          recipientId: recipient.id,
          personalizedCanvasJson: personalizedFrontCanvasJSON,
          trackingCode,
          qrCodeUrl: qrCodeUrl,
          personalizedPdfUrl: '', // Will be filled after parallel upload
          landingPageUrl,
        })

        // Create landing page if configured
        if (campaign.description) {
          try {
            const descriptionData = JSON.parse(campaign.description || '{}')
            if (descriptionData.landingPageConfig) {
              const config = descriptionData.landingPageConfig
              await createLandingPage({
                campaignId,
                trackingCode,
                templateType: config.template_type || 'default',
                pageConfig: config,
                recipientData: {
                  firstName: recipient.first_name,
                  lastName: recipient.last_name,
                  city: recipient.city,
                  state: recipient.state,
                  zip: recipient.zip_code,
                  email: recipient.email || undefined,
                  phone: recipient.phone || undefined,
                },
              })
            }
          } catch (parseError) {
            // Ignore JSON parse errors for description field
          }
        }

        successCount++
        console.log(`    ✅ PDF generated: ${recipientName}`)
      } catch (error) {
        failureCount++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        console.error(`    ❌ Failed: ${recipientName}`, errorMessage)

        progress.errors.push({
          recipientId: recipient.id,
          recipientName,
          error: errorMessage,
        })
      }
    }

    const pdfGenDuration = ((Date.now() - pdfGenStartTime) / 1000).toFixed(1)
    console.log(`✅ [processCampaignBatch] Phase 1 complete: ${successCount} PDFs generated in ${pdfGenDuration}s`)

    // ==================== STEP 4.25: Parallel PDF Upload ====================
    if (pendingUploads.length > 0) {
      console.log(`📤 [processCampaignBatch] Phase 2: Uploading ${pendingUploads.length} PDFs in parallel...`)

      const uploadResults = await uploadPDFsBatch(pendingUploads, (completed, total) => {
        // Update progress during upload phase (70-100%)
        progress.percentage = 70 + Math.round((completed / total) * 30)
        progress.currentRecipient = `Uploading ${completed}/${total}`
        onProgress?.(progress)
      });

      // Update recipientBulkData with PDF URLs
      for (const [index, pdfUrl] of uploadResults) {
        if (recipientBulkData[index]) {
          recipientBulkData[index].personalizedPdfUrl = pdfUrl;

          // If upload failed, mark as failure
          if (!pdfUrl) {
            failureCount++;
            successCount--;
            progress.errors.push({
              recipientId: recipientBulkData[index].recipientId,
              recipientName: `Recipient ${index + 1}`,
              error: 'PDF upload failed',
            });
          }
        }
      }
    }

    // ==================== STEP 4.5: Bulk Insert Campaign Recipients ====================
    // OPTIMIZATION: Single database call instead of N calls (up to 90% faster)
    if (recipientBulkData.length > 0) {
      console.log(`📦 [processCampaignBatch] Bulk inserting ${recipientBulkData.length} campaign recipients...`)
      try {
        await createCampaignRecipientsBulk(recipientBulkData);
        console.log(`✅ [processCampaignBatch] Bulk insert complete`)
      } catch (bulkError) {
        console.error('❌ [processCampaignBatch] Bulk insert failed, falling back to individual inserts:', bulkError)
        // Fallback: Insert individually (slower but more reliable)
        for (const data of recipientBulkData) {
          try {
            await createCampaignRecipient(data);
          } catch (individualError) {
            console.error(`❌ [processCampaignBatch] Individual insert failed for ${data.recipientId}:`, individualError)
          }
        }
      }
    }

    // ==================== STEP 5: Update Campaign Status ====================
    // Determine if this chunk completes the campaign
    const totalProcessedNow = processedIds.size + successCount
    const isChunkComplete = remainingAfterChunk === 0 // No more recipients after this chunk
    const allProcessed = totalProcessedNow >= allRecipients.length

    // Only mark as 'completed' if ALL recipients are processed
    // Keep as 'sending' if more chunks remain
    let finalStatus: 'sending' | 'completed' | 'failed'
    if (failureCount === recipients.length) {
      finalStatus = 'failed'
    } else if (isChunkComplete && allProcessed) {
      finalStatus = 'completed'
    } else {
      finalStatus = 'sending' // More chunks to process
    }

    await updateCampaignStatus(campaignId, organizationId, finalStatus)

    progress.status = isChunkComplete && allProcessed ? 'completed' : 'processing'
    progress.currentRecipient = null
    onProgress?.(progress)

    const duration = (Date.now() - startTime) / 1000

    // ==================== STEP 6: Cleanup Page Pool (Phase C1) ====================
    // OPTIMIZATION: Clean up browser page pool to free resources
    if (useOptimizedPDF) {
      console.log('🧹 [processCampaignBatch] Cleaning up page pool...')
      await cleanupPagePool()
    }

    console.log(`✅ [processCampaignBatch] Chunk complete: ${successCount}/${recipients.length} success (${totalProcessedNow}/${allRecipients.length} total, ${remainingAfterChunk} remaining) in ${duration}s`)

    return {
      success: failureCount < recipients.length,
      campaignId,
      totalRecipients: allRecipients.length,
      successCount: totalProcessedNow,
      failureCount,
      errors: progress.errors,
      duration,
      // Chunking info for client polling
      isComplete: isChunkComplete && allProcessed,
      processedInChunk: successCount,
      remainingRecipients: remainingAfterChunk,
    }
  } catch (error) {
    console.error('❌ [processCampaignBatch] Fatal error:', error)

    progress.status = 'failed'
    onProgress?.(progress)

    // Cleanup page pool on error (Phase C1)
    try {
      await cleanupPagePool()
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    // Update campaign to failed status
    await updateCampaignStatus(campaignId, organizationId, 'failed')

    const duration = (Date.now() - startTime) / 1000

    return {
      success: false,
      campaignId,
      totalRecipients: progress.total,
      successCount: 0,
      failureCount: progress.total,
      errors: [
        {
          recipientId: 'system',
          recipientName: 'System Error',
          error: error instanceof Error ? error.message : 'Unknown fatal error',
        },
      ],
      duration,
      // Chunking info for error case
      isComplete: false,
      processedInChunk: 0,
      remainingRecipients: progress.total,
    }
  }
}
