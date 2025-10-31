'use client';

import { useState } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  showInput?: boolean;
}

export function ColorPicker({ color, onChange, label, showInput = true }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <div className="flex gap-2 items-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-10 h-10 p-0 border-2"
              style={{ backgroundColor: color }}
              aria-label="Pick color"
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-3">
              <HexColorPicker color={color} onChange={onChange} />
              {showInput && (
                <div className="space-y-1">
                  <Label className="text-xs">Hex Color</Label>
                  <HexColorInput
                    color={color}
                    onChange={onChange}
                    prefixed
                    alpha
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
              )}
              {/* Preset colors */}
              <div className="space-y-1">
                <Label className="text-xs">Presets</Label>
                <div className="grid grid-cols-8 gap-1">
                  {[
                    '#000000', '#FFFFFF', '#FF0000', '#00FF00',
                    '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
                    '#FF6B35', '#004E89', '#F77F00', '#06A77D',
                    '#D62828', '#8338EC', '#3A86FF', '#FB5607'
                  ].map((presetColor) => (
                    <button
                      key={presetColor}
                      className="w-6 h-6 rounded border-2 hover:border-slate-400 transition-colors"
                      style={{ backgroundColor: presetColor }}
                      onClick={() => {
                        onChange(presetColor);
                        setOpen(false);
                      }}
                      aria-label={`Select ${presetColor}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {showInput && (
          <HexColorInput
            color={color}
            onChange={onChange}
            prefixed
            className="flex-1 px-3 py-2 text-sm border rounded-md font-mono"
            placeholder="#000000"
          />
        )}
      </div>
    </div>
  );
}
