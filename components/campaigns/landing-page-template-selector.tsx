'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Check, Sparkles } from 'lucide-react';
import type { LandingPageTemplate, TemplateConfig } from '@/types/landing-page-template';
import TemplateCard from '@/components/templates/template-card';
import TemplateCustomizer from '@/components/templates/template-customizer';
import { getBrandProfile } from '@/lib/database/tracking-queries';
import { mergeBrandKitWithTemplate, type BrandProfile } from '@/lib/templates/brand-kit-merger';

interface LandingPageTemplateSelectorProps {
  companyName: string;
  selectedTemplateId: string | null;
  onTemplateChange: (templateId: string | null, config: TemplateConfig | null) => void;
}

export default function LandingPageTemplateSelector({
  companyName,
  selectedTemplateId,
  onTemplateChange,
}: LandingPageTemplateSelectorProps) {
  const [templates, setTemplates] = useState<LandingPageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<LandingPageTemplate | null>(null);
  const [customizedConfig, setCustomizedConfig] = useState<TemplateConfig | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadBrandProfile();
  }, []);

  useEffect(() => {
    if (selectedTemplateId && templates.length > 0) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        setSelectedTemplate(template);
        const config = JSON.parse(template.template_config) as TemplateConfig;
        const mergedConfig = mergeBrandKitWithTemplate(config, brandProfile);
        setCustomizedConfig(mergedConfig);
      }
    }
  }, [selectedTemplateId, templates, brandProfile]);

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

  const loadBrandProfile = async () => {
    if (!companyName) return;

    try {
      const profile = await getBrandProfile(companyName);
      setBrandProfile(profile);
    } catch (error) {
      console.error('Error loading brand profile:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setSelectedTemplate(template);

    // Parse template config and merge with brand kit
    const config = JSON.parse(template.template_config) as TemplateConfig;
    const mergedConfig = mergeBrandKitWithTemplate(config, brandProfile);

    setCustomizedConfig(mergedConfig);
    onTemplateChange(templateId, mergedConfig);
  };

  const handleCustomize = () => {
    setShowCustomizer(true);
  };

  const handleSaveCustomization = (config: TemplateConfig, logoUrl: string | null) => {
    // Update config with logo URL if provided
    if (logoUrl) {
      config.branding = {
        ...config.branding,
        logoUrl,
      };
    }

    setCustomizedConfig(config);
    onTemplateChange(selectedTemplate?.id || null, config);
    setShowCustomizer(false);
  };

  const handleCancelCustomization = () => {
    setShowCustomizer(false);
  };

  const handleRemoveTemplate = () => {
    setSelectedTemplate(null);
    setCustomizedConfig(null);
    onTemplateChange(null, null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-slate-500">Loading templates...</div>
        </CardContent>
      </Card>
    );
  }

  if (showCustomizer && selectedTemplate && customizedConfig) {
    return (
      <TemplateCustomizer
        templateConfig={customizedConfig}
        brandProfile={brandProfile}
        onSave={handleSaveCustomization}
        onCancel={handleCancelCustomization}
      />
    );
  }

  const hasBrandKit = !!(brandProfile?.primary_color || brandProfile?.logo_url);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Landing Page Template
              </CardTitle>
              <CardDescription>
                {hasBrandKit ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Sparkles className="w-4 h-4" />
                    Templates automatically styled with your brand colors and logo
                  </span>
                ) : (
                  'Choose a template or use the default styling'
                )}
              </CardDescription>
            </div>

            {selectedTemplate && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCustomize}>
                  <Palette className="w-4 h-4 mr-2" />
                  Customize
                </Button>
                <Button variant="outline" size="sm" onClick={handleRemoveTemplate}>
                  Remove
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Selected Template Info */}
          {selectedTemplate && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      Template: {selectedTemplate.name}
                    </span>
                  </div>
                  {hasBrandKit && (
                    <p className="text-xs text-green-700 mt-1">
                      With your brand colors, fonts, and logo
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Template Selection (First 4) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {templates.slice(0, 4).map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={template.id === selectedTemplate?.id}
                onSelect={handleTemplateSelect}
              />
            ))}
          </div>

          {/* Show more option */}
          {templates.length > 4 && !selectedTemplate && (
            <div className="mt-4 text-center">
              <p className="text-sm text-slate-600">
                + {templates.length - 4} more templates available
              </p>
            </div>
          )}

          {/* Helper Text */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Dual-Mode Support:</strong> Your landing page will automatically work in two ways:
              <br />
              • <strong>Personalized Mode:</strong> When recipients scan the QR code, they see a personalized greeting and pre-filled form
              <br />
              • <strong>Generic Mode:</strong> Direct visitors see a generic welcome message with an empty form
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
