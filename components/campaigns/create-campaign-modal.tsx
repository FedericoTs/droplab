"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  detectTemplateVariables,
  generateSampleCSV,
  downloadCSVSample,
  TemplateVariable,
} from '@/lib/campaigns/variable-detection'
import { DesignTemplate } from '@/lib/database/types'
import { CSVUploader } from './csv-uploader'
import {
  processBatchPersonalization,
  PersonalizationJob,
  PersonalizedVariant,
  PersonalizationProgress,
} from '@/lib/campaigns/personalization-engine'

interface CreateCampaignModalProps {
  template: DesignTemplate | null
  open: boolean
  onClose: () => void
  onCampaignCreated?: (campaignId: string) => void
}

type Step = 'variables' | 'upload' | 'processing'

export function CreateCampaignModal({
  template,
  open,
  onClose,
  onCampaignCreated,
}: CreateCampaignModalProps) {
  const [step, setStep] = useState<Step>('variables')
  const [variables, setVariables] = useState<TemplateVariable[]>([])
  const [csvDownloaded, setCsvDownloaded] = useState(false)
  const [csvData, setCsvData] = useState<Record<string, string>[]>([])
  const [csvColumns, setCsvColumns] = useState<string[]>([])
  const [variants, setVariants] = useState<PersonalizedVariant[]>([])
  const [progress, setProgress] = useState<PersonalizationProgress | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Detect variables when template changes
  useEffect(() => {
    if (template?.canvas_json) {
      try {
        const canvasJSON = typeof template.canvas_json === 'string'
          ? JSON.parse(template.canvas_json)
          : template.canvas_json

        const detected = detectTemplateVariables(canvasJSON)
        setVariables(detected)
      } catch (error) {
        console.error('❌ Failed to parse canvas JSON:', error)
        setVariables([])
      }
    }
  }, [template])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep('variables')
      setCsvDownloaded(false)
      setCsvData([])
      setCsvColumns([])
    }
  }, [open])

  const handleCSVDataLoaded = (data: Record<string, string>[], columns: string[]) => {
    setCsvData(data)
    setCsvColumns(columns)
  }

  const handleGenerateCampaign = async () => {
    if (!template || csvData.length === 0) return

    try {
      setIsProcessing(true)
      setStep('processing')
      setVariants([])
      setProgress(null)

      // Parse canvas JSON
      const canvasJSON = typeof template.canvas_json === 'string'
        ? JSON.parse(template.canvas_json)
        : template.canvas_json

      // Create personalization job
      const job: PersonalizationJob = {
        templateId: template.id,
        templateName: template.name,
        canvasJSON,
        csvData,
        totalVariants: csvData.length,
        organizationId: template.organization_id,
      }

      // Process in batches with progress tracking
      const allVariants: PersonalizedVariant[] = []

      for await (const batchVariants of processBatchPersonalization(job, setProgress)) {
        allVariants.push(...batchVariants)
        setVariants([...allVariants]) // Update state with accumulated variants
      }

      toast.success(`Successfully generated ${allVariants.length} personalized variants!`)
      setIsProcessing(false)
    } catch (error) {
      console.error('❌ Failed to generate campaign:', error)
      toast.error('Failed to generate campaign variants')
      setIsProcessing(false)
      setStep('upload') // Go back to upload step
    }
  }

  const handleDownloadCSV = () => {
    if (!template) return

    const csvContent = generateSampleCSV(variables)
    downloadCSVSample(csvContent, template.name)
    setCsvDownloaded(true)
    toast.success('CSV template downloaded! Fill it with your data and upload below.')
  }

  const handleContinue = () => {
    if (variables.length === 0) {
      toast.error('This template has no variables. Add {variableName} to your template first.')
      return
    }

    setStep('upload')
  }

  const handleBack = () => {
    setStep('variables')
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Create Campaign
          </DialogTitle>
          <DialogDescription>
            From template: <span className="font-semibold text-slate-700">{template.name}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 pb-4 border-b">
          <div className={`flex items-center gap-2 ${step === 'variables' ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'variables' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300'}`}>
              1
            </div>
            <span className="text-sm">Variables</span>
          </div>
          <div className="flex-1 h-px bg-slate-200" />
          <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'upload' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300'}`}>
              2
            </div>
            <span className="text-sm">Upload Data</span>
          </div>
        </div>

        {/* Step 1: Variables Detection */}
        {step === 'variables' && (
          <div className="space-y-6 py-4">
            {/* Variable Count */}
            <div className="flex items-center gap-3">
              {variables.length > 0 ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-lg">
                      Detected {variables.length} variable{variables.length === 1 ? '' : 's'}
                    </p>
                    <p className="text-sm text-slate-600">
                      Your template is ready for personalization
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 text-amber-500" />
                  <div>
                    <p className="font-semibold text-lg">No variables detected</p>
                    <p className="text-sm text-slate-600">
                      Add {"{"} variableName {"}"} to your template for personalization
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Variables List */}
            {variables.length > 0 && (
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Variables in this template:
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {variables.map((variable, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        {`{${variable.fieldName}}`}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium text-slate-700">{variable.displayName}</p>
                        <p className="text-xs text-slate-500">Example: {variable.sampleValue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Sample CSV Preview */}
            {variables.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">CSV Template Sample:</h3>
                <div className="bg-white border rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-slate-700">{generateSampleCSV(variables)}</pre>
                </div>
              </div>
            )}

            {/* Instructions */}
            {variables.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Download the CSV template below</li>
                  <li>Fill it with your recipient data (can add 10-10,000 rows)</li>
                  <li>Upload the completed CSV in the next step</li>
                  <li>We'll generate personalized mailers for each recipient</li>
                </ol>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <div className="flex items-center gap-3">
                {variables.length > 0 && (
                  <Button variant="outline" onClick={handleDownloadCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV Template
                  </Button>
                )}
                <Button
                  onClick={handleContinue}
                  disabled={variables.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Upload
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {csvDownloaded && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                <span>CSV template downloaded successfully</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: CSV Upload */}
        {step === 'upload' && (
          <div className="space-y-6 py-4">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Upload Your CSV File</h4>
              <p className="text-sm text-blue-800">
                Upload the CSV file you created with your recipient data. We'll validate the columns and show you a preview before generating.
              </p>
            </div>

            {/* CSV Uploader */}
            <CSVUploader
              expectedColumns={variables.map(v => v.fieldName)}
              onDataLoaded={handleCSVDataLoaded}
            />

            {/* Preview First 5 Rows */}
            {csvData.length > 0 && (
              <Card className="p-4 bg-slate-50">
                <h4 className="font-semibold text-sm mb-3">Preview (first 5 rows):</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-300">
                        {csvColumns.map(col => (
                          <th key={col} className="text-left p-2 font-semibold text-slate-700">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          {csvColumns.map(col => (
                            <td key={col} className="p-2 text-slate-600">
                              {row[col]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Showing 5 of {csvData.length} rows
                </p>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                disabled={csvData.length === 0}
                onClick={handleGenerateCampaign}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Generate Campaign ({csvData.length} variants)
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Processing & Results */}
        {step === 'processing' && (
          <div className="space-y-6 py-4">
            {/* Progress Indicator */}
            {isProcessing && progress && (
              <Card className="p-6 bg-blue-50 border-blue-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">Generating Campaign Variants</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Processing batch {progress.currentBatch} of {progress.totalBatches}
                      </p>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {progress.percentage}%
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300 ease-out"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>

                  <p className="text-sm text-slate-600">
                    {progress.completed} of {progress.total} variants generated
                  </p>
                </div>
              </Card>
            )}

            {/* Results Summary */}
            {!isProcessing && variants.length > 0 && (
              <div className="space-y-4">
                <Card className="p-6 bg-green-50 border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-lg">Campaign Generated Successfully!</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {variants.length} personalized variants ready for export
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Variants Grid Preview */}
                <Card className="p-4 bg-slate-50">
                  <h4 className="font-semibold text-sm mb-3">Generated Variants:</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {variants.slice(0, 10).map((variant, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {Object.keys(variant.data).slice(0, 2).map(key => variant.data[key]).join(' • ')}
                            </p>
                            <p className="text-xs text-slate-500">
                              {Object.keys(variant.data).length} fields personalized
                            </p>
                          </div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                    ))}
                    {variants.length > 10 && (
                      <p className="text-xs text-slate-500 text-center pt-2">
                        + {variants.length - 10} more variants
                      </p>
                    )}
                  </div>
                </Card>

                {/* Next Steps */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>Export variants as high-quality PDFs (300 DPI)</li>
                    <li>Download all files as ZIP archive</li>
                    <li>Send to print fulfillment or download individually</li>
                  </ol>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  <Button
                    disabled
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Export All as PDF (Coming Soon)
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
