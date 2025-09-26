import { ProductivityFramework } from "../types/index";

export interface ProductivityPrinciple {
  id: string;
  framework: ProductivityFramework | "universal";
  category:
    | "capture"
    | "clarify"
    | "organize"
    | "reflect"
    | "engage"
    | "planning"
    | "energy"
    | "habits";
  title: string;
  description: string;
  application: string;
  examples: string[];
  commonMistakes: string[];
  relatedPrinciples: string[];
}

export interface ProductivityTemplate {
  id: string;
  name: string;
  framework: ProductivityFramework | "universal";
  category:
    | "planning"
    | "review"
    | "goal-setting"
    | "task-breakdown"
    | "prioritization";
  description: string;
  template: string;
  variables: string[];
  usage: string;
}

export class ProductivityKnowledgeBase {
  private principles: Map<string, ProductivityPrinciple> = new Map();
  private templates: Map<string, ProductivityTemplate> = new Map();

  constructor() {
    this.initializePrinciples();
    this.initializeTemplates();
  }

  private initializePrinciples() {
    const principles: ProductivityPrinciple[] = [
      // GTD Principles
      {
        id: "gtd-capture",
        framework: "gtd",
        category: "capture",
        title: "Ubiquitous Capture",
        description:
          "Capture everything that has your attention into a trusted external system.",
        application:
          "Use a reliable system to collect all tasks, ideas, and commitments as they occur to you.",
        examples: [
          "Keep a notebook or digital capture tool always accessible",
          "Set up quick capture methods (voice memos, inbox apps)",
          "Do a mind sweep weekly to catch missed items",
        ],
        commonMistakes: [
          "Using unreliable or multiple capture systems",
          "Trying to remember things in your head",
          "Not processing captured items regularly",
        ],
        relatedPrinciples: ["gtd-clarify", "gtd-organize"],
      },
      {
        id: "gtd-clarify",
        framework: "gtd",
        category: "clarify",
        title: "Clarify What Things Mean",
        description:
          "Process captured items to determine what they are and what action, if any, is required.",
        application:
          "For each item, ask: What is it? Is it actionable? What's the next action?",
        examples: [
          'Transform "Mom\'s birthday" into "Buy birthday gift for Mom"',
          'Convert "Website redesign" into specific next actions',
          "Identify projects that require multiple steps",
        ],
        commonMistakes: [
          "Leaving items vague and unclear",
          "Not identifying the specific next physical action",
          "Confusing projects with single actions",
        ],
        relatedPrinciples: ["gtd-capture", "gtd-organize", "gtd-next-action"],
      },
      {
        id: "gtd-next-action",
        framework: "gtd",
        category: "clarify",
        title: "Next Action Thinking",
        description:
          "Define the very next physical action required to move something forward.",
        application:
          "Always identify the specific, concrete, physical next step for every project or task.",
        examples: [
          'Instead of "Plan vacation," write "Call travel agent about Hawaii options"',
          'Instead of "Tax preparation," write "Gather 2023 tax documents from file cabinet"',
          'Instead of "Exercise more," write "Research local gyms online"',
        ],
        commonMistakes: [
          "Making next actions too vague or abstract",
          "Confusing outcomes with actions",
          "Not making actions specific enough to be immediately doable",
        ],
        relatedPrinciples: ["gtd-clarify", "gtd-contexts"],
      },
      {
        id: "gtd-contexts",
        framework: "gtd",
        category: "organize",
        title: "Context-Based Organization",
        description:
          "Group actions by the context in which they can be completed.",
        application:
          "Organize next actions by where you are, what tools you have, or your energy level.",
        examples: [
          "@Calls: Phone calls to make",
          "@Computer: Tasks requiring a computer",
          "@Errands: Things to do when out and about",
          "@Waiting For: Items dependent on others",
        ],
        commonMistakes: [
          "Creating too many or too few contexts",
          "Making contexts that don't match your actual workflow",
          "Not reviewing context lists regularly",
        ],
        relatedPrinciples: ["gtd-organize", "gtd-engage"],
      },
      {
        id: "gtd-weekly-review",
        framework: "gtd",
        category: "reflect",
        title: "Weekly Review",
        description:
          "Regular review to keep your system current and your perspective clear.",
        application:
          "Set aside time each week to review all lists, projects, and commitments.",
        examples: [
          "Review and update all project lists",
          "Process all captured items to zero",
          "Review calendar for upcoming appointments",
          "Check waiting-for list for follow-ups needed",
        ],
        commonMistakes: [
          "Skipping weekly reviews when busy",
          "Making reviews too long or comprehensive",
          "Not having a consistent review process",
        ],
        relatedPrinciples: ["gtd-capture", "gtd-clarify", "gtd-organize"],
      },

      // Full Focus Principles
      {
        id: "ff-vision",
        framework: "full-focus",
        category: "planning",
        title: "Vision-Driven Planning",
        description:
          "Start with a clear vision of where you want to go and work backward to create goals.",
        application:
          "Develop a compelling long-term vision and align all goals and activities with it.",
        examples: [
          "Create a written vision statement for your life/career",
          'Regularly ask "Does this align with my vision?"',
          "Use vision to guide difficult decisions and trade-offs",
        ],
        commonMistakes: [
          "Setting goals without a clear vision",
          "Making vision too vague or generic",
          "Not regularly reviewing and updating vision",
        ],
        relatedPrinciples: ["ff-quarterly-goals", "ff-big-three"],
      },
      {
        id: "ff-quarterly-goals",
        framework: "full-focus",
        category: "planning",
        title: "Quarterly Goal Setting",
        description:
          "Set 3-5 specific, measurable goals each quarter that align with your vision.",
        application:
          "Break your annual vision into quarterly milestones with clear success metrics.",
        examples: [
          "Q1: Launch new service line with 10 pilot customers",
          "Q2: Complete leadership training program",
          "Q3: Implement new team productivity system",
        ],
        commonMistakes: [
          "Setting too many quarterly goals",
          "Making goals too vague or unmeasurable",
          "Not connecting quarterly goals to annual vision",
        ],
        relatedPrinciples: ["ff-vision", "ff-big-three", "ff-energy-zones"],
      },
      {
        id: "ff-big-three",
        framework: "full-focus",
        category: "planning",
        title: "Daily Big Three",
        description:
          "Identify the three most important tasks to accomplish each day.",
        application:
          "Each day, choose three high-impact tasks that move you closer to your goals.",
        examples: [
          "Write quarterly business review presentation",
          "Have one-on-one meeting with key team member",
          "Complete market research for new initiative",
        ],
        commonMistakes: [
          "Choosing more than three priorities",
          "Picking tasks that aren't truly important",
          "Not connecting daily tasks to larger goals",
        ],
        relatedPrinciples: ["ff-quarterly-goals", "ff-energy-zones"],
      },
      {
        id: "ff-energy-zones",
        framework: "full-focus",
        category: "energy",
        title: "Energy Zone Management",
        description:
          "Align your most important work with your highest energy levels.",
        application:
          "Schedule your most critical tasks during your peak energy hours.",
        examples: [
          "Do creative work during your natural peak hours",
          "Schedule routine tasks for lower energy times",
          "Take breaks before energy completely depletes",
        ],
        commonMistakes: [
          "Not knowing your personal energy patterns",
          "Wasting high energy on low-value activities",
          "Not protecting your peak energy times",
        ],
        relatedPrinciples: ["ff-big-three", "universal-breaks"],
      },

      // Universal Principles
      {
        id: "universal-time-blocking",
        framework: "universal",
        category: "organize",
        title: "Time Blocking",
        description:
          "Allocate specific time slots for different types of work and activities.",
        application:
          "Schedule dedicated blocks of time for focused work, meetings, and personal tasks.",
        examples: [
          "Block 9-11 AM for deep work on priority projects",
          "Reserve afternoons for meetings and collaboration",
          "Schedule weekly blocks for planning and review",
        ],
        commonMistakes: [
          "Making time blocks too rigid",
          "Not leaving buffer time between blocks",
          "Overestimating how much can fit in a block",
        ],
        relatedPrinciples: ["universal-focus", "ff-energy-zones"],
      },
      {
        id: "universal-single-tasking",
        framework: "universal",
        category: "engage",
        title: "Single-Tasking Focus",
        description:
          "Focus on one task at a time to maximize quality and efficiency.",
        application:
          "Eliminate distractions and give full attention to the current task.",
        examples: [
          "Close unnecessary browser tabs and applications",
          "Use focus techniques like Pomodoro Technique",
          "Complete one task before starting another",
        ],
        commonMistakes: [
          "Believing multitasking increases productivity",
          "Not managing digital distractions",
          "Switching tasks too frequently",
        ],
        relatedPrinciples: ["universal-time-blocking", "universal-breaks"],
      },
      {
        id: "universal-breaks",
        framework: "universal",
        category: "energy",
        title: "Strategic Rest and Recovery",
        description:
          "Take regular breaks to maintain energy and focus throughout the day.",
        application:
          "Schedule and protect time for rest, reflection, and energy renewal.",
        examples: [
          "Take a 10-15 minute break every 90 minutes",
          "Go for a walk between meetings",
          "Have lunch away from your workspace",
        ],
        commonMistakes: [
          'Working through breaks to "save time"',
          "Taking breaks that aren't truly restorative",
          "Not scheduling breaks proactively",
        ],
        relatedPrinciples: ["ff-energy-zones", "universal-single-tasking"],
      },
    ];

    principles.forEach((principle) => {
      this.principles.set(principle.id, principle);
    });
  }

