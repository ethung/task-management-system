import type { WeeklyPlan, WeeklyGoal, WeeklyPlanStatus, PaginationParams, PaginatedResponse } from "@/lib/types";
import { prisma } from "./index";
import { VersionManager } from "@/lib/versioning/version-manager";

export async function createWeeklyPlan(data: {
  userId: string;
  weekStartDate: Date;
  weeklyGoals: WeeklyGoal[];
  intentions?: string;
  status?: WeeklyPlanStatus;
}): Promise<WeeklyPlan> {
  const weeklyPlan = await prisma.weeklyPlan.create({
    data: {
      ...data,
      status: data.status || "DRAFT",
      weeklyGoals: data.weeklyGoals as any, // Prisma JSON type
    },
    include: {
      tasks: true,
      weeklyReflections: true,
    },
  });

  // Create initial version
  await VersionManager.createVersion(
    "WEEKLY_PLAN",
    weeklyPlan.id,
    data.userId,
    {
      weeklyGoals: data.weeklyGoals,
      intentions: data.intentions,
      status: data.status || "DRAFT",
      weekStartDate: data.weekStartDate,
    },
    "CREATE",
    null,
    "Created weekly plan"
  );

  return {
    id: weeklyPlan.id,
    userId: weeklyPlan.userId,
    weekStartDate: weeklyPlan.weekStartDate,
    weeklyGoals: weeklyPlan.weeklyGoals as WeeklyGoal[],
    intentions: weeklyPlan.intentions,
    status: weeklyPlan.status as WeeklyPlanStatus,
    createdAt: weeklyPlan.createdAt,
    updatedAt: weeklyPlan.updatedAt,
    tasks: weeklyPlan.tasks?.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.status === "COMPLETED",
      priority: task.priority === 1 ? "high" : task.priority === 2 ? "medium" : "low",
      dueDate: task.dueDate,
      projectId: task.projectId,
      userId: task.userId,
      bigThreeRank: task.bigThreeRank,
      weeklyPlanId: task.weeklyPlanId,
      plannedDate: task.plannedDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    })),
    weeklyReflections: weeklyPlan.weeklyReflections?.map(reflection => ({
      id: reflection.id,
      userId: reflection.userId,
      weeklyPlanId: reflection.weeklyPlanId,
      weekEndDate: reflection.weekEndDate,
      accomplishments: reflection.accomplishments,
      challenges: reflection.challenges,
      lessons: reflection.lessons,
      nextWeekGoals: reflection.nextWeekGoals,
      satisfactionRating: reflection.satisfactionRating,
      progressNotes: reflection.progressNotes,
      createdAt: reflection.createdAt,
      updatedAt: reflection.updatedAt,
    })),
  };
}

export async function getWeeklyPlanById(id: string): Promise<WeeklyPlan | null> {
  const weeklyPlan = await prisma.weeklyPlan.findUnique({
    where: { id },
    include: {
      tasks: true,
      weeklyReflections: true,
    },
  });

  if (!weeklyPlan) return null;

  return {
    id: weeklyPlan.id,
    userId: weeklyPlan.userId,
    weekStartDate: weeklyPlan.weekStartDate,
    weeklyGoals: weeklyPlan.weeklyGoals as WeeklyGoal[],
    intentions: weeklyPlan.intentions,
    status: weeklyPlan.status as WeeklyPlanStatus,
    createdAt: weeklyPlan.createdAt,
    updatedAt: weeklyPlan.updatedAt,
    tasks: weeklyPlan.tasks?.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.status === "COMPLETED",
      priority: task.priority === 1 ? "high" : task.priority === 2 ? "medium" : "low",
      dueDate: task.dueDate,
      projectId: task.projectId,
      userId: task.userId,
      bigThreeRank: task.bigThreeRank,
      weeklyPlanId: task.weeklyPlanId,
      plannedDate: task.plannedDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    })),
    weeklyReflections: weeklyPlan.weeklyReflections?.map(reflection => ({
      id: reflection.id,
      userId: reflection.userId,
      weeklyPlanId: reflection.weeklyPlanId,
      weekEndDate: reflection.weekEndDate,
      accomplishments: reflection.accomplishments,
      challenges: reflection.challenges,
      lessons: reflection.lessons,
      nextWeekGoals: reflection.nextWeekGoals,
      satisfactionRating: reflection.satisfactionRating,
      progressNotes: reflection.progressNotes,
      createdAt: reflection.createdAt,
      updatedAt: reflection.updatedAt,
    })),
  };
}

