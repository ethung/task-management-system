import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { VersionManager } from '@/lib/versioning/version-manager';
import { getWeeklyPlanById } from '@/lib/db/weekly-plans';

export async function POST(
  request: Request,
  { params }: { params: { id: string; version: string } }
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

    const version = parseInt(params.version);
    if (isNaN(version)) {
      return new NextResponse('Invalid version number', { status: 400 });
    }

    // Verify user owns the plan
    const plan = await getWeeklyPlanById(params.id);
    if (!plan) {
      return new NextResponse('Weekly plan not found', { status: 404 });
    }
    if (plan.userId !== userId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const result = await VersionManager.revertToVersion(
      'WEEKLY_PLAN',
      params.id,
      version,
      userId
    );

    if (!result.success) {
      return new NextResponse(JSON.stringify({ error: result.error }), { status: 400 });
    }

    return new NextResponse(JSON.stringify({
      success: true,
      message: `Reverted to version ${version}`,
      data: result.data,
    }), { status: 200 });
  } catch (error) {
    console.error('Error reverting to version:', error);
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}