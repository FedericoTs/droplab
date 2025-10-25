"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface QuickStartWizardData {
  // Step 1: Campaign Info
  campaignName: string;
  message: string;
  companyName: string;

  // Step 2: Template Selection
  templateId: string;

  // Step 3: Preview (derived)
  previewUrl?: string;
}

interface WizardStepCampaignProps {
  data: Partial<QuickStartWizardData>;
  onChange: (data: Partial<QuickStartWizardData>) => void;
}

export function WizardStepCampaign({ data, onChange }: WizardStepCampaignProps) {
  const [generatingCopy, setGeneratingCopy] = useState(false);

  const handleAIGenerate = async () => {
    if (!data.message?.trim()) {
      toast.error('Please enter a brief idea or prompt for AI to work with');
      return;
    }

    setGeneratingCopy(true);

    try {
      const response = await fetch('/api/copywriting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: data.message,
          companyName: data.companyName,
        }),
      });

      const result = await response.json();

      if (result.success && result.data.variations?.length > 0) {
        // Use first variation
        const firstVariation = result.data.variations[0];
        onChange({
          ...data,
          message: firstVariation.copy,
        });
        toast.success('AI-generated copy added!');
      } else {
        toast.error('Failed to generate copy');
      }
    } catch (error) {
      console.error('Error generating copy:', error);
      toast.error('Failed to generate copy');
    } finally {
      setGeneratingCopy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="campaign-name">Campaign Name *</Label>
        <Input
          id="campaign-name"
          value={data.campaignName || ''}
          onChange={(e) => onChange({ ...data, campaignName: e.target.value })}
          placeholder="e.g., Summer Sale 2025"
          className="mt-2"
          autoFocus
        />
        <p className="text-xs text-slate-500 mt-1">
          This will help you identify the campaign later
        </p>
      </div>

      <div>
        <Label htmlFor="company-name">Company Name *</Label>
        <Input
          id="company-name"
          value={data.companyName || ''}
          onChange={(e) => onChange({ ...data, companyName: e.target.value })}
          placeholder="e.g., Acme Corp"
          className="mt-2"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="message">Marketing Message *</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAIGenerate}
            disabled={generatingCopy || !data.message?.trim()}
            className="gap-2"
          >
            {generatingCopy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                AI Enhance
              </>
            )}
          </Button>
        </div>
        <Textarea
          id="message"
          value={data.message || ''}
          onChange={(e) => onChange({ ...data, message: e.target.value })}
          placeholder="Enter your marketing message or a brief idea (then click AI Enhance)"
          rows={6}
          className="resize-none"
        />
        <p className="text-xs text-slate-500 mt-1">
          Enter a brief idea or full message. Click "AI Enhance" to improve it with AI.
        </p>
      </div>
    </div>
  );
}
