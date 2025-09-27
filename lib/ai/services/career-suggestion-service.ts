import { getAIService } from "../core/ai-service";
import { AIMessage, AutocompleteRequest } from "../types/index";

export interface CareerSuggestionRequest {
  type: "title" | "description" | "category";
  input: string;
  context?: {
    previousWins?: string[];
    userStyle?: string;
    industry?: string;
  };
}

export interface CareerSuggestion {
  text: string;
  category?: string;
  framework?: string;
  confidence: number;
  type: "title" | "description" | "category";
}

export interface CategorySuggestion {
  name: string;
  confidence: number;
  frameworks: string[];
}

export class CareerSuggestionService {
  private static readonly PROFESSIONAL_ACTION_VERBS = [
    "Led",
    "Managed",
    "Developed",
    "Implemented",
    "Created",
    "Designed",
    "Optimized",
    "Streamlined",
    "Launched",
    "Delivered",
    "Coordinated",
    "Facilitated",
    "Established",
    "Built",
    "Improved",
    "Enhanced",
    "Spearheaded",
    "Orchestrated",
    "Executed",
    "Architected",
    "Pioneered",
    "Transformed",
    "Modernized",
    "Automated",
    "Scaled",
    "Accelerated",
  ];

  private static readonly COMMON_CATEGORIES = [
    "Leadership",
    "Project Management",
    "Technical Innovation",
    "Team Development",
    "Process Improvement",
    "Strategic Planning",
    "Client Relations",
    "Product Development",
    "Problem Solving",
    "Communication",
    "Mentoring",
    "Cross-functional Collaboration",
    "Revenue Growth",
    "Cost Optimization",
    "Quality Assurance",
  ];

  private static readonly ACHIEVEMENT_TEMPLATES = [
    "Successfully {action} {project} resulting in {outcome}",
    "{Action} cross-functional team of {size} to deliver {result}",
    "Implemented {solution} that improved {metric} by {percentage}",
    "Designed and launched {initiative} leading to {benefit}",
    "Optimized {process} reducing {cost/time} by {amount}",
  ];

  /**
   * Get title suggestions based on input
   */
  static async getTitleSuggestions(
    input: string,
    context?: CareerSuggestionRequest["context"]
  ): Promise<CareerSuggestion[]> {
    // For quick responses, use local patterns first
    const localSuggestions = this.getLocalTitleSuggestions(input);

    // For enhanced suggestions, use AI service
    try {
      const aiSuggestions = await this.getAITitleSuggestions(input, context);
      return [...localSuggestions, ...aiSuggestions];
    } catch (error) {
      console.warn(
        "AI title suggestions failed, using local suggestions:",
        error
      );
      return localSuggestions;
    }
  }

  /**
   * Get description suggestions based on input
   */
  static async getDescriptionSuggestions(
    input: string,
    context?: CareerSuggestionRequest["context"]
  ): Promise<CareerSuggestion[]> {
    const localSuggestions = this.getLocalDescriptionSuggestions(input);

    try {
      const aiSuggestions = await this.getAIDescriptionSuggestions(
        input,
        context
      );
      return [...localSuggestions, ...aiSuggestions];
    } catch (error) {
      console.warn(
        "AI description suggestions failed, using local suggestions:",
        error
      );
      return localSuggestions;
    }
  }

  /**
   * Get category suggestions based on title and description
   */
  static async getCategorySuggestions(
    title: string,
    description?: string
  ): Promise<CategorySuggestion[]> {
    const text = `${title} ${description || ""}`.toLowerCase();

    // Local category matching
    const localCategories = this.getLocalCategorySuggestions(text);

    try {
      const aiCategories = await this.getAICategorySuggestions(
        title,
        description
      );
      return [...localCategories, ...aiCategories];
    } catch (error) {
      console.warn(
        "AI category suggestions failed, using local suggestions:",
        error
      );
      return localCategories;
    }
  }

