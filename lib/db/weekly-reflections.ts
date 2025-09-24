import type { WeeklyReflection, PaginationParams, PaginatedResponse } from "@/lib/types";
import { prisma } from "./index";
import { VersionManager } from "@/lib/versioning/version-manager";

export async function createWeeklyReflection(data: {
  userId: string;
  weeklyPlanId: string;
  weekEndDate: Date;
  accomplishments?: string;
  challenges?: string;
  lessons?: string;
  nextWeekGoals?: string;
  satisfactionRating?: number;
  progressNotes?: string;
}): Promise<WeeklyReflection> {
  const weeklyReflection = await prisma.weeklyReflection.create({
    data,
    include: {
      weeklyPlan: {
        include: {
          tasks: true,
        },
      },
    },
  });

  // Create initial version
  await VersionManager.createVersion(
    "WEEKLY_REFLECTION",
    weeklyReflection.id,
    data.userId,
    {
      accomplishments: data.accomplishments,
      challenges: data.challenges,
      lessons: data.lessons,
      nextWeekGoals: data.nextWeekGoals,
      satisfactionRating: data.satisfactionRating,
      progressNotes: data.progressNotes,
      weekEndDate: data.weekEndDate,
    },
    "CREATE",
    null,
    "Created weekly reflection"
  );

  return {
    id: weeklyReflection.id,
    userId: weeklyReflection.userId,
    weeklyPlanId: weeklyReflection.weeklyPlanId,
    weekEndDate: weeklyReflection.weekEndDate,
    accomplishments: weeklyReflection.accomplishments,
    challenges: weeklyReflection.challenges,
    lessons: weeklyReflection.lessons,
    nextWeekGoals: weeklyReflection.nextWeekGoals,
    satisfactionRating: weeklyReflection.satisfactionRating,
    progressNotes: weeklyReflection.progressNotes,
    createdAt: weeklyReflection.createdAt,
    updatedAt: weeklyReflection.updatedAt,
    weeklyPlan: weeklyReflection.weeklyPlan ? {
      id: weeklyReflection.weeklyPlan.id,
      userId: weeklyReflection.weeklyPlan.userId,
      weekStartDate: weeklyReflection.weeklyPlan.weekStartDate,
      weeklyGoals: weeklyReflection.weeklyPlan.weeklyGoals as any,
      intentions: weeklyReflection.weeklyPlan.intentions,
      status: weeklyReflection.weeklyPlan.status as any,
      createdAt: weeklyReflection.weeklyPlan.createdAt,
      updatedAt: weeklyReflection.weeklyPlan.updatedAt,
    } : undefined,
  };
}

export async function getWeeklyReflectionById(id: string): Promise<WeeklyReflection | null> {
  const weeklyReflection = await prisma.weeklyReflection.findUnique({
    where: { id },
    include: {
      weeklyPlan: {
        include: {
          tasks: true,
        },
      },
    },
  });

  if (!weeklyReflection) return null;

  return {
    id: weeklyReflection.id,
    userId: weeklyReflection.userId,
    weeklyPlanId: weeklyReflection.weeklyPlanId,
    weekEndDate: weeklyReflection.weekEndDate,
    accomplishments: weeklyReflection.accomplishments,
    challenges: weeklyReflection.challenges,
    lessons: weeklyReflection.lessons,
    nextWeekGoals: weeklyReflection.nextWeekGoals,
    satisfactionRating: weeklyReflection.satisfactionRating,
    progressNotes: weeklyReflection.progressNotes,
    createdAt: weeklyReflection.createdAt,
    updatedAt: weeklyReflection.updatedAt,
    weeklyPlan: weeklyReflection.weeklyPlan ? {
      id: weeklyReflection.weeklyPlan.id,
      userId: weeklyReflection.weeklyPlan.userId,
      weekStartDate: weeklyReflection.weeklyPlan.weekStartDate,
      weeklyGoals: weeklyReflection.weeklyPlan.weeklyGoals as any,
      intentions: weeklyReflection.weeklyPlan.intentions,
      status: weeklyReflection.weeklyPlan.status as any,
      createdAt: weeklyReflection.weeklyPlan.createdAt,
      updatedAt: weeklyReflection.weeklyPlan.updatedAt,
    } : undefined,
  };
}

