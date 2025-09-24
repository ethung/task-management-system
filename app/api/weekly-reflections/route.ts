import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { createWeeklyReflection, getWeeklyReflectionsByUserId, exportReflections } from '@/lib/db/weekly-reflections';
import { z } from 'zod';

const createWeeklyReflectionSchema = z.object({
  weeklyPlanId: z.string(),
  weekEndDate: z.string().transform((str) => new Date(str)),
  accomplishments: z.string().optional(),
  challenges: z.string().optional(),
  lessons: z.string().optional(),
  nextWeekGoals: z.string().optional(),
  satisfactionRating: z.number().min(1).max(10).optional(),
  progressNotes: z.string().optional(),
});

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
    const parsed = createWeeklyReflectionSchema.safeParse(json);

    if (!parsed.success) {
      return new NextResponse(JSON.stringify({ error: 'Invalid data', details: parsed.error }), { status: 400 });
    }

    const {
      weeklyPlanId,
      weekEndDate,
      accomplishments,
      challenges,
      lessons,
      nextWeekGoals,
      satisfactionRating,
      progressNotes,
    } = parsed.data;

    const weeklyReflection = await createWeeklyReflection({
      userId,
      weeklyPlanId,
      weekEndDate,
      accomplishments,
      challenges,
      lessons,
      nextWeekGoals,
      satisfactionRating,
      progressNotes,
    });

    return new NextResponse(JSON.stringify(weeklyReflection), { status: 201 });
  } catch (error) {
    console.error('Error creating weekly reflection:', error);
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'weekEndDate';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';
    const export_format = searchParams.get('export');

    if (export_format) {
      // Handle export
      const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

      const dateRange = startDate && endDate ? { start: startDate, end: endDate } : undefined;
      const exportData = await exportReflections(userId, export_format as 'json' | 'csv', dateRange);

      const contentType = export_format === 'csv' ? 'text/csv' : 'application/json';
      const filename = `weekly-reflections-${new Date().toISOString().split('T')[0]}.${export_format}`;

      return new NextResponse(exportData, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    const result = await getWeeklyReflectionsByUserId(userId, {
      page,
      limit,
      sort,
      order,
    });

    return new NextResponse(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error fetching weekly reflections:', error);
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}