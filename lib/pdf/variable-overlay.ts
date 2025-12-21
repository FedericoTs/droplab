/**
 * Variable Overlay Engine (Phase 2 of Ultra-Fast VDP)
 *
 * KEY OPTIMIZATION: Overlay recipient data on base PDF (no re-rendering!)
 * Takes pre-rendered base PDF + recipient data → personalized PDF
 *
 * Performance: 50-100ms per recipient (vs 3-5 seconds with full Puppeteer render)
 *
 * Process:
 * 1. Load base PDF (cached, pre-rendered)
 * 2. For each variable position from ExtractedPositions:
 *    - Resolve variable value from recipient data
 *    - Draw text at exact position with styling
 * 3. Generate unique QR code for recipient
 * 4. Overlay QR at correct position
 * 5. Return personalized PDF buffer
 *
 * Coordinates: All positions use PDF points from bottom-left origin
 */

import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib'
import * as fontkit from '@pdf-lib/fontkit'
import * as QRCode from 'qrcode'
import { type ExtractedPositions, type VariablePosition } from './position-extractor'

/**
 * Recipient data for variable replacement
 */
export interface RecipientData {
  name?: string
  firstName?: string
  first_name?: string
  lastName?: string
  last_name?: string
  lastname?: string
  address?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  zip?: string
  zip_code?: string
  phone?: string
  email?: string
  company?: string
  [key: string]: string | undefined
}

/**
 * Configuration for dynamic overlay with extracted positions
 */
export interface DynamicOverlayConfig {
  /** Extracted positions from template pre-rendering */
  positions: ExtractedPositions

  /** Recipient data for variable replacement */
  recipientData: RecipientData

  /** Optional QR code URL (generated per recipient) */
  qrCodeUrl?: string

  /** Campaign ID for tracking */
  campaignId?: string

  /** Recipient ID for tracking */
  recipientId?: string
}

/**
 * Legacy configuration (for backwards compatibility)
 */
export interface OverlayConfig {
  namePosition?: { x: number; y: number }
  addressPosition?: { x: number; y: number }
  qrPosition?: { x: number; y: number; size: number }
  fontSize?: number
  textColor?: { r: number; g: number; b: number }
  qrCodeUrl?: string
}

// Font cache to avoid repeated fetching
const fontCache: Map<string, ArrayBuffer> = new Map()

/**
 * Fetch a Google Font and return as ArrayBuffer
 * Uses fontkit for embedding custom fonts in PDF
 */
