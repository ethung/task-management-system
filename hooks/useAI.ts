"use client";

import { useState, useCallback } from "react";
import {
  AIMessage,
  ProductivityContext,
  AutocompleteRequest,
  ProductivityPattern,
} from "@/lib/ai/types/index";

interface UseAIOptions {
  enableAutoComplete?: boolean;
  enablePatternRecognition?: boolean;
  enableCRUDValidation?: boolean;
}

interface AIState {
  isLoading: boolean;
  error: string | null;
  lastResponse: string | null;
}

interface ChatResponse {
  response: string;
  metadata?: {
    provider: string;
    requestId: string;
    timestamp: string;
    confidence?: number;
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface AutocompleteResponse {
  suggestions: string[];
  metadata: {
    provider: string;
    context: string;
    requestId: string;
    timestamp: string;
  };
}

interface PatternResponse {
  patterns: ProductivityPattern[];
  dataPoints: number;
  timeframe: string;
  metadata: {
    provider: string;
    requestId: string;
    timestamp: string;
  };
}

interface CRUDValidationResponse {
  approved: boolean;
  reason?: string;
  operation: {
    action: string;
    entity: string;
    requiresConfirmation: boolean;
  };
  metadata: {
    provider: string;
    requestId: string;
    timestamp: string;
  };
}

export function useAI(options: UseAIOptions = {}) {
  const [state, setState] = useState<AIState>({
    isLoading: false,
    error: null,
    lastResponse: null,
  });

  const updateState = (updates: Partial<AIState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  // General chat with productivity context
  const chat = useCallback(
    async (
      messages: AIMessage[],
      context?: ProductivityContext
    ): Promise<ChatResponse | null> => {
      updateState({ isLoading: true, error: null });

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages,
            type: context ? "productivity" : "general",
            context,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI chat failed: ${response.status}`);
        }

        const data: ChatResponse = await response.json();
        updateState({ isLoading: false, lastResponse: data.response });

        return data;
      } catch (error) {
        console.error("AI chat error:", error);
        updateState({
          isLoading: false,
          error: error instanceof Error ? error.message : "Chat failed",
        });
        return null;
      }
    },
    []
  );

  // Smart autocomplete
  const autocomplete = useCallback(
    async (
      text: string,
      position: number,
      context: "task" | "goal" | "project" | "note",
      userPatterns?: string[]
    ): Promise<string[]> => {
      if (!options.enableAutoComplete) {
        return [];
      }

      try {
        const response = await fetch("/api/ai/autocomplete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            position,
            contextType: context,
            userPatterns,
          }),
        });

        if (!response.ok) {
          console.warn("Autocomplete request failed:", response.status);
          return [];
        }

        const data: AutocompleteResponse = await response.json();
        return data.suggestions || [];
      } catch (error) {
        console.error("Autocomplete error:", error);
        return [];
      }
    },
    [options.enableAutoComplete]
  );

  // Pattern recognition
  const analyzePatterns = useCallback(
    async (
      data: any[],
      timeframe: string = "7d"
    ): Promise<ProductivityPattern[]> => {
      if (!options.enablePatternRecognition) {
        return [];
      }

      updateState({ isLoading: true, error: null });

      try {
        const response = await fetch("/api/ai/patterns", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data,
            timeframe,
          }),
        });

        if (!response.ok) {
          throw new Error(`Pattern analysis failed: ${response.status}`);
        }

        const result: PatternResponse = await response.json();
        updateState({ isLoading: false });

        return result.patterns || [];
      } catch (error) {
        console.error("Pattern analysis error:", error);
        updateState({
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Pattern analysis failed",
        });
        return [];
      }
    },
    [options.enablePatternRecognition]
  );

  // CRUD operation validation
  const validateCRUDOperation = useCallback(
    async (
      action: "create" | "read" | "update" | "delete",
      entity: "task" | "goal" | "plan" | "project",
      data: any,
      reason?: string
    ): Promise<{ approved: boolean; reason?: string }> => {
      if (!options.enableCRUDValidation) {
        return { approved: true }; // Default to approved if validation disabled
      }

      try {
        const response = await fetch("/api/ai/crud-validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            operation: {
              action,
              entity,
              data,
              reason,
            },
          }),
        });

        if (!response.ok) {
          console.warn("CRUD validation request failed:", response.status);
          return { approved: true }; // Default to approved on error
        }

        const result: CRUDValidationResponse = await response.json();
        return {
          approved: result.approved,
          reason: result.reason,
        };
      } catch (error) {
        console.error("CRUD validation error:", error);
        return { approved: true }; // Default to approved on error
      }
    },
    [options.enableCRUDValidation]
  );

  // Productivity assistance shortcuts
  const planTask = useCallback(
    (taskDescription: string, context: ProductivityContext) => {
      return chat(
        [
          {
            role: "user",
            content: `Help me plan this task: ${taskDescription}`,
          },
        ],
        { ...context, requestType: "planning" } as any
      );
    },
    [chat]
  );

  const breakdownProject = useCallback(
    (projectDescription: string, context: ProductivityContext) => {
      return chat(
        [
          {
            role: "user",
            content: `Break down this project into actionable tasks: ${projectDescription}`,
          },
        ],
        { ...context, requestType: "breakdown" } as any
      );
    },
    [chat]
  );

  const prioritizeTasks = useCallback(
    (taskList: string, context: ProductivityContext) => {
      return chat(
        [
          {
            role: "user",
            content: `Help me prioritize these tasks: ${taskList}`,
          },
        ],
        { ...context, requestType: "prioritization" } as any
      );
    },
    [chat]
  );

  const weeklyReflection = useCallback(
    (weekData: string, context: ProductivityContext) => {
      return chat(
        [{ role: "user", content: `Help me reflect on my week: ${weekData}` }],
        { ...context, requestType: "reflection" } as any
      );
    },
    [chat]
  );

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    lastResponse: state.lastResponse,

    // Core functions
    chat,
    autocomplete,
    analyzePatterns,
    validateCRUDOperation,

    // Productivity shortcuts
    planTask,
    breakdownProject,
    prioritizeTasks,
    weeklyReflection,

    // Utility
    clearError: () => updateState({ error: null }),
    isAvailable: true, // Will be dynamic based on feature flags
  };
}

export type UseAIReturn = ReturnType<typeof useAI>;