export async function getWeeklyReflectionsByUserId(
  userId: string,
  params: PaginationParams = {}
): Promise<PaginatedResponse<WeeklyReflection>> {
  const { page = 1, limit = 10, sort = "weekEndDate", order = "desc" } = params;
  const skip = (page - 1) * limit;

  const [weeklyReflections, total] = await Promise.all([
    prisma.weeklyReflection.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { [sort]: order },
      include: {
        weeklyPlan: {
          include: {
            tasks: true,
          },
        },
      },
    }),
    prisma.weeklyReflection.count({ where: { userId } }),
  ]);

  const items = weeklyReflections.map((weeklyReflection) => ({
    id: weeklyReflection.id,
    userId: weeklyReflection.userId,
    weeklyPlanId: weeklyReflection.weeklyPlanId,
    weekEndDate: weeklyReflection.weekEndDate,
    accomplishments: weeklyReflection.accomplishments,
    challenges: weeklyReflection.challenges,
    lessons: weeklyReflection.lessons,
    nextWeekGoals: weeklyReflection.nextWeekGoals,
    satisfactionRating: weeklyReflection.satisfactionRating,
    progressNotes: weeklyReflection.progressNotes,
    createdAt: weeklyReflection.createdAt,
    updatedAt: weeklyReflection.updatedAt,
    weeklyPlan: weeklyReflection.weeklyPlan ? {
      id: weeklyReflection.weeklyPlan.id,
      userId: weeklyReflection.weeklyPlan.userId,
      weekStartDate: weeklyReflection.weeklyPlan.weekStartDate,
      weeklyGoals: weeklyReflection.weeklyPlan.weeklyGoals as any,
      intentions: weeklyReflection.weeklyPlan.intentions,
      status: weeklyReflection.weeklyPlan.status as any,
      createdAt: weeklyReflection.weeklyPlan.createdAt,
      updatedAt: weeklyReflection.weeklyPlan.updatedAt,
    } : undefined,
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

export async function getWeeklyReflectionByPlanId(weeklyPlanId: string): Promise<WeeklyReflection | null> {
  const weeklyReflection = await prisma.weeklyReflection.findUnique({
    where: { weeklyPlanId },
    include: {
      weeklyPlan: {
        include: {
          tasks: true,
        },
      },
    },
  });

  if (!weeklyReflection) return null;

  return {
    id: weeklyReflection.id,
    userId: weeklyReflection.userId,
    weeklyPlanId: weeklyReflection.weeklyPlanId,
    weekEndDate: weeklyReflection.weekEndDate,
    accomplishments: weeklyReflection.accomplishments,
    challenges: weeklyReflection.challenges,
    lessons: weeklyReflection.lessons,
    nextWeekGoals: weeklyReflection.nextWeekGoals,
    satisfactionRating: weeklyReflection.satisfactionRating,
    progressNotes: weeklyReflection.progressNotes,
    createdAt: weeklyReflection.createdAt,
    updatedAt: weeklyReflection.updatedAt,
    weeklyPlan: weeklyReflection.weeklyPlan ? {
      id: weeklyReflection.weeklyPlan.id,
      userId: weeklyReflection.weeklyPlan.userId,
      weekStartDate: weeklyReflection.weeklyPlan.weekStartDate,
      weeklyGoals: weeklyReflection.weeklyPlan.weeklyGoals as any,
      intentions: weeklyReflection.weeklyPlan.intentions,
      status: weeklyReflection.weeklyPlan.status as any,
      createdAt: weeklyReflection.weeklyPlan.createdAt,
      updatedAt: weeklyReflection.weeklyPlan.updatedAt,
    } : undefined,
  };
}

export async function updateWeeklyReflection(
  id: string,
  userId: string,
  data: Partial<Pick<WeeklyReflection, "accomplishments" | "challenges" | "lessons" | "nextWeekGoals" | "satisfactionRating" | "progressNotes">>
): Promise<WeeklyReflection> {
  // Get current data for versioning
  const currentReflection = await getWeeklyReflectionById(id);
  if (!currentReflection) {
    throw new Error("Weekly reflection not found");
  }

  const weeklyReflection = await prisma.weeklyReflection.update({
    where: { id },
    data,
    include: {
      weeklyPlan: {
        include: {
          tasks: true,
        },
      },
    },
  });

  // Create version for the update
  await VersionManager.createVersion(
    "WEEKLY_REFLECTION",
    id,
    userId,
    {
      accomplishments: weeklyReflection.accomplishments,
      challenges: weeklyReflection.challenges,
      lessons: weeklyReflection.lessons,
      nextWeekGoals: weeklyReflection.nextWeekGoals,
      satisfactionRating: weeklyReflection.satisfactionRating,
      progressNotes: weeklyReflection.progressNotes,
      weekEndDate: weeklyReflection.weekEndDate,
    },
    "UPDATE",
    {
      accomplishments: currentReflection.accomplishments,
      challenges: currentReflection.challenges,
      lessons: currentReflection.lessons,
      nextWeekGoals: currentReflection.nextWeekGoals,
      satisfactionRating: currentReflection.satisfactionRating,
      progressNotes: currentReflection.progressNotes,
      weekEndDate: currentReflection.weekEndDate,
    },
    "Updated weekly reflection"
  );

  return {
    id: weeklyReflection.id,
    userId: weeklyReflection.userId,
    weeklyPlanId: weeklyReflection.weeklyPlanId,
    weekEndDate: weeklyReflection.weekEndDate,
    accomplishments: weeklyReflection.accomplishments,
    challenges: weeklyReflection.challenges,
    lessons: weeklyReflection.lessons,
    nextWeekGoals: weeklyReflection.nextWeekGoals,
    satisfactionRating: weeklyReflection.satisfactionRating,
    progressNotes: weeklyReflection.progressNotes,
    createdAt: weeklyReflection.createdAt,
    updatedAt: weeklyReflection.updatedAt,
    weeklyPlan: weeklyReflection.weeklyPlan ? {
      id: weeklyReflection.weeklyPlan.id,
      userId: weeklyReflection.weeklyPlan.userId,
      weekStartDate: weeklyReflection.weeklyPlan.weekStartDate,
      weeklyGoals: weeklyReflection.weeklyPlan.weeklyGoals as any,
      intentions: weeklyReflection.weeklyPlan.intentions,
      status: weeklyReflection.weeklyPlan.status as any,
      createdAt: weeklyReflection.weeklyPlan.createdAt,
      updatedAt: weeklyReflection.weeklyPlan.updatedAt,
    } : undefined,
  };
}

export async function deleteWeeklyReflection(id: string, userId: string): Promise<void> {
  // Get current data for versioning
  const currentReflection = await getWeeklyReflectionById(id);
  if (!currentReflection) {
    throw new Error("Weekly reflection not found");
  }

  await prisma.weeklyReflection.delete({
    where: { id },
  });

  // Create version for the delete
  await VersionManager.createVersion(
    "WEEKLY_REFLECTION",
    id,
    userId,
    { deleted: true },
    "DELETE",
    {
      accomplishments: currentReflection.accomplishments,
      challenges: currentReflection.challenges,
      lessons: currentReflection.lessons,
      nextWeekGoals: currentReflection.nextWeekGoals,
      satisfactionRating: currentReflection.satisfactionRating,
      progressNotes: currentReflection.progressNotes,
      weekEndDate: currentReflection.weekEndDate,
    },
    "Deleted weekly reflection"
  );
}

export async function exportReflections(
  userId: string,
  format: "json" | "csv" = "json",
  dateRange?: { start: Date; end: Date }
): Promise<string> {
  const where: any = { userId };

  if (dateRange) {
    where.weekEndDate = {
      gte: dateRange.start,
      lte: dateRange.end,
    };
  }

  const reflections = await prisma.weeklyReflection.findMany({
    where,
    orderBy: { weekEndDate: "asc" },
    include: {
      weeklyPlan: true,
    },
  });

  if (format === "csv") {
    const headers = [
      "Week End Date",
      "Accomplishments",
      "Challenges",
      "Lessons",
      "Next Week Goals",
      "Satisfaction Rating",
      "Progress Notes",
      "Weekly Goals",
    ];

    const rows = reflections.map((reflection) => [
      reflection.weekEndDate.toISOString().split('T')[0],
      reflection.accomplishments || "",
      reflection.challenges || "",
      reflection.lessons || "",
      reflection.nextWeekGoals || "",
      reflection.satisfactionRating?.toString() || "",
      reflection.progressNotes || "",
      reflection.weeklyPlan?.weeklyGoals ? JSON.stringify(reflection.weeklyPlan.weeklyGoals) : "",
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
  }

  // JSON format
  return JSON.stringify(
    reflections.map((reflection) => ({
      id: reflection.id,
      weekEndDate: reflection.weekEndDate,
      accomplishments: reflection.accomplishments,
      challenges: reflection.challenges,
      lessons: reflection.lessons,
      nextWeekGoals: reflection.nextWeekGoals,
      satisfactionRating: reflection.satisfactionRating,
      progressNotes: reflection.progressNotes,
      weeklyGoals: reflection.weeklyPlan?.weeklyGoals,
      createdAt: reflection.createdAt,
    })),
    null,
    2
  );
}

export async function getReflectionInsights(userId: string): Promise<{
  averageSatisfactionRating: number;
  totalReflections: number;
  commonChallenges: string[];
  progressTrends: { week: string; rating: number }[];
}> {
  const reflections = await prisma.weeklyReflection.findMany({
    where: { userId },
    orderBy: { weekEndDate: "asc" },
  });

  const ratingsWithValues = reflections.filter(r => r.satisfactionRating !== null);
  const averageSatisfactionRating = ratingsWithValues.length > 0
    ? ratingsWithValues.reduce((sum, r) => sum + (r.satisfactionRating || 0), 0) / ratingsWithValues.length
    : 0;

  const progressTrends = reflections
    .filter(r => r.satisfactionRating !== null)
    .map(r => ({
      week: r.weekEndDate.toISOString().split('T')[0],
      rating: r.satisfactionRating || 0,
    }))
    .filter(item => item.week !== undefined) as { week: string; rating: number }[];

  // Simple analysis of common challenge keywords
  const allChallenges = reflections
    .map(r => r.challenges)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const challengeKeywords = ["time", "focus", "energy", "stress", "deadline", "communication", "planning"];
  const commonChallenges = challengeKeywords
    .filter(keyword => allChallenges.includes(keyword))
    .slice(0, 5);

  return {
    averageSatisfactionRating: Math.round(averageSatisfactionRating * 10) / 10,
    totalReflections: reflections.length,
    commonChallenges,
    progressTrends,
  };
}