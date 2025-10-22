'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TemplateConfig } from '@/types/landing-page-template';
import type { BrandProfile } from '@/lib/templates/brand-kit-merger';
import { Palette, Type, Image as ImageIcon, RotateCcw, Sparkles } from 'lucide-react';

interface TemplateCustomizerProps {
  templateConfig: TemplateConfig;
  brandProfile: BrandProfile | null;
  onSave: (config: TemplateConfig, logoUrl: string | null) => void;
  onCancel: () => void;
}

// Popular Google Fonts
const GOOGLE_FONTS = [
  'Inter',
  'Open Sans',
  'Roboto',
  'Lato',
  'Montserrat',
  'Poppins',
  'Raleway',
  'Nunito',
  'Playfair Display',
  'Merriweather',
  'Source Sans Pro',
  'Lora',
  'Space Grotesk',
];

export default function TemplateCustomizer({
  templateConfig,
  brandProfile,
  onSave,
  onCancel,
}: TemplateCustomizerProps) {
  const [config, setConfig] = useState<TemplateConfig>(templateConfig);
  const [logoUrl, setLogoUrl] = useState<string | null>(brandProfile?.logo_url || null);

  const handleColorChange = (colorKey: keyof TemplateConfig['colors'], value: string) => {
    setConfig({
      ...config,
      colors: {
        ...config.colors,
        [colorKey]: value,
      },
    });
  };

  const handleFontChange = (fontKey: 'headingFont' | 'bodyFont', value: string) => {
    setConfig({
      ...config,
      typography: {
        ...config.typography,
        [fontKey]: value,
      },
    });
  };

  const resetToBrandKit = () => {
    if (!brandProfile) return;

    const resetConfig = { ...config };

    // Reset colors to brand kit
    if (brandProfile.primary_color) resetConfig.colors.primary = brandProfile.primary_color;
    if (brandProfile.secondary_color) resetConfig.colors.secondary = brandProfile.secondary_color;
    if (brandProfile.accent_color) resetConfig.colors.accent = brandProfile.accent_color;
    if (brandProfile.background_color) resetConfig.colors.background = brandProfile.background_color;
    if (brandProfile.text_color) resetConfig.colors.text = brandProfile.text_color;

    // Reset fonts to brand kit
    if (brandProfile.heading_font) resetConfig.typography.headingFont = brandProfile.heading_font;
    if (brandProfile.body_font) resetConfig.typography.bodyFont = brandProfile.body_font;

    // Reset logo
    setLogoUrl(brandProfile.logo_url || null);

    setConfig(resetConfig);
  };

  const hasBrandKit = !!(
    brandProfile?.primary_color ||
    brandProfile?.logo_url ||
    brandProfile?.heading_font
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Customize Landing Page
            </CardTitle>
            <CardDescription>
              Adjust colors, fonts, and branding for your campaign
            </CardDescription>
          </div>

          {hasBrandKit && (
            <Button variant="outline" size="sm" onClick={resetToBrandKit}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Brand Kit
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Colors Section */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Colors
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Primary Color */}
            <div>
              <Label htmlFor="primary-color" className="text-xs">
                Primary Color
                {brandProfile?.primary_color && (
                  <span className="ml-1 text-green-600">
                    <Sparkles className="w-3 h-3 inline" />
                  </span>
                )}
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="primary-color"
                  type="color"
                  value={config.colors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={config.colors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="flex-1"
                  placeholder="#4F46E5"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div>
              <Label htmlFor="secondary-color" className="text-xs">
                Secondary Color
                {brandProfile?.secondary_color && (
                  <span className="ml-1 text-green-600">
                    <Sparkles className="w-3 h-3 inline" />
                  </span>
                )}
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="secondary-color"
                  type="color"
                  value={config.colors.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={config.colors.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="flex-1"
                  placeholder="#FF6B35"
                />
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <Label htmlFor="accent-color" className="text-xs">
                Accent Color
                {brandProfile?.accent_color && (
                  <span className="ml-1 text-green-600">
                    <Sparkles className="w-3 h-3 inline" />
                  </span>
                )}
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="accent-color"
                  type="color"
                  value={config.colors.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={config.colors.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="flex-1"
                  placeholder="#10B981"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography Section */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Type className="w-4 h-4" />
            Typography
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Heading Font */}
            <div>
              <Label htmlFor="heading-font" className="text-xs">
                Heading Font
                {brandProfile?.heading_font && (
                  <span className="ml-1 text-green-600">
                    <Sparkles className="w-3 h-3 inline" />
                  </span>
                )}
              </Label>
              <Select
                value={config.typography.headingFont}
                onValueChange={(value) => handleFontChange('headingFont', value)}
              >
                <SelectTrigger id="heading-font" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOOGLE_FONTS.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Body Font */}
            <div>
              <Label htmlFor="body-font" className="text-xs">
                Body Font
                {brandProfile?.body_font && (
                  <span className="ml-1 text-green-600">
                    <Sparkles className="w-3 h-3 inline" />
                  </span>
                )}
              </Label>
              <Select
                value={config.typography.bodyFont}
                onValueChange={(value) => handleFontChange('bodyFont', value)}
              >
                <SelectTrigger id="body-font" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOOGLE_FONTS.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Branding Section */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Branding
          </h3>

          <div>
            <Label htmlFor="logo-url" className="text-xs">
              Company Logo URL
              {brandProfile?.logo_url && (
                <span className="ml-1 text-green-600">
                  <Sparkles className="w-3 h-3 inline" /> From Brand Kit
                </span>
              )}
            </Label>
            <Input
              id="logo-url"
              type="text"
              value={logoUrl || ''}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="/images/logo.png"
              className="mt-1"
            />
            {logoUrl && (
              <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200">
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="h-12 w-auto object-contain"
                  onError={() => setLogoUrl(null)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={() => onSave(config, logoUrl)} className="flex-1">
            Save Changes
          </Button>
        </div>

        {/* Brand Kit Info */}
        {hasBrandKit && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-800">
              <Sparkles className="w-4 h-4 inline mr-1" />
              <strong>Brand Kit Applied:</strong> Your brand colors, fonts, and logo have been
              automatically applied. You can override them here if needed.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