  private initializeTemplates() {
    const templates: ProductivityTemplate[] = [
      {
        id: "gtd-project-planning",
        name: "GTD Project Planning",
        framework: "gtd",
        category: "planning",
        description:
          "Template for planning a new project using GTD methodology",
        template: `Project: {{project_name}}

Purpose/Vision: {{purpose}}

Success Criteria:
- {{success_criterion_1}}
- {{success_criterion_2}}
- {{success_criterion_3}}

Brainstorming (things that might need to happen):
{{brainstorm_items}}

Next Actions:
1. {{next_action_1}} (@{{context_1}})
2. {{next_action_2}} (@{{context_2}})
3. {{next_action_3}} (@{{context_3}})

Waiting For:
- {{waiting_for_items}}

Someday/Maybe:
- {{someday_maybe_items}}`,
        variables: [
          "project_name",
          "purpose",
          "success_criterion_1",
          "success_criterion_2",
          "success_criterion_3",
          "brainstorm_items",
          "next_action_1",
          "context_1",
          "next_action_2",
          "context_2",
          "next_action_3",
          "context_3",
          "waiting_for_items",
          "someday_maybe_items",
        ],
        usage:
          "Use this template when starting any multi-step project to ensure proper GTD planning",
      },
      {
        id: "gtd-weekly-review",
        name: "GTD Weekly Review Checklist",
        framework: "gtd",
        category: "review",
        description:
          "Complete weekly review checklist following GTD methodology",
        template: `Weekly Review - Week of {{week_date}}

□ Get Clear
  □ Collect loose papers and materials
  □ Get "IN" to zero
  □ Empty your head (mind sweep)

□ Get Current
  □ Review Next Action Lists
  □ Review Previous Calendar Data
  □ Review Upcoming Calendar
  □ Review Waiting For List
  □ Review Project Lists (and create new Next Actions)
  □ Review Someday/Maybe Lists

□ Get Creative
  □ Review any relevant checklists
  □ Be creative and courageous
  □ Identify new projects and next actions

Key Insights from this week:
{{insights}}

Priorities for next week:
1. {{priority_1}}
2. {{priority_2}}
3. {{priority_3}}`,
        variables: [
          "week_date",
          "insights",
          "priority_1",
          "priority_2",
          "priority_3",
        ],
        usage:
          "Use this weekly to maintain your GTD system and stay on top of commitments",
      },
      {
        id: "ff-quarterly-planning",
        name: "Full Focus Quarterly Planning",
        framework: "full-focus",
        category: "goal-setting",
        description:
          "Template for setting quarterly goals using Full Focus methodology",
        template: `Quarterly Goals - {{quarter}} {{year}}

Vision Reminder: {{vision_statement}}

Goal 1: {{goal_1_title}}
- Motivation: {{goal_1_motivation}}
- Measurement: {{goal_1_measurement}}
- Key Actions:
  • {{goal_1_action_1}}
  • {{goal_1_action_2}}
  • {{goal_1_action_3}}

Goal 2: {{goal_2_title}}
- Motivation: {{goal_2_motivation}}
- Measurement: {{goal_2_measurement}}
- Key Actions:
  • {{goal_2_action_1}}
  • {{goal_2_action_2}}
  • {{goal_2_action_3}}

Goal 3: {{goal_3_title}}
- Motivation: {{goal_3_motivation}}
- Measurement: {{goal_3_measurement}}
- Key Actions:
  • {{goal_3_action_1}}
  • {{goal_3_action_2}}
  • {{goal_3_action_3}}

Key Risks & Mitigation:
- {{risk_1}}: {{mitigation_1}}
- {{risk_2}}: {{mitigation_2}}

Success Celebration Plan:
{{celebration_plan}}`,
        variables: [
          "quarter",
          "year",
          "vision_statement",
          "goal_1_title",
          "goal_1_motivation",
          "goal_1_measurement",
          "goal_1_action_1",
          "goal_1_action_2",
          "goal_1_action_3",
          "goal_2_title",
          "goal_2_motivation",
          "goal_2_measurement",
          "goal_2_action_1",
          "goal_2_action_2",
          "goal_2_action_3",
          "goal_3_title",
          "goal_3_motivation",
          "goal_3_measurement",
          "goal_3_action_1",
          "goal_3_action_2",
          "goal_3_action_3",
          "risk_1",
          "mitigation_1",
          "risk_2",
          "mitigation_2",
          "celebration_plan",
        ],
        usage:
          "Use at the beginning of each quarter to set clear, measurable goals aligned with your vision",
      },
      {
        id: "daily-planning",
        name: "Daily Big Three Planning",
        framework: "universal",
        category: "planning",
        description: "Template for daily priority planning",
        template: `Daily Plan - {{date}}

Today's Big Three:
1. {{big_three_1}} (Est. time: {{time_1}})
2. {{big_three_2}} (Est. time: {{time_2}})
3. {{big_three_3}} (Est. time: {{time_3}})

Energy Level: {{energy_level}}/10
Peak Energy Time: {{peak_time}}

Schedule:
{{time_block_1}}: {{activity_1}}
{{time_block_2}}: {{activity_2}}
{{time_block_3}}: {{activity_3}}

Other Tasks (if time permits):
- {{other_task_1}}
- {{other_task_2}}
- {{other_task_3}}

Evening Reflection:
Accomplished: {{accomplished}}
Challenges: {{challenges}}
Tomorrow's Priority: {{tomorrow_priority}}`,
        variables: [
          "date",
          "big_three_1",
          "time_1",
          "big_three_2",
          "time_2",
          "big_three_3",
          "time_3",
          "energy_level",
          "peak_time",
          "time_block_1",
          "activity_1",
          "time_block_2",
          "activity_2",
          "time_block_3",
          "activity_3",
          "other_task_1",
          "other_task_2",
          "other_task_3",
          "accomplished",
          "challenges",
          "tomorrow_priority",
        ],
        usage:
          "Use each morning for daily planning and each evening for reflection",
      },
    ];

    templates.forEach((template) => {
      this.templates.set(template.id, template);
    });
  }

