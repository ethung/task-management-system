import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateTaskSchema } from "@/lib/tasks/task-validation";
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
    const taskId = params.id;

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!task) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return new NextResponse(JSON.stringify(task), { status: 200 });
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
    const taskId = params.id;

    const json = await request.json();
    const parsed = updateTaskSchema.safeParse(json);

    if (!parsed.success) {
      return new NextResponse(JSON.stringify(parsed.error), { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!task) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const { title, description, priority, dueDate, projectId, status, tags } =
      parsed.data;

    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        title,
        description,
        priority,
        dueDate,
        projectId,
        status,
        tags: tags
          ? {
              deleteMany: {},
              create: tags.map((tagId) => ({
                tag: {
                  connect: {
                    id: tagId,
                  },
                },
              })),
            }
          : undefined,
      },
    });

    return new NextResponse(JSON.stringify(updatedTask), { status: 200 });
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
    const taskId = params.id;

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!task) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.task.delete({
      where: {
        id: taskId,
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

export async function PATCH(
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
    const taskId = params.id;

    const json = await request.json();
    const { status } = json;

    if (
      !status ||
      !["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"].includes(status)
    ) {
      return new NextResponse("Invalid status", { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!task) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        status,
      },
    });

    return new NextResponse(JSON.stringify(updatedTask), { status: 200 });
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
