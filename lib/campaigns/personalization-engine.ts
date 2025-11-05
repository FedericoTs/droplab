/**
 * Batch Personalization Engine
 *
 * Processes CSV data and generates personalized canvas variants
 * Handles chunked processing for scalability (10-10,000 variants)
 */

import { replaceVariables } from '@/lib/design/variable-parser'

export interface PersonalizationJob {
  templateId: string
  templateName: string
  canvasJSON: any
  csvData: Record<string, string>[]
  totalVariants: number
  organizationId: string
}

export interface PersonalizedVariant {
  rowIndex: number
  data: Record<string, string>
  canvasJSON: any
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
}

export interface PersonalizationProgress {
  completed: number
  total: number
  percentage: number
  currentBatch: number
  totalBatches: number
}

/**
 * Chunk size for batch processing
 * Process 50 variants at a time to avoid memory issues
 */
const CHUNK_SIZE = 50

/**
 * Create personalized canvas variants from CSV data
 * Replaces all {variable} fields in text objects with CSV row data
 */
export function personalizeCanvas(
  canvasJSON: any,
  rowData: Record<string, string>
): any {
  // Deep clone canvas JSON to avoid mutations
  const personalizedCanvas = JSON.parse(JSON.stringify(canvasJSON))

  // Process all objects in the canvas
  if (personalizedCanvas.objects) {
    personalizedCanvas.objects = personalizedCanvas.objects.map((obj: any) => {
      // Only process text-based objects
      // CRITICAL: Fabric.js v6 uses capital letters: 'Textbox', 'IText', 'Text'
      const objType = (obj.type || '').toLowerCase()
      if (objType === 'textbox' || objType === 'itext' || objType === 'i-text' || objType === 'text') {
        const originalText = obj.text || ''

        // Replace variables with actual data from CSV row
        const personalizedText = replaceVariables(originalText, rowData)

        // CRITICAL FIX: Remove Fabric.js character-level styles when text is replaced
        // These styles (purple chip styling) have indices that no longer match after replacement
        // Clean slate ensures text renders correctly without style artifacts
        const cleanedObj = {
          ...obj,
          text: personalizedText,
        }

        // Remove all character-level styling properties
        delete cleanedObj.styles
        delete cleanedObj.styleHas

        return cleanedObj
      }

      return obj
    })
  }

  return personalizedCanvas
}

/**
 * Process CSV data in chunks for better performance
 * Returns array of personalized variants with progress tracking
 */
export async function* processBatchPersonalization(
  job: PersonalizationJob,
  onProgress?: (progress: PersonalizationProgress) => void
): AsyncGenerator<PersonalizedVariant[], void, unknown> {
  const { canvasJSON, csvData } = job
  const totalBatches = Math.ceil(csvData.length / CHUNK_SIZE)

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const startIdx = batchIndex * CHUNK_SIZE
    const endIdx = Math.min(startIdx + CHUNK_SIZE, csvData.length)
    const batchData = csvData.slice(startIdx, endIdx)

    // Process batch
    const variants: PersonalizedVariant[] = []

    for (let i = 0; i < batchData.length; i++) {
      const rowIndex = startIdx + i
      const rowData = batchData[i]

      try {
        const personalizedCanvas = personalizeCanvas(canvasJSON, rowData)

        variants.push({
          rowIndex,
          data: rowData,
          canvasJSON: personalizedCanvas,
          status: 'completed',
        })
      } catch (error) {
        console.error(`❌ Failed to personalize variant ${rowIndex}:`, error)

        variants.push({
          rowIndex,
          data: rowData,
          canvasJSON: null,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Report progress
    if (onProgress) {
      onProgress({
        completed: endIdx,
        total: csvData.length,
        percentage: Math.round((endIdx / csvData.length) * 100),
        currentBatch: batchIndex + 1,
        totalBatches,
      })
    }

    // Yield batch results
    yield variants

    // Small delay to avoid blocking UI
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}

/**
 * Process all variants at once (for smaller datasets)
 * Useful for < 100 variants where chunking is unnecessary
 */
export function processAllVariants(job: PersonalizationJob): PersonalizedVariant[] {
  const { canvasJSON, csvData } = job

  return csvData.map((rowData, rowIndex) => {
    try {
      const personalizedCanvas = personalizeCanvas(canvasJSON, rowData)

      return {
        rowIndex,
        data: rowData,
        canvasJSON: personalizedCanvas,
        status: 'completed',
      }
    } catch (error) {
      console.error(`❌ Failed to personalize variant ${rowIndex}:`, error)

      return {
        rowIndex,
        data: rowData,
        canvasJSON: null,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })
}

/**
 * Validate personalization readiness
 * Checks that template has variables and CSV has matching columns
 */
export function validatePersonalizationJob(
  canvasJSON: any,
  csvData: Record<string, string>[],
  requiredVariables: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check canvas JSON
  if (!canvasJSON || !canvasJSON.objects) {
    errors.push('Invalid canvas JSON - missing objects')
  }

  // Check CSV data
  if (!csvData || csvData.length === 0) {
    errors.push('CSV data is empty')
  }

  // Check required variables exist in CSV columns
  if (csvData.length > 0) {
    const csvColumns = Object.keys(csvData[0])
    const missingColumns = requiredVariables.filter(v => !csvColumns.includes(v))

    if (missingColumns.length > 0) {
      errors.push(`Missing CSV columns: ${missingColumns.join(', ')}`)
    }
  }

  // Check row limits
  if (csvData.length < 10) {
    errors.push(`Too few rows (${csvData.length}). Minimum is 10 rows.`)
  }

  if (csvData.length > 10000) {
    errors.push(`Too many rows (${csvData.length}). Maximum is 10,000 rows.`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
