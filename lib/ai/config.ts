import { AIProvider, AIConfig } from "./types/index";

// AI Configuration Management
export class AIConfigManager {
  private static instance: AIConfigManager | null = null;
  private currentConfig: AIConfig;

  private constructor() {
    this.currentConfig = this.getDefaultConfig();
  }

  static getInstance(): AIConfigManager {
    if (!AIConfigManager.instance) {
      AIConfigManager.instance = new AIConfigManager();
    }
    return AIConfigManager.instance;
  }

  private getDefaultConfig(): AIConfig {
    // Phase 1: Start with Ollama for prototyping
    const defaultProvider: AIProvider = "ollama";

    return {
      provider: defaultProvider,
      model: this.getDefaultModel(defaultProvider),
      temperature: 0.7,
      maxTokens: 2000,
      baseUrl: this.getDefaultBaseUrl(defaultProvider),
      apiKey: this.getApiKey(defaultProvider),
    };
  }

  private getDefaultModel(provider: AIProvider): string {
    const modelMap: Record<AIProvider, string> = {
      ollama: "llama3.2:3b",
      gemini: "gemini-1.5-flash",
      claude: "claude-3-haiku-20240307",
      openai: "gpt-3.5-turbo",
    };
    return modelMap[provider];
  }

  private getDefaultBaseUrl(provider: AIProvider): string | undefined {
    const urlMap: Record<AIProvider, string | undefined> = {
      ollama: "http://localhost:11434",
      gemini: undefined,
      claude: undefined,
      openai: undefined,
    };
    return urlMap[provider];
  }

  private getApiKey(provider: AIProvider): string | undefined {
    const keyMap: Record<AIProvider, string | undefined> = {
      ollama: undefined,
      gemini: process.env.GEMINI_API_KEY,
      claude: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
    };
    return keyMap[provider];
  }

  getCurrentConfig(): AIConfig {
    return { ...this.currentConfig };
  }

  updateConfig(updates: Partial<AIConfig>): void {
    this.currentConfig = {
      ...this.currentConfig,
      ...updates,
    };

    // Update model if provider changed but model wasn't specified
    if (updates.provider && !updates.model) {
      this.currentConfig.model = this.getDefaultModel(updates.provider);
    }

    // Update base URL if provider changed but URL wasn't specified
    if (updates.provider && !updates.baseUrl) {
      this.currentConfig.baseUrl = this.getDefaultBaseUrl(updates.provider);
    }

    // Update API key if provider changed
    if (updates.provider) {
      this.currentConfig.apiKey = this.getApiKey(updates.provider);
    }
  }

  switchProvider(provider: AIProvider): void {
    this.updateConfig({
      provider,
      model: this.getDefaultModel(provider),
      baseUrl: this.getDefaultBaseUrl(provider),
      apiKey: this.getApiKey(provider),
    });
  }

  isProviderAvailable(provider: AIProvider): boolean {
    switch (provider) {
      case "ollama":
        // Check if Ollama is running locally
        return true; // Will be validated at runtime
      case "gemini":
        return !!process.env.GEMINI_API_KEY;
      case "claude":
        return !!process.env.ANTHROPIC_API_KEY;
      case "openai":
        return !!process.env.OPENAI_API_KEY;
      default:
        return false;
    }
  }

  getAvailableProviders(): AIProvider[] {
    const allProviders: AIProvider[] = ["ollama", "gemini", "claude", "openai"];
    return allProviders.filter((provider) =>
      this.isProviderAvailable(provider)
    );
  }

  validateConfig(config: AIConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.provider) {
      errors.push("Provider is required");
    }

    if (!config.model) {
      errors.push("Model is required");
    }

    if (
      config.temperature !== undefined &&
      (config.temperature < 0 || config.temperature > 2)
    ) {
      errors.push("Temperature must be between 0 and 2");
    }

    if (
      config.maxTokens !== undefined &&
      (config.maxTokens < 1 || config.maxTokens > 8000)
    ) {
      errors.push("Max tokens must be between 1 and 8000");
    }

