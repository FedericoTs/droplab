import { jsPDF } from "jspdf";
import { DirectMailData } from "@/types/dm-creative";

/**
 * Improved PDF Generator with Aspect Ratio Preservation
 *
 * Automatically detects template dimensions and orientation
 * Scales images proportionally to fill the page without distortion
 */

interface TemplateDimensions {
  width: number;
  height: number;
}

/**
 * Calculate optimal PDF orientation and dimensions
 */
function calculatePDFLayout(templateDimensions: TemplateDimensions) {
  const { width, height } = templateDimensions;
  const aspectRatio = width / height;

  // Determine orientation
  const isLandscape = aspectRatio > 1;
  const orientation = isLandscape ? 'landscape' : 'portrait';

  // Choose appropriate page size based on aspect ratio
  // Common DM sizes in mm:
  // - Postcard: 152.4 x 101.6 (6" x 4") - 1.5:1 ratio
  // - A4: 297 x 210 (landscape) or 210 x 297 (portrait)
  // - Letter: 279.4 x 215.9 (landscape) or 215.9 x 279.4 (portrait)
  // - Tabloid: 431.8 x 279.4 (landscape)

  let format: [number, number] | string = 'letter';

  // Match closest standard format
  if (Math.abs(aspectRatio - 1.5) < 0.1) {
    // Postcard size (6" x 4" = 152.4 x 101.6 mm)
    format = isLandscape ? [152.4, 101.6] : [101.6, 152.4];
  } else if (Math.abs(aspectRatio - 1.414) < 0.1) {
    // A4 ratio (√2:1)
    format = 'a4';
  } else if (Math.abs(aspectRatio - 1.294) < 0.1) {
    // Letter ratio
    format = 'letter';
  } else {
    // Custom size - calculate from template dimensions
    // Assuming 96 DPI for screen to print conversion
    const mmWidth = (width / 96) * 25.4;
    const mmHeight = (height / 96) * 25.4;
    format = [mmWidth, mmHeight];
  }

  return { orientation, format };
}

/**
 * Calculate image dimensions to fill page while maintaining aspect ratio
 */
function calculateImageDimensions(
  imageWidth: number,
  imageHeight: number,
  pageWidth: number,
  pageHeight: number,
  fillMode: 'contain' | 'cover' = 'contain'
): { width: number; height: number; x: number; y: number } {
  const imageAspect = imageWidth / imageHeight;
  const pageAspect = pageWidth / pageHeight;

  let scaledWidth: number;
  let scaledHeight: number;

  if (fillMode === 'contain') {
    // Fit entire image within page (letterbox/pillarbox if needed)
    if (imageAspect > pageAspect) {
      // Image is wider - fit to width
      scaledWidth = pageWidth;
      scaledHeight = pageWidth / imageAspect;
    } else {
      // Image is taller - fit to height
      scaledHeight = pageHeight;
      scaledWidth = pageHeight * imageAspect;
    }
  } else {
    // Cover entire page (crop if needed)
    if (imageAspect > pageAspect) {
      // Image is wider - fit to height
      scaledHeight = pageHeight;
      scaledWidth = pageHeight * imageAspect;
    } else {
      // Image is taller - fit to width
      scaledWidth = pageWidth;
      scaledHeight = pageWidth / imageAspect;
    }
  }

  // Center the image
  const x = (pageWidth - scaledWidth) / 2;
  const y = (pageHeight - scaledHeight) / 2;

  return { width: scaledWidth, height: scaledHeight, x, y };
}

/**
 * Generate PDF with proper aspect ratio preservation
 */