async function fetchGoogleFont(fontFamily: string, fontWeight: string = 'normal'): Promise<ArrayBuffer | null> {
  const cacheKey = `${fontFamily}-${fontWeight}`

  if (fontCache.has(cacheKey)) {
    console.log(`📋 [Font Cache] Using cached font: ${cacheKey}`)
    return fontCache.get(cacheKey)!
  }

  try {
    // Map common font names to Google Fonts URLs
    const weight = fontWeight === 'bold' ? '700' : '400'
    const fontName = fontFamily.replace(/\s+/g, '+')

    // Google Fonts CSS endpoint
    const cssUrl = `https://fonts.googleapis.com/css2?family=${fontName}:wght@${weight}&display=swap`

    console.log(`🔤 [Font Fetch] Loading font: ${fontFamily} (${fontWeight})`)

    // Fetch CSS to get font URL
    const cssResponse = await fetch(cssUrl, {
      headers: {
        // Use a user agent that returns woff2 format
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!cssResponse.ok) {
      console.warn(`⚠️ [Font Fetch] Could not fetch CSS for ${fontFamily}`)
      return null
    }

    const css = await cssResponse.text()

    // Extract font URL from CSS (look for woff2 or woff)
    const urlMatch = css.match(/url\(([^)]+\.woff2?)\)/i)
    if (!urlMatch) {
      console.warn(`⚠️ [Font Fetch] Could not find font URL in CSS for ${fontFamily}`)
      return null
    }

    const fontUrl = urlMatch[1].replace(/['"]/g, '')

    // Fetch actual font file
    const fontResponse = await fetch(fontUrl)
    if (!fontResponse.ok) {
      console.warn(`⚠️ [Font Fetch] Could not fetch font file for ${fontFamily}`)
      return null
    }

    const fontBuffer = await fontResponse.arrayBuffer()

    // Cache it
    fontCache.set(cacheKey, fontBuffer)
    console.log(`✅ [Font Fetch] Loaded and cached: ${fontFamily} (${(fontBuffer.byteLength / 1024).toFixed(1)} KB)`)

    return fontBuffer
  } catch (error) {
    console.error(`❌ [Font Fetch] Error loading ${fontFamily}:`, error)
    return null
  }
}

/**
 * Generate QR code as PNG data URL
 */
async function generateQRCode(url: string, size: number = 300): Promise<string> {
  return await QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  })
}

/**
 * Resolve variable value from recipient data based on variable type
 */
function resolveVariableValue(variableType: string, recipientData: RecipientData): string {
  switch (variableType) {
    case 'recipientName':
    case 'name':
    case 'firstName':
      return recipientData.name || recipientData.firstName || recipientData.first_name || ''

    case 'recipientLastName':
    case 'lastName':
    case 'lastname':
      return recipientData.lastName || recipientData.last_name || recipientData.lastname || ''

    case 'recipientFullName':
    case 'fullName':
      const first = recipientData.name || recipientData.firstName || recipientData.first_name || ''
      const last = recipientData.lastName || recipientData.last_name || recipientData.lastname || ''
      return `${first} ${last}`.trim()

    case 'recipientAddress':
    case 'address':
      return recipientData.address || recipientData.address_line1 || ''

    case 'recipientAddress2':
    case 'address2':
      return recipientData.address_line2 || ''

    case 'recipientCity':
    case 'city':
      return recipientData.city || ''

    case 'recipientState':
    case 'state':
      return recipientData.state || ''

    case 'recipientZip':
    case 'zip':
      return recipientData.zip || recipientData.zip_code || ''

    case 'recipientCityStateZip':
    case 'cityStateZip':
      const city = recipientData.city || ''
      const state = recipientData.state || ''
      const zip = recipientData.zip || recipientData.zip_code || ''
      return `${city}${city && state ? ', ' : ''}${state} ${zip}`.trim()

    case 'recipientPhone':
    case 'phone':
      return recipientData.phone || ''

    case 'recipientEmail':
    case 'email':
      return recipientData.email || ''

    case 'recipientCompany':
    case 'company':
      return recipientData.company || ''

    default:
      // Try to find in recipient data directly
      return recipientData[variableType] || ''
  }
}

/**
 * Parse hex color to RGB values
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255
  return { r, g, b }
}

/**
 * Overlay variables on PDF using dynamic positions (ULTRA-FAST MODE)
 *
 * Uses extracted positions from template pre-rendering for accurate placement.
 * 50-100ms per PDF vs 3-5 seconds with Puppeteer.
 *
 * @param basePDFBuffer - Pre-rendered base PDF (from cache)
 * @param config - Dynamic overlay configuration with positions
 * @returns Personalized PDF buffer
 */
export async function overlayWithDynamicPositions(
  basePDFBuffer: Buffer,
  config: DynamicOverlayConfig
): Promise<Buffer> {
  const startTime = Date.now()
  const recipientName = config.recipientData.name || config.recipientData.firstName || 'recipient'

  console.log(`⚡ [Dynamic Overlay] Personalizing for ${recipientName}...`)

  try {
    // Load base PDF
    const pdfDoc = await PDFDocument.load(basePDFBuffer)

    // Register fontkit for custom font embedding
    // @ts-ignore - fontkit type definitions are incomplete
    pdfDoc.registerFontkit(fontkit.default || fontkit)

    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    const { height: pageHeight } = firstPage.getSize()

    // Load standard fonts as fallback
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Font cache for this document
    const embeddedFonts: Map<string, PDFFont> = new Map()
    embeddedFonts.set('Helvetica-normal', helvetica)
    embeddedFonts.set('Helvetica-bold', helveticaBold)

    // Process each variable position
    for (const variable of config.positions.variables) {
      // Skip QR codes - handled separately
      if (variable.variableType === 'qrCode') {
        continue
      }

      // Skip reusable elements (they're already in base PDF)
      if (variable.isReusable) {
        continue
      }

      // Resolve the variable value
      const value = resolveVariableValue(variable.variableType, config.recipientData)

      if (!value) {
        console.log(`  ⏭️ Skipping empty ${variable.variableType}`)
        continue
      }

      // Get or embed font
      let font: PDFFont = helvetica
      const fontKey = `${variable.fontFamily || 'Helvetica'}-${variable.fontWeight || 'normal'}`

      if (embeddedFonts.has(fontKey)) {
        font = embeddedFonts.get(fontKey)!
      } else if (variable.fontFamily && variable.fontFamily !== 'Helvetica') {
        // Try to fetch and embed Google Font
        const fontBuffer = await fetchGoogleFont(variable.fontFamily, variable.fontWeight)
        if (fontBuffer) {
          try {
            font = await pdfDoc.embedFont(fontBuffer)
            embeddedFonts.set(fontKey, font)
          } catch (fontError) {
            console.warn(`  ⚠️ Could not embed font ${variable.fontFamily}, using fallback`)
            font = variable.fontWeight === 'bold' ? helveticaBold : helvetica
          }
        } else {
          font = variable.fontWeight === 'bold' ? helveticaBold : helvetica
        }
      } else if (variable.fontWeight === 'bold') {
        font = helveticaBold
      }

      // Parse color
      const color = variable.fontColor ? parseHexColor(variable.fontColor) : { r: 0, g: 0, b: 0 }

      // Calculate Y position (positions are already in PDF coordinates from bottom-left)
      const y = variable.y

      // Draw text
      firstPage.drawText(value, {
        x: variable.x,
        y: y,
        size: variable.fontSize || 12,
        font,
        color: rgb(color.r, color.g, color.b),
      })

      console.log(`  ✏️ Drew "${value}" for ${variable.variableType} at (${variable.x.toFixed(1)}, ${y.toFixed(1)})`)
    }

    // Handle QR code
    const qrPosition = config.positions.variables.find(v => v.variableType === 'qrCode')

    if (qrPosition && config.qrCodeUrl) {
      console.log(`  📱 Generating QR code for ${config.qrCodeUrl.substring(0, 50)}...`)

      const qrDataUrl = await generateQRCode(config.qrCodeUrl, 300)
      const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64')
      const qrImage = await pdfDoc.embedPng(qrImageBytes)

      firstPage.drawImage(qrImage, {
        x: qrPosition.x,
        y: qrPosition.y,
        width: qrPosition.width,
        height: qrPosition.height,
      })

      console.log(`  ✅ QR code placed at (${qrPosition.x.toFixed(1)}, ${qrPosition.y.toFixed(1)})`)
    }

    // Save personalized PDF
    const pdfBytes = await pdfDoc.save()
    const finalBuffer = Buffer.from(pdfBytes)

    const elapsed = Date.now() - startTime
    console.log(`✅ [Dynamic Overlay] Complete in ${elapsed}ms (${(finalBuffer.length / 1024).toFixed(2)} KB)`)

    return finalBuffer
  } catch (error) {
    console.error('❌ [Dynamic Overlay] Failed:', error)
    throw error
  }
}

/**
 * Overlay recipient data on base PDF (LEGACY MODE)
 *
 * Uses hardcoded positions. For new code, use overlayWithDynamicPositions().
 *
 * @param basePDFBuffer - Pre-rendered base PDF
 * @param recipientData - Recipient information
 * @param config - Positioning and styling configuration
 * @returns Personalized PDF buffer
 */
export async function overlayVariablesOnPDF(
  basePDFBuffer: Buffer,
  recipientData: RecipientData,
  config: OverlayConfig = {}
): Promise<Buffer> {
  console.log(`⚡ [Variable Overlay] Personalizing for ${recipientData.name || 'recipient'}...`)

  try {
    // Load base PDF
    const pdfDoc = await PDFDocument.load(basePDFBuffer)
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]

    // Get page dimensions
    const { height } = firstPage.getSize()

    // Load font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Default configuration (postcard 4x6 layout)
    const fontSize = config.fontSize || 12
    const textColor = config.textColor || { r: 0, g: 0, b: 0 }
    const namePos = config.namePosition || { x: 0.5, y: 5.0 } // 0.5" from left, 5.0" from top
    const addressPos = config.addressPosition || { x: 0.5, y: 5.3 }
    const qrPos = config.qrPosition || { x: 3.0, y: 0.5, size: 1.5 } // Bottom right

    // Convert inches to points (1 inch = 72 points)
    const pointsPerInch = 72

    // Overlay recipient name (bold)
    if (recipientData.name || recipientData.lastname) {
      const fullName = `${recipientData.name || ''} ${recipientData.lastname || ''}`.trim()
      firstPage.drawText(fullName, {
        x: namePos.x * pointsPerInch,
        y: height - (namePos.y * pointsPerInch), // PDF coordinates are bottom-up
        size: fontSize + 2,
        font: boldFont,
        color: rgb(textColor.r, textColor.g, textColor.b),
      })
    }

    // Overlay address
    if (recipientData.address) {
      firstPage.drawText(recipientData.address, {
        x: addressPos.x * pointsPerInch,
        y: height - (addressPos.y * pointsPerInch),
        size: fontSize,
        font,
        color: rgb(textColor.r, textColor.g, textColor.b),
      })
    }

    // Overlay city/zip
    if (recipientData.city || recipientData.zip) {
      const cityZip = `${recipientData.city || ''}${recipientData.city && recipientData.zip ? ', ' : ''}${recipientData.zip || ''}`.trim()
      firstPage.drawText(cityZip, {
        x: addressPos.x * pointsPerInch,
        y: height - ((addressPos.y + 0.2) * pointsPerInch),
        size: fontSize,
        font,
        color: rgb(textColor.r, textColor.g, textColor.b),
      })
    }

    // Overlay QR code (if URL provided)
    if (config.qrCodeUrl) {
      console.log(`  📱 [Variable Overlay] Generating QR code...`)
      const qrDataUrl = await generateQRCode(config.qrCodeUrl, 300)
      const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64')
      const qrImage = await pdfDoc.embedPng(qrImageBytes)

      const qrSizePoints = qrPos.size * pointsPerInch

      firstPage.drawImage(qrImage, {
        x: qrPos.x * pointsPerInch,
        y: height - ((qrPos.y + qrPos.size) * pointsPerInch), // Bottom-up coordinates
        width: qrSizePoints,
        height: qrSizePoints,
      })
    }

    // Save personalized PDF
    const pdfBytes = await pdfDoc.save()
    const finalBuffer = Buffer.from(pdfBytes)

    console.log(`✅ [Variable Overlay] Personalized PDF created: ${(finalBuffer.length / 1024).toFixed(2)} KB`)

    return finalBuffer
  } catch (error) {
    console.error('❌ [Variable Overlay] Failed:', error)
    throw error
  }
}

