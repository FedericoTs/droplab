'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { LandingPageTemplate } from '@/types/landing-page-template';
import { Check } from 'lucide-react';

interface TemplateCardProps {
  template: LandingPageTemplate;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
  showUseCount?: boolean;
}

export default function TemplateCard({
  template,
  isSelected,
  onSelect,
  showUseCount = false,
}: TemplateCardProps) {
  // Parse config to show preview colors
  const config = JSON.parse(template.template_config);

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
      }`}
      onClick={() => onSelect(template.id)}
    >
      <CardContent className="p-4">
        {/* Preview */}
        <div className="relative mb-3 h-32 rounded-lg overflow-hidden border border-slate-200">
          {/* Color preview */}
          <div className="h-full w-full flex">
            {/* Primary color */}
            <div
              className="flex-1"
              style={{ backgroundColor: config.colors.primary }}
            />
            {/* Secondary color */}
            <div
              className="flex-1"
              style={{ backgroundColor: config.colors.secondary }}
            />
            {/* Accent color */}
            <div
              className="flex-1"
              style={{ backgroundColor: config.colors.accent }}
            />
          </div>

          {/* Selected indicator */}
          {isSelected && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
              <Check className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Template info */}
        <div>
          <h3 className="font-semibold text-slate-900 mb-1">{template.name}</h3>
          <p className="text-xs text-slate-600 mb-3">{template.description}</p>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="capitalize">{template.template_type}</span>
            {showUseCount && template.use_count > 0 && (
              <span>Used {template.use_count}×</span>
            )}
          </div>
        </div>

        {/* Select button */}
        <Button
          variant={isSelected ? 'default' : 'outline'}
          size="sm"
          className="w-full mt-3"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(template.id);
          }}
        >
          {isSelected ? 'Selected' : 'Select'}
        </Button>
      </CardContent>
    </Card>
  );
}
