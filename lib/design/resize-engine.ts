/**
 * Intelligent Resize Engine for DropLab
 *
 * Handles canvas resizing when changing between print formats.
 * Supports three strategies: scale, crop, and AI reflow.
 */

import type { Canvas, FabricObject } from 'fabric';
import type { PrintFormat } from './print-formats';

export type ResizeStrategy = 'scale' | 'crop' | 'reflow';

export interface ResizeOptions {
  strategy: ResizeStrategy;
  maintainAspectRatio?: boolean;
  centerContent?: boolean;
  onProgress?: (percent: number) => void;
}

export interface ResizeResult {
  success: boolean;
  strategy: ResizeStrategy;
  originalDimensions: { width: number; height: number };
  newDimensions: { width: number; height: number };
  objectsModified: number;
  warnings: string[];
}

/**
 * Resize canvas from one format to another
 */
export async function resizeCanvas(
  canvas: Canvas,
  currentFormat: PrintFormat,
  targetFormat: PrintFormat,
  options: ResizeOptions
): Promise<ResizeResult> {
  const warnings: string[] = [];
  const objects = canvas.getObjects();

  console.log(`🔄 Resizing canvas from ${currentFormat.name} to ${targetFormat.name}`);
  console.log(`   Strategy: ${options.strategy}`);
  console.log(`   Objects: ${objects.length}`);

  // Store original dimensions
  const originalDimensions = {
    width: canvas.width || 0,
    height: canvas.height || 0
  };

  try {
    if (options.strategy === 'scale') {
      await resizeWithScale(canvas, currentFormat, targetFormat, options);
    } else if (options.strategy === 'crop') {
      await resizeWithCrop(canvas, currentFormat, targetFormat, options);
    } else if (options.strategy === 'reflow') {
      await resizeWithReflow(canvas, currentFormat, targetFormat, options);
    }

    // Update canvas dimensions
    canvas.setDimensions({
      width: targetFormat.widthPixels,
      height: targetFormat.heightPixels
    });

    canvas.renderAll();

    console.log(`✅ Resize complete: ${objects.length} objects modified`);

    return {
      success: true,
      strategy: options.strategy,
      originalDimensions,
      newDimensions: {
        width: targetFormat.widthPixels,
        height: targetFormat.heightPixels
      },
      objectsModified: objects.length,
      warnings
    };
  } catch (error) {
    console.error('❌ Resize failed:', error);
    throw error;
  }
}

/**
 * Strategy 1: Proportional Scale
 *
 * Scales all objects proportionally to fit new canvas size.
 * Maintains aspect ratio and relative positioning.
 */
async function resizeWithScale(
  canvas: Canvas,
  currentFormat: PrintFormat,
  targetFormat: PrintFormat,
  options: ResizeOptions
): Promise<void> {
  const objects = canvas.getObjects();

  // Calculate scale factors
  const scaleX = targetFormat.widthPixels / currentFormat.widthPixels;
  const scaleY = targetFormat.heightPixels / currentFormat.heightPixels;

  // Use smaller scale to maintain aspect ratio (fit content)
  const scale = options.maintainAspectRatio !== false
    ? Math.min(scaleX, scaleY)
    : scaleX; // Default to width-based scaling

  console.log(`   Scale factor: ${scale.toFixed(3)} (scaleX: ${scaleX.toFixed(3)}, scaleY: ${scaleY.toFixed(3)})`);

  // Calculate centering offset if needed
  let offsetX = 0;
  let offsetY = 0;

  if (options.centerContent) {
    offsetX = (targetFormat.widthPixels - (currentFormat.widthPixels * scale)) / 2;
    offsetY = (targetFormat.heightPixels - (currentFormat.heightPixels * scale)) / 2;
  }

  // Apply scaling to all objects
  objects.forEach((obj, index) => {
    const currentLeft = obj.left || 0;
    const currentTop = obj.top || 0;
    const currentScaleX = obj.scaleX || 1;
    const currentScaleY = obj.scaleY || 1;

    obj.set({
      left: (currentLeft * scale) + offsetX,
      top: (currentTop * scale) + offsetY,
      scaleX: currentScaleX * scale,
      scaleY: currentScaleY * scale
    });

    obj.setCoords();

    if (options.onProgress) {
      options.onProgress(Math.round(((index + 1) / objects.length) * 100));
    }
  });
}

/**
 * Strategy 2: Crop/Expand
 *
 * Keeps elements in place, adds/removes space around edges.
 * Best for minor size changes (e.g., 4x6 → 5x7).
 */
async function resizeWithCrop(
  canvas: Canvas,
  currentFormat: PrintFormat,
  targetFormat: PrintFormat,
  options: ResizeOptions
): Promise<void> {
  const objects = canvas.getObjects();

  // Calculate offset to center content in new canvas
  const offsetX = (targetFormat.widthPixels - currentFormat.widthPixels) / 2;
  const offsetY = (targetFormat.heightPixels - currentFormat.heightPixels) / 2;

  console.log(`   Offset: (${offsetX.toFixed(0)}px, ${offsetY.toFixed(0)}px)`);

  // Apply offset to all objects
  objects.forEach((obj, index) => {
    const currentLeft = obj.left || 0;
    const currentTop = obj.top || 0;

    obj.set({
      left: currentLeft + offsetX,
      top: currentTop + offsetY
    });

    obj.setCoords();

    if (options.onProgress) {
      options.onProgress(Math.round(((index + 1) / objects.length) * 100));
    }
  });

  // Warn if objects are now outside canvas bounds
  const outOfBounds = objects.filter(obj => {
    const left = obj.left || 0;
    const top = obj.top || 0;
    const width = (obj.width || 0) * (obj.scaleX || 1);
    const height = (obj.height || 0) * (obj.scaleY || 1);

    return (
      left < 0 ||
      top < 0 ||
      left + width > targetFormat.widthPixels ||
      top + height > targetFormat.heightPixels
    );
  });

  if (outOfBounds.length > 0) {
    console.warn(`⚠️ ${outOfBounds.length} objects are outside canvas bounds after crop`);
  }
}

