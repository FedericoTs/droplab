import type { LandingPageTemplate, TemplateConfig } from '@/types/landing-page-template';

/**
 * Pre-Built Landing Page Templates
 *
 * 8 professional templates ready to use
 * Simple, intuitive, no AI matching needed
 */

// Template 1: Professional (Default)
const professionalConfig: TemplateConfig = {
  version: '1.0',
  layout: {
    type: 'split',
    formPosition: 'right',
    headerHeight: 'normal',
  },
  colors: {
    primary: '#1E3A8A',
    secondary: '#3B82F6',
    accent: '#10B981',
    background: '#FFFFFF',
    text: '#1F2937',
    textLight: '#6B7280',
  },
  typography: {
    headingFont: 'Inter',
    headingWeight: '700',
    bodyFont: 'Open Sans',
    bodyWeight: '400',
  },
  spacing: {
    sectionPadding: '4rem',
    elementSpacing: '2rem',
  },
  form: {
    style: 'modern',
    buttonStyle: 'solid',
    buttonSize: 'large',
  },
  effects: {
    gradientBackground: false,
    backgroundImage: null,
    cardShadow: true,
  },
};

// Template 2: Modern
const modernConfig: TemplateConfig = {
  version: '1.0',
  layout: {
    type: 'hero_with_form',
    formPosition: 'overlay',
    headerHeight: 'tall',
  },
  colors: {
    primary: '#8B5CF6',
    secondary: '#EC4899',
    accent: '#F59E0B',
    background: '#FFFFFF',
    text: '#111827',
    textLight: '#6B7280',
  },
  typography: {
    headingFont: 'Inter',
    headingWeight: '800',
    bodyFont: 'Inter',
    bodyWeight: '400',
  },
  spacing: {
    sectionPadding: '5rem',
    elementSpacing: '2.5rem',
  },
  form: {
    style: 'modern',
    buttonStyle: 'gradient',
    buttonSize: 'large',
  },
  effects: {
    gradientBackground: true,
    backgroundImage: null,
    cardShadow: true,
  },
};

// Template 3: Minimal
const minimalConfig: TemplateConfig = {
  version: '1.0',
  layout: {
    type: 'centered',
    formPosition: 'bottom',
    headerHeight: 'compact',
  },
  colors: {
    primary: '#000000',
    secondary: '#4B5563',
    accent: '#6B7280',
    background: '#FFFFFF',
    text: '#1F2937',
    textLight: '#9CA3AF',
  },
  typography: {
    headingFont: 'Raleway',
    headingWeight: '300',
    bodyFont: 'Lato',
    bodyWeight: '400',
  },
  spacing: {
    sectionPadding: '6rem',
    elementSpacing: '3rem',
  },
  form: {
    style: 'minimal',
    buttonStyle: 'outline',
    buttonSize: 'medium',
  },
  effects: {
    gradientBackground: false,
    backgroundImage: null,
    cardShadow: false,
  },
};

// Template 4: Bold
const boldConfig: TemplateConfig = {
  version: '1.0',
  layout: {
    type: 'hero_with_form',
    formPosition: 'right',
    headerHeight: 'tall',
  },
  colors: {
    primary: '#DC2626',
    secondary: '#F59E0B',
    accent: '#FBBF24',
    background: '#1F2937',
    text: '#FFFFFF',
    textLight: '#D1D5DB',
  },
  typography: {
    headingFont: 'Montserrat',
    headingWeight: '900',
    bodyFont: 'Roboto',
    bodyWeight: '400',
  },
  spacing: {
    sectionPadding: '4rem',
    elementSpacing: '2rem',
  },
  form: {
    style: 'modern',
    buttonStyle: 'solid',
    buttonSize: 'large',
  },
  effects: {
    gradientBackground: false,
    backgroundImage: null,
    cardShadow: true,
  },
};

// Template 5: Medical
const medicalConfig: TemplateConfig = {
  version: '1.0',
  layout: {
    type: 'split',
    formPosition: 'right',
    headerHeight: 'normal',
  },
  colors: {
    primary: '#0EA5E9',
    secondary: '#10B981',
    accent: '#06B6D4',
    background: '#F0F9FF',
    text: '#1F2937',
    textLight: '#6B7280',
  },
  typography: {
    headingFont: 'Nunito',
    headingWeight: '700',
    bodyFont: 'Source Sans Pro',
    bodyWeight: '400',
  },
  spacing: {
    sectionPadding: '4rem',
    elementSpacing: '2rem',
  },
  form: {
    style: 'modern',
    buttonStyle: 'solid',
    buttonSize: 'large',
  },
  effects: {
    gradientBackground: false,
    backgroundImage: null,
    cardShadow: true,
  },
};

