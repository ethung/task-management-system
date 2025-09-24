import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { TemporalAccess } from '@/lib/db/temporal-access';

export async function GET(
  request: Request,
  { params }: { params: { year: string; week: string } }
) {
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

    const year = parseInt(params.year);
    const week = parseInt(params.week);

    if (isNaN(year) || isNaN(week) || week < 1 || week > 53) {
      return new NextResponse('Invalid year or week number', { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const autoCreate = searchParams.get('autoCreate') === 'true';

    const weeklyPlan = await TemporalAccess.getWeeklyPlanByISOWeek(userId, year, week, autoCreate);

    if (!weeklyPlan) {
      return new NextResponse('No plan found for this ISO week', { status: 404 });
    }

    return new NextResponse(JSON.stringify(weeklyPlan), { status: 200 });
  } catch (error) {
    console.error('Error fetching weekly plan by ISO week:', error);
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}