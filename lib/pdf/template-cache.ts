/**
 * Template PDF Cache System
 *
 * Manages caching of pre-rendered base PDFs in Supabase Storage.
 * Part of the ultra-fast PDF generation system.
 *
 * Storage Structure:
 *   base-pdfs/{template_id}/front-{version_hash}.pdf
 *   base-pdfs/{template_id}/back-{version_hash}.pdf
 *
 * Cache Flow:
 *   1. Hash canvas_json to create version string
 *   2. Check database for existing cache entry
 *   3. If hit: Download from Storage, return with positions
 *   4. If miss: Pre-render, upload to Storage, save metadata
 */

import { createServiceClient } from '@/lib/supabase/server'
import { hashCanvasJSON, type ExtractedPositions } from './position-extractor'

const STORAGE_BUCKET = 'base-pdfs'

/**
 * Cached base PDF data
 */
export interface CachedBasePDF {
  id: string
  templateId: string
  surfaceSide: 'front' | 'back'
  versionHash: string
  storagePath: string
  pdfBuffer: Buffer
  variablePositions: ExtractedPositions
  hitCount: number
  createdAt: string
}

/**
 * Cache lookup result
 */
export interface CacheLookupResult {
  hit: boolean
  data?: CachedBasePDF
  error?: string
}

/**
 * Result of cache storage operation
 */
export interface CacheStoreResult {
  success: boolean
  cacheId?: string
  storagePath?: string
  error?: string
}

/**
 * Generate storage path for a cached PDF
 */
function generateStoragePath(
  templateId: string,
  surfaceSide: 'front' | 'back',
  versionHash: string
): string {
  return `${templateId}/${surfaceSide}-${versionHash}.pdf`
}

/**
 * Ensure the base-pdfs storage bucket exists
 */
async function ensureBucketExists(): Promise<void> {
  const supabase = createServiceClient()

  const { data: buckets } = await supabase.storage.listBuckets()

  if (!buckets?.find((b) => b.name === STORAGE_BUCKET)) {
    const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: false,
      fileSizeLimit: 10485760, // 10MB max
      allowedMimeTypes: ['application/pdf'],
    })

    if (error && !error.message.includes('already exists')) {
      console.error(`❌ [Template Cache] Failed to create bucket: ${error.message}`)
    } else {
      console.log(`✅ [Template Cache] Created storage bucket: ${STORAGE_BUCKET}`)
    }
  }
}

/**
 * Look up cached base PDF by template, surface, and canvas hash
 *
 * @param templateId - Template ID
 * @param surfaceSide - 'front' or 'back'
 * @param canvasJSON - Canvas JSON to hash for version check
 * @returns Cache lookup result with data if hit
 */
