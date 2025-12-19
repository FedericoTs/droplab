'use client';

/**
 * Recent Campaigns Table
 *
 * Displays the 5 most recent campaigns with:
 * - Campaign name
 * - Status badge
 * - Recipients count
 * - Response rate
 * - Actions (View Analytics, Duplicate)
 *
 * Dashboard Improvement - Nov 21, 2025
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Copy, Calendar } from 'lucide-react';
import Link from 'next/link';

interface RecentCampaign {
  id: string;
  name: string;
  status: string;
  recipients: number;
  responseRate: number;
  conversions: number;
  createdAt: string;
  sentAt: string | null;
}

interface RecentCampaignsTableProps {
  campaigns: RecentCampaign[];
  isLoading: boolean;
}

export function RecentCampaignsTable({ campaigns, isLoading }: RecentCampaignsTableProps) {
  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'lime' }> = {
      draft: { label: 'Draft', variant: 'outline' },
      scheduled: { label: 'Scheduled', variant: 'secondary' },
      sending: { label: 'Sending', variant: 'lime' },
      sent: { label: 'Sent', variant: 'success' },
      completed: { label: 'Completed', variant: 'success' },
      paused: { label: 'Paused', variant: 'warning' },
      failed: { label: 'Failed', variant: 'destructive' },
    };

    const { label, variant } = config[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not sent';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-neutral-100 rounded w-40 animate-shimmer"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-neutral-50 rounded-lg animate-shimmer"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50">
            <Calendar className="h-5 w-5 text-emerald-600" />
          </div>
          Recent Campaigns
        </CardTitle>
        <CardDescription>
          Your latest campaigns and their performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {campaigns.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-50 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-neutral-300" />
            </div>
            <p className="text-neutral-500 mb-4 font-medium">No campaigns yet</p>
            <Link href="/campaigns/create">
              <Button>Create Your First Campaign</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="group flex items-center justify-between p-4 border border-neutral-200/80 rounded-xl hover:bg-emerald-50/30 hover:border-emerald-200/60 transition-all duration-normal"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-neutral-800 truncate group-hover:text-emerald-700 transition-colors duration-fast">
                      {campaign.name}
                    </h4>
                    {getStatusBadge(campaign.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-neutral-500">
                    <span className="font-medium">{campaign.recipients} recipients</span>
                    <span className="text-emerald-600 font-semibold">
                      {campaign.responseRate.toFixed(1)}% response
                    </span>
                    <span className="text-amber-600 font-semibold">
                      {campaign.conversions} conversions
                    </span>
                    <span className="text-neutral-400">
                      {formatDate(campaign.sentAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity duration-fast">
                  <Link href={`/analytics?campaign=${campaign.id}`}>
                    <Button variant="outline" size="sm" className="border-neutral-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analytics
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" title="Duplicate campaign" className="hover:bg-neutral-100 hover:text-neutral-700">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {campaigns.length >= 5 && (
              <div className="text-center pt-4 border-t border-neutral-100">
                <Link href="/campaigns">
                  <Button variant="link" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                    View All Campaigns →
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
