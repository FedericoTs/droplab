"use client"

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import { toast } from 'sonner'

interface CSVUploaderProps {
  expectedColumns: string[]
  onDataLoaded: (data: Record<string, string>[], columns: string[]) => void
}

interface ParsedCSV {
  data: Record<string, string>[]
  columns: string[]
  rowCount: number
}

export function CSVUploader({ expectedColumns, onDataLoaded }: CSVUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedCSV | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === 'text/csv') {
      processFile(droppedFile)
    } else {
      toast.error('Please upload a CSV file')
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }, [])

  const processFile = useCallback((file: File) => {
    setIsProcessing(true)
    setValidationError(null)
    setFile(file)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // Validate CSV data
          if (!results.data || results.data.length === 0) {
            throw new Error('CSV file is empty')
          }

          const columns = results.meta.fields || []
          const data = results.data as Record<string, string>[]

          // Validate row count (10-10,000 as per requirements)
          if (data.length < 10) {
            throw new Error(`CSV must contain at least 10 rows (found ${data.length})`)
          }

          if (data.length > 10000) {
            throw new Error(`CSV cannot exceed 10,000 rows (found ${data.length})`)
          }

          // Check for missing columns
          const missingColumns = expectedColumns.filter(col => !columns.includes(col))
          if (missingColumns.length > 0) {
            throw new Error(`Missing required columns: ${missingColumns.join(', ')}`)
          }

          // Success - store parsed data
          setParsedData({ data, columns, rowCount: data.length })
          onDataLoaded(data, columns)
          toast.success(`Successfully loaded ${data.length} rows from CSV`)
          setIsProcessing(false)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV'
          setValidationError(errorMessage)
          toast.error(errorMessage)
          setIsProcessing(false)
          setParsedData(null)
        }
      },
      error: (error) => {
        const errorMessage = `CSV parsing error: ${error.message}`
        setValidationError(errorMessage)
        toast.error(errorMessage)
        setIsProcessing(false)
        setParsedData(null)
      },
    })
  }, [expectedColumns, onDataLoaded])

  const handleRemoveFile = useCallback(() => {
    setFile(null)
    setParsedData(null)
    setValidationError(null)
  }, [])

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!file && (
        <Card
          className={`border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 hover:border-slate-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="p-8 text-center">
            <Upload className={`w-12 h-12 mx-auto mb-4 ${
              isDragging ? 'text-blue-500' : 'text-slate-400'
            }`} />

            <h3 className="font-semibold text-lg mb-2">
              {isDragging ? 'Drop CSV file here' : 'Upload CSV File'}
            </h3>

            <p className="text-sm text-slate-600 mb-4">
              Drag & drop your CSV file, or click to browse
            </p>

            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button variant="outline" asChild>
                <span>Browse Files</span>
              </Button>
            </label>

            <div className="mt-4 text-xs text-slate-500">
              <p>Required columns: <span className="font-mono font-semibold">{expectedColumns.join(', ')}</span></p>
              <p className="mt-1">Row limit: 10-10,000 rows</p>
            </div>
          </div>
        </Card>
      )}

      {/* File Info Card */}
      {file && (
        <Card className={`p-4 ${
          validationError
            ? 'border-red-300 bg-red-50'
            : parsedData
            ? 'border-green-300 bg-green-50'
            : 'border-slate-300'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <FileText className={`w-5 h-5 mt-0.5 ${
                validationError
                  ? 'text-red-600'
                  : parsedData
                  ? 'text-green-600'
                  : 'text-slate-600'
              }`} />

              <div>
                <p className="font-semibold text-sm">{file.name}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {(file.size / 1024).toFixed(2)} KB
                  {parsedData && ` • ${parsedData.rowCount} rows • ${parsedData.columns.length} columns`}
                </p>

                {/* Validation Status */}
                {validationError && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span>{validationError}</span>
                  </div>
                )}

                {parsedData && !validationError && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-green-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Valid CSV - Ready to process</span>
                  </div>
                )}

                {isProcessing && (
                  <p className="text-sm text-slate-600 mt-2">Processing...</p>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Column Mapping Preview */}
      {parsedData && !validationError && (
        <Card className="p-4 bg-slate-50">
          <h4 className="font-semibold text-sm mb-3">Detected Columns:</h4>
          <div className="flex flex-wrap gap-2">
            {parsedData.columns.map((col) => (
              <div
                key={col}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  expectedColumns.includes(col)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {col}
                {expectedColumns.includes(col) && ' ✓'}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