  getPrinciplesByFramework(
    framework: ProductivityFramework
  ): ProductivityPrinciple[] {
    return Array.from(this.principles.values()).filter(
      (p) => p.framework === framework || p.framework === "universal"
    );
  }

  getPrinciplesByCategory(
    category: ProductivityPrinciple["category"]
  ): ProductivityPrinciple[] {
    return Array.from(this.principles.values()).filter(
      (p) => p.category === category
    );
  }

  getPrinciple(id: string): ProductivityPrinciple | undefined {
    return this.principles.get(id);
  }

  getTemplatesByFramework(
    framework: ProductivityFramework
  ): ProductivityTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) => t.framework === framework || t.framework === "universal"
    );
  }

  getTemplatesByCategory(
    category: ProductivityTemplate["category"]
  ): ProductivityTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) => t.category === category
    );
  }

  getTemplate(id: string): ProductivityTemplate | undefined {
    return this.templates.get(id);
  }

  searchPrinciples(query: string): ProductivityPrinciple[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.principles.values()).filter(
      (p) =>
        p.title.toLowerCase().includes(lowercaseQuery) ||
        p.description.toLowerCase().includes(lowercaseQuery) ||
        p.application.toLowerCase().includes(lowercaseQuery)
    );
  }

  searchTemplates(query: string): ProductivityTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(
      (t) =>
        t.name.toLowerCase().includes(lowercaseQuery) ||
        t.description.toLowerCase().includes(lowercaseQuery) ||
        t.template.toLowerCase().includes(lowercaseQuery)
    );
  }

  getRelatedPrinciples(principleId: string): ProductivityPrinciple[] {
    const principle = this.principles.get(principleId);
    if (!principle) return [];

    return principle.relatedPrinciples
      .map((id) => this.principles.get(id))
      .filter(Boolean) as ProductivityPrinciple[];
  }

  getFrameworkBestPractices(framework: ProductivityFramework): {
    principles: ProductivityPrinciple[];
    templates: ProductivityTemplate[];
    commonMistakes: string[];
  } {
    const principles = this.getPrinciplesByFramework(framework);
    const templates = this.getTemplatesByFramework(framework);
    const commonMistakes = principles.flatMap((p) => p.commonMistakes);

    return { principles, templates, commonMistakes };
  }
}

// Singleton instance
let knowledgeBaseInstance: ProductivityKnowledgeBase | null = null;

export function getKnowledgeBase(): ProductivityKnowledgeBase {
  if (!knowledgeBaseInstance) {
    knowledgeBaseInstance = new ProductivityKnowledgeBase();
  }
  return knowledgeBaseInstance;
}

export default ProductivityKnowledgeBase;
