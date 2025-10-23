"use client";

/**
 * Batch Jobs Dashboard
 *
 * Real-time monitoring and management of all batch processing jobs
 * - Live status updates every 3 seconds for active jobs
 * - Quick stats overview
 * - Filter by status
 * - One-click actions (view, cancel, download)
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Eye,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  PlayCircle,
  StopCircle,
  TrendingUp,
  Activity
} from "lucide-react";
import { toast } from "sonner";
// Import standardized KPI utilities for consistent percentage formatting
import { formatPercentage } from "@/lib/utils/kpi-calculator";

interface BatchJob {
  id: string;
  campaignId: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  totalRecipients: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  progressPercent: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  outputZipPath?: string;
}

interface BatchJobStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
}

type StatusFilter = "all" | "active" | "completed" | "failed" | "cancelled";

export default function BatchJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [stats, setStats] = useState<BatchJobStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());

  // Fetch jobs from API
  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/batch-jobs?stats=true");
      const result = await response.json();

      if (result.success) {
        setJobs(result.data.jobs);
        setStats(result.data.stats);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching batch jobs:", error);
      setIsLoading(false);
    }
  };

  // Initial fetch + smart polling (only active jobs)
  useEffect(() => {
    fetchJobs();

    // Poll every 3 seconds if there are active jobs
    const interval = setInterval(() => {
      const hasActiveJobs = jobs.some(
        (job) => job.status === "pending" || job.status === "processing"
      );
      if (hasActiveJobs) {
        fetchJobs();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobs.length]); // Re-setup interval when jobs change

  // Cancel job
  const handleCancel = async (jobId: string) => {
    if (!confirm("Are you sure you want to cancel this batch job?")) {
      return;
    }

    setCancellingIds((prev) => new Set(prev).add(jobId));

    try {
      const response = await fetch(`/api/batch-jobs/${jobId}/cancel`, {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Batch job cancelled");
        fetchJobs(); // Refresh list
      } else {
        toast.error(result.error || "Failed to cancel job");
      }
    } catch (error) {
      console.error("Error cancelling job:", error);
      toast.error("Failed to cancel job");
    } finally {
      setCancellingIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  // Download completed job
  const handleDownload = async (jobId: string) => {
    try {
      const response = await fetch(`/api/batch-jobs/${jobId}/download`);

      if (!response.ok) {
        toast.error("Failed to download batch results");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `batch-${jobId.substring(0, 8)}.zip`;
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

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") {
      return job.status === "pending" || job.status === "processing";
    }
    return job.status === statusFilter;
  });

  // Calculate duration helper
  const calculateDuration = (job: BatchJob): string => {
    const start = job.startedAt ? new Date(job.startedAt).getTime() : new Date(job.createdAt).getTime();
    const end = job.completedAt ? new Date(job.completedAt).getTime() : Date.now();
    const durationMs = end - start;

    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: BatchJob["status"] }) => {
    const config = {
      pending: {
        icon: Clock,
        label: "Pending",
        className: "bg-slate-100 text-slate-700 border-slate-300"
      },
      processing: {
        icon: Activity,
        label: "Processing",
        className: "bg-blue-100 text-blue-700 border-blue-300 animate-pulse"
      },
      completed: {
        icon: CheckCircle2,
        label: "Completed",
        className: "bg-green-100 text-green-700 border-green-300"
      },
      failed: {
        icon: XCircle,
        label: "Failed",
        className: "bg-red-100 text-red-700 border-red-300"
      },
      cancelled: {
        icon: StopCircle,
        label: "Cancelled",
        className: "bg-orange-100 text-orange-700 border-orange-300"
      },
    };

    const { icon: Icon, label, className } = config[status];

    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${className}`}>
        <Icon className="h-3 w-3" />
        {label}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Batch Jobs</h1>
        <p className="text-slate-600 mt-1">Monitor and manage all batch processing operations</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-slate-600" />
                <p className="text-xs font-medium text-slate-600">Total</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-slate-600" />
                <p className="text-xs font-medium text-slate-600">Pending</p>
              </div>
              <p className="text-2xl font-bold text-slate-700">{stats.pending}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-medium text-blue-600">Processing</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{stats.processing}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="text-xs font-medium text-green-600">Completed</p>
              </div>
              <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-red-600" />
                <p className="text-xs font-medium text-red-600">Failed</p>
              </div>
              <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <StopCircle className="h-4 w-4 text-orange-600" />
                <p className="text-xs font-medium text-orange-600">Cancelled</p>
              </div>
              <p className="text-2xl font-bold text-orange-700">{stats.cancelled}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-700 mr-2">Filter:</p>
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("completed")}
            >
              Completed
            </Button>
            <Button
              variant={statusFilter === "failed" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("failed")}
            >
              Failed
            </Button>
            <Button
              variant={statusFilter === "cancelled" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("cancelled")}
            >
              Cancelled
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Jobs ({filteredJobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No batch jobs found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/dm-creative")}
              >
                Create New Batch
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Job ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Recipients
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Success / Failed
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                          {job.id.substring(0, 8)}
                        </code>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${job.progressPercent || 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-700">
                              {formatPercentage((job.progressPercent || 0) / 100, 0)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <span className="font-medium text-slate-900">
                            {job.processedCount}
                          </span>
                          <span className="text-slate-500"> / {job.totalRecipients}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-green-700 font-medium">
                            ✓ {job.successCount}
                          </span>
                          <span className="text-red-700 font-medium">
                            ✗ {job.failedCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-slate-700">
                          {calculateDuration(job)}
                        </div>
                        {job.status === "processing" && (
                          <div className="text-xs text-blue-600 mt-0.5">⏱️ Running</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-slate-600">
                          {new Date(job.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Details */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/batch-jobs/${job.id}`)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Download (completed jobs only) */}
                          {job.status === "completed" && job.outputZipPath && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(job.id)}
                              title="Download ZIP"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Cancel (pending/processing jobs only) */}
                          {(job.status === "pending" || job.status === "processing") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(job.id)}
                              disabled={cancellingIds.has(job.id)}
                              title="Cancel job"
                            >
                              {cancellingIds.has(job.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <StopCircle className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
