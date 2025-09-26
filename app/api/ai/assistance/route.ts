import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAccessToken } from "@/lib/auth/tokens";
import { getAIService } from "@/lib/ai/core/ai-service";
import { aiConfigManager } from "@/lib/ai/config";
import { getKnowledgeBase } from "@/lib/ai/core/knowledge-base";
import { ProductivityAssistRequest } from "@/lib/ai/types";

const assistanceRequestSchema = z.object({
  type: z.enum([
    "planning",
    "breakdown",
    "prioritization",
    "reflection",
    "autocomplete",
  ]),
  content: z.string().min(1),
  context: z.object({
    framework: z.enum(["gtd", "full-focus", "hybrid"]),
    userPreferences: z.object({
      communicationStyle: z.enum(["concise", "detailed", "balanced"]),
      expertiseLevel: z.enum(["beginner", "intermediate", "advanced"]),
    }),
    currentWorkload: z.object({
      tasksCount: z.number(),
      urgentTasks: z.number(),
      overdueItems: z.number(),
    }),
    historicalPatterns: z
      .object({
        completionRate: z.number(),
        averageTaskDuration: z.number(),
        peakProductivityHours: z.array(z.number()),
      })
      .optional(),
  }),
  additionalData: z.record(z.any()).optional(),
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
    const validatedRequest = assistanceRequestSchema.parse(body);

    // Get AI service with current configuration
    const currentPhase = aiConfigManager.getConfigForPhase();
    const aiService = getAIService(currentPhase.config);

    // Generate productivity assistance
    const response = await aiService.generateProductivityAssistance(
      validatedRequest as ProductivityAssistRequest
    );

    // Get relevant knowledge base information
    const knowledgeBase = getKnowledgeBase();
    const frameworkPrinciples = knowledgeBase.getPrinciplesByFramework(
      validatedRequest.context.framework
    );
    const relevantTemplates = knowledgeBase.getTemplatesByCategory(
      validatedRequest.type as any
    );

    return NextResponse.json({
      success: true,
      data: {
        response: response.content,
        metadata: response.metadata,
        usage: response.usage,
        relevantPrinciples: frameworkPrinciples.slice(0, 3), // Top 3 relevant principles
        suggestedTemplates: relevantTemplates.slice(0, 2), // Top 2 relevant templates
        aiProvider: currentPhase.config.provider,
        phase: currentPhase.phase,
        phaseDescription: currentPhase.description,
      },
    });
  } catch (error) {
    console.error("AI assistance error:", error);

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
        error: "AI assistance failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    // Get AI service health status
    const currentPhase = aiConfigManager.getConfigForPhase();
    const aiService = getAIService(currentPhase.config);
    const healthStatus = await aiService.healthCheck();

    // Get available providers
    const availableProviders = aiConfigManager.getAvailableProviders();

    return NextResponse.json({
      success: true,
      data: {
        currentProvider: currentPhase.config.provider,
        phase: currentPhase.phase,
        phaseDescription: currentPhase.description,
        availableProviders,
        healthStatus,
        configuration: {
          model: currentPhase.config.model,
          temperature: currentPhase.config.temperature,
          maxTokens: currentPhase.config.maxTokens,
        },
      },
    });
  } catch (error) {
    console.error("AI status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get AI status",
      },
      { status: 500 }
    );
  }
}
