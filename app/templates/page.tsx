"use client";

import { TemplateLibrary } from "@/components/analytics/template-library";

export default function TemplatesPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Campaign Templates</h1>
        <p className="text-slate-600">
          Start with proven templates or save your successful campaigns for future use
        </p>
      </div>

      <TemplateLibrary />
    </div>
  );
}
