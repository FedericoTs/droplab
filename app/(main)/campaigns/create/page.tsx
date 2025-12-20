'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WizardProgress } from '@/components/campaigns/wizard-progress';
import { Step1Template } from '@/components/campaigns/wizard-steps/step1-template';
import { Step2Audience } from '@/components/campaigns/wizard-steps/step2-audience';
import { Step3Mapping } from '@/components/campaigns/wizard-steps/step3-mapping';
import { Step4Review } from '@/components/campaigns/wizard-steps/step4-review';
import { toast } from 'sonner';
import type { CampaignWizardState, DesignTemplate, RecipientList, VariableMapping, LandingPageConfig } from '@/lib/database/types';
import { useBillingStatus } from '@/lib/hooks/use-billing-status';
import { FeatureLocked } from '@/components/billing/feature-locked';
import { Loader2, RefreshCw, X } from 'lucide-react';

// ==================== DRAFT AUTO-SAVE CONFIGURATION ====================
const DRAFT_STORAGE_KEY = 'droplab_campaign_draft';
const DRAFT_AUTOSAVE_DELAY = 3000; // 3 seconds debounce

// Initial empty state for fresh wizard
const getEmptyWizardState = (): CampaignWizardState => ({
  selectedTemplate: null,
  selectedRecipientList: null,
  audienceSource: null,
  variableMappings: [],
  campaignName: '',
  campaignDescription: '',
  currentStep: 1,
  includeLandingPage: false,
  landingPageConfig: {
    headline: '',
    subheadline: '',
    cta_text: '',
    cta_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#8B5CF6',
    background_color: '#FFFFFF',
  },
});

