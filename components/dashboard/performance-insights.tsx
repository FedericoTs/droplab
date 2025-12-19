'use client';

/**
 * Performance Insights Widget
 *
 * Displays actionable insights:
 * - Top Performing Template (by response rate)
 * - Best Performing Locations (geographic)
 * - Recommendations based on data
 *
 * Dashboard Improvement - Nov 21, 2025
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb, Award, MapPin, FileImage } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface TopTemplate {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  responseRate: number;
  campaignsUsed: number;
}

interface TopLocation {
  name: string;
  events: number;
}

interface PerformanceInsightsProps {
  topTemplate: TopTemplate | null;
  topLocations: TopLocation[];
  isLoading: boolean;
}

export function PerformanceInsights({
  topTemplate,
  topLocations,
  isLoading,
}: PerformanceInsightsProps) {
  if (isLoading) {
    return (
      <Card className="border-emerald-200/50 bg-gradient-to-br from-emerald-50/80 to-lime-50/60">
        <CardHeader>
          <div className="h-6 bg-emerald-100 rounded-lg w-32 animate-shimmer"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-white/60 rounded-xl animate-shimmer"></div>
            <div className="h-20 bg-white/60 rounded-xl animate-shimmer"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = topTemplate || topLocations.length > 0;

  return (
    <Card className="border-emerald-200/50 bg-gradient-to-br from-emerald-50/80 to-lime-50/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-900">
          <div className="p-1.5 rounded-lg bg-amber-100">
            <Lightbulb className="h-5 w-5 text-amber-600" />
          </div>
          Performance Insights
        </CardTitle>
        <CardDescription className="text-emerald-700">
          Data-driven recommendations to improve your campaigns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasData ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/80 flex items-center justify-center">
              <Lightbulb className="h-8 w-8 text-neutral-300" />
            </div>
            <p className="text-neutral-600 mb-2 font-medium">
              No insights available yet
            </p>
            <p className="text-sm text-neutral-500">
              Send campaigns to generate performance insights
            </p>
          </div>
        ) : (
          <>
            {/* Top Performing Template */}
            {topTemplate && (
              <div className="bg-white/90 rounded-xl p-4 border border-emerald-200/60 shadow-xs hover:shadow-sm transition-shadow duration-normal">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {topTemplate.thumbnailUrl ? (
                      <img
                        src={topTemplate.thumbnailUrl}
                        alt={topTemplate.name}
                        className="h-16 w-16 rounded-xl object-cover border-2 border-emerald-200 shadow-sm"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-emerald-50 flex items-center justify-center border-2 border-emerald-200">
                        <FileImage className="h-8 w-8 text-emerald-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="h-4 w-4 text-amber-500" />
                      <h4 className="font-semibold text-neutral-800">
                        Top Performing Template
                      </h4>
                    </div>
                    <p className="text-sm font-medium text-emerald-800 truncate">
                      {topTemplate.name}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-emerald-600 font-semibold">
                        {topTemplate.responseRate.toFixed(1)}% response rate
                      </span>
                      <span className="text-neutral-500">
                        Used in {topTemplate.campaignsUsed} campaign{topTemplate.campaignsUsed !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <Link href={`/templates?template=${topTemplate.id}`}>
                      <Button variant="link" size="sm" className="px-0 mt-2 text-emerald-600 hover:text-emerald-700 font-semibold">
                        Use this template →
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Best Performing Locations */}
            {topLocations.length > 0 && (
              <div className="bg-white/90 rounded-xl p-4 border border-emerald-200/60 shadow-xs hover:shadow-sm transition-shadow duration-normal">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1 rounded-md bg-lime-100">
                    <MapPin className="h-4 w-4 text-lime-600" />
                  </div>
                  <h4 className="font-semibold text-neutral-800">
                    Top Performing Locations
                  </h4>
                </div>
                <div className="space-y-2">
                  {topLocations.map((location, index) => (
                    <div
                      key={location.name}
                      className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center shadow-sm">
                          <span className="text-xs font-bold text-white">
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-neutral-800">
                          {location.name}
                        </span>
                      </div>
                      <span className="text-sm text-emerald-600 font-semibold">
                        {location.events} events
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-neutral-500 mt-3 bg-lime-50/60 px-3 py-2 rounded-lg">
                  💡 Consider targeting more contacts in these high-performing areas
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
