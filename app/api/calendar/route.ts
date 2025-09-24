import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { TemporalAccess } from '@/lib/db/temporal-access';

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
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;

    if (isNaN(year) || (month && (isNaN(month) || month < 1 || month > 12))) {
      return new NextResponse('Invalid year or month', { status: 400 });
    }

    const calendarView = await TemporalAccess.getCalendarView(userId, year, month);

    return new NextResponse(JSON.stringify(calendarView), { status: 200 });
  } catch (error) {
    console.error('Error fetching calendar view:', error);
    if ((error as any)?.name === 'TokenExpiredError' || (error as any)?.name === 'JsonWebTokenError') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}