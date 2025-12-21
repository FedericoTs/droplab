/**
 * Position Extractor for Ultra-Fast PDF Generation
 *
 * Extracts variable positions from Fabric.js canvas JSON and converts
 * coordinates to PDF points for pdf-lib overlay operations.
 *
 * Coordinate Systems:
 * - Fabric.js: pixels from top-left corner @ 300 DPI
 * - PDF (pdf-lib): points from bottom-left corner (72 points per inch)
 *
 * Conversion Formula:
 *   pixelsToPoints = (px / DPI) * 72
 *   yPDF = pageHeight - yFabric - objectHeight (flip Y axis)
 */

import { getFormat, type PrintFormat } from '@/lib/design/print-formats'

/**
 * Represents a single variable field position in PDF coordinates
 */
export interface VariablePosition {
  /** Index of the object in Fabric.js canvas objects array */
  objectIndex: number

  /** Type of variable: recipientName, recipientAddress, qrCode, etc. */
  variableType: string

  /** Whether this element is reusable (logo) or unique per recipient (QR) */
  isReusable: boolean

  /** X position in PDF points from left edge */
  x: number

  /** Y position in PDF points from bottom edge */
  y: number

  /** Width in PDF points */
  width: number

  /** Height in PDF points */
  height: number

  /** Font size in PDF points (for text elements) */
  fontSize?: number

  /** Font family name (for Google Fonts embedding) */
  fontFamily?: string

  /** Font color as hex string (e.g., '#000000') */
  fontColor?: string

  /** Font weight (normal, bold) */
  fontWeight?: string

  /** Text alignment (left, center, right) */
  textAlign?: 'left' | 'center' | 'right'

  /** Original text content (for reference) */
  originalText?: string

  /** Scale factors applied to the object */
  scaleX?: number
  scaleY?: number
}

/**
 * Collection of all extracted variable positions for a template
 */
export interface ExtractedPositions {
  /** Format type (e.g., 'postcard_4x6') */
  formatType: string

  /** Page width in PDF points */
  pageWidth: number

  /** Page height in PDF points */
  pageHeight: number

  /** DPI used in the original canvas */
  dpi: number

  /** Canvas width in pixels */
  canvasWidthPixels: number

  /** Canvas height in pixels */
  canvasHeightPixels: number

  /** All variable positions extracted from the template */
  variables: VariablePosition[]

  /** Timestamp when positions were extracted */
  extractedAt: string
}

/**
 * Variable mappings stored in the database
 * Maps object index to variable metadata
 */
export interface VariableMappings {
  [index: string]: {
    variableType?: string
    isReusable?: boolean
  }
}

/**
 * Convert pixels to PDF points
 * PDF uses 72 points per inch
 *
 * @param px - Value in pixels
 * @param dpi - Dots per inch (usually 300)
 * @returns Value in PDF points
 */
export function pixelsToPoints(px: number, dpi: number = 300): number {
  return (px / dpi) * 72
}

/**
 * Convert PDF points to pixels
 *
 * @param pt - Value in points
 * @param dpi - Dots per inch (usually 300)
 * @returns Value in pixels
 */
export function pointsToPixels(pt: number, dpi: number = 300): number {
  return (pt / 72) * dpi
}

/**
 * Convert Fabric.js Y coordinate to PDF Y coordinate
 * Fabric.js uses top-left origin, PDF uses bottom-left origin
 *
 * @param fabricTop - Top position in Fabric.js (pixels from top)
 * @param objectHeight - Height of the object (pixels)
 * @param canvasHeight - Total canvas height (pixels)
 * @param dpi - Dots per inch
 * @returns Y position in PDF points from bottom
 */
export function fabricYToPdfY(
  fabricTop: number,
  objectHeight: number,
  canvasHeight: number,
  dpi: number = 300
): number {
  // Convert to bottom-left origin:
  // yPDF = canvasHeight - fabricTop - objectHeight
  const yInPixels = canvasHeight - fabricTop - objectHeight
  return pixelsToPoints(yInPixels, dpi)
}

/**
 * Check if a Fabric.js object is a text element
 */
