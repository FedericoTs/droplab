'use client';

import { AppointmentLayout } from './appointment-layout';
import { DownloadLayout } from './download-layout';
import { ShopLayout, TrialLayout, QuoteLayout, EventLayout, AssessmentLayout, DemoLayout } from './all-layouts';

export interface LayoutTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
}

export interface LayoutConfig {
  title: string;
  message: string;
  companyName: string;
  ctaText: string;
}

interface LayoutRouterProps {
  layoutType: string;
  theme: LayoutTheme;
  config: LayoutConfig;
  brandLogo?: string;
  isPreview?: boolean;
  onSubmit: (data: any) => Promise<void>;
}

/**
 * Layout Router - Renders the appropriate landing page layout based on layoutType
 *
 * Each layout is completely different:
 * - appointment: Calendar + contact form
 * - download: eBook preview + email capture
 * - shop: Product grid + cart
 * - trial: Features + signup
 * - quote: Multi-step form
 * - event: Event details + registration
 * - assessment: Interactive quiz
 * - demo: Video + enterprise form
 */
export function LayoutRouter({
  layoutType,
  theme,
  config,
  brandLogo,
  isPreview = false,
  onSubmit,
}: LayoutRouterProps) {
  const sharedProps = { theme, config, brandLogo, onSubmit };

  switch (layoutType) {
    case 'appointment':
      return <AppointmentLayout {...sharedProps} />;

    case 'download':
      return <DownloadLayout {...sharedProps} />;

    case 'shop':
      return <ShopLayout {...sharedProps} />;

    case 'trial':
      return <TrialLayout {...sharedProps} />;

    case 'quote':
      return <QuoteLayout {...sharedProps} />;

    case 'event':
      return <EventLayout {...sharedProps} />;

    case 'assessment':
      return <AssessmentLayout {...sharedProps} />;

    case 'demo':
      return <DemoLayout {...sharedProps} />;

    default:
      // Default to appointment layout
      return <AppointmentLayout {...sharedProps} />;
  }
}
