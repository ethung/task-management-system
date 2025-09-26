import { NextRequest, NextResponse } from "next/server";
import { getAIService } from "@/lib/ai/core/ai-service";
import {
  aiConfigManager,
  getEnvironmentConfig,
  getAIFeatureFlags,
} from "@/lib/ai/config";
import { AutocompleteRequest } from "@/lib/ai/types/index";
import { verifyAccessToken } from "@/lib/auth/tokens";

export async function POST(request: NextRequest) {
  try {
    // Check if AI and autocomplete are enabled
    const envConfig = getEnvironmentConfig();
    const featureFlags = getAIFeatureFlags();

    if (!envConfig.aiConfig.enableAI || !featureFlags.enableSmartAutocomplete) {
      return NextResponse.json(
        { error: "Smart autocomplete is currently disabled" },
        { status: 503 }
      );
    }

    // Authenticate user
    const accessToken = request.cookies.get("accessToken")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const payload = verifyAccessToken(accessToken);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const {
      input,
      text,
      position,
      contextType = "task",
      context,
      userPatterns,
    } = body;

    // Support both old and new format
    const inputText = text || input;
    const inputPosition = position || inputText?.length || 0;

    // Validate request
    if (typeof inputText !== "string") {
      return NextResponse.json(
        { error: "Invalid request: input text is required" },
        { status: 400 }
      );
    }

    if (!["task", "goal", "project", "note"].includes(contextType)) {
      return NextResponse.json(
        { error: "Invalid context: must be task, goal, project, or note" },
        { status: 400 }
      );
    }

    // Create autocomplete request
    const autocompleteRequest: AutocompleteRequest = {
      text: inputText,
      position: inputPosition,
      context: contextType,
      userPatterns: Array.isArray(userPatterns) ? userPatterns : undefined,
    };

    // Get AI service and generate suggestions
    const config = aiConfigManager.getCurrentConfig();
    const aiService = getAIService(config);

    const suggestions =
      await aiService.generateAutocomplete(autocompleteRequest);

    // Log interaction if enabled
    if (envConfig.aiConfig.logAIInteractions) {
      console.log("AI Autocomplete:", {
        userId: payload.userId,
        provider: config.provider,
        context: contextType,
        textLength: inputText.length,
        suggestionsCount: suggestions.length,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      suggestions,
      input: inputText,
      contextType,
      metadata: {
        provider: config.provider,
        context: contextType,
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
      userId: payload.userId,
    });
  } catch (error) {
    console.error("AI Autocomplete API Error:", error);

    return NextResponse.json(
      {
        suggestions: [], // Return empty array on error
        error: "Autocomplete service temporarily unavailable",
        metadata: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