export async function getWeeklyPlansByUserId(
  userId: string,
  params: PaginationParams = {}
): Promise<PaginatedResponse<WeeklyPlan>> {
  const { page = 1, limit = 10, sort = "weekStartDate", order = "desc" } = params;
  const skip = (page - 1) * limit;

  const [weeklyPlans, total] = await Promise.all([
    prisma.weeklyPlan.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { [sort]: order },
      include: {
        tasks: true,
        weeklyReflections: true,
      },
    }),
    prisma.weeklyPlan.count({ where: { userId } }),
  ]);

  const items = weeklyPlans.map((weeklyPlan) => ({
    id: weeklyPlan.id,
    userId: weeklyPlan.userId,
    weekStartDate: weeklyPlan.weekStartDate,
    weeklyGoals: weeklyPlan.weeklyGoals as WeeklyGoal[],
    intentions: weeklyPlan.intentions,
    status: weeklyPlan.status as WeeklyPlanStatus,
    createdAt: weeklyPlan.createdAt,
    updatedAt: weeklyPlan.updatedAt,
    tasks: weeklyPlan.tasks?.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.status === "COMPLETED",
      priority: task.priority === 1 ? "high" : task.priority === 2 ? "medium" : "low",
      dueDate: task.dueDate,
      projectId: task.projectId,
      userId: task.userId,
      bigThreeRank: task.bigThreeRank,
      weeklyPlanId: task.weeklyPlanId,
      plannedDate: task.plannedDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    })),
    weeklyReflections: weeklyPlan.weeklyReflections?.map(reflection => ({
      id: reflection.id,
      userId: reflection.userId,
      weeklyPlanId: reflection.weeklyPlanId,
      weekEndDate: reflection.weekEndDate,
      accomplishments: reflection.accomplishments,
      challenges: reflection.challenges,
      lessons: reflection.lessons,
      nextWeekGoals: reflection.nextWeekGoals,
      satisfactionRating: reflection.satisfactionRating,
      progressNotes: reflection.progressNotes,
      createdAt: reflection.createdAt,
      updatedAt: reflection.updatedAt,
    })),
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

export async function getCurrentWeekPlan(userId: string): Promise<WeeklyPlan | null> {
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // Monday
  weekStart.setHours(0, 0, 0, 0);

  const weeklyPlan = await prisma.weeklyPlan.findFirst({
    where: {
      userId,
      weekStartDate: weekStart,
    },
    include: {
      tasks: true,
      weeklyReflections: true,
    },
  });

  if (!weeklyPlan) return null;

  return {
    id: weeklyPlan.id,
    userId: weeklyPlan.userId,
    weekStartDate: weeklyPlan.weekStartDate,
    weeklyGoals: weeklyPlan.weeklyGoals as WeeklyGoal[],
    intentions: weeklyPlan.intentions,
    status: weeklyPlan.status as WeeklyPlanStatus,
    createdAt: weeklyPlan.createdAt,
    updatedAt: weeklyPlan.updatedAt,
    tasks: weeklyPlan.tasks?.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.status === "COMPLETED",
      priority: task.priority === 1 ? "high" : task.priority === 2 ? "medium" : "low",
      dueDate: task.dueDate,
      projectId: task.projectId,
      userId: task.userId,
      bigThreeRank: task.bigThreeRank,
      weeklyPlanId: task.weeklyPlanId,
      plannedDate: task.plannedDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    })),
    weeklyReflections: weeklyPlan.weeklyReflections?.map(reflection => ({
      id: reflection.id,
      userId: reflection.userId,
      weeklyPlanId: reflection.weeklyPlanId,
      weekEndDate: reflection.weekEndDate,
      accomplishments: reflection.accomplishments,
      challenges: reflection.challenges,
      lessons: reflection.lessons,
      nextWeekGoals: reflection.nextWeekGoals,
      satisfactionRating: reflection.satisfactionRating,
      progressNotes: reflection.progressNotes,
      createdAt: reflection.createdAt,
      updatedAt: reflection.updatedAt,
    })),
  };
}

