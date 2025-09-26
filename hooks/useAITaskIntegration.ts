"use client";

import { useState, useCallback } from "react";
import { useAI } from "./useAI";

interface TaskData {
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: Date | string;
  projectId?: string;
  tags?: string[];
}

interface AITaskSuggestions {
  enhancedDescription?: string;
  suggestedPriority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedDuration?: string;
  suggestedTags?: string[];
  breakdown?: string[];
  dependencies?: string[];
  risks?: string[];
  nextActions?: string[];
}

interface CRUDValidation {
  approved: boolean;
  reason?: string;
  suggestions?: string[];
  requiresConfirmation?: boolean;
}

export function useAITaskIntegration() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ai = useAI({
    enableAutoComplete: true,
    enablePatternRecognition: true,
    enableCRUDValidation: true,
  });

  // AI-enhanced task creation with suggestions and validation
  const createTaskWithAI = useCallback(
    async (
      taskData: TaskData,
      options: {
        enableSuggestions?: boolean;
        validateWithAI?: boolean;
        framework?: "gtd" | "full-focus" | "hybrid";
      } = {}
    ) => {
      setIsProcessing(true);
      setError(null);

      try {
        const {
          enableSuggestions = true,
          validateWithAI = true,
          framework = "hybrid",
        } = options;

        let aiSuggestions: AITaskSuggestions | null = null;
        let crudValidation: CRUDValidation | null = null;

        // Step 1: Get AI suggestions for task enhancement
        if (enableSuggestions) {
          aiSuggestions = await getTaskSuggestions(taskData, framework);
        }

        // Step 2: Validate the task creation with AI
        if (validateWithAI) {
          crudValidation = await validateTaskOperation(
            "create",
            taskData,
            aiSuggestions
          );
        }

        // Step 3: If validation requires confirmation, return for user review
        if (crudValidation && !crudValidation.approved) {
          return {
            success: false,
            requiresConfirmation: crudValidation.requiresConfirmation,
            validation: crudValidation,
            suggestions: aiSuggestions,
            taskData,
          };
        }

        // Step 4: Apply AI suggestions if available
        const enhancedTaskData = aiSuggestions
          ? {
              ...taskData,
              description:
                aiSuggestions.enhancedDescription || taskData.description,
              priority: aiSuggestions.suggestedPriority || taskData.priority,
              tags: [
                ...(taskData.tags || []),
                ...(aiSuggestions.suggestedTags || []),
              ],
            }
          : taskData;

        // Step 5: Create the task
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(enhancedTaskData),
        });

        if (!response.ok) {
          throw new Error("Failed to create task");
        }

        const createdTask = await response.json();

        // Step 6: Create breakdown tasks if suggested
        if (aiSuggestions?.breakdown && aiSuggestions.breakdown.length > 0) {
          await createBreakdownTasks(createdTask.id, aiSuggestions.breakdown);
        }

        return {
          success: true,
          task: createdTask,
          suggestions: aiSuggestions,
          validation: crudValidation,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  // Get AI suggestions for task enhancement
  const getTaskSuggestions = useCallback(
    async (
      taskData: TaskData,
      framework: "gtd" | "full-focus" | "hybrid"
    ): Promise<AITaskSuggestions> => {
      const response = await fetch("/api/ai/assistance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "breakdown",
          content: `Analyze and enhance this task: "${taskData.title}" ${taskData.description ? `- ${taskData.description}` : ""}`,
          context: {
            framework,
            userPreferences: {
              communicationStyle: "balanced",
              expertiseLevel: "intermediate",
            },
            currentWorkload: {
              tasksCount: 0, // TODO: Get from actual user data
              urgentTasks: 0,
              overdueItems: 0,
            },
          },
          additionalData: {
            taskType: "creation",
            originalTask: taskData,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI suggestions");
      }

      const result = await response.json();
      return parseTaskSuggestions(result.data.response);
    },
    []
  );

  // Validate CRUD operations with AI
  const validateTaskOperation = useCallback(
    async (
      operation: "create" | "update" | "delete",
      taskData: TaskData,
      suggestions?: AITaskSuggestions | null
    ): Promise<CRUDValidation> => {
      const response = await fetch("/api/ai/crud-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: {
            action: operation,
            entity: "task",
            data: taskData,
            confirmation: false,
            reason: suggestions
              ? "AI-enhanced task creation"
              : "Standard task creation",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to validate task operation");
      }

      const result = await response.json();
      return {
        approved: result.approved,
        reason: result.reason,
        requiresConfirmation: result.operation?.requiresConfirmation || false,
      };
    },
    []
  );

  // Create breakdown tasks from AI suggestions
  const createBreakdownTasks = useCallback(
    async (parentTaskId: string, breakdown: string[]) => {
      const breakdownTasks = breakdown.map((item) => ({
        title: item,
        priority: "MEDIUM" as const,
        projectId: null, // Will inherit from parent if needed
      }));

      const promises = breakdownTasks.map((task) =>
        fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            ...task,
            description: `Subtask of: ${parentTaskId}`,
          }),
        })
      );

      await Promise.all(promises);
    },
    []
  );

  // AI-powered task completion analysis
  const analyzeTaskCompletion = useCallback(
    async (taskId: string) => {
      setIsProcessing(true);

      try {
        // Get task completion patterns
        const patterns = await ai.analyzePatterns([
          { taskId, action: "completed" },
        ]);

        return {
          patterns,
          insights: patterns.map((p) => p.suggestion),
          nextActions: [], // TODO: Extract from patterns
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [ai]
  );

  // Smart task prioritization
  const suggestTaskPriorities = useCallback(async (tasks: TaskData[]) => {
    const response = await fetch("/api/ai/assistance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "prioritization",
        content: `Analyze and prioritize these tasks: ${JSON.stringify(tasks, null, 2)}`,
        context: {
          framework: "hybrid",
          userPreferences: {
            communicationStyle: "concise",
            expertiseLevel: "intermediate",
          },
          currentWorkload: {
            tasksCount: tasks.length,
            urgentTasks: tasks.filter((t) => t.priority === "URGENT").length,
            overdueItems: 0,
          },
        },
      }),
    });

    const result = await response.json();
    return parsePrioritySuggestions(result.data.response);
  }, []);

  return {
    createTaskWithAI,
    getTaskSuggestions,
    validateTaskOperation,
    analyzeTaskCompletion,
    suggestTaskPriorities,
    isProcessing,
    error,
  };
}

