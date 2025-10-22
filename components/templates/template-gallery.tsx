'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TemplateCard from './template-card';
import type { LandingPageTemplate } from '@/types/landing-page-template';
import { Palette, Sparkles } from 'lucide-react';

interface TemplateGalleryProps {
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  onCustomize?: () => void;
  showCustomizeButton?: boolean;
  brandKitApplied?: boolean;
}

export default function TemplateGallery({
  selectedTemplateId,
  onSelectTemplate,
  onCustomize,
  showCustomizeButton = true,
  brandKitApplied = false,
}: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<LandingPageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show first 4 templates by default (quick options)
  const quickTemplates = templates.slice(0, 4);
  const displayTemplates = showAll ? templates : quickTemplates;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-slate-500">Loading templates...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Landing Page Template
            </CardTitle>
            <CardDescription>
              {brandKitApplied ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Sparkles className="w-4 h-4" />
                  Brand colors and logo applied automatically
                </span>
              ) : (
                'Choose a template for your landing page'
              )}
            </CardDescription>
          </div>

          {showCustomizeButton && onCustomize && (
            <Button variant="outline" size="sm" onClick={onCustomize}>
              <Palette className="w-4 h-4 mr-2" />
              Customize
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Currently selected */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-blue-900">
                Currently using:{' '}
                {templates.find((t) => t.id === selectedTemplateId)?.name || 'Professional'}
              </span>
              {brandKitApplied && (
                <p className="text-xs text-blue-700 mt-1">
                  With your brand colors and logo
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {displayTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={template.id === selectedTemplateId}
              onSelect={onSelectTemplate}
            />
          ))}
        </div>

        {/* Show more/less button */}
        {templates.length > 4 && (
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `Show All ${templates.length} Templates`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
