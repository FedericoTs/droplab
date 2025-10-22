import type { TemplateConfig } from '@/types/landing-page-template';

/**
 * Brand Kit Integration
 *
 * Merges brand profile (logo, colors, fonts) with template configuration
 * This ensures templates automatically inherit company branding
 */

export interface BrandProfile {
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  heading_font?: string | null;
  body_font?: string | null;
}

/**
 * Merge brand kit with template configuration
 *
 * Priority: Brand Kit > Template Defaults
 *
 * @param templateConfig - Base template configuration
 * @param brandProfile - Company brand profile
 * @returns Merged configuration with brand kit applied
 */
export function mergeBrandKitWithTemplate(
  templateConfig: TemplateConfig,
  brandProfile: BrandProfile | null
): TemplateConfig {
  if (!brandProfile) {
    return templateConfig;
  }

  // Clone template config to avoid mutation
  const mergedConfig: TemplateConfig = JSON.parse(JSON.stringify(templateConfig));

  // Apply brand colors (if available)
  if (brandProfile.primary_color) {
    mergedConfig.colors.primary = brandProfile.primary_color;
  }

  if (brandProfile.secondary_color) {
    mergedConfig.colors.secondary = brandProfile.secondary_color;
  }

  if (brandProfile.accent_color) {
    mergedConfig.colors.accent = brandProfile.accent_color;
  }

  if (brandProfile.background_color) {
    mergedConfig.colors.background = brandProfile.background_color;
  }

  if (brandProfile.text_color) {
    mergedConfig.colors.text = brandProfile.text_color;
  }

  // Apply brand fonts (if available)
  if (brandProfile.heading_font) {
    mergedConfig.typography.headingFont = brandProfile.heading_font;
  }

  if (brandProfile.body_font) {
    mergedConfig.typography.bodyFont = brandProfile.body_font;
  }

  // Apply brand logo (if available)
  if (brandProfile.logo_url) {
    // Add branding section to template config
    (mergedConfig as any).branding = {
      logoUrl: brandProfile.logo_url,
    };
  }

  return mergedConfig;
}

/**
 * Get brand logo URL
 * Returns brand logo if available, null otherwise
 */
export function getBrandLogo(brandProfile: BrandProfile | null): string | null {
  return brandProfile?.logo_url || null;
}

/**
 * Check if brand kit is configured
 */
export function hasBrandKit(brandProfile: BrandProfile | null): boolean {
  if (!brandProfile) {
    return false;
  }

  return !!(
    brandProfile.primary_color ||
    brandProfile.secondary_color ||
    brandProfile.accent_color ||
    brandProfile.logo_url
  );
}

/**
 * Get brand-aware template configuration
 *
 * This is the main function to use when rendering templates
 * It automatically applies brand kit if available
 */
export function getBrandedTemplateConfig(
  templateConfig: TemplateConfig,
  brandProfile: BrandProfile | null
): {
  config: TemplateConfig;
  logoUrl: string | null;
  hasBranding: boolean;
} {
  const config = mergeBrandKitWithTemplate(templateConfig, brandProfile);
  const logoUrl = getBrandLogo(brandProfile);
  const hasBranding = hasBrandKit(brandProfile);

  return {
    config,
    logoUrl,
    hasBranding,
  };
}
