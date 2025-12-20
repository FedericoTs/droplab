"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Building2, MessageSquare, Layout, Loader2 } from "lucide-react";
import { QuickStartWizardData } from "./wizard-step-campaign";

interface WizardStepPreviewProps {
  data: QuickStartWizardData;
}

export function WizardStepPreview({ data }: WizardStepPreviewProps) {
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data.templateId) {
      loadTemplate();
    }
  }, [data.templateId]);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/campaigns/templates/${data.templateId}`);
      const result = await response.json();

      if (result.success) {
        setTemplate(result.data);
      }
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          🎉 Ready to Create Your Campaign!
        </h3>
        <p className="text-sm text-slate-700">
          Review the details below. You can edit or add stores after creation.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Campaign Name */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Campaign Name
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-900 font-semibold">{data.campaignName}</p>
          </CardContent>
        </Card>

        {/* Company Name */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              Company
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-900 font-semibold">{data.companyName}</p>
          </CardContent>
        </Card>

        {/* Marketing Message */}
        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-600" />
              Marketing Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-wrap">{data.message}</p>
          </CardContent>
        </Card>

        {/* Template */}
        {data.templateId && (
          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Layout className="h-4 w-4 text-orange-600" />
                Selected Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading template details...
                </div>
              ) : template ? (
                <div>
                  <p className="text-slate-900 font-semibold">{template.name}</p>
                  {template.description && (
                    <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {template.category}
                    </span>
                    <span className="text-xs text-slate-500">
                      Used {template.use_count} times
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">Template ID: {data.templateId}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Next Steps Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h4 className="font-medium text-slate-900 mb-2">What happens next:</h4>
        <ol className="text-sm text-slate-700 space-y-1 list-decimal list-inside">
          <li>Campaign will be created with your message and settings</li>
          <li>Template will be linked to the campaign for easy DM creation</li>
          <li>You can add stores and create orders from the campaign page</li>
          <li>Track performance in the Analytics dashboard</li>
        </ol>
      </div>
    </div>
  );
}