export async function generateDirectMailPDFImproved(
  dmData: DirectMailData,
  companyName: string,
  templateDimensions?: TemplateDimensions
): Promise<Blob> {
  // Default to template dimensions if not provided
  const dimensions = templateDimensions || { width: 1536, height: 1024 };

  // Calculate optimal PDF layout
  const { orientation, format } = calculatePDFLayout(dimensions);

  const doc = new jsPDF({
    orientation: orientation as 'portrait' | 'landscape',
    unit: "mm",
    format,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  console.log(`📄 PDF: ${pageWidth}x${pageHeight}mm (${orientation})`);
  console.log(`🖼️  Template: ${dimensions.width}x${dimensions.height}px (${(dimensions.width/dimensions.height).toFixed(2)}:1)`);

  // If we have the creative image, add it with proper scaling
  if (dmData.creativeImageUrl) {
    try {
      // Calculate dimensions to fill page while maintaining aspect ratio
      const imageDims = calculateImageDimensions(
        dimensions.width,
        dimensions.height,
        pageWidth,
        pageHeight,
        'contain' // Use 'contain' to ensure no cropping
      );

      console.log(`📐 Scaled image: ${imageDims.width.toFixed(1)}x${imageDims.height.toFixed(1)}mm at (${imageDims.x.toFixed(1)}, ${imageDims.y.toFixed(1)})`);

      // Add white background if image doesn't fill page
      if (imageDims.x > 0 || imageDims.y > 0) {
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
      }

      // Add the image with calculated dimensions
      doc.addImage(
        dmData.creativeImageUrl,
        "PNG",
        imageDims.x,
        imageDims.y,
        imageDims.width,
        imageDims.height,
        undefined,
        "FAST"
      );

      // Add subtle tracking ID footer
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Tracking: ${dmData.trackingId}`,
        pageWidth - 5,
        pageHeight - 2,
        { align: "right" }
      );
    } catch (error) {
      console.error("Error adding creative image to PDF:", error);
      // Fall back to basic layout if image fails
      return generateBasicPDF(doc, dmData, companyName, pageWidth, pageHeight);
    }
  } else {
    // Fallback: if no creative image, use basic layout
    return generateBasicPDF(doc, dmData, companyName, pageWidth, pageHeight);
  }

  return doc.output("blob");
}

// Fallback basic PDF layout (original design)
function generateBasicPDF(
  doc: jsPDF,
  dmData: DirectMailData,
  companyName: string,
  pageWidth: number,
  pageHeight: number
): Blob {
  // Background
  doc.setFillColor(250, 250, 250);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Header with company name
  doc.setFillColor(0, 62, 126); // Miracle-Ear deep blue
  doc.rect(0, 0, pageWidth, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, pageWidth / 2, 20, { align: "center" });

  // Recipient address box
  doc.setFillColor(255, 255, 255);
  doc.rect(15, 40, 80, 30, "F");
  doc.setDrawColor(200, 200, 200);
  doc.rect(15, 40, 80, 30, "S");

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  let yPos = 48;
  doc.text(`${dmData.recipient.name} ${dmData.recipient.lastname}`, 18, yPos);
  yPos += 5;
  if (dmData.recipient.address) {
    doc.text(dmData.recipient.address, 18, yPos);
    yPos += 5;
  }
  if (dmData.recipient.city && dmData.recipient.zip) {
    doc.text(`${dmData.recipient.city}, ${dmData.recipient.zip}`, 18, yPos);
  }

  // Main message
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);

  const messageLines = doc.splitTextToSize(dmData.message, pageWidth - 40);
  doc.text(messageLines, 20, 85);

  // QR Code section
  const qrX = pageWidth - 70;
  const qrY = 40;
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX - 5, qrY - 5, 60, 70, "F");
  doc.setDrawColor(0, 62, 126);
  doc.setLineWidth(1);
  doc.rect(qrX - 5, qrY - 5, 60, 70, "S");

  // Add QR code
  try {
    doc.addImage(
      dmData.qrCodeDataUrl,
      "PNG",
      qrX,
      qrY,
      50,
      50,
      undefined,
      "FAST"
    );
  } catch (error) {
    console.error("Error adding QR code to PDF:", error);
  }

  // QR code label
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 107, 53); // Miracle-Ear orange
  doc.text("Scan to Learn More", qrX + 25, qrY + 58, { align: "center" });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Tracking ID: ${dmData.trackingId}`,
    pageWidth / 2,
    pageHeight - 5,
    { align: "center" }
  );

  return doc.output("blob");
}

/**
 * Legacy compatibility wrapper
 * @deprecated Use generateDirectMailPDFImproved instead
 */
export async function generateDirectMailPDF(
  dmData: DirectMailData,
  companyName: string
): Promise<Blob> {
  return generateDirectMailPDFImproved(dmData, companyName);
}