export default function CampaignCreatePage() {
  const { isFeatureLocked, isLoading } = useBillingStatus();
  const router = useRouter();
  const [wizardState, setWizardState] = useState<CampaignWizardState>(getEmptyWizardState());

  // ==================== DRAFT AUTO-SAVE STATE ====================
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);

  // Load saved draft on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const { state, timestamp } = JSON.parse(savedDraft);
        const draftDate = new Date(timestamp);
        const now = new Date();
        const hoursSinceDraft = (now.getTime() - draftDate.getTime()) / (1000 * 60 * 60);

        // Only show draft recovery if less than 24 hours old
        if (hoursSinceDraft < 24 && state.currentStep > 1) {
          setDraftTimestamp(draftDate.toLocaleString());
          setShowDraftBanner(true);
          console.log('📋 [Draft] Found saved draft from', draftDate.toLocaleString());
        } else if (hoursSinceDraft >= 24) {
          // Clear old drafts
          localStorage.removeItem(DRAFT_STORAGE_KEY);
          console.log('🗑️ [Draft] Cleared old draft (>24h old)');
        }
      }
    } catch (error) {
      console.warn('⚠️ [Draft] Error loading draft:', error);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, []);

  // Auto-save draft on state changes (debounced)
  useEffect(() => {
    // Skip auto-save on initial load or if on step 1 with no data
    if (!hasInitialized.current) return;
    if (wizardState.currentStep === 1 && !wizardState.selectedTemplate) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Debounced save
    autoSaveTimerRef.current = setTimeout(() => {
      try {
        const draftData = {
          state: wizardState,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
        console.log('💾 [Draft] Auto-saved at step', wizardState.currentStep);
      } catch (error) {
        console.warn('⚠️ [Draft] Error saving draft:', error);
      }
    }, DRAFT_AUTOSAVE_DELAY);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [wizardState]);

  // Restore draft handler
  const handleRestoreDraft = useCallback(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const { state } = JSON.parse(savedDraft);
        setWizardState(state);
        setShowDraftBanner(false);
        toast.success('Draft restored successfully');
        console.log('✅ [Draft] Restored to step', state.currentStep);
      }
    } catch (error) {
      console.error('❌ [Draft] Error restoring draft:', error);
      toast.error('Failed to restore draft');
    }
  }, []);

  // Dismiss draft handler
  const handleDismissDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setShowDraftBanner(false);
    toast.info('Draft discarded');
    console.log('🗑️ [Draft] Discarded by user');
  }, []);

  // Clear draft on successful campaign creation
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    console.log('✅ [Draft] Cleared after successful campaign creation');
  }, []);

  // Navigate to specific step (only allow going back)
  const handleStepClick = (step: number) => {
    if (step < wizardState.currentStep) {
      setWizardState((prev) => ({ ...prev, currentStep: step }));
    }
  };

  // Step 1: Template Selection
  const handleTemplateSelect = (template: DesignTemplate) => {
    setWizardState((prev) => ({ ...prev, selectedTemplate: template }));
  };

  const handleStep1Next = () => {
    setWizardState((prev) => ({ ...prev, currentStep: 2 }));
  };

  // Step 2: Audience Selection (to be implemented)
  const handleRecipientListSelect = (list: RecipientList) => {
    setWizardState((prev) => ({ ...prev, selectedRecipientList: list }));
  };

  const handleAudienceSourceSelect = (source: 'data_axle' | 'csv') => {
    setWizardState((prev) => ({ ...prev, audienceSource: source }));
  };

  const handleStep2Next = () => {
    setWizardState((prev) => ({ ...prev, currentStep: 3 }));
  };

  const handleStep2Back = () => {
    setWizardState((prev) => ({ ...prev, currentStep: 1 }));
  };

  // Step 3: Variable Mapping (to be implemented)
  const handleVariableMappingsChange = (mappings: VariableMapping[]) => {
    setWizardState((prev) => ({ ...prev, variableMappings: mappings }));
  };

  const handleStep3Next = () => {
    setWizardState((prev) => ({ ...prev, currentStep: 4 }));
  };

  const handleStep3Back = () => {
    setWizardState((prev) => ({ ...prev, currentStep: 2 }));
  };

  // Step 4: Review & Launch
  const handleCampaignNameChange = (name: string) => {
    setWizardState((prev) => ({ ...prev, campaignName: name }));
  };

  const handleCampaignDescriptionChange = (description: string) => {
    setWizardState((prev) => ({ ...prev, campaignDescription: description }));
  };

  const handleIncludeLandingPageChange = (enabled: boolean) => {
    setWizardState((prev) => ({ ...prev, includeLandingPage: enabled }));
  };

  const handleLandingPageConfigChange = (config: LandingPageConfig) => {
    setWizardState((prev) => ({ ...prev, landingPageConfig: config }));
  };

  const handleCampaignLaunch = async () => {
    if (!wizardState.selectedTemplate || !wizardState.selectedRecipientList) {
      toast.error('Missing required data');
      return;
    }

    if (!wizardState.campaignName.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }

    console.log('🚀 Launching campaign with state:', wizardState);

    // Create campaign in database
    const response = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: wizardState.campaignName,
        description: wizardState.campaignDescription,
        templateId: wizardState.selectedTemplate.id,
        recipientListId: wizardState.selectedRecipientList.id,
        designSnapshot: wizardState.selectedTemplate.canvas_json,
        variableMappingsSnapshot: wizardState.variableMappings,
        totalRecipients: wizardState.selectedRecipientList.total_recipients,
        status: 'draft',
        // Landing page configuration (optional)
        includeLandingPage: wizardState.includeLandingPage,
        landingPageConfig: wizardState.includeLandingPage ? wizardState.landingPageConfig : undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create campaign');
    }

    const { data: campaign } = await response.json();
    console.log('✅ Campaign created:', campaign);

    // Clear draft on successful creation
    clearDraft();

    toast.success('Campaign created successfully!');

    // Redirect to campaign dashboard
    router.push('/campaigns');
  };

  const handleStep4Back = () => {
    setWizardState((prev) => ({ ...prev, currentStep: 3 }));
  };

  // Render current step
  const renderStep = () => {
    switch (wizardState.currentStep) {
      case 1:
        return (
          <Step1Template
            selectedTemplate={wizardState.selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
            onNext={handleStep1Next}
          />
        );

      case 2:
        return (
          <Step2Audience
            selectedRecipientList={wizardState.selectedRecipientList}
            audienceSource={wizardState.audienceSource}
            onRecipientListSelect={handleRecipientListSelect}
            onAudienceSourceSelect={handleAudienceSourceSelect}
            onNext={handleStep2Next}
            onBack={handleStep2Back}
          />
        );

      case 3:
        return (
          <Step3Mapping
            selectedTemplate={wizardState.selectedTemplate}
            variableMappings={wizardState.variableMappings}
            onVariableMappingsChange={handleVariableMappingsChange}
            onNext={handleStep3Next}
            onBack={handleStep3Back}
          />
        );

      case 4:
        return (
          <Step4Review
            selectedTemplate={wizardState.selectedTemplate}
            selectedRecipientList={wizardState.selectedRecipientList}
            variableMappings={wizardState.variableMappings}
            campaignName={wizardState.campaignName}
            campaignDescription={wizardState.campaignDescription}
            includeLandingPage={wizardState.includeLandingPage}
            landingPageConfig={wizardState.landingPageConfig}
            onCampaignNameChange={handleCampaignNameChange}
            onCampaignDescriptionChange={handleCampaignDescriptionChange}
            onIncludeLandingPageChange={handleIncludeLandingPageChange}
            onLandingPageConfigChange={handleLandingPageConfigChange}
            onLaunch={handleCampaignLaunch}
            onBack={handleStep4Back}
          />
        );

      default:
        return null;
    }
  };

  // Show loading state while checking billing status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-600 mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show locked state if feature is not accessible
  if (isFeatureLocked('campaigns')) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-slate-900">Create New Campaign</h1>
            <p className="text-slate-600 mt-2">
              Campaign creation requires an active subscription
            </p>
          </div>
        </div>

        {/* Locked Feature UI */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <FeatureLocked feature="campaigns" variant="card" showDetails={true} />
        </div>
      </div>
    );
  }

  // Show normal wizard for paid users
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900">Create New Campaign</h1>
          <p className="text-slate-600 mt-2">
            Follow the steps below to create and launch your direct mail campaign
          </p>
        </div>
      </div>

      {/* Draft Recovery Banner */}
      {showDraftBanner && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  You have an unsaved campaign draft
                </p>
                <p className="text-xs text-blue-700">
                  Last saved: {draftTimestamp}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismissDraft}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                <X className="h-4 w-4 mr-1" />
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleRestoreDraft}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Restore Draft
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Progress */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <WizardProgress
          currentStep={wizardState.currentStep}
          onStepClick={handleStepClick}
        />
      </div>

      {/* Step Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Card>
          <CardContent className="p-6 sm:p-8 lg:p-12">
            {renderStep()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
