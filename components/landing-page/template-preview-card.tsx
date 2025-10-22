'use client';

import { Check } from 'lucide-react';
import { LandingPageTemplateDefinition } from '@/lib/landing-page-templates';
import { cn } from '@/lib/utils';

interface TemplatePreviewCardProps {
  template: LandingPageTemplateDefinition;
  selected: boolean;
  onClick: () => void;
}

export function TemplatePreviewCard({
  template,
  selected,
  onClick
}: TemplatePreviewCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative group rounded-lg overflow-hidden border-2 transition-all duration-200',
        'hover:scale-105 hover:shadow-lg',
        selected
          ? 'border-purple-500 ring-2 ring-purple-200'
          : 'border-gray-200 hover:border-purple-300'
      )}
    >
      {/* Visual Mock Preview */}
      <div className="h-40 w-full relative bg-white">
        <LandingPageMockPreview template={template} />

        {/* Selected Checkmark */}
        {selected && (
          <div className="absolute top-2 right-2 bg-purple-600 rounded-full p-1 shadow-lg z-10">
            <Check className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Template Info */}
      <div className="p-3 bg-white border-t">
        <div className="text-sm font-semibold text-gray-900">{template.name}</div>
        <div className="text-xs text-gray-500 mt-0.5">{template.description}</div>
      </div>

      {/* Color Palette Preview */}
      <div className="flex h-2">
        <div
          className="flex-1"
          style={{ backgroundColor: template.colors.primary }}
          title="Primary Color"
        />
        <div
          className="flex-1"
          style={{ backgroundColor: template.colors.secondary }}
          title="Secondary Color"
        />
        <div
          className="flex-1"
          style={{ backgroundColor: template.colors.accent }}
          title="Accent Color"
        />
      </div>
    </button>
  );
}

/**
 * Visual mock preview showing UNIQUE landing page layout structure for each CTA type
 * Each template has a different visual structure, not just different colors
 */
function LandingPageMockPreview({ template }: { template: LandingPageTemplateDefinition }) {
  const { colors, layoutType } = template;

  // Render different layouts based on CTA type
  switch (layoutType) {
    case 'appointment':
      return <AppointmentLayoutMock colors={colors} />;
    case 'download':
      return <DownloadLayoutMock colors={colors} />;
    case 'shop':
      return <ShopLayoutMock colors={colors} />;
    case 'trial':
      return <TrialLayoutMock colors={colors} />;
    case 'quote':
      return <QuoteLayoutMock colors={colors} />;
    case 'event':
      return <EventLayoutMock colors={colors} />;
    case 'assessment':
      return <AssessmentLayoutMock colors={colors} />;
    case 'demo':
      return <DemoLayoutMock colors={colors} />;
    default:
      return <AppointmentLayoutMock colors={colors} />;
  }
}

// 1. APPOINTMENT LAYOUT - Calendar + Contact Form
function AppointmentLayoutMock({ colors }: { colors: any }) {
  return (
    <div className="h-full w-full p-1.5 flex flex-col gap-1">
      {/* Header */}
      <div className="h-6 rounded flex items-center px-1.5" style={{ backgroundColor: `${colors.primary}15` }}>
        <div className="w-4 h-1 rounded" style={{ backgroundColor: `${colors.primary}50` }} />
      </div>
      {/* Calendar + Form Split */}
      <div className="flex-1 flex gap-1">
        {/* Calendar Icon */}
        <div className="w-12 rounded border flex flex-col items-center justify-center gap-0.5" style={{ borderColor: `${colors.primary}30` }}>
          <div className="w-6 h-0.5 rounded" style={{ backgroundColor: `${colors.accent}60` }} />
          <div className="grid grid-cols-3 gap-0.5 w-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-1 h-1 rounded" style={{ backgroundColor: `${colors.primary}20` }} />
            ))}
          </div>
        </div>
        {/* Form Fields */}
        <div className="flex-1 space-y-1">
          <div className="h-1.5 rounded border" style={{ borderColor: `${colors.primary}20` }} />
          <div className="h-1.5 rounded border" style={{ borderColor: `${colors.primary}20` }} />
        </div>
      </div>
      {/* CTA Button */}
      <div className="h-2.5 rounded flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
        <div className="w-10 h-0.5 bg-white/80 rounded" />
      </div>
    </div>
  );
}

