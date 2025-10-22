'use client';

import { Monitor, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { LandingPageCustomization } from './customization-form';
import { cn } from '@/lib/utils';

interface LivePreviewProps {
  templateId: string;
  customization: LandingPageCustomization;
  campaignId: string;
}

export function LandingPageLivePreview({
  templateId,
  customization,
  campaignId
}: LivePreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Build preview URL with query params
  const previewParams = new URLSearchParams({
    template: templateId,
    config: JSON.stringify(customization)
  });

  const previewUrl = `/lp/campaign/${campaignId}/preview?${previewParams.toString()}`;

  return (
    <div className="border rounded-lg overflow-hidden bg-gray-50">
      {/* Preview Header */}
      <div className="bg-white px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Live Preview</span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
          <button
            onClick={() => setViewMode('desktop')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded transition-colors',
              viewMode === 'desktop'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Monitor className="h-3 w-3 inline mr-1" />
            Desktop
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded transition-colors',
              viewMode === 'mobile'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Smartphone className="h-3 w-3 inline mr-1" />
            Mobile
          </button>
        </div>
      </div>

      {/* Preview Iframe */}
      <div className="bg-gray-100 p-4 flex items-center justify-center min-h-[500px]">
        <div
          className={cn(
            'bg-white shadow-lg transition-all duration-300',
            viewMode === 'desktop' ? 'w-full h-[500px]' : 'w-[375px] h-[600px]'
          )}
        >
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title="Landing Page Preview"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </div>

      {/* Preview Footer */}
      <div className="bg-white px-4 py-2 border-t">
        <p className="text-xs text-gray-500">
          This is a live preview. Changes will be applied when you click "Apply Changes".
        </p>
      </div>
    </div>
  );
}
