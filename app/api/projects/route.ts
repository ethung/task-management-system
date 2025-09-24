import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createProjectSchema } from '@/lib/projects/project-validation';
import { verifyAccessToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const token = authHeader.substring(7);

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = payload.userId;

    const json = await request.json();
    const parsed = createProjectSchema.safeParse(json);

    if (!parsed.success) {
      return new NextResponse(JSON.stringify(parsed.error), { status: 400 });
    }

    const { name, description, parentId } = parsed.data;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        parentId,
        userId,
      },
    });

    return new NextResponse(JSON.stringify(project), { status: 201 });
  } catch (error) {
    console.error(error);
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const token = authHeader.substring(7);

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = payload.userId;

    const projects = await prisma.project.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return new NextResponse(JSON.stringify(projects), { status: 200 });
  } catch (error) {
    console.error(error);
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
