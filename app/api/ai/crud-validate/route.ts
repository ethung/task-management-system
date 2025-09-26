import { NextRequest, NextResponse } from "next/server";
import { getAIService } from "@/lib/ai/core/ai-service";
import {
  aiConfigManager,
  getEnvironmentConfig,
  getAIFeatureFlags,
} from "@/lib/ai/config";
import { CRUDOperation } from "@/lib/ai/types/index";
import { verifyAccessToken } from "@/lib/auth/tokens";

export async function POST(request: NextRequest) {
  try {
    // Check if AI and CRUD validation are enabled
    const envConfig = getEnvironmentConfig();
    const featureFlags = getAIFeatureFlags();

    if (!envConfig.aiConfig.enableAI || !featureFlags.enableCRUDValidation) {
      return NextResponse.json(
        { error: "CRUD validation is currently disabled" },
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
    const { operation } = body;

    if (!operation) {
      return NextResponse.json(
        { error: "Operation object is required" },
        { status: 400 }
      );
    }

    // Validate operation structure
    const { action, entity, data, confirmation, reason } = operation;

    if (!action || !entity || !data) {
      return NextResponse.json(
        { error: "Operation must include action, entity, and data fields" },
        { status: 400 }
      );
    }

    if (!["create", "read", "update", "delete"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action: must be create, read, update, or delete" },
        { status: 400 }
      );
    }

    if (!["task", "goal", "plan", "project"].includes(entity)) {
      return NextResponse.json(
        { error: "Invalid entity: must be task, goal, plan, or project" },
        { status: 400 }
      );
    }

    // Create CRUD operation object
    const crudOperation: CRUDOperation = {
      action,
      entity,
      data,
      confirmation: confirmation || false,
      reason,
    };

    // Get AI service and validate operation
    const config = aiConfigManager.getCurrentConfig();
    const aiService = getAIService(config);

    const validation = await aiService.validateCRUDOperation(crudOperation);

    // Log interaction if enabled
    if (envConfig.aiConfig.logAIInteractions) {
      console.log("AI CRUD Validation:", {
        userId: payload.userId,
        provider: config.provider,
        action,
        entity,
        approved: validation.approved,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      ...validation,
      operation: {
        action,
        entity,
        requiresConfirmation:
          ["delete", "update"].includes(action) && !confirmation,
      },
      metadata: {
        provider: config.provider,
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
      userId: payload.userId,
    });
  } catch (error) {
    console.error("AI CRUD Validation API Error:", error);

    return NextResponse.json(
      {
        approved: false,
        reason: "Validation service temporarily unavailable",
        error: "CRUD validation service error",
        metadata: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
