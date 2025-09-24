import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAccessToken } from "@/lib/auth";
import {
  getWeeklyPlanById,
  updateWeeklyPlan,
  deleteWeeklyPlan,
} from "@/lib/db/weekly-plans";

const updateWeeklyPlanSchema = z.object({
  weeklyGoals: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.number().min(1).max(5),
        completed: z.boolean().optional(),
      })
    )
    .optional(),
  intentions: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const weeklyPlan = await getWeeklyPlanById(params.id);

    if (!weeklyPlan) {
      return new NextResponse("Weekly plan not found", { status: 404 });
    }

    // Check if user owns this plan
    if (weeklyPlan.userId !== payload.userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return new NextResponse(JSON.stringify(weeklyPlan), { status: 200 });
  } catch (error) {
    console.error("Error fetching weekly plan:", error);
    if (
      error instanceof Error &&
      (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError")
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if plan exists and user owns it
    const existingPlan = await getWeeklyPlanById(params.id);
    if (!existingPlan) {
      return new NextResponse("Weekly plan not found", { status: 404 });
    }
    if (existingPlan.userId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const json = await request.json();
    const parsed = updateWeeklyPlanSchema.safeParse(json);

    if (!parsed.success) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid data", details: parsed.error }),
        { status: 400 }
      );
    }

    const updatedPlan = await updateWeeklyPlan(params.id, userId, parsed.data);

    return new NextResponse(JSON.stringify(updatedPlan), { status: 200 });
  } catch (error) {
    console.error("Error updating weekly plan:", error);
    if (
      error instanceof Error &&
      (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError")
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if plan exists and user owns it
    const existingPlan = await getWeeklyPlanById(params.id);
    if (!existingPlan) {
      return new NextResponse("Weekly plan not found", { status: 404 });
    }
    if (existingPlan.userId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await deleteWeeklyPlan(params.id, userId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting weekly plan:", error);
    if (
      error instanceof Error &&
      (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError")
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