/**
 * Strategy 3: AI Reflow (Placeholder)
 *
 * AI intelligently repositions elements for new dimensions.
 * Maintains visual hierarchy and readability.
 *
 * TODO: Implement Claude API integration for smart reflow
 */
async function resizeWithReflow(
  canvas: Canvas,
  currentFormat: PrintFormat,
  targetFormat: PrintFormat,
  options: ResizeOptions
): Promise<void> {
  console.log('   AI Reflow: Not yet implemented, falling back to scale strategy');

  // For now, fall back to scale strategy
  await resizeWithScale(canvas, currentFormat, targetFormat, options);

  // TODO: Implement AI reflow with Claude API
  /*
  const analysisPrompt = `
    Analyze this direct mail design and intelligently reposition elements for ${targetFormat.name}.

    Current format: ${currentFormat.name} (${currentFormat.widthInches}" × ${currentFormat.heightInches}")
    Target format: ${targetFormat.name} (${targetFormat.widthInches}" × ${targetFormat.heightInches}")

    Canvas state: ${JSON.stringify(canvas.toJSON())}

    Requirements:
    1. Maintain visual hierarchy
    2. Preserve readability
    3. Keep key elements (headline, CTA, logo) prominent
    4. Adjust spacing for new aspect ratio
    5. Ensure postal compliance (barcode zone, safe margins)

    Return JSON with new positions for each object (index-based):
    {
      "repositioning": {
        "0": { "left": 100, "top": 50, "scaleX": 1.2, "scaleY": 1.2 },
        "1": { "left": 200, "top": 150, "scaleX": 1.0, "scaleY": 1.0 },
        ...
      },
      "reasoning": "Why these changes improve the design"
    }
  `;

  const aiAnalysis = await analyzeWithClaude({ prompt: analysisPrompt });

  // Apply AI recommendations
  objects.forEach((obj, idx) => {
    const newPosition = aiAnalysis.repositioning[idx.toString()];
    if (newPosition) {
      obj.set({
        left: newPosition.left,
        top: newPosition.top,
        scaleX: newPosition.scaleX || obj.scaleX,
        scaleY: newPosition.scaleY || obj.scaleY
      });
      obj.setCoords();
    }
  });
  */
}

/**
 * Validate that all objects fit within canvas bounds
 */
export function validateObjectBounds(
  canvas: Canvas,
  format: PrintFormat
): { valid: boolean; outOfBoundsObjects: FabricObject[] } {
  const objects = canvas.getObjects();
  const outOfBounds: FabricObject[] = [];

  objects.forEach(obj => {
    const left = obj.left || 0;
    const top = obj.top || 0;
    const width = (obj.width || 0) * (obj.scaleX || 1);
    const height = (obj.height || 0) * (obj.scaleY || 1);

    if (
      left < 0 ||
      top < 0 ||
      left + width > format.widthPixels ||
      top + height > format.heightPixels
    ) {
      outOfBounds.push(obj);
    }
  });

  return {
    valid: outOfBounds.length === 0,
    outOfBoundsObjects: outOfBounds
  };
}

/**
 * Auto-detect best resize strategy based on format change
 */
export function recommendResizeStrategy(
  currentFormat: PrintFormat,
  targetFormat: PrintFormat
): ResizeStrategy {
  // Calculate aspect ratio change
  const currentAspectRatio = currentFormat.widthInches / currentFormat.heightInches;
  const targetAspectRatio = targetFormat.widthInches / targetFormat.heightInches;
  const aspectRatioDiff = Math.abs(currentAspectRatio - targetAspectRatio);

  // Calculate size change
  const currentArea = currentFormat.widthInches * currentFormat.heightInches;
  const targetArea = targetFormat.widthInches * targetFormat.heightInches;
  const sizeChange = targetArea / currentArea;

  console.log(`📊 Resize analysis:`);
  console.log(`   Aspect ratio change: ${aspectRatioDiff.toFixed(3)}`);
  console.log(`   Size change: ${sizeChange.toFixed(2)}x`);

  // Minor size change + similar aspect ratio → Crop
  if (Math.abs(sizeChange - 1.0) < 0.3 && aspectRatioDiff < 0.2) {
    console.log(`   ✅ Recommended: CROP (minor changes)`);
    return 'crop';
  }

  // Significant aspect ratio change → Reflow (or scale as fallback)
  if (aspectRatioDiff > 0.5) {
    console.log(`   ✅ Recommended: REFLOW (major aspect ratio change)`);
    return 'reflow'; // Will fall back to scale for now
  }

  // Default to scale for most cases
  console.log(`   ✅ Recommended: SCALE (standard resize)`);
  return 'scale';
}
