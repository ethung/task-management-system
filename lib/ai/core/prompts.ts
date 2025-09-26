import {
  ProductivityFramework,
  ProductivityAssistRequest,
  AutocompleteRequest,
  CRUDOperation,
} from "../types/index";

export class ProductivityPrompts {
  getSystemPrompt(framework: ProductivityFramework): string {
    const basePrompt = `You are an expert productivity consultant with 15+ years of experience helping busy professionals and leaders optimize their work and achieve their goals.

Your communication style is:
- Measured and thoughtful, not verbose or overly optimistic
- Practical and actionable, focusing on proven strategies
- Professional yet personable, like a trusted advisor
- Concise but comprehensive when needed

You maintain the demeanor of an experienced consultant who has seen it all and provides realistic, grounded advice based on proven productivity frameworks.`;

    const frameworkSpecific = this.getFrameworkPrompt(framework);

    return `${basePrompt}\n\n${frameworkSpecific}`;
  }

  private getFrameworkPrompt(framework: ProductivityFramework): string {
    switch (framework) {
      case "gtd":
        return `You specialize in David Allen's Getting Things Done (GTD) methodology:

Key Principles:
- Capture everything in trusted systems
- Clarify what items mean and what action is required
- Organize by context and priority
- Reflect through regular reviews
- Engage with confidence in your choices

GTD Workflow:
1. Capture: Collect all tasks, ideas, and commitments
2. Clarify: Process what each item means (actionable or not?)
3. Organize: Put items where they belong (projects, contexts, someday/maybe)
4. Reflect: Review and update your system regularly
5. Engage: Choose next actions with confidence

Always think in terms of:
- Next actions (specific, physical actions)
- Projects (outcomes requiring multiple steps)
- Contexts (where/when/how actions can be done)
- Waiting for (items dependent on others)
- Someday/maybe (items to review later)`;

      case "full-focus":
        return `You specialize in Michael Hyatt's Full Focus methodology:

Key Principles:
- Clarity of vision and goals drives everything
- Focus on the "Big Three" most important tasks
- Energy management is as important as time management
- Regular reflection and adjustment are essential

Full Focus Framework:
1. Vision: Clear long-term direction and purpose
2. Quarterly Goals: 3-5 significant outcomes per quarter
3. Weekly Big Three: Most important objectives for the week
4. Daily Big Three: Top priority tasks for today
5. Energy Zones: Optimize tasks based on energy levels

Always consider:
- Goal hierarchy (vision → quarterly → weekly → daily)
- Energy optimization (high energy for important work)
- Progress reflection and course correction
- Saying no to non-essential commitments`;

      case "hybrid":
        return `You combine the best of multiple productivity frameworks:

From GTD:
- Comprehensive capture and organization systems
- Clear next action thinking
- Context-based task organization

From Full Focus:
- Hierarchical goal setting and vision alignment
- Energy-based task scheduling
- Focus on "Big Three" priorities

From general productivity best practices:
- Time blocking and calendar optimization
- Regular review and reflection cycles
- Workload and capacity management
- Habit formation and system maintenance

You adapt your advice based on the user's specific situation, preferences, and current framework knowledge.`;
    }
  }

