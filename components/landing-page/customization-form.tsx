'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface LandingPageCustomization {
  title: string;
  ctaText: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  message?: string;
}

interface CustomizationFormProps {
  value: LandingPageCustomization;
  onChange: (value: LandingPageCustomization) => void;
}

export function LandingPageCustomizationForm({
  value,
  onChange
}: CustomizationFormProps) {
  return (
    <div className="space-y-4">
      {/* Page Title */}
      <div>
        <Label htmlFor="lp-title" className="text-sm font-medium">
          Page Title
        </Label>
        <Input
          id="lp-title"
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder="Schedule Your Consultation"
          className="mt-1.5"
        />
        <p className="text-xs text-gray-500 mt-1">
          Main heading visitors will see on the landing page
        </p>
      </div>

      {/* CTA Button Text */}
      <div>
        <Label htmlFor="lp-cta" className="text-sm font-medium">
          Call-to-Action Button Text
        </Label>
        <Input
          id="lp-cta"
          value={value.ctaText}
          onChange={(e) => onChange({ ...value, ctaText: e.target.value })}
          placeholder="Book Appointment"
          className="mt-1.5"
        />
        <p className="text-xs text-gray-500 mt-1">
          Text displayed on the primary action button
        </p>
      </div>

      {/* Campaign Message (Optional) */}
      {value.message !== undefined && (
        <div>
          <Label htmlFor="lp-message" className="text-sm font-medium">
            Campaign Message
          </Label>
          <Textarea
            id="lp-message"
            value={value.message}
            onChange={(e) => onChange({ ...value, message: e.target.value })}
            placeholder="Your personalized campaign message"
            className="mt-1.5 min-h-[80px]"
          />
          <p className="text-xs text-gray-500 mt-1">
            Main message displayed to visitors
          </p>
        </div>
      )}

      {/* Color Customization */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Brand Colors
        </Label>
        <div className="grid grid-cols-3 gap-3">
          {/* Primary Color */}
          <div>
            <Label htmlFor="lp-primary-color" className="text-xs text-gray-600 mb-1.5 block">
              Primary
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="lp-primary-color"
                value={value.primaryColor}
                onChange={(e) => onChange({ ...value, primaryColor: e.target.value })}
                className="h-10 w-full rounded border border-gray-300 cursor-pointer"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{value.primaryColor}</p>
          </div>

          {/* Secondary Color */}
          <div>
            <Label htmlFor="lp-secondary-color" className="text-xs text-gray-600 mb-1.5 block">
              Secondary
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="lp-secondary-color"
                value={value.secondaryColor}
                onChange={(e) => onChange({ ...value, secondaryColor: e.target.value })}
                className="h-10 w-full rounded border border-gray-300 cursor-pointer"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{value.secondaryColor}</p>
          </div>

          {/* Accent Color */}
          <div>
            <Label htmlFor="lp-accent-color" className="text-xs text-gray-600 mb-1.5 block">
              Accent
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="lp-accent-color"
                value={value.accentColor}
                onChange={(e) => onChange({ ...value, accentColor: e.target.value })}
                className="h-10 w-full rounded border border-gray-300 cursor-pointer"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{value.accentColor}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          These colors will be applied to your selected template
        </p>
      </div>
    </div>
  );
}
