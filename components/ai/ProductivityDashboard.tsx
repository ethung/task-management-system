"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  AlertTriangle,
  Lightbulb,
  Brain,
  RefreshCw,
} from "lucide-react";
import { PatternInsights } from "./PatternInsights";
import { ProactiveSuggestions } from "./ProactiveSuggestions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PerformanceMetrics {
  completionRate: number;
  averageTaskDuration: number;
  productiveHours: string[];
  commonBlockers: string[];
  mostProductiveDays: string[];
  taskPriorityAccuracy: number;
}

interface ProductivityInsight {
  type: "trend" | "pattern" | "anomaly" | "recommendation";
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  actionable: boolean;
  suggestions?: string[];
}

interface ProductivityDashboardProps {
  userId: string;
  currentState?: any;
  className?: string;
}

export function ProductivityDashboard({
  userId,
  currentState = {},
  className = "",
}: ProductivityDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [insights, setInsights] = useState<ProductivityInsight[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<"1w" | "1m" | "3m">("1m");

  const fetchDashboardData = async () => {
    setIsLoading(true);

    try {
      // Mock data - in production, these would be API calls
      const mockMetrics: PerformanceMetrics = {
        completionRate: 0.78,
        averageTaskDuration: 45,
        productiveHours: ["9:00", "14:00", "16:00"],
        commonBlockers: [
          "Interruptions",
          "Missing resources",
          "Unclear requirements",
        ],
        mostProductiveDays: ["Tuesday", "Wednesday", "Thursday"],
        taskPriorityAccuracy: 0.85,
      };

      const mockInsights: ProductivityInsight[] = [
        {
          type: "trend",
          title: "Completion Rate Improving",
          description:
            "Your task completion rate has increased by 12% this month",
          confidence: 0.87,
          timeframe: "1m",
          actionable: true,
          suggestions: [
            "Continue current workflow",
            "Consider taking on more challenging tasks",
          ],
        },
        {
          type: "pattern",
          title: "Afternoon Productivity Peak",
          description: "You consistently perform best between 2-4 PM",
          confidence: 0.92,
          timeframe: "1m",
          actionable: true,
          suggestions: [
            "Schedule important tasks during peak hours",
            "Block calendar for deep work",
          ],
        },
        {
          type: "anomaly",
          title: "Friday Productivity Drop",
          description:
            "Task completion drops 30% on Fridays compared to mid-week",
          confidence: 0.76,
          timeframe: "1m",
          actionable: true,
          suggestions: [
            "Schedule lighter tasks on Fridays",
            "Plan team meetings instead of individual work",
          ],
        },
      ];

      const mockRecommendations = [
        "Block 2-4 PM for your most important tasks",
        "Reduce Friday commitments by 25%",
        "Create templates for recurring task types to save time",
      ];

      setMetrics(mockMetrics);
      setInsights(mockInsights);
      setRecommendations(mockRecommendations);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "trend":
        return <TrendingUp className="h-4 w-4" />;
      case "pattern":
        return <Brain className="h-4 w-4" />;
      case "anomaly":
        return <AlertTriangle className="h-4 w-4" />;
      case "recommendation":
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <div className={className}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Brain className="h-6 w-6" />
          AI Productivity Dashboard
        </h2>
        <div className="flex items-center gap-2">
          <Tabs
            value={timeframe}
            onValueChange={(value) => setTimeframe(value as any)}
          >
            <TabsList>
              <TabsTrigger value="1w">1 Week</TabsTrigger>
              <TabsTrigger value="1m">1 Month</TabsTrigger>
              <TabsTrigger value="3m">3 Months</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Performance Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(metrics.completionRate * 100)}%
                </div>
                <Progress
                  value={metrics.completionRate * 100}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Task Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-2xl font-bold">
                  <Clock className="h-4 w-4" />
                  {metrics.averageTaskDuration}m
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Priority Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-2xl font-bold">
                  <Target className="h-4 w-4" />
                  {Math.round(metrics.taskPriorityAccuracy * 100)}%
                </div>
                <Progress
                  value={metrics.taskPriorityAccuracy * 100}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Peak Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {metrics.productiveHours.slice(0, 2).map((hour, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="mb-1 mr-1"
                    >
                      {hour}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Insights and Recommendations */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <div
                      key={index}
                      className="space-y-2 rounded-lg border p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getInsightIcon(insight.type)}
                          <span className="text-sm font-medium">
                            {insight.title}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}
                        >
                          {Math.round(insight.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                      {insight.suggestions &&
                        insight.suggestions.length > 0 && (
                          <div className="space-y-1">
                            {insight.suggestions.map(
                              (suggestion, suggestionIndex) => (
                                <div
                                  key={suggestionIndex}
                                  className="rounded bg-muted p-2 text-xs"
                                >
                                  • {suggestion}
                                </div>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Proactive Suggestions */}
          <ProactiveSuggestions
            currentState={currentState}
            onSuggestionAction={(suggestion, action) => {
              console.log("Suggestion action:", suggestion, action);
            }}
          />
        </div>

        {/* Pattern Recognition */}
        <PatternInsights
          data={insights}
          userId={userId}
          timeframe={
            timeframe === "1w" ? "7d" : timeframe === "1m" ? "30d" : "1d"
          }
        />
      </div>
    </div>
  );
}
