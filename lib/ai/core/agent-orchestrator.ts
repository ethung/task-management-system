import {
  AgentCapability,
  AgentHandoff,
  ProductivityFramework,
  AIMessage,
  AIResponse,
} from "../types/index";
import { aiConfigManager } from "../config";
import { getAIService } from "./ai-service";

interface SpecializedAgent {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  systemPrompt: string;
  triggerKeywords: string[];
  confidence: number;
}

interface HandoffContext {
  userId: string;
  conversationHistory: AIMessage[];
  currentAgent: string;
  targetAgent: string;
  reason: string;
  preservedContext: Record<string, any>;
}

export class AgentOrchestrator {
  private agents: Map<string, SpecializedAgent> = new Map();
  private activeHandoffs: Map<string, HandoffContext> = new Map();

  constructor() {
    this.initializeSpecializedAgents();
  }

  private initializeSpecializedAgents() {
    const agents: SpecializedAgent[] = [
      {
        id: "base-productivity",
        name: "Base Productivity Expert",
        description:
          "General productivity consulting and framework application",
        capabilities: [
          {
            name: "General Productivity Guidance",
            description:
              "Provides general productivity advice using GTD, Full Focus, and other frameworks",
            triggers: [
              "planning",
              "organization",
              "productivity",
              "time management",
            ],
            confidence: 0.9,
          },
          {
            name: "Task Management",
            description:
              "Help with task breakdown, prioritization, and organization",
            triggers: ["tasks", "todo", "priorities", "deadlines"],
            confidence: 0.9,
          },
          {
            name: "Goal Setting",
            description: "Assist with goal setting and quarterly planning",
            triggers: ["goals", "objectives", "planning", "quarterly"],
            confidence: 0.8,
          },
        ],
        systemPrompt: `You are a base productivity expert with 15+ years of experience. You provide measured, practical advice using proven frameworks like GTD and Full Focus. You maintain a professional, consultant-like demeanor and can hand off complex requests to specialized agents when appropriate.`,
        triggerKeywords: [
          "productivity",
          "planning",
          "tasks",
          "goals",
          "organization",
          "time",
        ],
        confidence: 0.8,
      },
      {
        id: "resume-expert",
        name: "Resume & Career Document Expert",
        description:
          "Specialized in resume writing, cover letters, and career documents",
        capabilities: [
          {
            name: "Resume Writing",
            description:
              "Create and optimize resumes for specific roles and industries",
            triggers: ["resume", "cv", "curriculum vitae", "resume writing"],
            confidence: 0.95,
          },
          {
            name: "Cover Letter Creation",
            description:
              "Write compelling cover letters tailored to specific positions",
            triggers: ["cover letter", "application letter", "job application"],
            confidence: 0.9,
          },
          {
            name: "Career Document Review",
            description: "Review and improve professional documents",
            triggers: [
              "document review",
              "career documents",
              "professional writing",
            ],
            confidence: 0.85,
          },
        ],
        systemPrompt: `You are a professional resume writer and career coach with expertise in creating compelling career documents. You understand ATS systems, industry-specific requirements, and modern hiring practices. You provide specific, actionable feedback on resumes, cover letters, and other career documents.`,
        triggerKeywords: [
          "resume",
          "cv",
          "cover letter",
          "job application",
          "career documents",
          "professional writing",
        ],
        confidence: 0.95,
      },
      {
        id: "career-coach",
        name: "Career Development Coach",
        description:
          "Career guidance, professional development, and strategic career planning",
        capabilities: [
          {
            name: "Career Strategy",
            description:
              "Develop long-term career strategies and professional development plans",
            triggers: [
              "career strategy",
              "professional development",
              "career planning",
            ],
            confidence: 0.9,
          },
          {
            name: "Skill Development",
            description:
              "Identify skill gaps and recommend development opportunities",
            triggers: ["skills", "professional growth", "career advancement"],
            confidence: 0.85,
          },
          {
            name: "Networking Guidance",
            description:
              "Provide networking strategies and relationship building advice",
            triggers: [
              "networking",
              "professional relationships",
              "career connections",
            ],
            confidence: 0.8,
          },
        ],
        systemPrompt: `You are an experienced career coach who helps professionals navigate their career journey. You provide strategic guidance on career development, skill building, networking, and professional advancement. You understand various industries and can provide tailored advice for different career stages.`,
        triggerKeywords: [
          "career coaching",
          "professional development",
          "career advancement",
          "networking",
          "skills",
          "leadership",
        ],
        confidence: 0.85,
      },
      {
        id: "interview-prep",
        name: "Interview Preparation Specialist",
        description:
          "Interview coaching, preparation strategies, and practice sessions",
        capabilities: [
          {
            name: "Interview Preparation",
            description: "Prepare candidates for various types of interviews",
            triggers: [
              "interview prep",
              "interview preparation",
              "job interview",
            ],
            confidence: 0.95,
          },
          {
            name: "Behavioral Interview Coaching",
            description:
              "Help with STAR method and behavioral question responses",
            triggers: [
              "behavioral interview",
              "STAR method",
              "interview questions",
            ],
            confidence: 0.9,
          },
          {
            name: "Technical Interview Support",
            description:
              "Guidance for technical and industry-specific interviews",
            triggers: [
              "technical interview",
              "coding interview",
              "technical questions",
            ],
            confidence: 0.8,
          },
        ],
        systemPrompt: `You are an interview coach with extensive experience helping candidates succeed in job interviews. You understand various interview formats, can provide mock interview practice, and help candidates develop compelling stories using the STAR method. You provide constructive feedback and confidence-building strategies.`,
        triggerKeywords: [
          "interview",
          "interview prep",
          "interview questions",
          "STAR method",
          "behavioral interview",
          "mock interview",
        ],
        confidence: 0.9,
      },
      {
        id: "project-manager",
        name: "Project Management Specialist",
        description:
          "Project planning, execution, and team coordination expertise",
        capabilities: [
          {
            name: "Project Planning",
            description: "Create comprehensive project plans and timelines",
            triggers: [
              "project planning",
              "project management",
              "project timeline",
            ],
            confidence: 0.9,
          },
          {
            name: "Team Coordination",
            description: "Strategies for team communication and collaboration",
            triggers: ["team management", "team coordination", "collaboration"],
            confidence: 0.85,
          },
          {
            name: "Risk Management",
            description: "Identify and mitigate project risks",
            triggers: [
              "risk management",
              "project risks",
              "contingency planning",
            ],
            confidence: 0.8,
          },
        ],
        systemPrompt: `You are a certified project manager with experience across various methodologies (Agile, Waterfall, Hybrid). You help with project planning, team coordination, risk management, and stakeholder communication. You provide structured, practical advice for project success.`,
        triggerKeywords: [
          "project",
          "project management",
          "team",
          "planning",
          "timeline",
          "milestones",
          "deliverables",
        ],
        confidence: 0.85,
      },
    ];

    agents.forEach((agent) => {
      this.agents.set(agent.id, agent);
    });
  }