/**
 * Batch overlay with dynamic positions: Process multiple recipients efficiently
 *
 * Uses ultra-fast mode with extracted positions.
 * Target: 100 PDFs in 5-10 seconds.
 *
 * @param basePDFBuffer - Pre-rendered base PDF
 * @param positions - Extracted variable positions
 * @param recipients - Array of recipient data
 * @param getQrUrl - Function to generate QR URL per recipient
 * @param onProgress - Optional progress callback
 * @returns Array of personalized PDF buffers
 */
export async function batchOverlayWithDynamicPositions(
  basePDFBuffer: Buffer,
  positions: ExtractedPositions,
  recipients: RecipientData[],
  getQrUrl: (recipient: RecipientData, index: number) => string,
  onProgress?: (completed: number, total: number) => void
): Promise<Buffer[]> {
  console.log(`🚀 [Batch Dynamic Overlay] Processing ${recipients.length} recipients...`)

  const startTime = Date.now()
  const results: Buffer[] = []

  // Process in parallel batches of 10 for optimal performance
  const BATCH_SIZE = 10

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)

    const batchResults = await Promise.all(
      batch.map(async (recipient, batchIndex) => {
        const globalIndex = i + batchIndex
        const qrUrl = getQrUrl(recipient, globalIndex)

        return overlayWithDynamicPositions(basePDFBuffer, {
          positions,
          recipientData: recipient,
          qrCodeUrl: qrUrl,
        })
      })
    )

    results.push(...batchResults)

    if (onProgress) {
      onProgress(results.length, recipients.length)
    }

    console.log(`📊 [Batch Dynamic Overlay] Progress: ${results.length}/${recipients.length}`)
  }

  const duration = (Date.now() - startTime) / 1000
  const avgTime = (duration / recipients.length) * 1000

  console.log(
    `✅ [Batch Dynamic Overlay] Complete: ${recipients.length} PDFs in ${duration.toFixed(2)}s ` +
    `(${avgTime.toFixed(0)}ms/PDF avg)`
  )

  return results
}

