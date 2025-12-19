'use client';

/**
 * Campaign Performance Overview Cards
 *
 * Displays key business metrics in a 4-card grid:
 * - Total Campaigns Sent
 * - Active Campaigns
 * - Average Response Rate
 * - Total ROI/Revenue
 *
 * Dashboard Improvement - Nov 21, 2025
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Activity, TrendingUp, DollarSign } from 'lucide-react';

interface PerformanceData {
  totalCampaigns: number;
  sentCampaigns: number;
  activeCampaigns: number;
  responseRate: number;
  totalRevenue: number;
  totalEvents: number;
  totalConversions: number;
}

interface CampaignPerformanceCardsProps {
  data: PerformanceData | null;
  isLoading: boolean;
}

export function CampaignPerformanceCards({ data, isLoading }: CampaignPerformanceCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="h-4 bg-neutral-100 rounded w-24 animate-shimmer"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-neutral-100 rounded w-16 animate-shimmer"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Campaigns Sent */}
      <Card className="group">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-neutral-500">
            <div className="p-1.5 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
              <Send className="h-4 w-4 text-emerald-600" />
            </div>
            Campaigns Sent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-neutral-800 metric-value">{data.sentCampaigns}</p>
            <p className="text-xs text-neutral-400">
              {data.totalCampaigns} total created
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active Campaigns */}
      <Card className="group">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-neutral-500">
            <div className="p-1.5 rounded-lg bg-lime-50 group-hover:bg-lime-100 transition-colors">
              <Activity className="h-4 w-4 text-lime-600" />
            </div>
            Active Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-lime-600 metric-value">{data.activeCampaigns}</p>
            <p className="text-xs text-neutral-400">
              Currently running
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Average Response Rate */}
      <Card className="group">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-neutral-500">
            <div className="p-1.5 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            Response Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-emerald-600 metric-value">
              {data.responseRate.toFixed(1)}%
            </p>
            <p className="text-xs text-neutral-400">
              {data.totalEvents} total events
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total ROI/Revenue */}
      <Card className="group">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-neutral-500">
            <div className="p-1.5 rounded-lg bg-amber-50 group-hover:bg-amber-100 transition-colors">
              <DollarSign className="h-4 w-4 text-amber-600" />
            </div>
            Total Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-amber-600 metric-value">
              ${data.totalRevenue.toFixed(2)}
            </p>
            <p className="text-xs text-neutral-400">
              {data.totalConversions} conversions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
