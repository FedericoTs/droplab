"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";

interface TimeSeriesData {
  date: string;
  pageViews: number;
  conversions: number;
  uniqueVisitors: number;
  calls?: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
  loading?: boolean;
  title?: string;
  showConversions?: boolean;
  showVisitors?: boolean;
  showPageViews?: boolean;
  showCalls?: boolean;
}

export function TimeSeriesChart({
  data,
  loading = false,
  title = "Campaign Performance Over Time",
  showConversions: initialShowConversions = true,
  showVisitors: initialShowVisitors = true,
  showPageViews: initialShowPageViews = true,
  showCalls: initialShowCalls = true,
}: TimeSeriesChartProps) {
  // State for toggling lines
  const [visibleLines, setVisibleLines] = useState({
    pageViews: initialShowPageViews,
    uniqueVisitors: initialShowVisitors,
    conversions: initialShowConversions,
    calls: initialShowCalls,
  });

  const toggleLine = (line: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({
      ...prev,
      [line]: !prev[line],
    }));
  };
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <p className="text-sm text-slate-600">Loading chart data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-sm text-slate-600">No data available for the selected period</p>
        </CardContent>
      </Card>
    );
  }

  // Format date for display
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle>{title}</CardTitle>

          {/* Toggle Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleLine('pageViews')}
              className={`h-8 text-xs transition-all ${
                visibleLines.pageViews
                  ? 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-purple-500 mr-1.5"></div>
              Page Views
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleLine('uniqueVisitors')}
              className={`h-8 text-xs transition-all ${
                visibleLines.uniqueVisitors
                  ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></div>
              Visitors
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleLine('conversions')}
              className={`h-8 text-xs transition-all ${
                visibleLines.conversions
                  ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
              Conversions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleLine('calls')}
              className={`h-8 text-xs transition-all ${
                visibleLines.calls
                  ? 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-orange-500 mr-1.5"></div>
              Calls
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart
            data={formattedData}
            margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
          >
            <XAxis
              dataKey="displayDate"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "none",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                fontSize: "13px",
                padding: "12px",
              }}
              labelStyle={{ color: "#0f172a", fontWeight: 600, marginBottom: "8px" }}
              itemStyle={{ padding: "4px 0" }}
            />
            <Legend
              wrapperStyle={{ fontSize: "13px", paddingTop: "20px" }}
              iconType="line"
              iconSize={14}
            />
            {visibleLines.pageViews && (
              <Line
                type="monotone"
                dataKey="pageViews"
                name="Page Views"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
              />
            )}
            {visibleLines.uniqueVisitors && (
              <Line
                type="monotone"
                dataKey="uniqueVisitors"
                name="Unique Visitors"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
              />
            )}
            {visibleLines.conversions && (
              <Line
                type="monotone"
                dataKey="conversions"
                name="Conversions"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
              />
            )}
            {visibleLines.calls && (
              <Line
                type="monotone"
                dataKey="calls"
                name="Calls"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ r: 4, fill: "#f97316", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#f97316", stroke: "#fff", strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
