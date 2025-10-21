"use client";

/**
 * Batch Job Details Page
 *
 * Shows real-time progress for a specific batch job
 */

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface BatchJobProgress {
  batchJobId: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  totalRecipients: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  progressPercent: number;
  estimatedTimeRemaining?: string;
  currentMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

export default function BatchJobPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [progress, setProgress] = useState<BatchJobProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Poll for progress updates every 2 seconds
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/batch-jobs/${unwrappedParams.id}/progress`);
        const result = await response.json();

        if (result.success) {
          setProgress(result.data);

          // Stop polling if job is complete or failed
          if (result.data.status === "completed" || result.data.status === "failed") {
            setIsLoading(false);
          }
        } else {
          toast.error("Failed to fetch job progress");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching progress:", error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchProgress();

    // Poll every 2 seconds
    const interval = setInterval(fetchProgress, 2000);

    return () => clearInterval(interval);
  }, [unwrappedParams.id]);

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/batch-jobs/${unwrappedParams.id}/download`);

      if (!response.ok) {
        toast.error("Failed to download batch results");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `batch-${unwrappedParams.id}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Download started!");
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error("Failed to download batch results");
    }
  };

  if (!progress && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Batch Job Not Found</h2>
            <p className="text-slate-600 mb-4">The requested batch job could not be found.</p>
            <Button onClick={() => router.push("/dm-creative")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to DM Creative
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      case "processing":
        return "text-blue-600";
      default:
        return "text-slate-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case "failed":
        return <XCircle className="h-6 w-6 text-red-600" />;
      case "processing":
        return <Loader2 className="h-6 w-6 animate-spin text-blue-600" />;
      default:
        return <Clock className="h-6 w-6 text-slate-600" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/dm-creative")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to DM Creative
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(progress.status)}
              <div>
                <CardTitle>Batch Job {unwrappedParams.id.substring(0, 8)}</CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Status: <span className={`font-semibold ${getStatusColor(progress.status)}`}>
                    {progress.status.toUpperCase()}
                  </span>
                </p>
              </div>
            </div>

            {progress.status === "completed" && (
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download ZIP
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">
                Progress: {progress.processedCount} / {progress.totalRecipients}
              </span>
              <span className="text-sm font-medium text-slate-700">
                {progress.progressPercent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">Total</p>
              <p className="text-2xl font-bold text-slate-900">{progress.totalRecipients}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">Success</p>
              <p className="text-2xl font-bold text-green-900">{progress.successCount}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">Failed</p>
              <p className="text-2xl font-bold text-red-900">{progress.failedCount}</p>
            </div>
          </div>

          {/* Current Status */}
          {progress.status === "processing" && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">
                🔄 Currently Processing...
              </p>
              {progress.currentMessage && (
                <p className="text-sm text-blue-700">{progress.currentMessage}</p>
              )}
              {progress.estimatedTimeRemaining && (
                <p className="text-sm text-blue-700 mt-1">
                  ⏱️ Estimated time remaining: {progress.estimatedTimeRemaining}
                </p>
              )}
            </div>
          )}

          {/* Completion Message */}
          {progress.status === "completed" && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900 mb-2">
                ✅ Batch Completed Successfully!
              </p>
              <p className="text-sm text-green-700">
                {progress.successCount} of {progress.totalRecipients} direct mails generated successfully.
              </p>
              <p className="text-sm text-green-700 mt-1">
                Check your email for the download link, or download directly using the button above.
              </p>
            </div>
          )}

          {/* Failure Message */}
          {progress.status === "failed" && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-900 mb-2">
                ❌ Batch Job Failed
              </p>
              <p className="text-sm text-red-700">
                The batch job encountered an error and could not be completed.
              </p>
              <p className="text-sm text-red-700 mt-1">
                Processed: {progress.processedCount} of {progress.totalRecipients} recipients
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-slate-900 mb-3">Timeline</h3>
            <div className="space-y-2 text-sm text-slate-600">
              {progress.startedAt && (
                <p>Started: {new Date(progress.startedAt).toLocaleString()}</p>
              )}
              {progress.completedAt && (
                <p>Completed: {new Date(progress.completedAt).toLocaleString()}</p>
              )}
              {!progress.completedAt && progress.status === "processing" && (
                <p className="text-blue-600 animate-pulse">⏳ Processing...</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
