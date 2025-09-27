import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateWinSchema } from "@/lib/career-wins/win-validation";
import { verifyAccessToken } from "@/lib/auth";

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

    const json = await request.json();
    const parsed = updateWinSchema.safeParse(json);

    if (!parsed.success) {
      return new NextResponse(JSON.stringify(parsed.error), { status: 400 });
    }

    const { title, description, date, tags, category, framework, visibility } =
      parsed.data;

    // Check if the career win exists and belongs to the user
    const existingWin = await prisma.careerWin.findUnique({
      where: { id: params.id },
    });

    if (!existingWin) {
      return new NextResponse("Career win not found", { status: 404 });
    }

    if (existingWin.userId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = date;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (category !== undefined) updateData.category = category;
    if (framework !== undefined) updateData.framework = framework;
    if (visibility !== undefined) updateData.visibility = visibility;

    const updatedWin = await prisma.careerWin.update({
      where: { id: params.id },
      data: updateData,
    });

    return new NextResponse(
      JSON.stringify({
        ...updatedWin,
        tags: JSON.parse(updatedWin.tags),
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

    // Check if the career win exists and belongs to the user
    const existingWin = await prisma.careerWin.findUnique({
      where: { id: params.id },
    });

    if (!existingWin) {
      return new NextResponse("Career win not found", { status: 404 });
    }

    if (existingWin.userId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.careerWin.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
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
    const userId = payload.userId;

    const careerWin = await prisma.careerWin.findUnique({
      where: { id: params.id },
    });

    if (!careerWin) {
      return new NextResponse("Career win not found", { status: 404 });
    }

    if (careerWin.userId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return new NextResponse(
      JSON.stringify({
        ...careerWin,
        tags: JSON.parse(careerWin.tags),
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
