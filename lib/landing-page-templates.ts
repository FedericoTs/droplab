/**
 * Landing Page Template Definitions
 *
 * CTA-BASED TEMPLATES (Not industry-based)
 * Each template is designed around a specific conversion goal
 *
 * Each template includes:
 * - Unique layout structure for the CTA
 * - Form type and fields specific to conversion goal
 * - Content sections optimized for the action
 * - Visual identity (uses brand kit colors + default fallbacks)
 * - Preview metadata
 */

export interface LandingPageTemplateDefinition {
  id: string;
  name: string;
  description: string;
  cta: string; // Primary call-to-action
  layoutType: 'appointment' | 'download' | 'shop' | 'trial' | 'quote' | 'event' | 'assessment' | 'demo';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  effects: {
    gradientBackground: boolean;
  };
  formConfig: {
    type: 'appointment' | 'email-capture' | 'multi-step' | 'contact' | 'registration' | 'quiz';
    fields: string[];
    ctaButtonText: string;
  };
  sections: {
    hero: boolean;
    benefits: boolean;
    social_proof: boolean;
    features: boolean;
    faq: boolean;
  };
  preview: {
    image?: string;
    gradient: string;
  };
}

export const LANDING_PAGE_TEMPLATES: LandingPageTemplateDefinition[] = [
  // 1. BOOK APPOINTMENT - Schedule, Consultation, Demo Booking
  {
    id: 'book-appointment',
    name: 'Book Appointment',
    description: 'Schedule consultation or demo',
    cta: 'Schedule Your Free Consultation',
    layoutType: 'appointment',
    colors: {
      primary: '#14b8a6', // Teal - trust, healthcare
      secondary: '#0d9488',
      accent: '#2dd4bf',
      background: '#ffffff',
      text: '#1f2937'
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter'
    },
    effects: {
      gradientBackground: true
    },
    formConfig: {
      type: 'appointment',
      fields: ['name', 'email', 'phone', 'preferredDate', 'preferredTime'],
      ctaButtonText: 'Book My Appointment'
    },
    sections: {
      hero: true,
      benefits: true,
      social_proof: true,
      features: false,
      faq: true
    },
    preview: {
      gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)'
    }
  },

  // 2. DOWNLOAD GUIDE - Lead Magnet, eBook, Whitepaper
  {
    id: 'download-guide',
    name: 'Download Guide',
    description: 'Lead magnet & content offers',
    cta: 'Download Your Free Guide',
    layoutType: 'download',
    colors: {
      primary: '#2563eb', // Blue - professional, trustworthy
      secondary: '#1e40af',
      accent: '#3b82f6',
      background: '#ffffff',
      text: '#1f2937'
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter'
    },
    effects: {
      gradientBackground: true
    },
    formConfig: {
      type: 'email-capture',
      fields: ['name', 'email', 'company'],
      ctaButtonText: 'Get Instant Access'
    },
    sections: {
      hero: true,
      benefits: true,
      social_proof: true,
      features: false,
      faq: false
    },
    preview: {
      gradient: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
    }
  },

  // 3. SHOP PRODUCTS - E-commerce, Product Showcase
  {
    id: 'shop-products',
    name: 'Shop Products',
    description: 'E-commerce & product catalog',
    cta: 'Shop Our Best Sellers',
    layoutType: 'shop',
    colors: {
      primary: '#f59e0b', // Amber - energy, retail
      secondary: '#d97706',
      accent: '#fbbf24',
      background: '#ffffff',
      text: '#1f2937'
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter'
    },
    effects: {
      gradientBackground: false
    },
    formConfig: {
      type: 'contact',
      fields: ['name', 'email', 'phone'],
      ctaButtonText: 'Shop Now'
    },
    sections: {
      hero: true,
      benefits: false,
      social_proof: true,
      features: true,
      faq: false
    },
    preview: {
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    }
  },

  // 4. START FREE TRIAL - SaaS, Software, Service Trial
  {
    id: 'start-trial',
    name: 'Start Free Trial',
    description: 'SaaS signup & trial activation',
    cta: 'Start Your 14-Day Free Trial',
    layoutType: 'trial',
    colors: {
      primary: '#8b5cf6', // Purple - innovation, tech
      secondary: '#7c3aed',
      accent: '#a78bfa',
      background: '#ffffff',
      text: '#1f2937'
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter'
    },
    effects: {
      gradientBackground: true
    },
    formConfig: {
      type: 'email-capture',
      fields: ['name', 'email', 'password'],
      ctaButtonText: 'Start Free Trial'
    },
    sections: {
      hero: true,
      benefits: false,
      social_proof: true,
      features: true,
      faq: true
    },
    preview: {
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
    }
  },

  // 5. GET QUOTE - Estimates, Custom Pricing, B2B Inquiry
  {
    id: 'get-quote',
    name: 'Get Quote',
    description: 'Request estimate or pricing',
    cta: 'Get Your Free Quote',
    layoutType: 'quote',
    colors: {
      primary: '#059669', // Green - growth, money
      secondary: '#047857',
      accent: '#10b981',
      background: '#ffffff',
      text: '#1f2937'
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter'
    },
    effects: {
      gradientBackground: true
    },
    formConfig: {
      type: 'multi-step',
      fields: ['name', 'email', 'phone', 'company', 'projectDetails', 'budget'],
      ctaButtonText: 'Request Quote'
    },
    sections: {
      hero: true,
      benefits: true,
      social_proof: true,
      features: false,
      faq: true
    },
    preview: {
      gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
    }
  },

  // 6. REGISTER FOR EVENT - Webinar, Workshop, Conference
  {
    id: 'register-event',
    name: 'Register for Event',
    description: 'Webinar & event registration',
    cta: 'Register for Free Webinar',
    layoutType: 'event',
    colors: {
      primary: '#dc2626', // Red - urgency, excitement
      secondary: '#b91c1c',
      accent: '#ef4444',
      background: '#ffffff',
      text: '#1f2937'
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter'
    },
    effects: {
      gradientBackground: true
    },
    formConfig: {
      type: 'registration',
      fields: ['name', 'email', 'phone', 'company', 'jobTitle'],
      ctaButtonText: 'Save My Spot'
    },
    sections: {
      hero: true,
      benefits: true,
      social_proof: true,
      features: false,
      faq: false
    },
    preview: {
      gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
    }
  },

  // 7. TAKE ASSESSMENT - Quiz, Survey, Diagnostic
  {
    id: 'take-assessment',
    name: 'Take Assessment',
    description: 'Interactive quiz & qualification',
    cta: 'Take Our Free Assessment',
    layoutType: 'assessment',
    colors: {
      primary: '#06b6d4', // Cyan - clarity, intelligence
      secondary: '#0891b2',
      accent: '#22d3ee',
      background: '#ffffff',
      text: '#1f2937'
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter'
    },
    effects: {
      gradientBackground: true
    },
    formConfig: {
      type: 'quiz',
      fields: ['name', 'email'],
      ctaButtonText: 'Start Assessment'
    },
    sections: {
      hero: true,
      benefits: true,
      social_proof: false,
      features: false,
      faq: false
    },
    preview: {
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
    }
  },

  // 8. REQUEST DEMO - Enterprise Sales, B2B Demo
  {
    id: 'request-demo',
    name: 'Request Demo',
    description: 'Enterprise sales & demo booking',
    cta: 'Schedule Your Personalized Demo',
    layoutType: 'demo',
    colors: {
      primary: '#000000', // Black - luxury, enterprise
      secondary: '#374151',
      accent: '#6b7280',
      background: '#ffffff',
      text: '#1f2937'
    },
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Inter'
    },
    effects: {
      gradientBackground: false
    },
    formConfig: {
      type: 'contact',
      fields: ['name', 'email', 'phone', 'company', 'employeeCount', 'message'],
      ctaButtonText: 'Request Demo'
    },
    sections: {
      hero: true,
      benefits: true,
      social_proof: true,
      features: true,
      faq: true
    },
    preview: {
      gradient: 'linear-gradient(135deg, #000000 0%, #374151 100%)'
    }
  }
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): LandingPageTemplateDefinition | undefined {
  return LANDING_PAGE_TEMPLATES.find(t => t.id === id);
}

/**
 * Get template colors by ID (for quick access)
 */
export function getTemplateColors(id: string) {
  const template = getTemplateById(id);
  return template?.colors || LANDING_PAGE_TEMPLATES[0].colors; // Default to 'book-appointment'
}

/**
 * Get all template IDs
 */
export function getTemplateIds(): string[] {
  return LANDING_PAGE_TEMPLATES.map(t => t.id);
}
