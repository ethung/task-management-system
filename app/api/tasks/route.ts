import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createTaskSchema } from "@/lib/tasks/task-validation";
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
    const parsed = createTaskSchema.safeParse(json);

    if (!parsed.success) {
      return new NextResponse(JSON.stringify(parsed.error), { status: 400 });
    }

    const { title, description, priority, dueDate, projectId, tags } =
      parsed.data;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        dueDate,
        userId,
        projectId,
        tags: tags
          ? {
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

    return new NextResponse(JSON.stringify(task), { status: 201 });
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
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const tags = searchParams.get("tags");
    const dueDateStart = searchParams.get("dueDateStart");
    const dueDateEnd = searchParams.get("dueDateEnd");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const q = searchParams.get("q");

    const where: any = {
      userId,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = parseInt(priority);
    }

    if (tags) {
      where.tags = {
        some: {
          tagId: {
            in: tags.split(","),
          },
        },
      };
    }

    if (dueDateStart && dueDateEnd) {
      where.dueDate = {
        gte: new Date(dueDateStart),
        lte: new Date(dueDateEnd),
      };
    } else if (dueDateStart) {
      where.dueDate = {
        gte: new Date(dueDateStart),
      };
    } else if (dueDateEnd) {
      where.dueDate = {
        lte: new Date(dueDateEnd),
      };
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        {
          tags: {
            some: { tag: { name: { contains: q, mode: "insensitive" } } },
          },
        },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalTasks = await prisma.task.count({ where });

    return new NextResponse(
      JSON.stringify({
        tasks,
        totalPages: Math.ceil(totalTasks / limit),
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
