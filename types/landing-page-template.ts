/**
 * Landing Page Template Types
 *
 * Simple template system for campaign landing pages
 * Supports pre-built templates and customization
 */

export interface LandingPageTemplate {
  id: string;
  name: string;
  description: string;
  category: 'prebuilt' | 'custom';
  template_type: 'professional' | 'modern' | 'minimal' | 'bold' | 'medical' | 'retail' | 'tech' | 'elegant';
  is_system_template: number; // 1 = system template, 0 = user template
  template_config: string; // JSON string
  preview_image: string | null;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateConfig {
  version: string;

  // Layout
  layout: {
    type: 'hero_with_form' | 'split' | 'centered' | 'minimal';
    formPosition: 'left' | 'right' | 'bottom' | 'overlay';
    headerHeight: 'compact' | 'normal' | 'tall';
  };

  // Colors
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    textLight: string;
  };

  // Typography
  typography: {
    headingFont: string;
    headingWeight: string;
    bodyFont: string;
    bodyWeight: string;
  };

  // Spacing
  spacing: {
    sectionPadding: string;
    elementSpacing: string;
  };

  // Form
  form: {
    style: 'modern' | 'classic' | 'minimal';
    buttonStyle: 'solid' | 'outline' | 'gradient';
    buttonSize: 'medium' | 'large';
  };

  // Effects
  effects: {
    gradientBackground: boolean;
    backgroundImage: string | null;
    cardShadow: boolean;
  };
}

export interface TrackingSnippet {
  id: string;
  name: string;
  snippet_type: 'google_analytics' | 'adobe' | 'facebook' | 'custom';
  code: string;
  position: 'head' | 'body';
  is_active: number;
  created_at: string;
  updated_at: string;
}
