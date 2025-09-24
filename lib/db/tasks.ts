import { prisma } from "./index";
import type { Task, PaginationParams, PaginatedResponse } from "@/lib/types";

// Priority conversion helpers for database operations
function priorityStringToNumber(priority?: "low" | "medium" | "high"): number {
  switch (priority) {
    case "low":
      return 1;
    case "medium":
      return 2;
    case "high":
      return 3;
    default:
      return 3; // default to high
  }
}

function priorityNumberToString(priority: number): "low" | "medium" | "high" {
  switch (priority) {
    case 1:
      return "low";
    case 2:
      return "medium";
    case 3:
      return "high";
    default:
      return "medium"; // fallback
  }
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: Date;
  projectId?: string;
  userId: string;
}): Promise<Task> {
  const task = await prisma.task.create({
    data: {
      ...data,
      priority: priorityStringToNumber(data.priority),
    },
  });

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    completed: task.status === "COMPLETED",
    priority: priorityNumberToString(task.priority),
    dueDate: task.dueDate,
    projectId: task.projectId,
    userId: task.userId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export async function getTaskById(id: string): Promise<Task | null> {
  const task = await prisma.task.findUnique({
    where: { id },
  });

  if (!task) return null;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    completed: task.status === "COMPLETED",
    priority: priorityNumberToString(task.priority),
    dueDate: task.dueDate,
    projectId: task.projectId,
    userId: task.userId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export async function getTasksByUserId(
  userId: string,
  params: PaginationParams = {}
): Promise<PaginatedResponse<Task>> {
  const { page = 1, limit = 10, sort = "createdAt", order = "desc" } = params;
  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { [sort]: order },
    }),
    prisma.task.count({ where: { userId } }),
  ]);

  const items = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    completed: task.status === "COMPLETED",
    priority: priorityNumberToString(task.priority),
    dueDate: task.dueDate,
    projectId: task.projectId,
    userId: task.userId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }));

  return {
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
}

export async function getTasksByProjectId(projectId: string): Promise<Task[]> {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    completed: task.status === "COMPLETED",
    priority: priorityNumberToString(task.priority),
    dueDate: task.dueDate,
    projectId: task.projectId,
    userId: task.userId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }));
}

export async function updateTask(
  id: string,
  data: Partial<
    Pick<Task, "title" | "description" | "completed" | "priority" | "dueDate">
  >
): Promise<Task> {
  const updateData: any = { ...data };
  if (data.priority) {
    updateData.priority = priorityStringToNumber(data.priority);
  }
  if (typeof data.completed === "boolean") {
    updateData.status = data.completed ? "COMPLETED" : "NOT_STARTED";
    delete updateData.completed;
  }

  const task = await prisma.task.update({
    where: { id },
    data: updateData,
  });

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    completed: task.status === "COMPLETED",
    priority: priorityNumberToString(task.priority),
    dueDate: task.dueDate,
    projectId: task.projectId,
    userId: task.userId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export async function deleteTask(id: string): Promise<void> {
  await prisma.task.delete({
    where: { id },
  });
}