/**
 * Batch overlay: Process multiple recipients efficiently (LEGACY MODE)
 *
 * This reuses the base PDF for all recipients.
 *
 * @param basePDFBuffer - Pre-rendered base PDF
 * @param recipients - Array of recipient data
 * @param configFn - Function to generate config per recipient (for unique QR codes)
 * @returns Array of personalized PDF buffers
 */
export async function batchOverlayVariables(
  basePDFBuffer: Buffer,
  recipients: RecipientData[],
  configFn: (recipient: RecipientData, index: number) => OverlayConfig
): Promise<Buffer[]> {
  console.log(`🚀 [Batch Overlay] Processing ${recipients.length} recipients...`)

  const startTime = Date.now()

  const results = await Promise.all(
    recipients.map((recipient, index) => {
      const config = configFn(recipient, index)
      return overlayVariablesOnPDF(basePDFBuffer, recipient, config)
    })
  )

  const duration = (Date.now() - startTime) / 1000
  console.log(`✅ [Batch Overlay] Complete: ${recipients.length} PDFs in ${duration.toFixed(2)}s (${(duration / recipients.length).toFixed(2)}s/PDF)`)

  return results
}

// ==================== PDF PAGE MERGING ====================

/**
 * Merge two single-page PDFs into one 2-page PDF
 *
 * Used for combining front and back pages of postcards/mailers.
 *
 * @param frontPdfBuffer - First page (front)
 * @param backPdfBuffer - Second page (back)
 * @returns Merged 2-page PDF buffer
 */