// Helper function to parse AI suggestions from response
function parseTaskSuggestions(aiResponse: string): AITaskSuggestions {
  // This is a simplified parser - in production you might want more sophisticated parsing
  const suggestions: AITaskSuggestions = {};

  // Extract breakdown if present
  const breakdownMatch = aiResponse.match(
    /breakdown:?\s*\n((?:\d+\.\s*.+\n?)+)/i
  );
  if (breakdownMatch) {
    suggestions.breakdown = breakdownMatch[1]
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.replace(/^\d+\.\s*/, "").trim());
  }

  // Extract priority suggestion
  const priorityMatch = aiResponse.match(
    /priority:?\s*(low|medium|high|urgent)/i
  );
  if (priorityMatch) {
    suggestions.suggestedPriority = priorityMatch[1].toUpperCase() as
      | "LOW"
      | "MEDIUM"
      | "HIGH"
      | "URGENT";
  }

  // Extract estimated duration
  const durationMatch = aiResponse.match(/duration:?\s*([^.]+)/i);
  if (durationMatch) {
    suggestions.estimatedDuration = durationMatch[1].trim();
  }

  return suggestions;
}

// Helper function to parse priority suggestions
function parsePrioritySuggestions(
  aiResponse: string
): Array<{ taskIndex: number; suggestedPriority: string; reasoning: string }> {
  // Simplified parsing - extract priority recommendations
  const suggestions: Array<{
    taskIndex: number;
    suggestedPriority: string;
    reasoning: string;
  }> = [];

  // This would need more sophisticated parsing in production
  const lines = aiResponse.split("\n").filter((line) => line.trim());
  lines.forEach((line, index) => {
    if (line.includes("priority") || line.includes("Priority")) {
      suggestions.push({
        taskIndex: index,
        suggestedPriority: "MEDIUM",
        reasoning: line,
      });
    }
  });

  return suggestions;
}
