import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAccessToken } from "@/lib/auth";
import {
  createWeeklyPlan,
  getWeeklyPlansByUserId,
} from "@/lib/db/weekly-plans";

const createWeeklyPlanSchema = z.object({
  weekStartDate: z.string().transform((str) => new Date(str)),
  weeklyGoals: z.array(
    z.object({
      id: z.string(),
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.number().min(1).max(5),
      completed: z.boolean().optional(),
    })
  ),
  intentions: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
});

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const token = authHeader.substring(7);

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = payload.userId;

    const json = await request.json();
    const parsed = createWeeklyPlanSchema.safeParse(json);

    if (!parsed.success) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid data", details: parsed.error }),
        { status: 400 }
      );
    }

    const { weekStartDate, weeklyGoals, intentions, status } = parsed.data;

    const weeklyPlan = await createWeeklyPlan({
      userId,
      weekStartDate,
      weeklyGoals,
      intentions,
      status,
    });

    return new NextResponse(JSON.stringify(weeklyPlan), { status: 201 });
  } catch (error) {
    console.error("Error creating weekly plan:", error);
    if (
      error instanceof Error &&
      (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError")
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const token = authHeader.substring(7);

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = payload.userId;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sort = searchParams.get("sort") || "weekStartDate";
    const order = (searchParams.get("order") || "desc") as "asc" | "desc";
    const status = searchParams.get("status");

    const result = await getWeeklyPlansByUserId(userId, {
      page,
      limit,
      sort,
      order,
    });

    // Filter by status if provided
    if (status && result.data) {
      result.data.items = result.data.items.filter(
        (plan) => plan.status === status
      );
    }

    return new NextResponse(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("Error fetching weekly plans:", error);
    if (
      error instanceof Error &&
      (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError")
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
