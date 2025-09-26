import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAccessToken } from "@/lib/auth/tokens";
import { getAIService } from "@/lib/ai/core/ai-service";
import { aiConfigManager } from "@/lib/ai/config";
import { ProductivityAssistRequest } from "@/lib/ai/types";

const suggestionsRequestSchema = z.object({
  currentState: z.object({
    tasks: z.array(z.any()).optional(),
    goals: z.array(z.any()).optional(),
    workload: z
      .object({
        current: z.number(),
        capacity: z.number(),
        urgentItems: z.number(),
        overdueItems: z.number(),
      })
      .optional(),
    timeContext: z
      .object({
        currentTime: z.string(),
        timeOfDay: z.enum(["morning", "afternoon", "evening"]),
        dayOfWeek: z.string(),
        upcomingDeadlines: z.array(z.any()).optional(),
      })
      .optional(),
  }),
  context: z
    .object({
      framework: z.enum(["gtd", "full-focus", "hybrid"]).default("hybrid"),
      userPreferences: z
        .object({
          communicationStyle: z
            .enum(["concise", "detailed", "balanced"])
            .default("balanced"),
          expertiseLevel: z
            .enum(["beginner", "intermediate", "advanced"])
            .default("intermediate"),
        })
        .optional(),
      triggerEvents: z.array(z.string()).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const accessToken = request.cookies.get("accessToken")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(accessToken);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const validatedRequest = suggestionsRequestSchema.parse(body);

    // Analyze current state for proactive suggestions
    const { currentState, context = {} } = validatedRequest;

    // Determine if user needs proactive assistance
    const needsAssistance = analyzeNeedForAssistance(currentState);

    if (!needsAssistance.shouldSuggest) {
      return NextResponse.json({
        success: true,
        data: {
          suggestions: [],
          reasoning: needsAssistance.reasoning,
          shouldProactivelySuggest: false,
        },
      });
    }

    // Create productivity assistance request for plan adjustment
    const assistRequest: ProductivityAssistRequest = {
      type: "planning",
      content: generateContextualPrompt(currentState, needsAssistance),
      context: {
        framework: (context as any)?.framework || "hybrid",
        userPreferences: (context as any)?.userPreferences || {
          communicationStyle: "balanced",
          expertiseLevel: "intermediate",
        },
        currentWorkload: {
          tasksCount: currentState.tasks?.length || 0,
          urgentTasks: currentState.workload?.urgentItems || 0,
          overdueItems: currentState.workload?.overdueItems || 0,
        },
      },
      additionalData: {
        triggerType: needsAssistance.triggerType,
        severity: needsAssistance.severity,
        timeContext: currentState.timeContext,
      },
    };

    // Get AI service and generate suggestions
    const currentPhase = aiConfigManager.getConfigForPhase();
    const aiService = getAIService(currentPhase.config);

    const response =
      await aiService.generateProductivityAssistance(assistRequest);

    // Parse AI response into structured suggestions
    const suggestions = parseAISuggestions(response.content);

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        reasoning: needsAssistance.reasoning,
        triggerType: needsAssistance.triggerType,
        severity: needsAssistance.severity,
        shouldProactivelySuggest: true,
        metadata: response.metadata,
        aiProvider: currentPhase.config.provider,
      },
    });
  } catch (error) {
    console.error("Proactive suggestions error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Suggestion service failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function analyzeNeedForAssistance(currentState: any): {
  shouldSuggest: boolean;
  reasoning: string;
  triggerType?: string;
  severity?: "low" | "medium" | "high";
} {
  const workload = currentState.workload;
  const timeContext = currentState.timeContext;
  const tasks = currentState.tasks || [];

  // Check for overload condition
  if (
    workload?.current &&
    workload?.capacity &&
    workload.current > workload.capacity * 0.8
  ) {
    return {
      shouldSuggest: true,
      reasoning: "High workload detected - capacity exceeded",
      triggerType: "workload_spike",
      severity: workload.current > workload.capacity ? "high" : "medium",
    };
  }

  // Check for overdue items
  if (workload?.overdueItems && workload.overdueItems > 0) {
    return {
      shouldSuggest: true,
      reasoning: "Overdue items detected",
      triggerType: "overdue_items",
      severity: workload.overdueItems > 3 ? "high" : "medium",
    };
  }

  // Check for urgent items near end of day
  if (
    timeContext?.timeOfDay === "evening" &&
    workload?.urgentItems &&
    workload.urgentItems > 2
  ) {
    return {
      shouldSuggest: true,
      reasoning: "Multiple urgent items remaining late in day",
      triggerType: "end_of_day_urgency",
      severity: "medium",
    };
  }

  // Check for upcoming deadlines
  if (
    timeContext?.upcomingDeadlines &&
    timeContext.upcomingDeadlines.length > 0
  ) {
    const nearDeadlines = timeContext.upcomingDeadlines.filter(
      (deadline: any) => {
        const deadlineDate = new Date(deadline.dueDate);
        const now = new Date();
        const timeDiff = deadlineDate.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return daysDiff <= 2; // Within 2 days
      }
    );

    if (nearDeadlines.length > 0) {
      return {
        shouldSuggest: true,
        reasoning: "Upcoming deadlines within 2 days",
        triggerType: "deadline_pressure",
        severity: nearDeadlines.length > 2 ? "high" : "medium",
      };
    }
  }

  // Check for long periods without task completion
  const recentlyCompleted = tasks.filter((task: any) => {
    if (!task.completedAt) return false;
    const completedDate = new Date(task.completedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - completedDate.getTime()) / (1000 * 3600);
    return hoursDiff <= 4; // Completed within last 4 hours
  });

  if (tasks.length > 5 && recentlyCompleted.length === 0) {
    return {
      shouldSuggest: true,
      reasoning: "No recent task completions detected",
      triggerType: "low_productivity",
      severity: "low",
    };
  }

  return {
    shouldSuggest: false,
    reasoning: "Current state appears manageable",
  };
}

function generateContextualPrompt(
  currentState: any,
  needsAssistance: any
): string {
  const { triggerType, severity } = needsAssistance;

  let basePrompt =
    "Based on the user's current productivity state, provide specific, actionable suggestions to help them ";

  switch (triggerType) {
    case "workload_spike":
      basePrompt +=
        "manage their high workload and prioritize effectively. Focus on what can be deferred, delegated, or simplified.";
      break;
    case "overdue_items":
      basePrompt +=
        "address overdue items and prevent further delays. Suggest quick wins and recovery strategies.";
      break;
    case "end_of_day_urgency":
      basePrompt +=
        "handle urgent items efficiently before day's end. Suggest which items to tackle now vs. tomorrow.";
      break;
    case "deadline_pressure":
      basePrompt +=
        "prepare for upcoming deadlines. Suggest time blocking and preparation strategies.";
      break;
    case "low_productivity":
      basePrompt +=
        "regain momentum and start completing tasks. Suggest starting with smaller, manageable items.";
      break;
    default:
      basePrompt +=
        "optimize their current planning and make adjustments for better productivity.";
  }

  basePrompt += `\n\nCurrent context: ${JSON.stringify(currentState, null, 2)}`;
  basePrompt += `\nSeverity: ${severity}`;
  basePrompt +=
    "\n\nProvide 2-3 specific, actionable suggestions. Be concise and practical.";

  return basePrompt;
}

function parseAISuggestions(aiResponse: string): Array<{
  id: string;
  type: string;
  title: string;
  description: string;
  action: string;
  priority: "low" | "medium" | "high";
  estimatedTime?: string;
}> {
  // Simple parsing - in production, you might want more sophisticated parsing
  const suggestions: any[] = [];

  // Try to extract structured suggestions from AI response
  const lines = aiResponse.split("\n").filter((line) => line.trim());

  let currentSuggestion: any = null;

  for (const line of lines) {
    // Look for numbered items or bullet points
    if (line.match(/^\d+\./) || line.match(/^[\-\*]/)) {
      if (currentSuggestion) {
        suggestions.push(currentSuggestion);
      }

      currentSuggestion = {
        id: crypto.randomUUID(),
        type: "plan_adjustment",
        title: line.replace(/^\d+\.|\*|\-/, "").trim(),
        description: line.replace(/^\d+\.|\*|\-/, "").trim(),
        action: "review",
        priority: "medium",
      };
    } else if (currentSuggestion && line.trim()) {
      // Add additional details to current suggestion
      currentSuggestion.description += " " + line.trim();
    }
  }

  if (currentSuggestion) {
    suggestions.push(currentSuggestion);
  }

  // If no structured suggestions found, create from full response
  if (suggestions.length === 0) {
    suggestions.push({
      id: crypto.randomUUID(),
      type: "general_advice",
      title: "Productivity Suggestion",
      description:
        aiResponse.substring(0, 200) + (aiResponse.length > 200 ? "..." : ""),
      action: "review",
      priority: "medium",
    });
  }

  return suggestions.slice(0, 3); // Limit to 3 suggestions
}