// 2. DOWNLOAD LAYOUT - eBook Preview + Email Capture
function DownloadLayoutMock({ colors }: { colors: any }) {
  return (
    <div className="h-full w-full p-1.5 flex flex-col gap-1">
      {/* Hero with Image Preview */}
      <div className="flex-1 flex gap-1">
        {/* Book/Guide Preview */}
        <div className="w-12 rounded shadow-sm flex flex-col" style={{ backgroundColor: `${colors.primary}20`, borderLeft: `2px solid ${colors.primary}` }}>
          <div className="flex-1" />
          <div className="h-0.5 mx-1 mb-1 rounded" style={{ backgroundColor: `${colors.primary}40` }} />
          <div className="h-0.5 mx-1 mb-1 rounded" style={{ backgroundColor: `${colors.primary}30` }} />
        </div>
        {/* Benefits List */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.accent }} />
            <div className="flex-1 h-0.5 rounded" style={{ backgroundColor: `${colors.primary}20` }} />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.accent }} />
            <div className="flex-1 h-0.5 rounded" style={{ backgroundColor: `${colors.primary}20` }} />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.accent }} />
            <div className="flex-1 h-0.5 rounded" style={{ backgroundColor: `${colors.primary}20` }} />
          </div>
        </div>
      </div>
      {/* Email Capture */}
      <div className="h-2 rounded border flex items-center px-1" style={{ borderColor: `${colors.primary}30` }}>
        <div className="w-12 h-0.5 rounded" style={{ backgroundColor: `${colors.primary}20` }} />
      </div>
      <div className="h-2.5 rounded flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
        <div className="w-10 h-0.5 bg-white rounded" />
      </div>
    </div>
  );
}

// 3. SHOP LAYOUT - Product Grid
function ShopLayoutMock({ colors }: { colors: any }) {
  return (
    <div className="h-full w-full p-1.5 flex flex-col gap-1">
      {/* Product Grid */}
      <div className="flex-1 grid grid-cols-2 gap-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded border flex flex-col" style={{ borderColor: `${colors.primary}20` }}>
            <div className="flex-1 rounded-t" style={{ backgroundColor: `${colors.primary}10` }} />
            <div className="h-1 mx-0.5 my-0.5 rounded" style={{ backgroundColor: `${colors.primary}20` }} />
            <div className="h-1.5 mx-0.5 mb-0.5 rounded" style={{ backgroundColor: colors.accent }}>
              <div className="w-4 h-0.5 bg-white/70 rounded mx-auto mt-0.5" />
            </div>
          </div>
        ))}
      </div>
      {/* View All Button */}
      <div className="h-2 rounded border flex items-center justify-center" style={{ borderColor: colors.primary, color: colors.primary }}>
        <div className="w-8 h-0.5 rounded" style={{ backgroundColor: colors.primary }} />
      </div>
    </div>
  );
}

// 4. TRIAL LAYOUT - Feature List + Signup
function TrialLayoutMock({ colors }: { colors: any }) {
  return (
    <div className="h-full w-full p-1.5 flex flex-col gap-1">
      {/* Feature Columns */}
      <div className="flex-1 grid grid-cols-3 gap-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded flex flex-col items-center gap-0.5 p-1" style={{ backgroundColor: `${colors.primary}08` }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `${colors.accent}40` }} />
            <div className="w-full h-0.5 rounded" style={{ backgroundColor: `${colors.primary}20` }} />
            <div className="w-3/4 h-0.5 rounded" style={{ backgroundColor: `${colors.primary}15` }} />
          </div>
        ))}
      </div>
      {/* Signup Form */}
      <div className="space-y-0.5">
        <div className="h-1.5 rounded border" style={{ borderColor: `${colors.primary}30` }} />
        <div className="h-2.5 rounded flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
          <div className="w-12 h-0.5 bg-white rounded" />
        </div>
        <div className="text-center h-0.5 rounded mx-auto w-16" style={{ backgroundColor: `${colors.primary}20` }} />
      </div>
    </div>
  );
}

// 5. QUOTE LAYOUT - Multi-Step Form
function QuoteLayoutMock({ colors }: { colors: any }) {
  return (
    <div className="h-full w-full p-1.5 flex flex-col gap-1">
      {/* Progress Steps */}
      <div className="flex gap-0.5 mb-1">
        <div className="flex-1 h-1 rounded" style={{ backgroundColor: colors.primary }} />
        <div className="flex-1 h-1 rounded" style={{ backgroundColor: `${colors.primary}40` }} />
        <div className="flex-1 h-1 rounded" style={{ backgroundColor: `${colors.primary}20` }} />
      </div>
      {/* Form Fields */}
      <div className="flex-1 space-y-1">
        <div className="h-1.5 rounded border" style={{ borderColor: `${colors.primary}30` }} />
        <div className="h-1.5 rounded border" style={{ borderColor: `${colors.primary}30` }} />
        <div className="h-4 rounded border" style={{ borderColor: `${colors.primary}30`, backgroundColor: `${colors.primary}05` }} />
      </div>
      {/* Next Button */}
      <div className="h-2.5 rounded flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
        <div className="w-10 h-0.5 bg-white rounded" />
      </div>
    </div>
  );
}

