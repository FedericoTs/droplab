'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface FontSelectorProps {
  fontFamily: string;
  fontSize?: number;
  fontWeight?: number;
  onFontFamilyChange: (font: string) => void;
  onFontSizeChange?: (size: number) => void;
  onFontWeightChange?: (weight: number) => void;
  showSize?: boolean;
  showWeight?: boolean;
  label?: string;
}

// Popular Google Fonts and system fonts
const POPULAR_FONTS = [
  // System fonts (always available)
  { name: 'Arial', category: 'system' },
  { name: 'Helvetica', category: 'system' },
  { name: 'Times New Roman', category: 'system' },
  { name: 'Georgia', category: 'system' },
  { name: 'Courier New', category: 'system' },
  { name: 'Verdana', category: 'system' },

  // Popular Google Fonts
  { name: 'Roboto', category: 'google' },
  { name: 'Open Sans', category: 'google' },
  { name: 'Lato', category: 'google' },
  { name: 'Montserrat', category: 'google' },
  { name: 'Oswald', category: 'google' },
  { name: 'Raleway', category: 'google' },
  { name: 'Poppins', category: 'google' },
  { name: 'Merriweather', category: 'google' },
  { name: 'Playfair Display', category: 'google' },
  { name: 'Inter', category: 'google' },
  { name: 'Nunito', category: 'google' },
  { name: 'PT Sans', category: 'google' },
  { name: 'Source Sans Pro', category: 'google' },
  { name: 'Ubuntu', category: 'google' },
  { name: 'Bebas Neue', category: 'google' },
];

const FONT_WEIGHTS = [
  { value: 300, label: 'Light' },
  { value: 400, label: 'Normal' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semi Bold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extra Bold' },
];

export function FontSelector({
  fontFamily,
  fontSize = 16,
  fontWeight = 400,
  onFontFamilyChange,
  onFontSizeChange,
  onFontWeightChange,
  showSize = true,
  showWeight = true,
  label = 'Font',
}: FontSelectorProps) {
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  // Load Google Font dynamically
  const loadGoogleFont = (fontName: string) => {
    if (loadedFonts.has(fontName)) return;

    const font = POPULAR_FONTS.find(f => f.name === fontName);
    if (!font || font.category !== 'google') return;

    // Load font from Google Fonts
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    setLoadedFonts(prev => new Set(prev).add(fontName));
  };

  // Load current font on mount
  useEffect(() => {
    loadGoogleFont(fontFamily);
  }, [fontFamily]);

  return (
    <div className="space-y-4">
      {/* Font Family */}
      <div className="space-y-2">
        {label && <Label className="text-sm font-medium">{label}</Label>}
        <Select value={fontFamily} onValueChange={(value) => {
          onFontFamilyChange(value);
          loadGoogleFont(value);
        }}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {/* System Fonts */}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              System Fonts
            </div>
            {POPULAR_FONTS.filter(f => f.category === 'system').map((font) => (
              <SelectItem
                key={font.name}
                value={font.name}
                style={{ fontFamily: font.name }}
              >
                {font.name}
              </SelectItem>
            ))}

            {/* Google Fonts */}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
              Google Fonts
            </div>
            {POPULAR_FONTS.filter(f => f.category === 'google').map((font) => (
              <SelectItem
                key={font.name}
                value={font.name}
                style={{ fontFamily: loadedFonts.has(font.name) ? font.name : 'inherit' }}
                onMouseEnter={() => loadGoogleFont(font.name)}
              >
                {font.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      {showSize && onFontSizeChange && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Size</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={fontSize}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 16;
                  onFontSizeChange(Math.max(8, Math.min(200, value)));
                }}
                className="w-16 h-8 px-2 text-sm"
                min={8}
                max={200}
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
          <Slider
            value={[fontSize]}
            onValueChange={([value]) => onFontSizeChange(value)}
            min={8}
            max={200}
            step={1}
            className="w-full"
          />
        </div>
      )}

      {/* Font Weight */}
      {showWeight && onFontWeightChange && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Weight</Label>
          <Select value={fontWeight.toString()} onValueChange={(value) => onFontWeightChange(parseInt(value))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_WEIGHTS.map((weight) => (
                <SelectItem key={weight.value} value={weight.value.toString()}>
                  {weight.label} ({weight.value})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
