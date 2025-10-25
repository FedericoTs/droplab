/**
 * Store Performance Comparison Chart
 *
 * Visual comparison showing:
 * - Store vs Plan Average for key metrics
 * - Percentile rankings
 * - Strength/weakness indicators
 * - Simple bar charts for at-a-glance understanding
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  DollarSign,
  Users,
  Award,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StorePerformanceComparisonProps {
  store: {
    aiConfidence: number;
    expectedConversions: number;
    quantity: number;
    costPerPiece?: number;
  };
  planAverage: {
    avgConfidence: number;
    avgExpectedConversions: number;
    avgQuantity: number;
    avgCostPerPiece?: number;
  };
  planStats?: {
    totalStores: number;
    highConfidenceStores: number;
  };
}

/**
 * Get percentile badge based on comparison
 */
function getPercentileBadge(storeValue: number, planAvg: number): {
  label: string;
  color: string;
  icon: React.ElementType;
} {
  const ratio = planAvg > 0 ? storeValue / planAvg : 1;

  if (ratio >= 1.2) {
    return {
      label: 'Top Performer',
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: Award,
    };
  } else if (ratio >= 1.05) {
    return {
      label: 'Above Average',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: TrendingUp,
    };
  } else if (ratio >= 0.95) {
    return {
      label: 'Average',
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: Minus,
    };
  } else {
    return {
      label: 'Below Average',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: TrendingDown,
    };
  }
}

/**
 * Comparison bar component
 */
function ComparisonBar({
  label,
  storeValue,
  planAverage,
  format = 'number',
  icon: Icon,
  tooltipText,
}: {
  label: string;
  storeValue: number;
  planAverage: number;
  format?: 'number' | 'percent' | 'currency';
  icon: React.ElementType;
  tooltipText: string;
}) {
  const ratio = planAverage > 0 ? (storeValue / planAverage) * 100 : 100;
  const storePercentage = Math.min(ratio, 150); // Cap at 150% for display
  const isAboveAverage = storeValue >= planAverage;

  // Format values
  const formatValue = (val: number): string => {
    switch (format) {
      case 'percent':
        return `${val.toFixed(0)}%`;
      case 'currency':
        return `$${val.toFixed(2)}`;
      default:
        return val.toFixed(1);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="h-3 w-3 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                  ?
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm max-w-xs">{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`text-lg font-bold ${isAboveAverage ? 'text-green-600' : 'text-yellow-600'}`}>
              {formatValue(storeValue)}
            </div>
            <div className="text-xs text-muted-foreground">
              vs {formatValue(planAverage)} avg
            </div>
          </div>
          {isAboveAverage ? (
            <TrendingUp className="h-5 w-5 text-green-600" />
          ) : (
            <TrendingDown className="h-5 w-5 text-yellow-600" />
          )}
        </div>
      </div>

      {/* Visual Bar */}
      <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
        {/* Plan average marker */}
        <div className="absolute inset-0 flex items-center px-3">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-400" style={{ left: '50%' }} />
          <div className="absolute text-xs text-gray-500" style={{ left: 'calc(50% - 30px)', top: '-18px' }}>
            Plan Avg
          </div>
        </div>

        {/* Store bar */}
        <div
          className={`h-full transition-all ${
            isAboveAverage
              ? 'bg-gradient-to-r from-green-400 to-green-600'
              : 'bg-gradient-to-r from-yellow-400 to-yellow-600'
          }`}
          style={{ width: `${Math.min(storePercentage / 1.5, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function StorePerformanceComparison({
  store,
  planAverage,
  planStats,
}: StorePerformanceComparisonProps) {
  // Get overall performance badge
  const confidenceBadge = getPercentileBadge(store.aiConfidence, planAverage.avgConfidence);
  const ConfidenceIcon = confidenceBadge.icon;

  // Calculate store's position in plan
  const storeRank = planStats ? Math.round((store.aiConfidence / 100) * planStats.totalStores) : 0;

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Performance Comparison</CardTitle>
          <Badge className={`${confidenceBadge.color} border flex items-center gap-1.5`}>
            <ConfidenceIcon className="h-3.5 w-3.5" />
            {confidenceBadge.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          How this store compares to plan average
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Confidence Comparison */}
        <ComparisonBar
          label="AI Confidence"
          storeValue={store.aiConfidence}
          planAverage={planAverage.avgConfidence}
          format="percent"
          icon={Target}
          tooltipText="AI's confidence in this store's success compared to plan average"
        />

        {/* Expected Conversions Comparison */}
        <ComparisonBar
          label="Expected Conversions"
          storeValue={store.expectedConversions}
          planAverage={planAverage.avgExpectedConversions}
          format="number"
          icon={Users}
          tooltipText="Predicted number of conversions vs plan average"
        />

        {/* Quantity Comparison */}
        <ComparisonBar
          label="Mail Quantity"
          storeValue={store.quantity}
          planAverage={planAverage.avgQuantity}
          format="number"
          icon={Target}
          tooltipText="Direct mail pieces allocated vs plan average"
        />

        {/* Cost Per Piece (if available) */}
        {store.costPerPiece && planAverage.avgCostPerPiece && (
          <ComparisonBar
            label="Cost Per Piece"
            storeValue={store.costPerPiece}
            planAverage={planAverage.avgCostPerPiece}
            format="currency"
            icon={DollarSign}
            tooltipText="Cost efficiency compared to plan average (lower is better)"
          />
        )}

        {/* Plan Position Summary */}
        {planStats && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {storeRank}/{planStats.totalStores}
                </div>
                <div className="text-xs text-muted-foreground">
                  Estimated Rank in Plan
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {((store.aiConfidence / 80) * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Confidence vs "Excellent" threshold
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Insights */}
        <div className="pt-4 border-t space-y-2">
          <div className="text-sm font-medium mb-2">Key Insights:</div>
          {store.aiConfidence >= planAverage.avgConfidence * 1.1 && (
            <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
              <TrendingUp className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                This store has {((store.aiConfidence / planAverage.avgConfidence - 1) * 100).toFixed(0)}% higher AI confidence than average - strong performer
              </span>
            </div>
          )}
          {store.expectedConversions >= planAverage.avgExpectedConversions * 1.15 && (
            <div className="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 p-2 rounded">
              <Award className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                Expected to generate {((store.expectedConversions / planAverage.avgExpectedConversions - 1) * 100).toFixed(0)}% more conversions than average store
              </span>
            </div>
          )}
          {store.aiConfidence < planAverage.avgConfidence * 0.9 && (
            <div className="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
              <TrendingDown className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                Below plan average - consider reviewing this store's selection or adjusting quantities
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
