import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { TemporalAccess } from "@/lib/db/temporal-access";

export async function GET(
  request: Request,
  { params }: { params: { date: string } }
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

    const { searchParams } = new URL(request.url);
    const autoCreate = searchParams.get("autoCreate") === "true";

    // Parse date from params
    const date = new Date(params.date);
    if (isNaN(date.getTime())) {
      return new NextResponse("Invalid date format", { status: 400 });
    }

    const weeklyPlan = await TemporalAccess.getOrCreateWeeklyPlan(
      userId,
      date,
      autoCreate
    );

    if (!weeklyPlan) {
      return new NextResponse("No plan found for this date", { status: 404 });
    }

    return new NextResponse(JSON.stringify(weeklyPlan), { status: 200 });
  } catch (error) {
    console.error("Error fetching weekly plan by date:", error);
    if (
      error instanceof Error &&
      (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError")
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
