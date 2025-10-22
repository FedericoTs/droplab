'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Code, Plus, Trash2, Edit2, Power, Check, X } from 'lucide-react';
import type { TrackingSnippet } from '@/types/landing-page-template';

// Quick setup templates
const SNIPPET_TEMPLATES = {
  google_analytics: {
    name: 'Google Analytics 4',
    snippet_type: 'google_analytics',
    position: 'head' as const,
    code: `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>`,
  },
  adobe_analytics: {
    name: 'Adobe Analytics',
    snippet_type: 'adobe_analytics',
    position: 'head' as const,
    code: `<!-- Adobe Analytics -->
<script src="https://assets.adobedtm.com/YOUR_PROPERTY_ID/satelliteLib-YOUR_ID.js" async></script>`,
  },
  facebook_pixel: {
    name: 'Facebook Pixel',
    snippet_type: 'facebook_pixel',
    position: 'head' as const,
    code: `<!-- Facebook Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
<noscript>
  <img height="1" width="1" style="display:none"
       src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"/>
</noscript>
<!-- End Facebook Pixel Code -->`,
  },
  google_tag_manager: {
    name: 'Google Tag Manager',
    snippet_type: 'google_tag_manager',
    position: 'head' as const,
    code: `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXX');</script>
<!-- End Google Tag Manager -->`,
  },
};

export default function TrackingSnippets() {
  const [snippets, setSnippets] = useState<TrackingSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    snippet_type: 'custom',
    code: '',
    position: 'head' as 'head' | 'body',
  });

  useEffect(() => {
    loadSnippets();
  }, []);

  const loadSnippets = async () => {
    try {
      const response = await fetch('/api/tracking-snippets');
      if (response.ok) {
        const data = await response.json();
        setSnippets(data.snippets || []);
      }
    } catch (error) {
      console.error('Error loading snippets:', error);
      toast.error('Failed to load tracking snippets');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSetup = (templateKey: keyof typeof SNIPPET_TEMPLATES) => {
    const template = SNIPPET_TEMPLATES[templateKey];
    setFormData({
      name: template.name,
      snippet_type: template.snippet_type,
      code: template.code,
      position: template.position,
    });
    setShowAddForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) {
      toast.error('Please provide name and code');
      return;
    }

    try {
      if (editingId) {
        // Update existing snippet
        const response = await fetch('/api/tracking-snippets', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            updates: formData,
          }),
        });

        if (!response.ok) throw new Error('Failed to update');

        toast.success('Snippet updated successfully');
      } else {
        // Create new snippet
        const response = await fetch('/api/tracking-snippets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error('Failed to create');

        toast.success('Snippet created successfully');
      }

      // Reset form
      setFormData({
        name: '',
        snippet_type: 'custom',
        code: '',
        position: 'head',
      });
      setShowAddForm(false);
      setEditingId(null);
      loadSnippets();
    } catch (error) {
      console.error('Error saving snippet:', error);
      toast.error('Failed to save snippet');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const response = await fetch('/api/tracking-snippets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'toggle' }),
      });

      if (!response.ok) throw new Error('Failed to toggle');

      toast.success('Snippet status updated');
      loadSnippets();
    } catch (error) {
      console.error('Error toggling snippet:', error);
      toast.error('Failed to update snippet');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tracking snippet?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tracking-snippets?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Snippet deleted successfully');
      loadSnippets();
    } catch (error) {
      console.error('Error deleting snippet:', error);
      toast.error('Failed to delete snippet');
    }
  };

  const handleEdit = (snippet: TrackingSnippet) => {
    setFormData({
      name: snippet.name,
      snippet_type: snippet.snippet_type,
      code: snippet.code,
      position: snippet.position as 'head' | 'body',
    });
    setEditingId(snippet.id);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      snippet_type: 'custom',
      code: '',
      position: 'head',
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-slate-500">Loading tracking snippets...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Analytics Tracking Snippets
              </CardTitle>
              <CardDescription>
                Add Google Analytics, Adobe, or custom tracking codes to your landing pages
              </CardDescription>
            </div>

            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Custom
            </Button>
          </div>
        </CardHeader>

        {/* Quick Setup Templates */}
        <CardContent>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Setup</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleQuickSetup('google_analytics')}
              >
                <Code className="w-4 h-4 mr-2" />
                Google Analytics 4
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleQuickSetup('google_tag_manager')}
              >
                <Code className="w-4 h-4 mr-2" />
                Google Tag Manager
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleQuickSetup('adobe_analytics')}
              >
                <Code className="w-4 h-4 mr-2" />
                Adobe Analytics
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleQuickSetup('facebook_pixel')}
              >
                <Code className="w-4 h-4 mr-2" />
                Facebook Pixel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit' : 'Add'} Tracking Snippet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="snippet-name">Snippet Name</Label>
              <Input
                id="snippet-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Google Analytics 4"
              />
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="snippet-type">Type</Label>
              <Select
                value={formData.snippet_type}
                onValueChange={(value) => setFormData({ ...formData, snippet_type: value })}
              >
                <SelectTrigger id="snippet-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google_analytics">Google Analytics</SelectItem>
                  <SelectItem value="google_tag_manager">Google Tag Manager</SelectItem>
                  <SelectItem value="adobe_analytics">Adobe Analytics</SelectItem>
                  <SelectItem value="facebook_pixel">Facebook Pixel</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Position */}
            <div>
              <Label htmlFor="snippet-position">Injection Position</Label>
              <Select
                value={formData.position}
                onValueChange={(value: 'head' | 'body') =>
                  setFormData({ ...formData, position: value })
                }
              >
                <SelectTrigger id="snippet-position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="head">Head (recommended for analytics)</SelectItem>
                  <SelectItem value="body">Body (after opening tag)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Code */}
            <div>
              <Label htmlFor="snippet-code">Tracking Code</Label>
              <textarea
                id="snippet-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="<script>...</script>"
                rows={8}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                Paste the complete tracking code provided by your analytics platform
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSubmit} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                {editingId ? 'Update' : 'Create'} Snippet
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Snippets List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Tracking Snippets ({snippets.filter((s) => s.is_active).length})</CardTitle>
          <CardDescription>
            Active snippets are automatically injected into all landing pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {snippets.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Code className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No tracking snippets configured</p>
              <p className="text-sm mt-1">Add your first snippet using Quick Setup above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {snippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className={`p-4 border rounded-lg ${
                    snippet.is_active ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900">{snippet.name}</h4>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            snippet.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {snippet.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 capitalize">
                          {snippet.snippet_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Position: <span className="font-mono">&lt;{snippet.position}&gt;</span> • Created:{' '}
                        {new Date(snippet.created_at).toLocaleDateString()}
                      </p>
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                          View code
                        </summary>
                        <pre className="mt-2 p-2 bg-slate-800 text-slate-100 rounded text-xs overflow-x-auto">
                          {snippet.code}
                        </pre>
                      </details>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(snippet.id)}
                        title={snippet.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <Power
                          className={`w-4 h-4 ${
                            snippet.is_active ? 'text-green-600' : 'text-slate-400'
                          }`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(snippet)}
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(snippet.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>How it works:</strong> Active tracking snippets are automatically injected into the{' '}
          <code className="px-1 py-0.5 bg-blue-100 rounded">&lt;head&gt;</code> or{' '}
          <code className="px-1 py-0.5 bg-blue-100 rounded">&lt;body&gt;</code> section of your campaign
          landing pages. This allows you to track page views, conversions, and user behavior across all
          campaigns.
        </p>
      </div>
    </div>
  );
}