export async function getCachedBasePDF(
  templateId: string,
  surfaceSide: 'front' | 'back',
  canvasJSON: any
): Promise<CacheLookupResult> {
  const supabase = createServiceClient()
  const versionHash = hashCanvasJSON(canvasJSON)

  console.log(`🔍 [Template Cache] Looking up cache for template ${templateId} ${surfaceSide}`)
  console.log(`   Version hash: ${versionHash}`)

  try {
    // Query cache metadata
    const { data: cacheEntry, error: dbError } = await supabase
      .from('template_pdf_cache')
      .select('*')
      .eq('template_id', templateId)
      .eq('surface_side', surfaceSide)
      .eq('version_hash', versionHash)
      .single()

    if (dbError || !cacheEntry) {
      console.log(`📭 [Template Cache] Cache MISS - no entry found`)
      return { hit: false }
    }

    console.log(`📬 [Template Cache] Cache metadata found, downloading PDF...`)

    // Download PDF from storage
    const { data: pdfData, error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(cacheEntry.storage_path)

    if (storageError || !pdfData) {
      console.error(`❌ [Template Cache] Storage download failed: ${storageError?.message}`)
      // Cache entry exists but file is missing - delete stale entry
      await supabase.from('template_pdf_cache').delete().eq('id', cacheEntry.id)
      return { hit: false, error: 'Cache file not found' }
    }

    // Convert blob to buffer
    const arrayBuffer = await pdfData.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)

    // Increment hit count asynchronously
    supabase.rpc('increment_cache_hit', { p_cache_id: cacheEntry.id }).then(() => {
      console.log(`📈 [Template Cache] Hit count incremented`)
    })

    console.log(`✅ [Template Cache] Cache HIT - ${(pdfBuffer.length / 1024).toFixed(2)} KB`)
    console.log(`   Total hits: ${cacheEntry.hit_count + 1}`)

    return {
      hit: true,
      data: {
        id: cacheEntry.id,
        templateId: cacheEntry.template_id,
        surfaceSide: cacheEntry.surface_side,
        versionHash: cacheEntry.version_hash,
        storagePath: cacheEntry.storage_path,
        pdfBuffer,
        variablePositions: cacheEntry.variable_positions as ExtractedPositions,
        hitCount: cacheEntry.hit_count + 1,
        createdAt: cacheEntry.created_at,
      },
    }
  } catch (error) {
    console.error(`❌ [Template Cache] Lookup error:`, error)
    return {
      hit: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Store a pre-rendered base PDF in cache
 *
 * @param templateId - Template ID
 * @param surfaceSide - 'front' or 'back'
 * @param canvasJSON - Original canvas JSON (for version hashing)
 * @param pdfBuffer - Pre-rendered PDF buffer
 * @param variablePositions - Extracted variable positions
 * @param formatType - Print format type
 * @returns Store operation result
 */
export async function cacheBasePDF(
  templateId: string,
  surfaceSide: 'front' | 'back',
  canvasJSON: any,
  pdfBuffer: Buffer,
  variablePositions: ExtractedPositions,
  formatType: string
): Promise<CacheStoreResult> {
  const supabase = createServiceClient()
  const versionHash = hashCanvasJSON(canvasJSON)
  const storagePath = generateStoragePath(templateId, surfaceSide, versionHash)

  console.log(`💾 [Template Cache] Storing cache for template ${templateId} ${surfaceSide}`)
  console.log(`   Version hash: ${versionHash}`)
  console.log(`   Storage path: ${storagePath}`)
  console.log(`   File size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`)

  try {
    // Ensure bucket exists
    await ensureBucketExists()

    // Upload PDF to storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true, // Overwrite if exists
      })

    if (uploadError) {
      console.error(`❌ [Template Cache] Upload failed: ${uploadError.message}`)
      return { success: false, error: uploadError.message }
    }

    console.log(`✅ [Template Cache] PDF uploaded to storage`)

    // Save metadata to database
    const { data: cacheEntry, error: dbError } = await supabase
      .from('template_pdf_cache')
      .upsert(
        {
          template_id: templateId,
          surface_side: surfaceSide,
          version_hash: versionHash,
          storage_path: storagePath,
          variable_positions: variablePositions,
          file_size_bytes: pdfBuffer.length,
          format_type: formatType,
          page_width_points: variablePositions.pageWidth,
          page_height_points: variablePositions.pageHeight,
          dpi: variablePositions.dpi,
          hit_count: 0,
          last_accessed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'template_id,surface_side,version_hash',
        }
      )
      .select('id')
      .single()

    if (dbError) {
      console.error(`❌ [Template Cache] Database insert failed: ${dbError.message}`)
      // Rollback: delete uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
      return { success: false, error: dbError.message }
    }

    console.log(`✅ [Template Cache] Cache entry created: ${cacheEntry?.id}`)

    return {
      success: true,
      cacheId: cacheEntry?.id,
      storagePath,
    }
  } catch (error) {
    console.error(`❌ [Template Cache] Store error:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Invalidate cache for a template (when template is modified)
 *
 * @param templateId - Template ID to invalidate
 * @param surfaceSide - Optional specific surface to invalidate (or all if not specified)
 * @returns Number of cache entries deleted
 */
export async function invalidateCache(
  templateId: string,
  surfaceSide?: 'front' | 'back'
): Promise<number> {
  const supabase = createServiceClient()

  console.log(`🗑️ [Template Cache] Invalidating cache for template ${templateId}`)

  try {
    // Get all cache entries for this template
    let query = supabase
      .from('template_pdf_cache')
      .select('id, storage_path')
      .eq('template_id', templateId)

    if (surfaceSide) {
      query = query.eq('surface_side', surfaceSide)
    }

    const { data: entries, error: fetchError } = await query

    if (fetchError || !entries || entries.length === 0) {
      console.log(`📭 [Template Cache] No cache entries to invalidate`)
      return 0
    }

    // Delete files from storage
    const storagePaths = entries.map((e) => e.storage_path)
    const { error: deleteStorageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(storagePaths)

    if (deleteStorageError) {
      console.error(`⚠️ [Template Cache] Storage delete error: ${deleteStorageError.message}`)
    }

    // Delete database entries
    const cacheIds = entries.map((e) => e.id)
    const { error: deleteDbError } = await supabase
      .from('template_pdf_cache')
      .delete()
      .in('id', cacheIds)

    if (deleteDbError) {
      console.error(`❌ [Template Cache] Database delete error: ${deleteDbError.message}`)
    }

    console.log(`✅ [Template Cache] Invalidated ${entries.length} cache entries`)
    return entries.length
  } catch (error) {
    console.error(`❌ [Template Cache] Invalidation error:`, error)
    return 0
  }
}

/**
 * Get cache statistics for a template
 *
 * @param templateId - Template ID
 * @returns Cache statistics
 */
export async function getCacheStats(templateId: string): Promise<{
  totalEntries: number
  totalHits: number
  totalSizeBytes: number
  entries: Array<{
    surfaceSide: string
    versionHash: string
    hitCount: number
    sizeBytes: number
    createdAt: string
  }>
}> {
  const supabase = createServiceClient()

  const { data: entries, error } = await supabase
    .from('template_pdf_cache')
    .select('surface_side, version_hash, hit_count, file_size_bytes, created_at')
    .eq('template_id', templateId)
    .order('created_at', { ascending: false })

  if (error || !entries) {
    return { totalEntries: 0, totalHits: 0, totalSizeBytes: 0, entries: [] }
  }

  return {
    totalEntries: entries.length,
    totalHits: entries.reduce((sum, e) => sum + e.hit_count, 0),
    totalSizeBytes: entries.reduce((sum, e) => sum + e.file_size_bytes, 0),
    entries: entries.map((e) => ({
      surfaceSide: e.surface_side,
      versionHash: e.version_hash,
      hitCount: e.hit_count,
      sizeBytes: e.file_size_bytes,
      createdAt: e.created_at,
    })),
  }
}

/**
 * Cleanup old cache entries that haven't been accessed recently
 *
 * @param maxAgeDays - Maximum age in days (default 30)
 * @returns Number of entries cleaned up
 */
export async function cleanupStaleCache(maxAgeDays: number = 30): Promise<number> {
  const supabase = createServiceClient()

  console.log(`🧹 [Template Cache] Cleaning up cache entries older than ${maxAgeDays} days`)

  try {
    const { data, error } = await supabase.rpc('cleanup_stale_cache', {
      p_max_age_days: maxAgeDays,
    })

    if (error) {
      console.error(`❌ [Template Cache] Cleanup error: ${error.message}`)
      return 0
    }

    console.log(`✅ [Template Cache] Cleaned up ${data || 0} stale entries`)
    return data || 0
  } catch (error) {
    console.error(`❌ [Template Cache] Cleanup error:`, error)
    return 0
  }
}
