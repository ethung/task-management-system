import { GET } from '@/app/api/tags/suggestions/route';
import { prisma } from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

jest.mock('@/lib/db', () => ({
  prisma: {
    taskTag: {
      groupBy: jest.fn(),
    },
    tag: {
        findMany: jest.fn(),
    }
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyAccessToken: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextResponse: class {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status;
    }
    json() {
      return Promise.resolve(JSON.parse(this.body));
    }
  }
}));

const mockUserId = 'user-123';
const mockTagSuggestions = [
    { tagId: 'tag-1', _count: { tagId: 10 } },
    { tagId: 'tag-2', _count: { tagId: 5 } },
];
const mockTags = [
    { id: 'tag-1', name: 'tag1', color: '#ff0000', userId: mockUserId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tag-2', name: 'tag2', color: '#00ff00', userId: mockUserId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];


describe('/api/tags/suggestions', () => {
  beforeEach(() => {
    (verifyAccessToken as jest.Mock).mockResolvedValue({ userId: mockUserId });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should fetch tag suggestions', async () => {
        const request = {
            headers: new Headers({ Authorization: 'Bearer token' }),
        } as any;

        (prisma.taskTag.groupBy as jest.Mock).mockResolvedValue(mockTagSuggestions);
        (prisma.tag.findMany as jest.Mock).mockResolvedValue(mockTags);

        const response = await GET(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json).toEqual(mockTags);
    });
  });
});
