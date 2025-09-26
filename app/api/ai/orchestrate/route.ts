import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAccessToken } from "@/lib/auth/tokens";
import { getAgentOrchestrator } from "@/lib/ai/core/agent-orchestrator";
import { AIMessage } from "@/lib/ai/types";

const orchestrateRequestSchema = z.object({
  message: z.string().min(1),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .optional(),
  currentAgent: z.string().optional(),
  context: z.record(z.any()).optional(),
  forceAgent: z.string().optional(), // Force use of specific agent
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
    const validatedRequest = orchestrateRequestSchema.parse(body);

    const orchestrator = getAgentOrchestrator();
    const {
      message,
      conversationHistory = [],
      currentAgent = "base-productivity",
      context,
      forceAgent,
    } = validatedRequest;

    let selectedAgent: string;
    let confidence: number;
    let reasoning: string;
    let handoffOccurred = false;

    if (forceAgent) {
      // Use forced agent
      selectedAgent = forceAgent;
      confidence = 1.0;
      reasoning = "Agent manually specified";
    } else {
      // Determine best agent for the request
      const agentSelection = await orchestrator.determineBestAgent(
        message,
        context
      );
      selectedAgent = agentSelection.agent.id;
      confidence = agentSelection.confidence;
      reasoning = agentSelection.reasoning;

      // Check if we should handoff from current agent
      if (currentAgent !== selectedAgent) {
        const handoffDecision = await orchestrator.shouldHandoff(
          currentAgent,
          message,
          conversationHistory as AIMessage[]
        );

        if (handoffDecision.shouldHandoff && handoffDecision.targetAgent) {
          selectedAgent = handoffDecision.targetAgent;
          handoffOccurred = true;

          // Log the handoff
          await orchestrator.initiateHandoff(currentAgent, selectedAgent, {
            userId: payload.userId || "unknown",
            conversationHistory: conversationHistory as AIMessage[],
            currentAgent,
            targetAgent: selectedAgent,
            reason: handoffDecision.reasoning || "Better suited agent found",
            preservedContext: context || {},
          });
        }
      }
    }

    // Process the request with the selected agent
    const response = await orchestrator.processWithSpecializedAgent(
      selectedAgent,
      message,
      conversationHistory as AIMessage[],
      context
    );

    // Get agent capabilities for client
    const agentCapabilities = orchestrator.getAgentCapabilities(selectedAgent);

    return NextResponse.json({
      success: true,
      data: {
        response: response.content,
        metadata: {
          ...response.metadata,
          selectedAgent,
          confidence,
          reasoning,
          handoffOccurred,
          previousAgent: handoffOccurred ? currentAgent : null,
          agentCapabilities,
        },
        usage: response.usage,
      },
    });
  } catch (error) {
    console.error("Agent orchestration error:", error);

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
        error: "Agent orchestration failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve available agents and their capabilities
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

    const orchestrator = getAgentOrchestrator();
    const agents = orchestrator.getAllAgents();

    return NextResponse.json({
      success: true,
      data: {
        agents: agents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          description: agent.description,
          capabilities: agent.capabilities,
          triggerKeywords: agent.triggerKeywords,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch available agents",
      },
      { status: 500 }
    );
  }
}
