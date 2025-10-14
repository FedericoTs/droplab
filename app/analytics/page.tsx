"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, MousePointerClick, Calendar, Eye } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  company_name: string;
  created_at: string;
  status: string;
}

interface CampaignAnalytics {
  campaign: Campaign;
  totalRecipients: number;
  totalPageViews: number;
  uniqueVisitors: number;
  totalConversions: number;
  conversionRate: number;
}

export default function AnalyticsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Load campaigns on mount
  useEffect(() => {
    loadCampaigns();
  }, []);

  // Load analytics when campaign is selected
  useEffect(() => {
    if (selectedCampaign) {
      loadAnalytics(selectedCampaign);
    }
  }, [selectedCampaign]);

  const loadCampaigns = async () => {
    try {
      const response = await fetch("/api/tracking/campaigns");
      const result = await response.json();

      if (result.success) {
        setCampaigns(result.data);

        if (result.data.length > 0 && !selectedCampaign) {
          setSelectedCampaign(result.data[0].id);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to load campaigns:", error);
      setLoading(false);
    }
  };

  const loadAnalytics = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/tracking/analytics/${campaignId}`);
      const result = await response.json();

      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Campaigns Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              Create your first direct mail campaign to start tracking analytics.
            </p>
            <Button
              onClick={() => (window.location.href = "/dm-creative")}
              className="w-full"
            >
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Campaign Analytics
          </h1>
          <p className="text-slate-600">
            Track the performance of your direct mail campaigns
          </p>
        </div>

        {/* Campaign Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {campaigns.map((campaign) => (
                <Button
                  key={campaign.id}
                  variant={selectedCampaign === campaign.id ? "default" : "outline"}
                  onClick={() => setSelectedCampaign(campaign.id)}
                >
                  {campaign.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Display */}
        {analytics && (
          <>
            {/* Campaign Info */}
            <Card>
              <CardHeader>
                <CardTitle>{analytics.campaign.name}</CardTitle>
                <p className="text-sm text-slate-600">
                  {analytics.campaign.company_name} •{" "}
                  {new Date(analytics.campaign.created_at).toLocaleDateString()}
                </p>
              </CardHeader>
            </Card>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Recipients */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        Total Recipients
                      </p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">
                        {analytics.totalRecipients}
                      </p>
                    </div>
                    <Users className="h-10 w-10 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              {/* Unique Visitors */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        Unique Visitors
                      </p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">
                        {analytics.uniqueVisitors}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {analytics.totalRecipients > 0
                          ? Math.round(
                              (analytics.uniqueVisitors / analytics.totalRecipients) * 100
                            )
                          : 0}
                        % response rate
                      </p>
                    </div>
                    <Eye className="h-10 w-10 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              {/* Total Page Views */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        Total Page Views
                      </p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">
                        {analytics.totalPageViews}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {analytics.uniqueVisitors > 0
                          ? (analytics.totalPageViews / analytics.uniqueVisitors).toFixed(1)
                          : 0}{" "}
                        avg per visitor
                      </p>
                    </div>
                    <MousePointerClick className="h-10 w-10 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              {/* Conversions */}
              <Card className="border-2 border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-900">
                        Conversions
                      </p>
                      <p className="text-3xl font-bold text-orange-900 mt-2">
                        {analytics.totalConversions}
                      </p>
                      <p className="text-xs text-orange-700 mt-1 font-semibold">
                        {analytics.conversionRate}% conversion rate
                      </p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        Response Rate
                      </span>
                      <span className="text-sm font-semibold text-blue-600">
                        {analytics.totalRecipients > 0
                          ? Math.round(
                              (analytics.uniqueVisitors / analytics.totalRecipients) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full"
                        style={{
                          width: `${
                            analytics.totalRecipients > 0
                              ? (analytics.uniqueVisitors / analytics.totalRecipients) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        Conversion Rate
                      </span>
                      <span className="text-sm font-semibold text-orange-600">
                        {analytics.conversionRate}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className="bg-orange-600 h-3 rounded-full"
                        style={{
                          width: `${analytics.conversionRate}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-slate-600">
                      <strong>Campaign Status:</strong>{" "}
                      <span className="capitalize font-semibold text-green-600">
                        {analytics.campaign.status}
                      </span>
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      <strong>Created:</strong>{" "}
                      {new Date(analytics.campaign.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