// 6. EVENT LAYOUT - Event Details + Registration
function EventLayoutMock({ colors }: { colors: any }) {
  return (
    <div className="h-full w-full p-1.5 flex flex-col gap-1">
      {/* Event Banner */}
      <div className="h-8 rounded flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
        <div className="space-y-0.5">
          <div className="w-12 h-1 rounded bg-white/80 mx-auto" />
          <div className="w-8 h-0.5 rounded bg-white/60 mx-auto" />
        </div>
      </div>
      {/* Event Details */}
      <div className="flex gap-1 px-1">
        <div className="flex flex-col items-center justify-center w-6 rounded" style={{ backgroundColor: `${colors.accent}20` }}>
          <div className="w-3 h-1 rounded" style={{ backgroundColor: colors.primary }} />
          <div className="w-2 h-0.5 rounded mt-0.5" style={{ backgroundColor: `${colors.primary}60` }} />
        </div>
        <div className="flex-1 space-y-0.5">
          <div className="h-0.5 rounded w-full" style={{ backgroundColor: `${colors.primary}30` }} />
          <div className="h-0.5 rounded w-3/4" style={{ backgroundColor: `${colors.primary}20` }} />
        </div>
      </div>
      {/* Register Button */}
      <div className="h-2.5 rounded flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
        <div className="w-10 h-0.5 bg-white rounded" />
      </div>
    </div>
  );
}

// 7. ASSESSMENT LAYOUT - Quiz/Questions
function AssessmentLayoutMock({ colors }: { colors: any }) {
  return (
    <div className="h-full w-full p-1.5 flex flex-col gap-1">
      {/* Question */}
      <div className="space-y-1">
        <div className="h-1 rounded w-full" style={{ backgroundColor: `${colors.primary}40` }} />
        <div className="h-0.5 rounded w-3/4" style={{ backgroundColor: `${colors.primary}20` }} />
      </div>
      {/* Answer Options */}
      <div className="flex-1 space-y-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-2 rounded border flex items-center px-1" style={{ borderColor: `${colors.primary}30`, backgroundColor: i === 1 ? `${colors.accent}10` : 'transparent' }}>
            <div className="w-1 h-1 rounded-full mr-1" style={{ backgroundColor: i === 1 ? colors.accent : `${colors.primary}20` }} />
            <div className="flex-1 h-0.5 rounded" style={{ backgroundColor: `${colors.primary}20` }} />
          </div>
        ))}
      </div>
      {/* Progress + Continue */}
      <div className="flex gap-1">
        <div className="flex-1 h-0.5 rounded" style={{ backgroundColor: `${colors.primary}20` }} />
        <div className="w-12 h-2.5 rounded flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
          <div className="w-6 h-0.5 bg-white rounded" />
        </div>
      </div>
    </div>
  );
}

// 8. DEMO LAYOUT - Enterprise/B2B
function DemoLayoutMock({ colors }: { colors: any }) {
  return (
    <div className="h-full w-full p-1.5 flex flex-col gap-1">
      {/* Video/Case Study */}
      <div className="flex-1 rounded flex items-center justify-center" style={{ backgroundColor: `${colors.primary}15`, border: `1px solid ${colors.primary}30` }}>
        <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.primary}40` }}>
          <div className="w-0 h-0 border-t-2 border-b-2 border-l-3 border-transparent" style={{ borderLeftColor: colors.primary }} />
        </div>
      </div>
      {/* Contact Form */}
      <div className="space-y-0.5">
        <div className="grid grid-cols-2 gap-0.5">
          <div className="h-1.5 rounded border" style={{ borderColor: `${colors.primary}30` }} />
          <div className="h-1.5 rounded border" style={{ borderColor: `${colors.primary}30` }} />
        </div>
        <div className="h-1.5 rounded border" style={{ borderColor: `${colors.primary}30` }} />
        <div className="h-2.5 rounded flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
          <div className="w-10 h-0.5 bg-white rounded" />
        </div>
      </div>
    </div>
  );
}
