"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Sankey, Tooltip, ResponsiveContainer } from "recharts";

interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
  metrics: {
    totalRecipients: number;
    qrScans: number;
    landingPageVisits: number;
    totalCalls: number;
    webAppointments: number;
    callAppointments: number;
    totalAppointments: number;
  };
}

export function SankeyChart() {
  const [data, setData] = useState<SankeyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/analytics/sankey");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to load Sankey chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Customer Journey Flow
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <p className="text-sm text-slate-600">Loading journey flow...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.links.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Customer Journey Flow
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">No customer journey data available</p>
            <p className="text-xs text-slate-500">
              Data will appear once recipients interact with campaigns
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for recharts Sankey
  const sankeyData = {
    nodes: data.nodes,
    links: data.links,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Customer Journey Flow
        </CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          Visual representation of how recipients move through your marketing funnel
        </p>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-2">Customer Journey Visualization</p>
          <p className="text-sm text-slate-500">
            Sankey diagram will be displayed here once we integrate a compatible library
          </p>
          <div className="mt-6 p-4 bg-slate-50 rounded-lg max-w-2xl mx-auto text-left">
            <p className="text-xs font-semibold text-slate-700 mb-2">Current Journey Flow:</p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• <strong>Recipients (Contacted):</strong> {data.metrics.totalRecipients.toLocaleString()}</li>
              <li>• <strong>QR Code Scans:</strong> {data.metrics.qrScans.toLocaleString()}</li>
              <li>• <strong>Landing Page Visits:</strong> {data.metrics.landingPageVisits.toLocaleString()}</li>
              <li>• <strong>Calls Received:</strong> {data.metrics.totalCalls.toLocaleString()}</li>
              <li>• <strong>Appointments Booked:</strong> {data.metrics.totalAppointments.toLocaleString()}
                ({data.metrics.webAppointments} web + {data.metrics.callAppointments} calls)</li>
            </ul>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs font-semibold text-blue-900 mb-2">Journey Stages:</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-blue-900">Recipients (Contacted)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-blue-900">QR Scans</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-blue-900">Landing Page Visits</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-blue-900">Calls Received</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pink-500 rounded"></div>
              <span className="text-blue-900">Appointments Booked</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
