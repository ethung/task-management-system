export interface TaskItem {
  id: string;
  content: string;
  completed: boolean;
  level: number; // indentation level for subtasks
  lineNumber: number;
}

export interface DailyGoal {
  id: string;
  content: string;
  order: number;
}

export interface ParsedDailyPlan {
  date: Date;
  goals: DailyGoal[];
  tasks: TaskItem[];
  notes: string;
  rawContent: string;
}

/**
 * Parse markdown content to extract daily goals, tasks, and notes
 */
export function parseDailyMarkdown(
  content: string,
  date: Date
): ParsedDailyPlan {
  const lines = content.split("\n");
  const goals: DailyGoal[] = [];
  const tasks: TaskItem[] = [];
  let currentSection: "none" | "goals" | "tasks" | "notes" = "none";
  let notesContent = "";
  let notesStarted = false;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Detect sections
    if (trimmedLine === "## Daily Goals") {
      currentSection = "goals";
      return;
    }

    if (trimmedLine === "## Tasks") {
      currentSection = "tasks";
      return;
    }

    if (trimmedLine === "## Notes") {
      currentSection = "notes";
      notesStarted = true;
      return;
    }

    // Parse content based on current section
    switch (currentSection) {
      case "goals":
        const goalMatch = line.match(/^(\d+)\.\s*(.*)$/);
        if (goalMatch) {
          const [, orderStr, content] = goalMatch;
          if (content.trim()) {
            goals.push({
              id: `goal-${index}`,
              content: content.trim(),
              order: parseInt(orderStr),
            });
          }
        }
        // If we hit a non-goal line, we might be moving to next section
        if (trimmedLine && !goalMatch && !trimmedLine.startsWith("##")) {
          currentSection = "none";
        }
        break;

      case "tasks":
        const taskMatch = line.match(/^(\s*)- \[([ x])\]\s*(.*)$/);
        if (taskMatch) {
          const [, indentation, checkmark, content] = taskMatch;
          if (content.trim()) {
            tasks.push({
              id: `task-${index}`,
              content: content.trim(),
              completed: checkmark.toLowerCase() === "x",
              level: Math.floor(indentation.length / 2), // 2 spaces per level
              lineNumber: index,
            });
          }
        }
        // If we hit a non-task line, we might be moving to next section
        if (trimmedLine && !taskMatch && !trimmedLine.startsWith("##")) {
          currentSection = "none";
        }
        break;

      case "notes":
        if (notesStarted) {
          notesContent += line + "\n";
        }
        break;
    }
  });

  return {
    date,
    goals,
    tasks,
    notes: notesContent.trim(),
    rawContent: content,
  };
}

/**
 * Generate markdown content from parsed daily plan data
 */
export function generateDailyMarkdown(plan: ParsedDailyPlan): string {
  const { date, goals, tasks, notes } = plan;

  let content = `# ${date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })}\n\n`;

  // Daily Goals
  content += "## Daily Goals\n";
  if (goals.length > 0) {
    goals
      .sort((a, b) => a.order - b.order)
      .forEach((goal) => {
        content += `${goal.order}. ${goal.content}\n`;
      });
  } else {
    content += "1.\n2.\n3.\n";
  }
  content += "\n";

  // Tasks
  content += "## Tasks\n";
  if (tasks.length > 0) {
    tasks.forEach((task) => {
      const indentation = "  ".repeat(task.level);
      const checkbox = task.completed ? "[x]" : "[ ]";
      content += `${indentation}- ${checkbox} ${task.content}\n`;
    });
  } else {
    content += "- [ ]\n- [ ]\n- [ ]\n";
  }
  content += "\n";

  // Notes
  content += "## Notes\n";
  if (notes) {
    content += notes + "\n";
  }
  content += "\n";

  return content;
}

/**
 * Toggle completion status of a task by line number
 */
export function toggleTaskCompletion(
  content: string,
  lineNumber: number
): string {
  const lines = content.split("\n");
  const line = lines[lineNumber];

  if (line) {
    const taskMatch = line.match(/^(\s*- \[)([ x])(\]\s*.*)$/);
    if (taskMatch) {
      const [, prefix, checkmark, suffix] = taskMatch;
      const newCheckmark = checkmark === "x" ? " " : "x";
      lines[lineNumber] = prefix + newCheckmark + suffix;
    }
  }

  return lines.join("\n");
}

/**
 * Extract task completion statistics from parsed content
 */
export function getTaskStats(tasks: TaskItem[]): {
  total: number;
  completed: number;
  percentage: number;
} {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, percentage };
}
