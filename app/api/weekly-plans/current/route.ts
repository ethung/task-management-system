import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { getCurrentWeekPlan } from "@/lib/db/weekly-plans";

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

    const currentPlan = await getCurrentWeekPlan(userId);

    if (!currentPlan) {
      return new NextResponse("No plan for current week", { status: 404 });
    }

    return new NextResponse(JSON.stringify(currentPlan), { status: 200 });
  } catch (error) {
    console.error("Error fetching current week plan:", error);
    if (
      error instanceof Error &&
      (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError")
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
