/**
 * Template to Conversion Type Mapper
 *
 * Maps landing page template IDs to their appropriate conversion types
 * This ensures CTA-aligned tracking for accurate analytics
 *
 * CRITICAL: This mapping must stay in sync with:
 * - components/landing/campaign-landing-page.tsx (layoutTypeMap)
 * - Database conversion_type constraints
 * - Analytics queries
 */

import type { Conversion } from '@/lib/database/tracking-queries';

/**
 * Map of template IDs to conversion types
 * Template IDs come from the campaign landing page configuration
 */
export const TEMPLATE_CONVERSION_MAP: Record<string, Conversion['conversion_type']> = {
  // ==================== APPOINTMENT-BASED TEMPLATES ====================
  // These templates end with users booking an appointment
  'book-appointment': 'appointment_booked',
  'medical-consultation': 'appointment_booked',
  'salon-booking': 'appointment_booked',
  'dental-appointment': 'appointment_booked',
  'schedule-meeting': 'appointment_booked',
  'book-service': 'appointment_booked',

  // ==================== DOWNLOAD-BASED TEMPLATES ====================
  // These templates end with users downloading content
  'download-guide': 'download',
  'get-ebook': 'download',
  'download-whitepaper': 'download',
  'get-template': 'download',
  'download-report': 'download',
  'get-checklist': 'download',

  // ==================== FORM SUBMISSION TEMPLATES ====================
  // Generic contact/inquiry forms that don't fit other categories
  'get-quote': 'form_submission',
  'request-demo': 'form_submission',
  'contact-us': 'form_submission',
  'register-event': 'form_submission',
  'shop-products': 'form_submission', // Until we add 'purchase' type
  'start-trial': 'form_submission',   // Until we add 'trial_started' type
  'take-assessment': 'form_submission',
  'request-info': 'form_submission',
  'join-waitlist': 'form_submission',
};

/**
 * Get conversion type for a template ID
 *
 * @param templateId - Template identifier (e.g., 'book-appointment')
 * @returns Conversion type for tracking
 *
 * @example
 * ```typescript
 * getConversionTypeForTemplate('book-appointment')
 * // Returns: 'appointment_booked'
 *
 * getConversionTypeForTemplate('download-guide')
 * // Returns: 'download'
 *
 * getConversionTypeForTemplate('unknown-template')
 * // Returns: 'form_submission' (fallback)
 * ```
 */
export function getConversionTypeForTemplate(
  templateId: string | null | undefined
): Conversion['conversion_type'] {
  // Handle null/undefined gracefully
  if (!templateId) {
    console.warn('[Template Mapper] No template ID provided, defaulting to form_submission');
    return 'form_submission';
  }

  const conversionType = TEMPLATE_CONVERSION_MAP[templateId];

  if (!conversionType) {
    console.warn(
      `[Template Mapper] Unknown template ID: "${templateId}", defaulting to form_submission. ` +
      `Known templates: ${Object.keys(TEMPLATE_CONVERSION_MAP).join(', ')}`
    );
    return 'form_submission';
  }

  console.log(`[Template Mapper] ✅ ${templateId} → ${conversionType}`);
  return conversionType;
}

/**
 * Get all template IDs for a specific conversion type
 * Useful for filtering and analytics
 *
 * @param conversionType - The conversion type to look up
 * @returns Array of template IDs that map to this conversion type
 *
 * @example
 * ```typescript
 * getTemplatesForConversionType('appointment_booked')
 * // Returns: ['book-appointment', 'medical-consultation', ...]
 * ```
 */
export function getTemplatesForConversionType(
  conversionType: Conversion['conversion_type']
): string[] {
  return Object.entries(TEMPLATE_CONVERSION_MAP)
    .filter(([_, type]) => type === conversionType)
    .map(([templateId]) => templateId);
}

/**
 * Check if a template ID is valid (exists in mapping)
 *
 * @param templateId - Template identifier to validate
 * @returns True if template exists in mapping
 */
export function isValidTemplateId(templateId: string): boolean {
  return templateId in TEMPLATE_CONVERSION_MAP;
}

/**
 * Get all available conversion types from the mapping
 * Useful for UI dropdowns and validation
 *
 * @returns Array of unique conversion types
 */
export function getAllConversionTypes(): Conversion['conversion_type'][] {
  const types = new Set(Object.values(TEMPLATE_CONVERSION_MAP));
  return Array.from(types);
}

/**
 * Get conversion type statistics
 * Shows how many templates map to each type
 *
 * @returns Object with conversion types as keys and counts as values
 */
export function getConversionTypeStats(): Record<string, number> {
  const stats: Record<string, number> = {};

  Object.values(TEMPLATE_CONVERSION_MAP).forEach((type) => {
    stats[type] = (stats[type] || 0) + 1;
  });

  return stats;
}
