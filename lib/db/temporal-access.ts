import type { WeeklyPlan, TemporalPlanQuery } from "@/lib/types";
import { prisma } from "./index";
import { getWeeklyPlanById, createWeeklyPlan } from "./weekly-plans";

/**
 * Temporal access utilities for weekly planning data
 * Supports navigation through past, present, and future planning periods
 */
export class TemporalAccess {
  /**
   * Get the start of the week (Monday) for any given date
   */
  static getWeekStart(date: Date): Date {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  /**
   * Get the end of the week (Sunday) for any given date
   */
  static getWeekEnd(date: Date): Date {
    const weekEnd = new Date(this.getWeekStart(date));
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }

  /**
   * Convert year and ISO week number to a date
   */
  static getDateFromISOWeek(year: number, week: number): Date {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) {
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    return ISOweekStart;
  }

  /**
   * Get ISO week number and year for a given date
   */
  static getISOWeek(date: Date): { year: number; week: number } {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const week = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    return { year: target.getFullYear(), week };
  }

  /**
   * Get or create a weekly plan for a specific date
   * This enables accessing plans for any past or future date
   */
  static async getOrCreateWeeklyPlan(
    userId: string,
    date: Date,
    autoCreate: boolean = false
  ): Promise<WeeklyPlan | null> {
    const weekStart = this.getWeekStart(date);

    // Try to find existing plan
    const existingPlan = await prisma.weeklyPlan.findFirst({
      where: {
        userId,
        weekStartDate: weekStart,
      },
      include: {
        tasks: true,
        weeklyReflections: true,
      },
    });

    if (existingPlan) {
      return {
        id: existingPlan.id,
        userId: existingPlan.userId,
        weekStartDate: existingPlan.weekStartDate,
        weeklyGoals: existingPlan.weeklyGoals as any,
        intentions: existingPlan.intentions,
        status: existingPlan.status as any,
        createdAt: existingPlan.createdAt,
        updatedAt: existingPlan.updatedAt,
        tasks: existingPlan.tasks?.map(task => ({
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
        weeklyReflections: existingPlan.weeklyReflections?.map(reflection => ({
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

    // Auto-create if requested and date is not too far in the future
    if (autoCreate && date <= new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) { // Max 1 year in future
      return await createWeeklyPlan({
        userId,
        weekStartDate: weekStart,
        weeklyGoals: [],
        intentions: "",
        status: "DRAFT",
      });
    }

    return null;
  }

  /**
   * Get weekly plan by ISO year and week number
   */
  static async getWeeklyPlanByISOWeek(
    userId: string,
    year: number,
    week: number,
    autoCreate: boolean = false
  ): Promise<WeeklyPlan | null> {
    const date = this.getDateFromISOWeek(year, week);
    return await this.getOrCreateWeeklyPlan(userId, date, autoCreate);
  }

  /**
   * Get a range of weekly plans
   */
  static async getWeeklyPlansInRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WeeklyPlan[]> {
    const weekStart = this.getWeekStart(startDate);
    const weekEnd = this.getWeekEnd(endDate);

    const plans = await prisma.weeklyPlan.findMany({
      where: {
        userId,
        weekStartDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      orderBy: {
        weekStartDate: "asc",
      },
      include: {
        tasks: true,
        weeklyReflections: true,
      },
    });

    return plans.map(plan => ({
      id: plan.id,
      userId: plan.userId,
      weekStartDate: plan.weekStartDate,
      weeklyGoals: plan.weeklyGoals as any,
      intentions: plan.intentions,
      status: plan.status as any,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      tasks: plan.tasks?.map(task => ({
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
      weeklyReflections: plan.weeklyReflections?.map(reflection => ({
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
  }

  /**
   * Get calendar view data showing which weeks have plans
   */
  static async getCalendarView(
    userId: string,
    year: number,
    month?: number
  ): Promise<{
    year: number;
    month?: number;
    weeks: Array<{
      weekNumber: number;
      weekStart: Date;
      weekEnd: Date;
      hasPlan: boolean;
      hasReflection: boolean;
      planStatus?: string;
      goalCount?: number;
    }>;
  }> {
    let startDate: Date;
    let endDate: Date;

    if (month) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }

    // Adjust to week boundaries
    startDate = this.getWeekStart(startDate);
    endDate = this.getWeekEnd(endDate);

    const plans = await prisma.weeklyPlan.findMany({
      where: {
        userId,
        weekStartDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        weeklyReflections: true,
      },
    });

    const weeks: Array<{
      weekNumber: number;
      weekStart: Date;
      weekEnd: Date;
      hasPlan: boolean;
      hasReflection: boolean;
      planStatus?: string;
      goalCount?: number;
    }> = [];

    const current = new Date(startDate);
    while (current <= endDate) {
      const weekStart = new Date(current);
      const weekEnd = this.getWeekEnd(current);
      const { week: weekNumber } = this.getISOWeek(current);

      const plan = plans.find(p => p.weekStartDate.getTime() === weekStart.getTime());

      weeks.push({
        weekNumber,
        weekStart,
        weekEnd,
        hasPlan: !!plan,
        hasReflection: !!plan?.weeklyReflections?.length,
        planStatus: plan?.status,
        goalCount: plan ? (plan.weeklyGoals as any[])?.length : 0,
      });

      current.setDate(current.getDate() + 7);
    }

    return { year, month, weeks };
  }

  /**
   * Navigate to adjacent weeks
   */
  static async getAdjacentWeekPlans(
    userId: string,
    currentDate: Date
  ): Promise<{
    previous: WeeklyPlan | null;
    current: WeeklyPlan | null;
    next: WeeklyPlan | null;
  }> {
    const currentWeekStart = this.getWeekStart(currentDate);
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    const [previous, current, next] = await Promise.all([
      this.getOrCreateWeeklyPlan(userId, previousWeekStart),
      this.getOrCreateWeeklyPlan(userId, currentWeekStart),
      this.getOrCreateWeeklyPlan(userId, nextWeekStart),
    ]);

    return { previous, current, next };
  }

  /**
   * Get planning statistics for a time period
   */
  static async getPlanningStats(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalWeeks: number;
    weeksWithPlans: number;
    weeksWithReflections: number;
    averageGoalsPerWeek: number;
    planningConsistency: number; // Percentage
  }> {
    const plans = await this.getWeeklyPlansInRange(userId, startDate, endDate);

    const weeksInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const weeksWithPlans = plans.length;
    const weeksWithReflections = plans.filter(p => p.weeklyReflections && p.weeklyReflections.length > 0).length;
    const totalGoals = plans.reduce((sum, p) => sum + p.weeklyGoals.length, 0);
    const averageGoalsPerWeek = weeksWithPlans > 0 ? totalGoals / weeksWithPlans : 0;
    const planningConsistency = weeksInRange > 0 ? (weeksWithPlans / weeksInRange) * 100 : 0;

    return {
      totalWeeks: weeksInRange,
      weeksWithPlans,
      weeksWithReflections,
      averageGoalsPerWeek: Math.round(averageGoalsPerWeek * 10) / 10,
      planningConsistency: Math.round(planningConsistency * 10) / 10,
    };
  }

  /**
   * Time travel: Get a snapshot of planning state at a specific point in time
   */
  static async getHistoricalSnapshot(
    userId: string,
    date: Date,
    asOfTimestamp: Date
  ): Promise<WeeklyPlan | null> {
    const weekStart = this.getWeekStart(date);

    // Find the plan that existed at the specified timestamp
    const plan = await prisma.weeklyPlan.findFirst({
      where: {
        userId,
        weekStartDate: weekStart,
        createdAt: { lte: asOfTimestamp },
      },
      include: {
        tasks: {
          where: {
            createdAt: { lte: asOfTimestamp },
          },
        },
        weeklyReflections: {
          where: {
            createdAt: { lte: asOfTimestamp },
          },
        },
      },
    });

    if (!plan) return null;

    // Get the version that was active at the specified timestamp
    const historicalVersion = await prisma.entityVersion.findFirst({
      where: {
        entityType: "WEEKLY_PLAN",
        entityId: plan.id,
        createdAt: { lte: asOfTimestamp },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (historicalVersion) {
      const versionData = historicalVersion.versionData as any;
      return {
        id: plan.id,
        userId: plan.userId,
        weekStartDate: plan.weekStartDate,
        weeklyGoals: versionData.weeklyGoals || [],
        intentions: versionData.intentions,
        status: versionData.status,
        createdAt: plan.createdAt,
        updatedAt: historicalVersion.createdAt,
        tasks: plan.tasks?.map(task => ({
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
        weeklyReflections: plan.weeklyReflections?.map(reflection => ({
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

    // Return current plan data if no historical version found
    return {
      id: plan.id,
      userId: plan.userId,
      weekStartDate: plan.weekStartDate,
      weeklyGoals: plan.weeklyGoals as any,
      intentions: plan.intentions,
      status: plan.status as any,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      tasks: plan.tasks?.map(task => ({
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
      weeklyReflections: plan.weeklyReflections?.map(reflection => ({
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
}