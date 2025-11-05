"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Calendar, Maximize2, FileText, Loader2, RefreshCw, Zap, Trash2 } from 'lucide-react'
import { DesignTemplate } from '@/lib/database/types'
import { toast } from 'sonner'
import { CreateCampaignModal } from '@/components/campaigns/create-campaign-modal'

interface TemplateLibraryProps {
  organizationId: string
  onLoadTemplate: (template: DesignTemplate) => void
  onClose?: () => void
}

export function TemplateLibrary({ organizationId, onLoadTemplate, onClose }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<DesignTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<DesignTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFormat, setSelectedFormat] = useState<string>('all')
  const [campaignModalOpen, setCampaignModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<DesignTemplate | null>(null)

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates()
  }, [organizationId])

  // Filter templates when search or format changes
  useEffect(() => {
    filterTemplates()
  }, [searchQuery, selectedFormat, templates])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const url = `/api/design-templates?organizationId=${organizationId}`
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch templates')
      }

      setTemplates(data.templates || [])
      toast.success(`Loaded ${data.count} template${data.count === 1 ? '' : 's'}`)
    } catch (error) {
      console.error('❌ Failed to fetch templates:', error)
      toast.error('Failed to load templates')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = [...templates]

    // Filter by search query (name or description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      )
    }

    // Filter by format type
    if (selectedFormat !== 'all') {
      filtered = filtered.filter(t => t.format_type === selectedFormat)
    }

    setFilteredTemplates(filtered)
  }

  const handleLoadTemplate = (template: DesignTemplate) => {
    onLoadTemplate(template)
    onClose?.()
  }

  const handleCreateCampaign = (template: DesignTemplate) => {
    // 🔍 ULTRA-DEBUG: Log template structure before passing to modal
    console.log('🔍 [TEMPLATE LIBRARY] Opening Create Campaign for template:', template.name);
    console.log('🔍 [TEMPLATE LIBRARY] Template canvas_json type:', typeof template.canvas_json);
    console.log('🔍 [TEMPLATE LIBRARY] Template canvas_json:', template.canvas_json);

    if (typeof template.canvas_json === 'object') {
      console.log('🔍 [TEMPLATE LIBRARY] Canvas objects count:', template.canvas_json.objects?.length || 0);
      template.canvas_json.objects?.forEach((obj: any, idx: number) => {
        console.log(`🔍 [TEMPLATE LIBRARY] Object ${idx}:`, {
          type: obj.type,
          hasText: !!obj.text,
          textContent: obj.text,
          textLength: obj.text?.length || 0,
        });
      });
    }

    setSelectedTemplate(template)
    setCampaignModalOpen(true)
  }

  const handleDeleteTemplate = async (template: DesignTemplate, e: React.MouseEvent) => {
    e.stopPropagation()

    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${template.name}"?\n\nThis action cannot be undone.`
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/design-templates?id=${template.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete template')
      }

      toast.success(`Template "${template.name}" deleted successfully`)

      // Refresh templates list
      fetchTemplates()
    } catch (error) {
      console.error('❌ Failed to delete template:', error)
      toast.error('Failed to delete template')
    }
  }

  const formatTypes = [
    { value: 'all', label: 'All Formats' },
    { value: 'postcard_4x6', label: '4×6 Postcard' },
    { value: 'postcard_6x9', label: '6×9 Postcard' },
    { value: 'postcard_6x11', label: '6×11 Postcard' },
    { value: 'letter_8.5x11', label: '8.5×11 Letter' },
    { value: 'selfmailer_11x17', label: '11×17 Self Mailer' },
    { value: 'doorhanger_4x11', label: '4×11 Door Hanger' },
  ]

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <span className="ml-3 text-slate-600">Loading templates...</span>
        </div>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No Templates Yet</h3>
        <p className="text-sm text-slate-500 mb-4">
          Create your first template using the canvas editor
        </p>
        <Button onClick={fetchTemplates} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with count and refresh */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {filteredTemplates.length} of {templates.length} template{templates.length === 1 ? '' : 's'}
        </p>
        <Button onClick={fetchTemplates} variant="ghost" size="sm">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {formatTypes.map(format => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">No templates match your search</p>
          <Button
            onClick={() => {
              setSearchQuery('')
              setSelectedFormat('all')
            }}
            variant="link"
            size="sm"
            className="mt-2"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
              {/* Thumbnail */}
              <div className="relative bg-slate-100 h-32 overflow-hidden">
                {template.thumbnail_url ? (
                  <img
                    src={template.thumbnail_url}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <FileText className="w-12 h-12" />
                  </div>
                )}

                {/* Format badge overlay */}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-white/90 text-xs">
                    {template.format_type.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Delete button overlay - z-20 to be above hover overlay */}
                <button
                  onClick={(e) => handleDeleteTemplate(template, e)}
                  className="absolute top-2 left-2 z-20 p-1.5 rounded-md bg-white/90 text-red-600 hover:bg-red-50 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  aria-label="Delete template"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Hover overlay with action buttons */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <Button
                    onClick={() => handleLoadTemplate(template)}
                    size="sm"
                    className="shadow-lg"
                  >
                    Load Template
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCreateCampaign(template)
                    }}
                    size="sm"
                    variant="outline"
                    className="shadow-lg bg-white"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              </div>

              {/* Template Info */}
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm text-slate-900 mb-1 truncate">
                  {template.name}
                </h3>

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Maximize2 className="w-3 h-3" />
                    <span>{template.canvas_width}×{template.canvas_height}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(template.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Campaign Creation Modal */}
      <CreateCampaignModal
        template={selectedTemplate}
        open={campaignModalOpen}
        onClose={() => {
          setCampaignModalOpen(false)
          setSelectedTemplate(null)
        }}
      />
    </div>
  )
}