  /**
   * Local title suggestions based on patterns and keywords
   */
  private static getLocalTitleSuggestions(input: string): CareerSuggestion[] {
    const suggestions: CareerSuggestion[] = [];
    const inputLower = input.toLowerCase();

    // Suggest action verbs if input is short
    if (input.length < 10) {
      this.PROFESSIONAL_ACTION_VERBS.filter((verb) =>
        verb.toLowerCase().startsWith(inputLower)
      )
        .slice(0, 3)
        .forEach((verb) => {
          suggestions.push({
            text: verb,
            confidence: 0.8,
            type: "title",
          });
        });
    }

    // Template-based suggestions
    if (inputLower.includes("project") || inputLower.includes("initiative")) {
      suggestions.push({
        text: "Successfully delivered critical project ahead of schedule",
        confidence: 0.7,
        type: "title",
        category: "Project Management",
      });
    }

    if (inputLower.includes("team") || inputLower.includes("lead")) {
      suggestions.push({
        text: "Led cross-functional team to exceed quarterly targets",
        confidence: 0.7,
        type: "title",
        category: "Leadership",
      });
    }

    return suggestions;
  }

  /**
   * Local description suggestions
   */
  private static getLocalDescriptionSuggestions(
    input: string
  ): CareerSuggestion[] {
    const suggestions: CareerSuggestion[] = [];
    const inputLower = input.toLowerCase();

    // Suggest strong action verbs for description starts
    if (input.length < 5) {
      const relevantVerbs = this.PROFESSIONAL_ACTION_VERBS.slice(0, 5);
      relevantVerbs.forEach((verb) => {
        suggestions.push({
          text: `${verb} `,
          confidence: 0.6,
          type: "description",
        });
      });
    }

    // Context-aware suggestions
    if (inputLower.includes("implement") || inputLower.includes("develop")) {
      suggestions.push({
        text: "Implemented innovative solution that improved efficiency by 25%",
        confidence: 0.7,
        type: "description",
        category: "Process Improvement",
      });
    }

    return suggestions;
  }

