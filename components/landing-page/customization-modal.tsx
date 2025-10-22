'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TemplateGallery } from './template-gallery';
import { LandingPageCustomizationForm, LandingPageCustomization } from './customization-form';
import { LandingPageLivePreview } from './live-preview';
import { toast } from 'sonner';
import { getTemplateColors } from '@/lib/landing-page-templates';
import { Loader2 } from 'lucide-react';

interface LandingPageCustomizationModalProps {
  open: boolean;
  campaignId: string;
  campaignName: string;
  companyName: string; // Company name for brand profile lookup
  campaignMessage: string;
  initialTemplateId?: string;
  initialConfig?: Partial<LandingPageCustomization>;
  onClose: () => void;
  onSave?: () => void;
}

export function LandingPageCustomizationModal({
  open,
  campaignId,
  campaignName,
  companyName,
  campaignMessage,
  initialTemplateId = 'book-appointment',
  initialConfig,
  onClose,
  onSave
}: LandingPageCustomizationModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplateId);
  const [brandKit, setBrandKit] = useState<any>(null);
  const [brandKitLoaded, setBrandKitLoaded] = useState(false);
  const [customization, setCustomization] = useState<LandingPageCustomization>({
    title: initialConfig?.title || `${campaignName} - Schedule Consultation`,
    ctaText: initialConfig?.ctaText || 'Book Appointment',
    // Initialize with empty colors - will be set by brand kit
    primaryColor: initialConfig?.primaryColor || '',
    secondaryColor: initialConfig?.secondaryColor || '',
    accentColor: initialConfig?.accentColor || '',
    message: campaignMessage
  });

  // Fetch brand kit on mount and initialize colors
  useEffect(() => {
    async function fetchBrandKit() {
      try {
        const response = await fetch(`/api/brand/profile?companyName=${encodeURIComponent(companyName)}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const profile = result.data;
            setBrandKit(profile);
            console.log('✅ Brand kit loaded:', {
              colors: { primary: profile.primary_color, secondary: profile.secondary_color, accent: profile.accent_color },
              logo: profile.logo_url
            });

            // Apply brand kit colors as defaults
            const templateColors = getTemplateColors(initialTemplateId);
            setCustomization(prev => ({
              ...prev,
              primaryColor: initialConfig?.primaryColor || profile.primary_color || templateColors.primary,
              secondaryColor: initialConfig?.secondaryColor || profile.secondary_color || templateColors.secondary,
              accentColor: initialConfig?.accentColor || profile.accent_color || templateColors.accent,
            }));
            setBrandKitLoaded(true);
          } else {
            // No brand kit - use template colors
            const templateColors = getTemplateColors(initialTemplateId);
            setCustomization(prev => ({
              ...prev,
              primaryColor: prev.primaryColor || templateColors.primary,
              secondaryColor: prev.secondaryColor || templateColors.secondary,
              accentColor: prev.accentColor || templateColors.accent,
            }));
            setBrandKitLoaded(true);
          }
        } else {
          // No brand kit - use template colors
          const templateColors = getTemplateColors(initialTemplateId);
          setCustomization(prev => ({
            ...prev,
            primaryColor: prev.primaryColor || templateColors.primary,
            secondaryColor: prev.secondaryColor || templateColors.secondary,
            accentColor: prev.accentColor || templateColors.accent,
          }));
          setBrandKitLoaded(true);
        }
      } catch (error) {
        console.error('Failed to fetch brand kit:', error);
        // Fallback to template colors
        const templateColors = getTemplateColors(initialTemplateId);
        setCustomization(prev => ({
          ...prev,
          primaryColor: prev.primaryColor || templateColors.primary,
          secondaryColor: prev.secondaryColor || templateColors.secondary,
          accentColor: prev.accentColor || templateColors.accent,
        }));
        setBrandKitLoaded(true);
      }
    }
    fetchBrandKit();
  }, [companyName, initialTemplateId, initialConfig]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // DON'T update colors when template changes - keep brand kit colors!
  // Template change only affects layout, not colors
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [selectedTemplate]);

  // Track changes in customization
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [customization]);

  // Handle save
  async function handleSave() {
    setIsSaving(true);
    try {
      // Call the existing API endpoint to update campaign landing page
      const response = await fetch(`/api/campaigns/${campaignId}/landing-page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          config: {
            title: customization.title,
            message: customization.message || campaignMessage,
            companyName: campaignName,
            formFields: ['name', 'email', 'phone', 'preferredDate'],
            ctaText: customization.ctaText,
            thankYouMessage: 'Thank you! We will contact you soon.',
            fallbackMessage: 'Welcome! Schedule your consultation today.',
            primaryColor: customization.primaryColor,
            secondaryColor: customization.secondaryColor,
            accentColor: customization.accentColor
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save customization');
      }

      toast.success('Landing page customized successfully!');
      setHasUnsavedChanges(false);
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error saving landing page customization:', error);
      toast.error('Failed to save customization. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  // Handle close with unsaved changes warning
  function handleClose() {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Landing Page</DialogTitle>
          <DialogDescription>
            Choose a template and customize colors, text, and design for your campaign landing page
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Left Column: Template Selection + Customization */}
          <div className="space-y-6">
            {/* Template Gallery */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Choose Template
              </h3>
              <TemplateGallery
                selectedId={selectedTemplate}
                onSelect={setSelectedTemplate}
              />
            </div>

            {/* Customization Form */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Customize Design
              </h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <LandingPageCustomizationForm
                  value={customization}
                  onChange={setCustomization}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Preview */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Live Preview
            </h3>
            {brandKitLoaded ? (
              <LandingPageLivePreview
                templateId={selectedTemplate}
                customization={customization}
                campaignId={campaignId}
              />
            ) : (
              <div className="border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center min-h-[500px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading brand kit...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {hasUnsavedChanges && <span className="text-amber-600">● Unsaved changes</span>}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Apply Changes'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