  async determineBestAgent(
    userMessage: string,
    context?: Record<string, any>
  ): Promise<{
    agent: SpecializedAgent;
    confidence: number;
    reasoning: string;
  }> {
    const messageLower = userMessage.toLowerCase();
    const scores: Array<{
      agent: SpecializedAgent;
      score: number;
      matches: string[];
    }> = [];

    // Score each agent based on keyword matching and capability alignment
    for (const agent of this.agents.values()) {
      let score = 0;
      const matches: string[] = [];

      // Check trigger keywords
      for (const keyword of agent.triggerKeywords) {
        if (messageLower.includes(keyword.toLowerCase())) {
          score += 2;
          matches.push(keyword);
        }
      }

      // Check capability triggers
      for (const capability of agent.capabilities) {
        for (const trigger of capability.triggers) {
          if (messageLower.includes(trigger.toLowerCase())) {
            score += capability.confidence;
            matches.push(trigger);
          }
        }
      }

      // Boost score for exact capability matches
      const exactMatches = agent.capabilities.filter((cap) =>
        cap.triggers.some((trigger) =>
          messageLower.includes(trigger.toLowerCase())
        )
      );
      score += exactMatches.length * 0.5;

      scores.push({ agent, score, matches });
    }

    // Sort by score and select best match
    scores.sort((a, b) => b.score - a.score);
    const bestMatch = scores[0];

    // If no good match found, default to base productivity agent
    if (bestMatch.score < 1) {
      const baseAgent = this.agents.get("base-productivity")!;
      return {
        agent: baseAgent,
        confidence: 0.6,
        reasoning:
          "No specialized agent match found, using base productivity expert",
      };
    }

    const confidence = Math.min(bestMatch.score / 5, 1); // Normalize to 0-1

    return {
      agent: bestMatch.agent,
      confidence,
      reasoning: `Best match based on keywords: ${bestMatch.matches.join(", ")}`,
    };
  }