export async function mergeFrontBackPDF(
  frontPdfBuffer: Buffer,
  backPdfBuffer: Buffer
): Promise<Buffer> {
  console.log('📑 [PDF Merge] Merging front and back pages...')

  const startTime = Date.now()

  // Load both PDFs
  const frontDoc = await PDFDocument.load(frontPdfBuffer)
  const backDoc = await PDFDocument.load(backPdfBuffer)

  // Create a new document for the merged result
  const mergedDoc = await PDFDocument.create()

  // Copy pages from front PDF
  const [frontPage] = await mergedDoc.copyPages(frontDoc, [0])
  mergedDoc.addPage(frontPage)

  // Copy pages from back PDF
  const [backPage] = await mergedDoc.copyPages(backDoc, [0])
  mergedDoc.addPage(backPage)

  // Save merged PDF
  const mergedBytes = await mergedDoc.save()
  const mergedBuffer = Buffer.from(mergedBytes)

  const elapsed = Date.now() - startTime
  console.log(`✅ [PDF Merge] Complete in ${elapsed}ms (${(mergedBuffer.length / 1024).toFixed(2)} KB)`)

  return mergedBuffer
}

/**
 * Create a 2-page PDF with front and blank back
 *
 * Used when template has no custom back page (PostGrid will add address block).
 *
 * @param frontPdfBuffer - Front page PDF
 * @param pageWidth - Width in points
 * @param pageHeight - Height in points
 * @returns 2-page PDF with blank second page
 */
export async function addBlankBackPage(
  frontPdfBuffer: Buffer,
  pageWidth?: number,
  pageHeight?: number
): Promise<Buffer> {
  console.log('📑 [PDF Merge] Adding blank back page...')

  const startTime = Date.now()

  // Load front PDF
  const frontDoc = await PDFDocument.load(frontPdfBuffer)
  const [frontPage] = frontDoc.getPages()

  // Get dimensions from front page if not specified
  const { width, height } = frontPage.getSize()
  const blankWidth = pageWidth || width
  const blankHeight = pageHeight || height

  // Add a blank page
  frontDoc.addPage([blankWidth, blankHeight])

  // Save
  const resultBytes = await frontDoc.save()
  const resultBuffer = Buffer.from(resultBytes)

  const elapsed = Date.now() - startTime
  console.log(`✅ [PDF Merge] Blank back added in ${elapsed}ms (${(resultBuffer.length / 1024).toFixed(2)} KB)`)

  return resultBuffer
}

/**
 * Overlay variables on both front and back pages with dynamic positions
 *
 * For templates with custom back pages that have variable data.
 *
 * @param frontBasePdf - Pre-rendered front base PDF
 * @param backBasePdf - Pre-rendered back base PDF (optional)
 * @param frontConfig - Configuration for front page overlay
 * @param backConfig - Configuration for back page overlay (optional)
 * @returns Merged 2-page PDF buffer
 */
export async function overlayFrontBackWithDynamicPositions(
  frontBasePdf: Buffer,
  backBasePdf: Buffer | null,
  frontConfig: DynamicOverlayConfig,
  backConfig?: DynamicOverlayConfig
): Promise<Buffer> {
  console.log('📑 [PDF Front/Back] Processing front and back with dynamic overlay...')

  const startTime = Date.now()

  // Process front page
  const frontResult = await overlayWithDynamicPositions(frontBasePdf, frontConfig)

  // Process back page if exists, otherwise add blank
  let finalResult: Buffer

  if (backBasePdf && backConfig) {
    const backResult = await overlayWithDynamicPositions(backBasePdf, backConfig)
    finalResult = await mergeFrontBackPDF(frontResult, backResult)
  } else if (backBasePdf) {
    // Back page exists but has no variables - just merge
    finalResult = await mergeFrontBackPDF(frontResult, backBasePdf)
  } else {
    // No back page - add blank for PostGrid address block
    finalResult = await addBlankBackPage(frontResult)
  }

  const elapsed = Date.now() - startTime
  console.log(`✅ [PDF Front/Back] Complete in ${elapsed}ms (${(finalResult.length / 1024).toFixed(2)} KB)`)

  return finalResult
}
