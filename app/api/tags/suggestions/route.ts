import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAccessToken } from "@/lib/auth";

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

    const tagSuggestions = await prisma.taskTag.groupBy({
      by: ["tagId"],
      where: {
        task: {
          userId,
        },
      },
      _count: {
        tagId: true,
      },
      orderBy: {
        _count: {
          tagId: "desc",
        },
      },
      take: 10,
    });

    const tags = await prisma.tag.findMany({
      where: {
        id: {
          in: tagSuggestions.map((t) => t.tagId),
        },
      },
    });

    return new NextResponse(JSON.stringify(tags), { status: 200 });
  } catch (error) {
    console.error(error);
    if (
      error instanceof Error &&
      (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError")
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
