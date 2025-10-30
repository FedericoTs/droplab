'use client';

import { useState } from 'react';
import { CanvasEditor } from '@/components/design/canvas-editor';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async (data: {
    canvasJSON: string;
    variableMappings: Record<string, any>;
    preview: string;
  }) => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please sign in to save templates');
        router.push('/login');
        return;
      }

      // Get user's organization
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        toast.error('User profile not found');
        return;
      }

      // Save template to database
      const { error } = await supabase
        .from('design_templates')
        .insert({
          organization_id: profile.organization_id,
          name: templateName,
          description: templateDescription || null,
          canvas_json: data.canvasJSON,
          variable_mappings: data.variableMappings,
          preview_image_url: data.preview, // Store as base64 for now
          template_type: 'postcard',
          canvas_dimensions: {
            width: 1800,
            height: 1200,
            dpi: 300,
            inches: { width: 6, height: 4 }
          },
          is_public: false,
        });

      if (error) {
        console.error('Save error:', error);
        toast.error('Failed to save template: ' + error.message);
        return;
      }

      toast.success('Template saved to database!');
      setTemplateName('');
      setTemplateDescription('');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Design Template Editor</h1>
        <p className="text-muted-foreground">
          Create professional direct mail templates with the Fabric.js canvas editor
        </p>
      </div>

      {/* Template Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
          <CardDescription>
            Enter a name and description for your template
          </CardDescription>
        </CardHeader>
        <div className="p-6 pt-0 space-y-4">
          <div>
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              placeholder="e.g., Summer Sale Postcard"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="template-description">Description</Label>
            <Input
              id="template-description"
              placeholder="Optional description"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Canvas Editor */}
      <CanvasEditor onSave={handleSave} />

      {isSaving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6">
            <p className="text-lg">Saving template...</p>
          </Card>
        </div>
      )}
    </div>
  );
}
