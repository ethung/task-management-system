import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { UndoRedoManager } from '@/lib/versioning/undo-redo';

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

    const result = await UndoRedoManager.undoLastAction(userId);

    return new NextResponse(JSON.stringify(result), { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Error undoing action:', error);
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
    const limit = parseInt(searchParams.get('limit') || '10');

    const undoHistory = await UndoRedoManager.getUndoHistory(userId, limit);

    return new NextResponse(JSON.stringify(undoHistory), { status: 200 });
  } catch (error) {
    console.error('Error fetching undo history:', error);
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}