import { NextRequest, NextResponse } from "next/server";
import { getAIService } from "@/lib/ai/core/ai-service";
import {
  aiConfigManager,
  getEnvironmentConfig,
  getAIFeatureFlags,
} from "@/lib/ai/config";
import { verifyAccessToken } from "@/lib/auth/tokens";

export async function POST(request: NextRequest) {
  try {
    // Check if AI and pattern recognition are enabled
    const envConfig = getEnvironmentConfig();
    const featureFlags = getAIFeatureFlags();

    if (
      !envConfig.aiConfig.enableAI ||
      !featureFlags.enablePatternRecognition
    ) {
      return NextResponse.json(
        { error: "Pattern recognition is currently disabled" },
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
    const { recentActions, data, context, timeframe = "7d" } = body;

    // Support both old and new format
    const analysisData = data || recentActions;

    if (!analysisData || !Array.isArray(analysisData)) {
      return NextResponse.json(
        { error: "Missing or invalid data array for pattern analysis" },
        { status: 400 }
      );
    }

    // Get AI service and analyze patterns
    const config = aiConfigManager.getCurrentConfig();
    const aiService = getAIService(config);

    const patterns = await aiService.analyzePatterns(analysisData);

    // Log interaction if enabled
    if (envConfig.aiConfig.logAIInteractions) {
      console.log("AI Pattern Analysis:", {
        userId: payload.userId,
        provider: config.provider,
        dataPoints: analysisData.length,
        patternsFound: patterns.length,
        timeframe,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      patterns,
      dataPoints: analysisData.length,
      timeframe,
      metadata: {
        provider: config.provider,
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
      userId: payload.userId,
    });
  } catch (error) {
    console.error("AI Pattern Recognition API Error:", error);

    return NextResponse.json(
      {
        patterns: [], // Return empty array on error
        error: "Pattern recognition service temporarily unavailable",
        metadata: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