  /**
   * Local category suggestions based on keywords
   */
  private static getLocalCategorySuggestions(
    text: string
  ): CategorySuggestion[] {
    const suggestions: CategorySuggestion[] = [];

    // Keyword mapping to categories
    const categoryKeywords = {
      Leadership: [
        "led",
        "lead",
        "managed",
        "directed",
        "supervised",
        "guided",
      ],
      "Project Management": [
        "project",
        "initiative",
        "delivered",
        "coordinated",
        "scheduled",
      ],
      "Technical Innovation": [
        "developed",
        "built",
        "architected",
        "designed",
        "coded",
        "technical",
      ],
      "Team Development": [
        "mentored",
        "trained",
        "coached",
        "developed team",
        "onboarded",
      ],
      "Process Improvement": [
        "optimized",
        "streamlined",
        "improved",
        "enhanced",
        "automated",
      ],
      "Client Relations": [
        "client",
        "customer",
        "stakeholder",
        "relationship",
        "communication",
      ],
      "Strategic Planning": [
        "strategy",
        "strategic",
        "planning",
        "roadmap",
        "vision",
      ],
      "Revenue Growth": [
        "revenue",
        "sales",
        "growth",
        "increased",
        "generated",
      ],
    };

    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      const matches = keywords.filter((keyword) =>
        text.includes(keyword)
      ).length;
      if (matches > 0) {
        suggestions.push({
          name: category,
          confidence: Math.min(0.9, matches * 0.3),
          frameworks: this.getFrameworksForCategory(category),
        });
      }
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  /**
   * AI-powered title suggestions
   */
  private static async getAITitleSuggestions(
    input: string,
    context?: CareerSuggestionRequest["context"]
  ): Promise<CareerSuggestion[]> {
    const aiService = getAIService();

    const autocompleteRequest: AutocompleteRequest = {
      text: input,
      position: input.length,
      context: "task", // Career wins are task-like
      userPatterns: context?.previousWins,
    };

    const suggestions =
      await aiService.generateAutocomplete(autocompleteRequest);

    return suggestions.map((suggestion) => ({
      text: suggestion,
      confidence: 0.8,
      type: "title" as const,
    }));
  }

  /**
   * AI-powered description suggestions
   */
  private static async getAIDescriptionSuggestions(
    input: string,
    context?: CareerSuggestionRequest["context"]
  ): Promise<CareerSuggestion[]> {
    const aiService = getAIService();

    const messages: AIMessage[] = [
      {
        role: "system",
        content: `You are a career coach helping professionals write compelling achievement descriptions.
        Provide 3 concise, action-oriented suggestions that complete or enhance the user's input.
        Focus on quantifiable results and professional language. Keep suggestions under 100 characters each.`,
      },
      {
        role: "user",
        content: `Complete or enhance this career achievement description: "${input}"`,
      },
    ];

    const response = await aiService.generateResponse(messages, {
      maxTokens: 200,
      temperature: 0.7,
    });

    // Parse AI response into suggestions
    const suggestions = response.content
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .slice(0, 3)
      .map((suggestion) => ({
        text: suggestion.replace(/^\d+\.\s*/, "").trim(),
        confidence: 0.8,
        type: "description" as const,
      }));

    return suggestions;
  }

  /**
   * AI-powered category suggestions
   */
  private static async getAICategorySuggestions(
    title: string,
    description?: string
  ): Promise<CategorySuggestion[]> {
    const aiService = getAIService();

    const text = `${title} ${description || ""}`;
    const messages: AIMessage[] = [
      {
        role: "system",
        content: `You are a career coach analyzing professional achievements.
        Based on the achievement text, suggest 2-3 most relevant categories from this list:
        ${this.COMMON_CATEGORIES.join(", ")}

        Respond with a JSON array of objects with "name" and "confidence" (0-1) fields.`,
      },
      {
        role: "user",
        content: `Categorize this achievement: "${text}"`,
      },
    ];

    try {
      const response = await aiService.generateResponse(messages, {
        maxTokens: 150,
        temperature: 0.3,
      });

      const categories = JSON.parse(response.content);
      return categories.map((cat: any) => ({
        name: cat.name,
        confidence: cat.confidence,
        frameworks: this.getFrameworksForCategory(cat.name),
      }));
    } catch (error) {
      console.warn("Failed to parse AI category suggestions:", error);
      return [];
    }
  }

  /**
   * Get relevant frameworks for a category
   */
  private static getFrameworksForCategory(category: string): string[] {
    const frameworkMap: Record<string, string[]> = {
      Leadership: [
        "STAR Method",
        "Situational Leadership",
        "Transformational Leadership",
      ],
      "Project Management": ["Agile", "Scrum", "Waterfall", "PMBOK"],
      "Technical Innovation": ["Design Thinking", "Lean Startup", "DevOps"],
      "Process Improvement": [
        "Lean Six Sigma",
        "Kaizen",
        "Continuous Improvement",
      ],
      "Strategic Planning": ["OKRs", "Balanced Scorecard", "SWOT Analysis"],
      "Team Development": ["Coaching", "Mentoring", "Performance Management"],
    };

    return frameworkMap[category] || [];
  }

  /**
   * Comprehensive suggestion method that combines all types
   */
  static async getAllSuggestions(
    request: CareerSuggestionRequest
  ): Promise<CareerSuggestion[]> {
    switch (request.type) {
      case "title":
        return this.getTitleSuggestions(request.input, request.context);
      case "description":
        return this.getDescriptionSuggestions(request.input, request.context);
      case "category":
        const categories = await this.getCategorySuggestions(request.input);
        return categories.map((cat) => ({
          text: cat.name,
          confidence: cat.confidence,
          type: "category" as const,
          category: cat.name,
          framework: cat.frameworks[0],
        }));
      default:
        return [];
    }
  }
}
