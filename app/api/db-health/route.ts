import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

// This API route should not be statically generated
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    // Get basic stats
    const [userCount, projectCount, taskCount] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
    ]);

    return NextResponse.json({
      success: true,
      message: "Database connection healthy",
      stats: {
        users: userCount,
        projects: projectCount,
        tasks: taskCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
