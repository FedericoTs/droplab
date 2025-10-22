'use client';

import { LANDING_PAGE_TEMPLATES } from '@/lib/landing-page-templates';
import { TemplatePreviewCard } from './template-preview-card';

interface TemplateGalleryProps {
  selectedId: string;
  onSelect: (templateId: string) => void;
}

export function TemplateGallery({ selectedId, onSelect }: TemplateGalleryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {LANDING_PAGE_TEMPLATES.map(template => (
        <TemplatePreviewCard
          key={template.id}
          template={template}
          selected={selectedId === template.id}
          onClick={() => onSelect(template.id)}
        />
      ))}
    </div>
  );
}
