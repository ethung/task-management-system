import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateTagSchema } from "@/lib/tags/tag-validation";
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
    const tagId = params.id;

    const json = await request.json();
    const parsed = updateTagSchema.safeParse(json);

    if (!parsed.success) {
      return new NextResponse(JSON.stringify(parsed.error), { status: 400 });
    }

    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        userId,
      },
    });

    if (!tag) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const { name, color } = parsed.data;

    const updatedTag = await prisma.tag.update({
      where: {
        id: tagId,
      },
      data: {
        name,
        color,
      },
    });

    return new NextResponse(JSON.stringify(updatedTag), { status: 200 });
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
    const tagId = params.id;

    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        userId,
      },
    });

    if (!tag) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.tag.delete({
      where: {
        id: tagId,
      },
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
