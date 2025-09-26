import {
  AIProvider,
  AIConfig,
  AIMessage,
  AIResponse,
  AIService,
  ProductivityAssistRequest,
  AutocompleteRequest,
  ProductivityPattern,
  CRUDOperation,
} from "../types/index";

// Provider imports
import { OllamaService } from "../providers/ollama";
import { GeminiService } from "../providers/gemini";
import { ClaudeService } from "../providers/claude";
import { OpenAIService } from "../providers/openai";

export class ProductivityAIService implements AIService {
  private providers: Map<AIProvider, AIService> = new Map();
  private currentProvider: AIProvider;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.currentProvider = config.provider;
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize available providers
    this.providers.set("ollama", new OllamaService(this.config));
    if (process.env.GEMINI_API_KEY) {
      this.providers.set("gemini", new GeminiService(this.config));
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set("claude", new ClaudeService(this.config));
    }
    if (process.env.OPENAI_API_KEY) {
      this.providers.set("openai", new OpenAIService(this.config));
    }
  }

  get provider(): AIProvider {
    return this.currentProvider;
  }

  async switchProvider(provider: AIProvider): Promise<void> {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} not available or configured`);
    }
    this.currentProvider = provider;
    this.config.provider = provider;
  }

  private getCurrentService(): AIService {
    const service = this.providers.get(this.currentProvider);
    if (!service) {
      throw new Error(`Provider ${this.currentProvider} not initialized`);
    }
    return service;
  }

  async generateResponse(
    messages: AIMessage[],
    config?: Partial<AIConfig>
  ): Promise<AIResponse> {
    try {
      const service = this.getCurrentService();
      return await service.generateResponse(messages, config);
    } catch (error) {
      // Attempt fallback to another provider
      return await this.handleProviderFallback(messages, config, error);
    }
  }

  async generateProductivityAssistance(
    request: ProductivityAssistRequest
  ): Promise<AIResponse> {
    try {
      const service = this.getCurrentService();
      return await service.generateProductivityAssistance(request);
    } catch (error) {
      console.error(
        `Productivity assistance failed with ${this.currentProvider}:`,
        error
      );
      throw error;
    }
  }

  async generateAutocomplete(request: AutocompleteRequest): Promise<string[]> {
    try {
      const service = this.getCurrentService();
      return await service.generateAutocomplete(request);
    } catch (error) {
      console.error(`Autocomplete failed with ${this.currentProvider}:`, error);
      return [];
    }
  }

  async analyzePatterns(data: any[]): Promise<ProductivityPattern[]> {
    try {
      const service = this.getCurrentService();
      return await service.analyzePatterns(data);
    } catch (error) {
      console.error(
        `Pattern analysis failed with ${this.currentProvider}:`,
        error
      );
      return [];
    }
  }

  async validateCRUDOperation(
    operation: CRUDOperation
  ): Promise<{ approved: boolean; reason?: string }> {
    try {
      const service = this.getCurrentService();
      return await service.validateCRUDOperation(operation);
    } catch (error) {
      console.error(
        `CRUD validation failed with ${this.currentProvider}:`,
        error
      );
      return { approved: false, reason: "AI service unavailable" };
    }
  }

  private async handleProviderFallback(
    messages: AIMessage[],
    config?: Partial<AIConfig>,
    originalError?: any
  ): Promise<AIResponse> {
    // Try fallback providers in order of preference
    const fallbackOrder: AIProvider[] = ["gemini", "ollama"];

    for (const provider of fallbackOrder) {
      if (provider !== this.currentProvider && this.providers.has(provider)) {
        try {
          console.warn(
            `Falling back to ${provider} due to ${this.currentProvider} failure`
          );
          const fallbackService = this.providers.get(provider)!;
          const response = await fallbackService.generateResponse(
            messages,
            config
          );

          // Add fallback metadata
          response.metadata = {
            model: response.metadata?.model || "unknown",
            provider: response.metadata?.provider || provider,
            timestamp: response.metadata?.timestamp || new Date(),
            ...response.metadata,
            fallback: true,
            originalProvider: this.currentProvider,
            fallbackProvider: provider,
            originalError: originalError?.message,
          };

          return response;
        } catch (fallbackError) {
          console.warn(`Fallback to ${provider} also failed:`, fallbackError);
          continue;
        }
      }
    }

    throw new Error(
      `All AI providers failed. Original error: ${originalError?.message}`
    );
  }

  async healthCheck(): Promise<
    {
      provider: AIProvider;
      status: "healthy" | "unhealthy";
      latency?: number;
    }[]
  > {
    const results: {
      provider: AIProvider;
      status: "healthy" | "unhealthy";
      latency?: number;
    }[] = [];

    const providerEntries = Array.from(this.providers.entries());

    for (const [provider, service] of providerEntries) {
      const startTime = Date.now();
      try {
        // Simple health check message
        await service.generateResponse(
          [{ role: "user", content: 'Health check - respond with "OK"' }],
          { maxTokens: 10 }
        );

        const latency = Date.now() - startTime;
        results.push({ provider, status: "healthy" as const, latency });
      } catch (error) {
        results.push({ provider, status: "unhealthy" as const });
      }
    }

    return results;
  }
}

// Singleton instance
let aiServiceInstance: ProductivityAIService | null = null;

export function getAIService(config?: AIConfig): ProductivityAIService {
  if (!aiServiceInstance) {
    if (!config) {
      // Default configuration
      config = {
        provider: "ollama",
        model: "llama3.2:3b",
        temperature: 0.7,
        maxTokens: 2000,
      };
    }
    aiServiceInstance = new ProductivityAIService(config);
  }
  return aiServiceInstance;
}

export function resetAIService(): void {
  aiServiceInstance = null;
}
