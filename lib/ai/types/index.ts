// AI Provider Types
export type AIProvider = "ollama" | "gemini" | "claude" | "openai";

// Base AI Configuration
export interface AIConfig {
  provider: AIProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  baseUrl?: string;
}

// AI Message Types
export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
  metadata?: Record<string, any>;
}

// AI Response Structure
export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: {
    model: string;
    provider: AIProvider;
    timestamp: Date;
    confidence?: number;
    reasoning?: string;
    [key: string]: any;
  };
}

// Productivity Framework Types
export type ProductivityFramework = "gtd" | "full-focus" | "hybrid";

export interface ProductivityContext {
  framework: ProductivityFramework;
  userPreferences: {
    communicationStyle: "concise" | "detailed" | "balanced";
    expertiseLevel: "beginner" | "intermediate" | "advanced";
  };
  currentWorkload: {
    tasksCount: number;
    urgentTasks: number;
    overdueItems: number;
  };
  historicalPatterns?: {
    completionRate: number;
    averageTaskDuration: number;
    peakProductivityHours: number[];
  };
}

// AI Request Types
export interface ProductivityAssistRequest {
  type:
    | "planning"
    | "breakdown"
    | "prioritization"
    | "reflection"
    | "autocomplete";
  content: string;
  context: ProductivityContext;
  additionalData?: Record<string, any>;
}

export interface AutocompleteRequest {
  text: string;
  position: number;
  context: "task" | "goal" | "project" | "note";
  userPatterns?: string[];
}

// Pattern Recognition Types
export interface ProductivityPattern {
  type:
    | "recurring_task"
    | "time_estimation"
    | "energy_cycle"
    | "workload_spike";
  confidence: number;
  description: string;
  suggestion: string;
  data: Record<string, any>;
}

// Agent Orchestration Types
export interface AgentCapability {
  name: string;
  description: string;
  triggers: string[];
  confidence: number;
}

export interface AgentHandoff {
  fromAgent: string;
  toAgent: string;
  context: Record<string, any>;
  reason: string;
}

// CRUD Operation Types
export interface CRUDOperation {
  action: "create" | "read" | "update" | "delete";
  entity: "task" | "goal" | "plan" | "project";
  data: any;
  confirmation?: boolean;
  reason?: string;
}

// AI Service Interface
export interface AIService {
  provider: AIProvider;
  generateResponse(
    messages: AIMessage[],
    config?: Partial<AIConfig>
  ): Promise<AIResponse>;
  generateProductivityAssistance(
    request: ProductivityAssistRequest
  ): Promise<AIResponse>;
  generateAutocomplete(request: AutocompleteRequest): Promise<string[]>;
  analyzePatterns(data: any[]): Promise<ProductivityPattern[]>;
  validateCRUDOperation(
    operation: CRUDOperation
  ): Promise<{ approved: boolean; reason?: string }>;
}
