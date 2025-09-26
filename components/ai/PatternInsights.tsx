"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Clock,
  Repeat,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAI } from "@/hooks/useAI";
import { ProductivityPattern } from "@/lib/ai/types/index";

interface PatternInsightsProps {
  data: any[];
  userId?: string;
  timeframe?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
  onPatternClick?: (pattern: ProductivityPattern) => void;
}

const PATTERN_ICONS = {
  recurring_task: Repeat,
  time_estimation: Clock,
  energy_cycle: TrendingUp,
  workload_spike: AlertTriangle,
} as const;

const PATTERN_COLORS = {
  recurring_task:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  time_estimation:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  energy_cycle:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  workload_spike:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
} as const;

export function PatternInsights({
  data,
  userId,
  timeframe = "7d",
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
  className = "",
  onPatternClick,
}: PatternInsightsProps) {
  const [patterns, setPatterns] = useState<ProductivityPattern[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

  const ai = useAI({ enablePatternRecognition: true });

  // Analyze patterns
  const analyzePatterns = async () => {
    if (!data || data.length === 0) {
      setPatterns([]);
      return;
    }

    try {
      const results = await ai.analyzePatterns(data, timeframe);
      setPatterns(results);
      setLastAnalyzed(new Date());
    } catch (error) {
      console.error("Pattern analysis error:", error);
    }
  };

  // Initial analysis
  useEffect(() => {
    analyzePatterns();
  }, [data, timeframe]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(analyzePatterns, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, data, timeframe]);

  // Format timeframe for display
  const formatTimeframe = (tf: string): string => {
    const timeframes: Record<string, string> = {
      "1d": "Last 24 hours",
      "3d": "Last 3 days",
      "7d": "Last week",
      "14d": "Last 2 weeks",
      "30d": "Last month",
    };
    return timeframes[tf] || tf;
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return "text-green-600 dark:text-green-400";
    if (confidence >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  // Pattern card component
  const PatternCard = ({ pattern }: { pattern: ProductivityPattern }) => {
    const Icon = PATTERN_ICONS[pattern.type] || Lightbulb;
    const colorClass =
      PATTERN_COLORS[pattern.type] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";

    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${
          onPatternClick ? "hover:bg-gray-50 dark:hover:bg-gray-800" : ""
        }`}
        onClick={() => onPatternClick?.(pattern)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`rounded-lg p-2 ${colorClass}`}>
              <Icon size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <h4 className="truncate font-medium">{pattern.description}</h4>
                <Badge
                  variant="outline"
                  className={`text-xs ${getConfidenceColor(pattern.confidence)}`}
                >
                  {Math.round(pattern.confidence * 100)}%
                </Badge>
              </div>

              <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                {pattern.suggestion}
              </p>

              {pattern.data && Object.keys(pattern.data).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(pattern.data)
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <Badge key={key} variant="secondary" className="text-xs">
                        {key}:{" "}
                        {typeof value === "number"
                          ? value.toFixed(1)
                          : String(value)}
                      </Badge>
                    ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!isVisible) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Pattern Insights
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(true)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Pattern Insights
            <Badge variant="outline" className="text-xs">
              {formatTimeframe(timeframe)}
            </Badge>
          </CardTitle>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={analyzePatterns}
              disabled={ai.isLoading}
              className="h-8 w-8 p-0"
              title="Refresh analysis"
            >
              <RefreshCw
                className={`h-4 w-4 ${ai.isLoading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-8 w-8 p-0"
              title="Hide panel"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {lastAnalyzed && (
          <div className="text-xs text-gray-500">
            Last analyzed: {lastAnalyzed.toLocaleTimeString()}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {ai.error && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {ai.error}
            </AlertDescription>
          </Alert>
        )}

        {ai.isLoading && (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <RefreshCw className="mr-2 h-6 w-6 animate-spin" />
            Analyzing patterns...
          </div>
        )}

        {!ai.isLoading && patterns.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            <Lightbulb className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-sm">
              {data && data.length > 0
                ? "No significant patterns detected yet. Keep working and patterns will emerge!"
                : "No data available for analysis. Complete some tasks to see insights."}
            </p>
          </div>
        )}

        {!ai.isLoading && patterns.length > 0 && (
          <>
            <div className="grid gap-3">
              {patterns
                .sort((a, b) => b.confidence - a.confidence)
                .map((pattern, index) => (
                  <PatternCard
                    key={`${pattern.type}-${index}`}
                    pattern={pattern}
                  />
                ))}
            </div>

            <div className="border-t pt-2">
              <p className="text-center text-xs text-gray-500">
                {patterns.length} pattern{patterns.length !== 1 ? "s" : ""}{" "}
                found. Higher confidence patterns are more reliable.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default PatternInsights;