// Template 6: Retail
const retailConfig: TemplateConfig = {
  version: '1.0',
  layout: {
    type: 'hero_with_form',
    formPosition: 'overlay',
    headerHeight: 'tall',
  },
  colors: {
    primary: '#EF4444',
    secondary: '#F97316',
    accent: '#FBBF24',
    background: '#FFFFFF',
    text: '#1F2937',
    textLight: '#6B7280',
  },
  typography: {
    headingFont: 'Poppins',
    headingWeight: '700',
    bodyFont: 'Inter',
    bodyWeight: '400',
  },
  spacing: {
    sectionPadding: '4rem',
    elementSpacing: '2rem',
  },
  form: {
    style: 'modern',
    buttonStyle: 'solid',
    buttonSize: 'large',
  },
  effects: {
    gradientBackground: true,
    backgroundImage: null,
    cardShadow: true,
  },
};

// Template 7: Tech
const techConfig: TemplateConfig = {
  version: '1.0',
  layout: {
    type: 'split',
    formPosition: 'right',
    headerHeight: 'normal',
  },
  colors: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    accent: '#EC4899',
    background: '#0F172A',
    text: '#F1F5F9',
    textLight: '#CBD5E1',
  },
  typography: {
    headingFont: 'Space Grotesk',
    headingWeight: '700',
    bodyFont: 'Inter',
    bodyWeight: '400',
  },
  spacing: {
    sectionPadding: '4rem',
    elementSpacing: '2rem',
  },
  form: {
    style: 'modern',
    buttonStyle: 'gradient',
    buttonSize: 'large',
  },
  effects: {
    gradientBackground: true,
    backgroundImage: null,
    cardShadow: true,
  },
};

// Template 8: Elegant
const elegantConfig: TemplateConfig = {
  version: '1.0',
  layout: {
    type: 'centered',
    formPosition: 'bottom',
    headerHeight: 'normal',
  },
  colors: {
    primary: '#7C3AED',
    secondary: '#A78BFA',
    accent: '#C4B5FD',
    background: '#FAFAF9',
    text: '#1C1917',
    textLight: '#78716C',
  },
  typography: {
    headingFont: 'Playfair Display',
    headingWeight: '600',
    bodyFont: 'Lora',
    bodyWeight: '400',
  },
  spacing: {
    sectionPadding: '5rem',
    elementSpacing: '2.5rem',
  },
  form: {
    style: 'classic',
    buttonStyle: 'solid',
    buttonSize: 'medium',
  },
  effects: {
    gradientBackground: false,
    backgroundImage: null,
    cardShadow: false,
  },
};

// Export all pre-built templates
export const PREBUILT_TEMPLATES: Omit<LandingPageTemplate, 'created_at' | 'updated_at'>[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, corporate design perfect for B2B and professional services',
    category: 'prebuilt',
    template_type: 'professional',
    is_system_template: 1,
    template_config: JSON.stringify(professionalConfig),
    preview_image: null,
    use_count: 0,
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Vibrant and energetic design for startups and tech companies',
    category: 'prebuilt',
    template_type: 'modern',
    is_system_template: 1,
    template_config: JSON.stringify(modernConfig),
    preview_image: null,
    use_count: 0,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple design for luxury and high-end brands',
    category: 'prebuilt',
    template_type: 'minimal',
    is_system_template: 1,
    template_config: JSON.stringify(minimalConfig),
    preview_image: null,
    use_count: 0,
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'High-impact design for promotions and limited-time offers',
    category: 'prebuilt',
    template_type: 'bold',
    is_system_template: 1,
    template_config: JSON.stringify(boldConfig),
    preview_image: null,
    use_count: 0,
  },
  {
    id: 'medical',
    name: 'Medical',
    description: 'Calming and trustworthy design for healthcare and wellness',
    category: 'prebuilt',
    template_type: 'medical',
    is_system_template: 1,
    template_config: JSON.stringify(medicalConfig),
    preview_image: null,
    use_count: 0,
  },
  {
    id: 'retail',
    name: 'Retail',
    description: 'Eye-catching design optimized for e-commerce and sales',
    category: 'prebuilt',
    template_type: 'retail',
    is_system_template: 1,
    template_config: JSON.stringify(retailConfig),
    preview_image: null,
    use_count: 0,
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Modern and innovative design for SaaS and technology',
    category: 'prebuilt',
    template_type: 'tech',
    is_system_template: 1,
    template_config: JSON.stringify(techConfig),
    preview_image: null,
    use_count: 0,
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated design for premium and luxury services',
    category: 'prebuilt',
    template_type: 'elegant',
    is_system_template: 1,
    template_config: JSON.stringify(elegantConfig),
    preview_image: null,
    use_count: 0,
  },
];