    // Provider-specific validation
    switch (config.provider) {
      case "gemini":
      case "claude":
      case "openai":
        if (!config.apiKey) {
          errors.push(`API key is required for ${config.provider}`);
        }
        break;
      case "ollama":
        if (!config.baseUrl) {
          errors.push("Base URL is required for Ollama");
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getConfigForPhase(): {
    phase: number;
    description: string;
    config: AIConfig;
  } {
    const availableProviders = this.getAvailableProviders();

    // Phase 1: Ollama prototyping
    if (availableProviders.includes("ollama")) {
      return {
        phase: 1,
        description: "Prototype with Ollama (zero-cost experimentation)",
        config: {
          provider: "ollama",
          model: "llama3.2:3b",
          temperature: 0.7,
          maxTokens: 2000,
          baseUrl: "http://localhost:11434",
        },
      };
    }

    // Phase 2: Gemini validation
    if (availableProviders.includes("gemini")) {
      return {
        phase: 2,
        description: "Validate with Gemini free tier",
        config: {
          provider: "gemini",
          model: "gemini-1.5-flash",
          temperature: 0.7,
          maxTokens: 2000,
          apiKey: process.env.GEMINI_API_KEY,
        },
      };
    }

    // Phase 3: Production scaling (Claude or OpenAI)
    if (availableProviders.includes("claude")) {
      return {
        phase: 3,
        description: "Production scaling with Claude",
        config: {
          provider: "claude",
          model: "claude-3-haiku-20240307",
          temperature: 0.7,
          maxTokens: 2000,
          apiKey: process.env.ANTHROPIC_API_KEY,
        },
      };
    }

    if (availableProviders.includes("openai")) {
      return {
        phase: 3,
        description: "Production scaling with OpenAI",
        config: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          temperature: 0.7,
          maxTokens: 2000,
          apiKey: process.env.OPENAI_API_KEY,
        },
      };
    }

    // Fallback - return current config
    return {
      phase: 0,
      description: "Fallback configuration",
      config: this.getCurrentConfig(),
    };
  }
}

// Environment Configuration
export function getEnvironmentConfig(): {
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
  aiConfig: {
    enableAI: boolean;
    logAIInteractions: boolean;
    maxConcurrentRequests: number;
    requestTimeout: number;
    enableFallback: boolean;
  };
} {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isDevelopment = nodeEnv === "development";
  const isProduction = nodeEnv === "production";

  return {
    nodeEnv,
    isDevelopment,
    isProduction,
    aiConfig: {
      enableAI: process.env.ENABLE_AI !== "false",
      logAIInteractions:
        isDevelopment || process.env.LOG_AI_INTERACTIONS === "true",
      maxConcurrentRequests: parseInt(
        process.env.AI_MAX_CONCURRENT_REQUESTS || "5",
        10
      ),
      requestTimeout: parseInt(process.env.AI_REQUEST_TIMEOUT || "30000", 10),
      enableFallback: process.env.AI_ENABLE_FALLBACK !== "false",
    },
  };
}

// Feature Flags for AI Features
export function getAIFeatureFlags(): {
  enableSmartAutocomplete: boolean;
  enablePatternRecognition: boolean;
  enableCRUDValidation: boolean;
  enableAgentHandoff: boolean;
  enableProactiveNudges: boolean;
} {
  return {
    enableSmartAutocomplete: process.env.AI_ENABLE_AUTOCOMPLETE !== "false",
    enablePatternRecognition: process.env.AI_ENABLE_PATTERNS !== "false",
    enableCRUDValidation: process.env.AI_ENABLE_CRUD_VALIDATION !== "false",
    enableAgentHandoff: process.env.AI_ENABLE_HANDOFF === "true",
    enableProactiveNudges: process.env.AI_ENABLE_NUDGES === "true",
  };
}

// Export singleton instance
export const aiConfigManager = AIConfigManager.getInstance();

export default AIConfigManager;
