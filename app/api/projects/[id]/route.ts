import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateProjectSchema } from "@/lib/projects/project-validation";
import { verifyAccessToken } from "@/lib/auth";

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
    const projectId = params.id;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return new NextResponse(JSON.stringify(project), { status: 200 });
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
    const projectId = params.id;

    const json = await request.json();
    const parsed = updateProjectSchema.safeParse(json);

    if (!parsed.success) {
      return new NextResponse(JSON.stringify(parsed.error), { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const { name, description, parentId, status } = parsed.data;

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData["name"] = name;
    if (description !== undefined) updateData["description"] = description;
    if (parentId !== undefined) updateData["parentId"] = parentId;
    if (status !== undefined) updateData["status"] = status;

    const updatedProject = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: updateData as any,
    });

    return new NextResponse(JSON.stringify(updatedProject), { status: 200 });
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
    const projectId = params.id;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.project.delete({
      where: {
        id: projectId,
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