  async initiateHandoff(
    fromAgent: string,
    toAgent: string,
    context: HandoffContext
  ): Promise<AgentHandoff> {
    const handoffId = crypto.randomUUID();

    this.activeHandoffs.set(handoffId, context);

    const handoff: AgentHandoff = {
      fromAgent,
      toAgent,
      context: context.preservedContext,
      reason: context.reason,
    };

    // In a production system, you might want to log this handoff
    console.log(`Agent handoff: ${fromAgent} → ${toAgent}`, handoff);

    return handoff;
  }

  async processWithSpecializedAgent(
    agentId: string,
    userMessage: string,
    conversationHistory: AIMessage[] = [],
    context?: Record<string, any>
  ): Promise<AIResponse> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Create specialized system prompt
    const systemMessage: AIMessage = {
      role: "system",
      content: agent.systemPrompt,
    };

    // Add context if provided
    let contextualMessage = userMessage;
    if (context) {
      contextualMessage += `\n\nAdditional context: ${JSON.stringify(context, null, 2)}`;
    }

    const userMessageObj: AIMessage = {
      role: "user",
      content: contextualMessage,
    };

    // Build message array with history
    const messages: AIMessage[] = [
      systemMessage,
      ...conversationHistory.slice(-5), // Keep last 5 messages for context
      userMessageObj,
    ];

    // Get AI service and generate response
    const config = aiConfigManager.getCurrentConfig();
    const aiService = getAIService(config);

    const response = await aiService.generateResponse(messages);

    // Add agent metadata
    response.metadata = {
      model: response.metadata?.model || "unknown",
      provider: response.metadata?.provider || "ollama",
      timestamp: response.metadata?.timestamp || new Date(),
      ...response.metadata,
      specializedAgent: agent.id,
      agentName: agent.name,
      agentCapabilities: agent.capabilities.map((c) => c.name),
    };

    return response;
  }

  getAgentCapabilities(agentId: string): AgentCapability[] {
    const agent = this.agents.get(agentId);
    return agent ? agent.capabilities : [];
  }

  getAllAgents(): SpecializedAgent[] {
    return Array.from(this.agents.values());
  }

  async shouldHandoff(
    currentAgent: string,
    userMessage: string,
    conversationHistory: AIMessage[]
  ): Promise<{
    shouldHandoff: boolean;
    targetAgent?: string;
    confidence?: number;
    reasoning?: string;
  }> {
    const bestAgent = await this.determineBestAgent(userMessage);

    // If best agent is different from current and confidence is high
    if (bestAgent.agent.id !== currentAgent && bestAgent.confidence > 0.7) {
      return {
        shouldHandoff: true,
        targetAgent: bestAgent.agent.id,
        confidence: bestAgent.confidence,
        reasoning: bestAgent.reasoning,
      };
    }

    return { shouldHandoff: false };
  }
}

// Singleton instance
let orchestratorInstance: AgentOrchestrator | null = null;

export function getAgentOrchestrator(): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator();
  }
  return orchestratorInstance;
}

export default AgentOrchestrator;