  getProductivityPrompt(request: ProductivityAssistRequest): string {
    const { type, content, context, additionalData } = request;
    const framework = context.framework;
    const workload = context.currentWorkload;

    const contextInfo = `
Current Context:
- Framework: ${framework.toUpperCase()}
- Tasks: ${workload.tasksCount} total, ${workload.urgentTasks} urgent, ${workload.overdueItems} overdue
- Communication preference: ${context.userPreferences.communicationStyle}
- Expertise level: ${context.userPreferences.expertiseLevel}
${
  context.historicalPatterns
    ? `
Historical patterns:
- Completion rate: ${context.historicalPatterns.completionRate}%
- Average task duration: ${context.historicalPatterns.averageTaskDuration} minutes
- Peak hours: ${context.historicalPatterns.peakProductivityHours.join(", ")}`
    : ""
}
`;

    switch (type) {
      case "planning":
        return `${contextInfo}

Request: Help me plan the following:
"${content}"

Please provide a structured plan using ${framework.toUpperCase()} principles. Consider my current workload and provide realistic timelines. Focus on actionable next steps and proper organization.

${additionalData ? `Additional information: ${JSON.stringify(additionalData, null, 2)}` : ""}`;

      case "breakdown":
        return `${contextInfo}

Request: Break down this complex task/project:
"${content}"

Please break this down into manageable, specific actions using ${framework.toUpperCase()} methodology. Each action should be clear, concrete, and immediately actionable. Consider dependencies and logical sequencing.

${additionalData ? `Additional information: ${JSON.stringify(additionalData, null, 2)}` : ""}`;

      case "prioritization":
        return `${contextInfo}

Request: Help me prioritize these items:
"${content}"

Using ${framework.toUpperCase()} principles and considering my current workload (${workload.urgentTasks} urgent items, ${workload.overdueItems} overdue), please help me prioritize these items. Consider importance, urgency, energy requirements, and alignment with goals.

${additionalData ? `Additional information: ${JSON.stringify(additionalData, null, 2)}` : ""}`;

      case "reflection":
        return `${contextInfo}

Request: Help me reflect on:
"${content}"

Please guide me through a productive reflection using ${framework.toUpperCase()} review principles. Help me identify what's working, what needs adjustment, and what actions to take moving forward.

${additionalData ? `Additional information: ${JSON.stringify(additionalData, null, 2)}` : ""}`;

      case "autocomplete":
        return `${contextInfo}

Request: Provide intelligent completion for:
"${content}"

Based on ${framework.toUpperCase()} principles and productivity best practices, suggest how to complete this text. Consider the context and provide practical, actionable suggestions.

${additionalData ? `Additional information: ${JSON.stringify(additionalData, null, 2)}` : ""}`;

      default:
        return `${contextInfo}

Request: ${content}

Please provide guidance using ${framework.toUpperCase()} principles and considering my current context and workload.

${additionalData ? `Additional information: ${JSON.stringify(additionalData, null, 2)}` : ""}`;
    }
  }

  getAutocompletePrompt(request: AutocompleteRequest): string {
    const { text, position, context, userPatterns } = request;

    const beforeText = text.substring(0, position);
    const afterText = text.substring(position);

    return `Complete this ${context} text intelligently:

Before cursor: "${beforeText}"
After cursor: "${afterText}"

Context: This is a ${context} in a productivity application.
${userPatterns ? `User's common patterns: ${userPatterns.join(", ")}` : ""}

Provide 3-5 practical, actionable completions as a JSON array. Consider productivity best practices and common task/goal language. Make completions specific and immediately usable.

Example format: ["complete this task", "finish the project by Friday", "review and update status"]`;
  }

  getPatternAnalysisPrompt(data: any[]): string {
    return `Analyze these productivity patterns and identify insights:

Data: ${JSON.stringify(data, null, 2)}

Look for patterns in:
- Task completion times and accuracy
- Recurring tasks or themes
- Energy and productivity cycles
- Workload spikes and capacity issues
- Procrastination or avoidance patterns
- Successful strategies and approaches

Respond with a JSON array of pattern objects, each with:
- type: 'recurring_task' | 'time_estimation' | 'energy_cycle' | 'workload_spike'
- confidence: number (0-1)
- description: string (what you observed)
- suggestion: string (actionable recommendation)
- data: object (supporting data)

Focus on actionable insights that can improve productivity. Limit to the top 5 most significant patterns.`;
  }

  getCRUDValidationPrompt(operation: CRUDOperation): string {
    const { action, entity, data, reason } = operation;

    return `Validate this productivity operation:

Action: ${action.toUpperCase()}
Entity: ${entity}
Data: ${JSON.stringify(data, null, 2)}
${reason ? `Reason: ${reason}` : ""}

Consider:
- Is this operation likely to improve productivity?
- Are there any risks or downsides?
- Does the operation make sense in context?
- Should the user be warned or asked for confirmation?

For destructive operations (delete, major updates), be more cautious.
For creative operations (create, minor updates), be more permissive.

Respond with JSON: {"approved": boolean, "reason": string}

The reason should explain your decision and provide guidance.`;
  }

  getAgentHandoffPrompt(request: string, availableAgents: string[]): string {
    return `Determine if this request should be handed off to a specialized agent:

Request: "${request}"

Available specialized agents: ${availableAgents.join(", ")}

Consider:
- Is this within your core productivity expertise?
- Would a specialized agent provide better assistance?
- What specific expertise is needed?

Respond with JSON:
{
  "handoff": boolean,
  "agent": string (if handoff is true),
  "reason": string,
  "context": object (information to pass to specialized agent)
}

Only recommend handoff for requests that clearly require specialized expertise beyond general productivity guidance.`;
  }
}

export default ProductivityPrompts;
