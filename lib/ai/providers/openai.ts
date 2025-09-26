import {
  AIConfig,
  AIMessage,
  AIResponse,
  AIService,
  ProductivityAssistRequest,
  AutocompleteRequest,
  ProductivityPattern,
  CRUDOperation,
  ProductivityFramework,
} from "../types/index";
import { ProductivityPrompts } from "../core/prompts";

export class OpenAIService implements AIService {
  provider = "openai" as const;
  private apiKey: string;
  private model: string;
  private prompts: ProductivityPrompts;

  constructor(config: AIConfig) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || "";
    this.model = config.model || "gpt-3.5-turbo";
    this.prompts = new ProductivityPrompts();

    if (!this.apiKey) {
      throw new Error("OpenAI API key is required");
    }
  }

  async generateResponse(
    messages: AIMessage[],
    config?: Partial<AIConfig>
  ): Promise<AIResponse> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: config?.model || this.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: config?.temperature || 0.7,
        max_tokens: config?.maxTokens || 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || "",
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      metadata: {
        model: this.model,
        provider: this.provider,
        timestamp: new Date(),
      },
    };
  }

  async generateProductivityAssistance(
    request: ProductivityAssistRequest
  ): Promise<AIResponse> {
    const systemPrompt = this.prompts.getSystemPrompt(
      request.context.framework
    );
    const userPrompt = this.prompts.getProductivityPrompt(request);

    const messages: AIMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const response = await this.generateResponse(messages);

    // Add productivity-specific metadata
    response.metadata = {
      model: response.metadata?.model || this.model,
      provider: response.metadata?.provider || "openai",
      timestamp: response.metadata?.timestamp || new Date(),
      ...response.metadata,
      requestType: request.type,
      framework: request.context.framework,
      confidence: this.calculateConfidence(request, response.content),
    };

    return response;
  }

  async generateAutocomplete(request: AutocompleteRequest): Promise<string[]> {
    const prompt = this.prompts.getAutocompletePrompt(request);

    const messages: AIMessage[] = [
      {
        role: "system",
        content:
          "You are a productivity expert providing intelligent autocomplete suggestions. Respond with a JSON array of 3-5 relevant completions.",
      },
      { role: "user", content: prompt },
    ];

    try {
      const response = await this.generateResponse(messages, {
        maxTokens: 200,
      });

      // Parse JSON response
      const cleanedContent = response.content
        .replace(/```json|```/g, "")
        .trim();
      const suggestions = JSON.parse(cleanedContent);

      return Array.isArray(suggestions) ? suggestions.slice(0, 5) : [];
    } catch (error) {
      console.error("Autocomplete parsing error:", error);
      return [];
    }
  }

  async analyzePatterns(data: any[]): Promise<ProductivityPattern[]> {
    const prompt = this.prompts.getPatternAnalysisPrompt(data);

    const messages: AIMessage[] = [
      {
        role: "system",
        content:
          "You are a productivity expert analyzing user patterns. Respond with a JSON array of pattern objects with type, confidence, description, and suggestion fields.",
      },
      { role: "user", content: prompt },
    ];

    try {
      const response = await this.generateResponse(messages, {
        maxTokens: 1000,
      });

      const cleanedContent = response.content
        .replace(/```json|```/g, "")
        .trim();
      const patterns = JSON.parse(cleanedContent);

      return Array.isArray(patterns) ? patterns : [];
    } catch (error) {
      console.error("Pattern analysis parsing error:", error);
      return [];
    }
  }

  async validateCRUDOperation(
    operation: CRUDOperation
  ): Promise<{ approved: boolean; reason?: string }> {
    const prompt = this.prompts.getCRUDValidationPrompt(operation);

    const messages: AIMessage[] = [
      {
        role: "system",
        content:
          'You are a productivity expert validating user operations. Respond with JSON: {"approved": boolean, "reason": string}',
      },
      { role: "user", content: prompt },
    ];

    try {
      const response = await this.generateResponse(messages, {
        maxTokens: 150,
      });

      const cleanedContent = response.content
        .replace(/```json|```/g, "")
        .trim();
      const validation = JSON.parse(cleanedContent);

      return {
        approved: validation.approved === true,
        reason: validation.reason || "No reason provided",
      };
    } catch (error) {
      console.error("CRUD validation parsing error:", error);
      return { approved: false, reason: "Validation service unavailable" };
    }
  }

  private calculateConfidence(
    request: ProductivityAssistRequest,
    response: string
  ): number {
    // Simple confidence calculation based on response length and request type
    let confidence = 0.8; // Base confidence (OpenAI typically provides high-quality responses)

    // Adjust based on request type
    switch (request.type) {
      case "planning":
        confidence += response.length > 200 ? 0.1 : -0.1;
        break;
      case "breakdown":
        confidence += (response.match(/\d+\./g) || []).length > 2 ? 0.1 : -0.1;
        break;
      case "prioritization":
        confidence +=
          response.includes("important") || response.includes("urgent")
            ? 0.1
            : -0.1;
        break;
    }

    // Adjust based on framework alignment
    const framework = request.context.framework;
    if (framework === "gtd" && response.includes("next action"))
      confidence += 0.1;
    if (framework === "full-focus" && response.includes("big three"))
      confidence += 0.1;

    return Math.min(Math.max(confidence, 0.1), 1.0);
  }
}

export default OpenAIService;