export function isTextObject(obj: any): boolean {
  return ['textbox', 'i-text', 'text'].includes(obj.type?.toLowerCase())
}

/**
 * Check if a Fabric.js object is an image element
 */
export function isImageObject(obj: any): boolean {
  return obj.type?.toLowerCase() === 'image'
}

/**
 * Extract font information from a Fabric.js text object
 */
function extractFontInfo(obj: any): {
  fontSize?: number
  fontFamily?: string
  fontColor?: string
  fontWeight?: string
  textAlign?: 'left' | 'center' | 'right'
} {
  return {
    fontSize: obj.fontSize ? pixelsToPoints(obj.fontSize, 300) : undefined,
    fontFamily: obj.fontFamily || 'Helvetica',
    fontColor: obj.fill || '#000000',
    fontWeight: obj.fontWeight || 'normal',
    textAlign: obj.textAlign || 'left',
  }
}

/**
 * Extract variable positions from Fabric.js canvas JSON
 *
 * @param canvasJSON - Fabric.js canvas state (parsed or string)
 * @param variableMappings - Variable type mappings by object index
 * @param formatType - Print format ID (e.g., 'postcard_4x6')
 * @returns Extracted positions in PDF coordinates
 */
export function extractVariablePositions(
  canvasJSON: any,
  variableMappings: VariableMappings,
  formatType: string
): ExtractedPositions {
  // Parse if string
  const canvas = typeof canvasJSON === 'string' ? JSON.parse(canvasJSON) : canvasJSON

  // Get format specifications
  const format = getFormat(formatType)
  const dpi = format.dpi

  // Get canvas dimensions from format
  const canvasWidth = format.widthPixels
  const canvasHeight = format.heightPixels

  // Convert page dimensions to points
  const pageWidth = pixelsToPoints(canvasWidth, dpi)
  const pageHeight = pixelsToPoints(canvasHeight, dpi)

  console.log(`📐 [Position Extractor] Format: ${formatType}`)
  console.log(`   Canvas: ${canvasWidth}×${canvasHeight}px @ ${dpi} DPI`)
  console.log(`   PDF Page: ${pageWidth.toFixed(2)}×${pageHeight.toFixed(2)} points`)

  const variables: VariablePosition[] = []
  const objects = canvas.objects || []

  // Iterate through all canvas objects
  objects.forEach((obj: any, index: number) => {
    const mapping = variableMappings[index.toString()]

    // Only process objects that have variable mappings
    if (!mapping || !mapping.variableType) {
      return
    }

    // Get object dimensions accounting for scale
    const scaleX = obj.scaleX || 1
    const scaleY = obj.scaleY || 1
    const objWidth = (obj.width || 100) * scaleX
    const objHeight = (obj.height || 100) * scaleY

    // Calculate position in PDF coordinates
    const xPoints = pixelsToPoints(obj.left || 0, dpi)
    const yPoints = fabricYToPdfY(obj.top || 0, objHeight, canvasHeight, dpi)
    const widthPoints = pixelsToPoints(objWidth, dpi)
    const heightPoints = pixelsToPoints(objHeight, dpi)

    // Build variable position
    const position: VariablePosition = {
      objectIndex: index,
      variableType: mapping.variableType,
      isReusable: mapping.isReusable ?? false,
      x: xPoints,
      y: yPoints,
      width: widthPoints,
      height: heightPoints,
      scaleX,
      scaleY,
    }

    // Add text-specific properties
    if (isTextObject(obj)) {
      const fontInfo = extractFontInfo(obj)
      position.fontSize = fontInfo.fontSize
      position.fontFamily = fontInfo.fontFamily
      position.fontColor = fontInfo.fontColor
      position.fontWeight = fontInfo.fontWeight
      position.textAlign = fontInfo.textAlign
      position.originalText = obj.text
    }

    console.log(
      `   📍 Variable "${mapping.variableType}" at (${xPoints.toFixed(1)}, ${yPoints.toFixed(1)}) ` +
        `size ${widthPoints.toFixed(1)}×${heightPoints.toFixed(1)} points`
    )

    variables.push(position)
  })

  console.log(`✅ [Position Extractor] Extracted ${variables.length} variable positions`)

  return {
    formatType,
    pageWidth,
    pageHeight,
    dpi,
    canvasWidthPixels: canvasWidth,
    canvasHeightPixels: canvasHeight,
    variables,
    extractedAt: new Date().toISOString(),
  }
}

