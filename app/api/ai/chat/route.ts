import { NextRequest, NextResponse } from "next/server";
import { getAIService } from "@/lib/ai/core/ai-service";
import {
  aiConfigManager,
  getEnvironmentConfig,
  getAIFeatureFlags,
} from "@/lib/ai/config";
import { AIMessage, ProductivityAssistRequest } from "@/lib/ai/types/index";
import { verifyAccessToken } from "@/lib/auth/tokens";

export async function POST(request: NextRequest) {
  try {
    // Check if AI is enabled
    const envConfig = getEnvironmentConfig();
    if (!envConfig.aiConfig.enableAI) {
      return NextResponse.json(
        { error: "AI features are currently disabled" },
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
    const { messages, type = "general", context } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Validate message format
    const validMessages: AIMessage[] = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      metadata: msg.metadata,
    }));

    // Get AI service with current configuration
    const config = aiConfigManager.getCurrentConfig();
    const aiService = getAIService(config);

    let response;

    if (type === "productivity" && context) {
      // Handle productivity-specific requests
      const productivityRequest: ProductivityAssistRequest = {
        type: context.requestType || "planning",
        content: messages[messages.length - 1].content,
        context: {
          framework: context.framework || "hybrid",
          userPreferences: context.userPreferences || {
            communicationStyle: "balanced",
            expertiseLevel: "intermediate",
          },
          currentWorkload: context.currentWorkload || {
            tasksCount: 0,
            urgentTasks: 0,
            overdueItems: 0,
          },
          historicalPatterns: context.historicalPatterns,
        },
        additionalData: context.additionalData,
      };

      response =
        await aiService.generateProductivityAssistance(productivityRequest);
    } else {
      // Handle general chat requests
      response = await aiService.generateResponse(validMessages);
    }

    // Log interaction if enabled
    if (envConfig.aiConfig.logAIInteractions) {
      console.log("AI Interaction:", {
        userId: payload.userId,
        provider: config.provider,
        model: config.model,
        type,
        messageCount: messages.length,
        responseLength: response.content.length,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      response: response.content,
      metadata: {
        ...response.metadata,
        userId: payload.userId,
        requestId: crypto.randomUUID(),
      },
      usage: response.usage,
    });
  } catch (error) {
    console.error("AI Chat API Error:", error);

    // Return appropriate error response
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "AI service error",
          message: error.message,
          fallbackAvailable: true,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const envConfig = getEnvironmentConfig();
    const featureFlags = getAIFeatureFlags();
    const config = aiConfigManager.getCurrentConfig();
    const aiService = getAIService(config);

    // Perform health check
    const healthResults = await aiService.healthCheck();

    return NextResponse.json({
      status: "ok",
      aiEnabled: envConfig.aiConfig.enableAI,
      currentProvider: config.provider,
      availableProviders: aiConfigManager.getAvailableProviders(),
      features: featureFlags,
      healthCheck: healthResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Health Check Error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
