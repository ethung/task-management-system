"use client";

import { useState, useEffect } from "react";
import {
  Lightbulb,
  Clock,
  Target,
  ArrowRight,
  X,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProactiveSuggestionsProps {
  currentState: any;
  onSuggestionAction?: (
    suggestion: string,
    action: "accept" | "dismiss"
  ) => void;
  className?: string;
}

export function ProactiveSuggestions({
  currentState,
  onSuggestionAction,
  className = "",
}: ProactiveSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(
    new Set()
  );

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentState,
          context: {
            userProfile: {
              frameworks: ["GTD"],
              workStyle: "individual",
              priorities: ["productivity", "time-management"],
            },
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to get suggestions");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionAction = (
    suggestion: string,
    action: "accept" | "dismiss"
  ) => {
    if (action === "dismiss") {
      setDismissedSuggestions((prev) => new Set([...prev, suggestion]));
    }
    onSuggestionAction?.(suggestion, action);
  };

  const activeSuggestions = suggestions.filter(
    (s) => !dismissedSuggestions.has(s)
  );

  useEffect(() => {
    if (currentState && Object.keys(currentState).length > 0) {
      fetchSuggestions();
    }
  }, [currentState]);

  if (!currentState || Object.keys(currentState).length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="py-4 text-center text-muted-foreground">
            <Lightbulb className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">
              Start working to receive proactive suggestions!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                variant="link"
                className="ml-2 h-auto p-0"
                onClick={fetchSuggestions}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Smart Suggestions
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSuggestions}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && activeSuggestions.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            Analyzing your workflow...
          </div>
        ) : activeSuggestions.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
            <p className="text-sm">
              You're on track! No suggestions right now.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3"
              >
                <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    {suggestion}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 bg-white px-2 text-xs"
                      onClick={() =>
                        handleSuggestionAction(suggestion, "accept")
                      }
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={() =>
                        handleSuggestionAction(suggestion, "dismiss")
                      }
                    >
                      <X className="mr-1 h-3 w-3" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {dismissedSuggestions.size > 0 && (
              <div className="border-t pt-2">
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs text-muted-foreground"
                  onClick={() => setDismissedSuggestions(new Set())}
                >
                  Show {dismissedSuggestions.size} dismissed suggestion
                  {dismissedSuggestions.size === 1 ? "" : "s"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
