import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createTagSchema } from '@/lib/tags/tag-validation';
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
    const parsed = createTagSchema.safeParse(json);

    if (!parsed.success) {
      return new NextResponse(JSON.stringify(parsed.error), { status: 400 });
    }

    const { name, color } = parsed.data;

    const tag = await prisma.tag.create({
      data: {
        name,
        color,
        userId,
      },
    });

    return new NextResponse(JSON.stringify(tag), { status: 201 });
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

        const tags = await prisma.tag.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return new NextResponse(JSON.stringify(tags), { status: 200 });
    } catch (error) {
        console.error(error);
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
