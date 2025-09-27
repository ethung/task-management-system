import { NextRequest, NextResponse } from "next/server";
import {
  CareerSuggestionService,
  CareerSuggestionRequest,
} from "@/lib/ai/services/career-suggestion-service";
import { verifyAccessToken } from "@/lib/auth/tokens";
import { getEnvironmentConfig, getAIFeatureFlags } from "@/lib/ai/config";

export async function POST(request: NextRequest) {
  try {
    // Check if AI features are enabled
    const envConfig = getEnvironmentConfig();
    const featureFlags = getAIFeatureFlags();

    if (!envConfig.aiConfig.enableAI || !featureFlags.enableSmartAutocomplete) {
      return NextResponse.json(
        { error: "Smart suggestions are currently disabled" },
        { status: 503 }
      );
    }

    // Authenticate user
    const accessToken = request.cookies.get("accessToken")?.value;
    if (!accessToken) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = payload.userId;

    // Check rate limiting
    if (isRateLimited(userId)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { type, input, context } = body;

    // Validate request
    if (!type || !input) {
      return NextResponse.json(
        { error: "Invalid request: type and input are required" },
        { status: 400 }
      );
    }

    if (!["title", "description", "category"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type: must be title, description, or category" },
        { status: 400 }
      );
    }

    if (typeof input !== "string" || input.length > 500) {
      return NextResponse.json(
        { error: "Invalid input: must be a string under 500 characters" },
        { status: 400 }
      );
    }

    // Create suggestion request
    const suggestionRequest: CareerSuggestionRequest = {
      type: type as "title" | "description" | "category",
      input: input.trim(),
      context: {
        previousWins: context?.previousWins,
        userStyle: context?.userStyle,
        industry: context?.industry,
      },
    };

    // Generate suggestions with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Suggestion timeout")), 5000)
    );

    const suggestionsPromise =
      CareerSuggestionService.getAllSuggestions(suggestionRequest);

    const suggestions = await Promise.race([
      suggestionsPromise,
      timeoutPromise,
    ]);

    // Log interaction if enabled
    if (envConfig.aiConfig.logAIInteractions) {
      console.log("AI Career Suggestions:", {
        userId: payload.userId,
        type,
        inputLength: input.length,
        suggestionsCount: Array.isArray(suggestions) ? suggestions.length : 0,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      suggestions: suggestions || [],
      input,
      type,
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        responseTime: Date.now(),
      },
    });
  } catch (error) {
    console.error("Career Suggestions API Error:", error);

    // Return empty suggestions on error to maintain UX
    return NextResponse.json(
      {
        suggestions: [],
        error: "Suggestion service temporarily unavailable",
        metadata: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          errorType: error instanceof Error ? error.name : "UnknownError",
        },
      },
      { status: 200 } // Return 200 to avoid breaking UX
    );
  }
}

// Rate limiting for suggestions
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const userRequest = requestCounts.get(userId);

  if (!userRequest || now > userRequest.resetTime) {
    // Reset or initialize
    requestCounts.set(userId, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return false;
  }

  if (userRequest.count >= 30) {
    // 30 requests per minute
    return true;
  }

  userRequest.count++;
  return false;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(userId);
    }
  }
}, 300000); // Clean up every 5 minutes
