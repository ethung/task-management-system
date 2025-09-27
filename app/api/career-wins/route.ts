import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createWinSchema } from "@/lib/career-wins/win-validation";
import { verifyAccessToken } from "@/lib/auth";

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
    const parsed = createWinSchema.safeParse(json);

    if (!parsed.success) {
      return new NextResponse(JSON.stringify(parsed.error), { status: 400 });
    }

    const { title, description, date, tags, category, framework, visibility } =
      parsed.data;

    const careerWin = await prisma.careerWin.create({
      data: {
        title,
        description,
        date,
        tags: JSON.stringify(tags || []),
        category,
        framework,
        visibility,
        userId,
      },
    });

    return new NextResponse(
      JSON.stringify({
        ...careerWin,
        tags: JSON.parse(careerWin.tags),
      }),
      { status: 201 }
    );
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
    const tags = searchParams.get("tags");
    const visibility = searchParams.get("visibility");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const q = searchParams.get("q");

    const where: any = {
      userId,
    };

    if (visibility) {
      where.visibility = visibility;
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    let careerWins = await prisma.careerWin.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        date: "desc",
      },
    });

    // Filter by tags if specified
    if (tags) {
      const tagList = tags.split(",").map((tag) => tag.trim());
      careerWins = careerWins.filter((win) => {
        const winTags = JSON.parse(win.tags);
        return tagList.some((tag) => winTags.includes(tag));
      });
    }

    const totalWins = await prisma.careerWin.count({ where });

    // Parse tags for response
    const winsWithParsedTags = careerWins.map((win) => ({
      ...win,
      tags: JSON.parse(win.tags),
    }));

    return new NextResponse(
      JSON.stringify({
        careerWins: winsWithParsedTags,
        totalPages: Math.ceil(totalWins / limit),
        currentPage: page,
      }),
      { status: 200 }
    );
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
