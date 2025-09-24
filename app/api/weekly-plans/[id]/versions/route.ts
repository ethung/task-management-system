import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { VersionManager } from "@/lib/versioning/version-manager";
import { getWeeklyPlanById } from "@/lib/db/weekly-plans";

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

    // Verify user owns the plan
    const plan = await getWeeklyPlanById(params.id);
    if (!plan) {
      return new NextResponse("Weekly plan not found", { status: 404 });
    }
    if (plan.userId !== payload.userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const versions = await VersionManager.getVersionHistory(
      "WEEKLY_PLAN",
      params.id
    );

    return new NextResponse(JSON.stringify(versions), { status: 200 });
  } catch (error) {
    console.error("Error fetching version history:", error);
    if (
      error instanceof Error &&
      (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError")
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
