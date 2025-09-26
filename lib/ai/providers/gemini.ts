import {
  AIConfig,
  AIMessage,
  AIResponse,
  AIService,
  ProductivityAssistRequest,
  AutocompleteRequest,
  ProductivityPattern,
  CRUDOperation,
} from "../types/index";
import { ProductivityPrompts } from "../core/prompts";

export class GeminiService implements AIService {
  provider = "gemini" as const;
  private apiKey: string;
  private model: string;
  private prompts: ProductivityPrompts;

  constructor(config: AIConfig) {
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || "";
    this.model = config.model || "gemini-1.5-flash";
    this.prompts = new ProductivityPrompts();

    if (!this.apiKey) {
      throw new Error("Gemini API key not provided");
    }
  }

  async generateResponse(
    messages: AIMessage[],
    config?: Partial<AIConfig>
  ): Promise<AIResponse> {
    // Convert messages to Gemini format
    const contents = this.convertMessagesToGeminiFormat(messages);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: config?.temperature || 0.7,
            maxOutputTokens: config?.maxTokens || 2000,
            topP: 0.9,
            topK: 40,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response from Gemini API");
    }

    const candidate = data.candidates[0];
    const content = candidate.content.parts[0].text;

    return {
      content,
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount || 0,
            completionTokens: data.usageMetadata.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata.totalTokenCount || 0,
          }
        : undefined,
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

    response.metadata = {
      model: response.metadata?.model || "gemini-pro",
      provider: response.metadata?.provider || "gemini",
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

      const cleanedContent = response.content
        .replace(/```json|```/g, "")
        .trim();
      const suggestions = JSON.parse(cleanedContent);

      return Array.isArray(suggestions) ? suggestions.slice(0, 5) : [];
    } catch (error) {
      console.error("Gemini autocomplete parsing error:", error);
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
      console.error("Gemini pattern analysis parsing error:", error);
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
      console.error("Gemini CRUD validation parsing error:", error);
      return { approved: false, reason: "Validation service unavailable" };
    }
  }

  private convertMessagesToGeminiFormat(messages: AIMessage[]): any[] {
    const contents: any[] = [];
    let systemMessage = "";

    for (const message of messages) {
      if (message.role === "system") {
        systemMessage = message.content;
        continue;
      }

      const role = message.role === "assistant" ? "model" : "user";
      let content = message.content;

      // Prepend system message to first user message
      if (role === "user" && systemMessage && contents.length === 0) {
        content = `${systemMessage}\n\n${content}`;
        systemMessage = "";
      }

      contents.push({
        role,
        parts: [{ text: content }],
      });
    }

    return contents;
  }

  private calculateConfidence(
    request: ProductivityAssistRequest,
    response: string
  ): number {
    let confidence = 0.8; // Higher base confidence for Gemini

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

    const framework = request.context.framework;
    if (framework === "gtd" && response.includes("next action"))
      confidence += 0.1;
    if (framework === "full-focus" && response.includes("big three"))
      confidence += 0.1;

    return Math.min(Math.max(confidence, 0.1), 1.0);
  }
}

export default GeminiService;