/**
 * Get variable positions for specific variable types
 *
 * @param positions - Extracted positions
 * @param types - Variable types to filter for
 * @returns Filtered positions
 */
export function getPositionsForTypes(
  positions: ExtractedPositions,
  types: string[]
): VariablePosition[] {
  return positions.variables.filter((v) => types.includes(v.variableType))
}

/**
 * Get the position for a specific variable type
 *
 * @param positions - Extracted positions
 * @param type - Variable type to find
 * @returns Position or undefined if not found
 */
export function getPositionForType(
  positions: ExtractedPositions,
  type: string
): VariablePosition | undefined {
  return positions.variables.find((v) => v.variableType === type)
}

/**
 * Validate that all required variable types are present
 *
 * @param positions - Extracted positions
 * @param requiredTypes - Variable types that must be present
 * @returns Array of missing types (empty if all present)
 */
export function validateRequiredVariables(
  positions: ExtractedPositions,
  requiredTypes: string[]
): string[] {
  const presentTypes = new Set(positions.variables.map((v) => v.variableType))
  return requiredTypes.filter((t) => !presentTypes.has(t))
}

/**
 * Create a stripped version of canvas JSON for base PDF rendering
 * Removes/clears variable text content but preserves positions
 *
 * @param canvasJSON - Original Fabric.js canvas state
 * @param variableMappings - Variable type mappings
 * @returns Canvas JSON with variable content cleared
 */
export function stripVariableContent(
  canvasJSON: any,
  variableMappings: VariableMappings
): any {
  const canvas = typeof canvasJSON === 'string' ? JSON.parse(canvasJSON) : canvasJSON
  const stripped = JSON.parse(JSON.stringify(canvas)) // Deep clone

  const objects = stripped.objects || []

  objects.forEach((obj: any, index: number) => {
    const mapping = variableMappings[index.toString()]

    if (mapping && mapping.variableType) {
      // Clear text content for text variables
      if (isTextObject(obj)) {
        // Replace with placeholder that matches approximate size
        obj.text = ''
        obj.visible = false // Hide during base PDF render
      }

      // Hide QR code placeholders
      if (mapping.variableType === 'qrCode' && isImageObject(obj)) {
        obj.visible = false
      }
    }
  })

  console.log(
    `🧹 [Position Extractor] Stripped ${Object.keys(variableMappings).length} variable fields`
  )

  return stripped
}

/**
 * Restore stripped canvas to original state (for preview)
 *
 * @param strippedCanvas - Canvas with cleared variables
 * @param originalCanvas - Original canvas with content
 * @returns Restored canvas JSON
 */
export function restoreVariableContent(strippedCanvas: any, originalCanvas: any): any {
  const original = typeof originalCanvas === 'string' ? JSON.parse(originalCanvas) : originalCanvas
  const stripped = typeof strippedCanvas === 'string' ? JSON.parse(strippedCanvas) : strippedCanvas

  const restored = JSON.parse(JSON.stringify(stripped))
  const originalObjects = original.objects || []

  ;(restored.objects || []).forEach((obj: any, index: number) => {
    if (originalObjects[index]) {
      // Restore text content
      if (isTextObject(obj)) {
        obj.text = originalObjects[index].text
        obj.visible = true
      }

      // Restore image visibility
      if (isImageObject(obj)) {
        obj.visible = originalObjects[index].visible ?? true
      }
    }
  })

  return restored
}

/**
 * Generate a hash of canvas JSON for cache versioning
 * Uses a simple string hash for speed
 *
 * @param canvasJSON - Canvas JSON to hash
 * @returns Hash string
 */
export function hashCanvasJSON(canvasJSON: any): string {
  const str = typeof canvasJSON === 'string' ? canvasJSON : JSON.stringify(canvasJSON)

  // Simple FNV-1a hash
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }

  // Convert to hex string
  return (hash >>> 0).toString(16).padStart(8, '0')
}