export async function updateWeeklyPlan(
  id: string,
  userId: string,
  data: Partial<Pick<WeeklyPlan, "weeklyGoals" | "intentions" | "status">>
): Promise<WeeklyPlan> {
  // Get current data for versioning
  const currentPlan = await getWeeklyPlanById(id);
  if (!currentPlan) {
    throw new Error("Weekly plan not found");
  }

  const updateData = {
    ...(data.weeklyGoals && { weeklyGoals: data.weeklyGoals as any }),
    ...(data.intentions !== undefined && { intentions: data.intentions }),
    ...(data.status && { status: data.status }),
  };

  const weeklyPlan = await prisma.weeklyPlan.update({
    where: { id },
    data: updateData,
    include: {
      tasks: true,
      weeklyReflections: true,
    },
  });

  // Create version for the update
  await VersionManager.createVersion(
    "WEEKLY_PLAN",
    id,
    userId,
    {
      weeklyGoals: weeklyPlan.weeklyGoals,
      intentions: weeklyPlan.intentions,
      status: weeklyPlan.status,
      weekStartDate: weeklyPlan.weekStartDate,
    },
    "UPDATE",
    {
      weeklyGoals: currentPlan.weeklyGoals,
      intentions: currentPlan.intentions,
      status: currentPlan.status,
      weekStartDate: currentPlan.weekStartDate,
    },
    "Updated weekly plan"
  );

  return {
    id: weeklyPlan.id,
    userId: weeklyPlan.userId,
    weekStartDate: weeklyPlan.weekStartDate,
    weeklyGoals: weeklyPlan.weeklyGoals as WeeklyGoal[],
    intentions: weeklyPlan.intentions,
    status: weeklyPlan.status as WeeklyPlanStatus,
    createdAt: weeklyPlan.createdAt,
    updatedAt: weeklyPlan.updatedAt,
    tasks: weeklyPlan.tasks?.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.status === "COMPLETED",
      priority: task.priority === 1 ? "high" : task.priority === 2 ? "medium" : "low",
      dueDate: task.dueDate,
      projectId: task.projectId,
      userId: task.userId,
      bigThreeRank: task.bigThreeRank,
      weeklyPlanId: task.weeklyPlanId,
      plannedDate: task.plannedDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    })),
    weeklyReflections: weeklyPlan.weeklyReflections?.map(reflection => ({
      id: reflection.id,
      userId: reflection.userId,
      weeklyPlanId: reflection.weeklyPlanId,
      weekEndDate: reflection.weekEndDate,
      accomplishments: reflection.accomplishments,
      challenges: reflection.challenges,
      lessons: reflection.lessons,
      nextWeekGoals: reflection.nextWeekGoals,
      satisfactionRating: reflection.satisfactionRating,
      progressNotes: reflection.progressNotes,
      createdAt: reflection.createdAt,
      updatedAt: reflection.updatedAt,
    })),
  };
}

export async function deleteWeeklyPlan(id: string, userId: string): Promise<void> {
  // Get current data for versioning
  const currentPlan = await getWeeklyPlanById(id);
  if (!currentPlan) {
    throw new Error("Weekly plan not found");
  }

  // Archive instead of delete to preserve referential integrity
  await prisma.weeklyPlan.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  // Create version for the delete
  await VersionManager.createVersion(
    "WEEKLY_PLAN",
    id,
    userId,
    { status: "ARCHIVED" },
    "DELETE",
    {
      weeklyGoals: currentPlan.weeklyGoals,
      intentions: currentPlan.intentions,
      status: currentPlan.status,
      weekStartDate: currentPlan.weekStartDate,
    },
    "Archived weekly plan"
  );
}

export async function generateTasksFromGoals(
  weeklyPlanId: string,
  userId: string
): Promise<void> {
  const weeklyPlan = await getWeeklyPlanById(weeklyPlanId);
  if (!weeklyPlan) {
    throw new Error("Weekly plan not found");
  }

  const weekStart = weeklyPlan.weekStartDate;
  const tasksToCreate = [];

  for (const goal of weeklyPlan.weeklyGoals) {
    // Create a task for each goal
    const taskData = {
      title: goal.title,
      description: goal.description || `Generated from weekly goal: ${goal.title}`,
      priority: goal.priority,
      status: "NOT_STARTED" as const,
      userId,
      weeklyPlanId,
      plannedDate: new Date(weekStart.getTime() + (goal.priority - 1) * 24 * 60 * 60 * 1000), // Spread across week by priority
    };

    tasksToCreate.push(taskData);
  }

  await prisma.task.createMany({
    data: tasksToCreate,
  });
}