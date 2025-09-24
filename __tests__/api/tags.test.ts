import { POST, GET } from '@/app/api/tags/route';
import { PUT, DELETE } from '@/app/api/tags/[id]/route';
import { prisma } from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

jest.mock('@/lib/db', () => ({
  prisma: {
    tag: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
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
const mockTag = {
  id: 'tag-123',
  name: 'Test Tag',
  color: '#ff0000',
  userId: mockUserId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('/api/tags', () => {
  beforeEach(() => {
    (verifyAccessToken as jest.Mock).mockResolvedValue({ userId: mockUserId });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should create a tag', async () => {
      const request = {
        headers: new Headers({ Authorization: 'Bearer token' }),
        json: async () => ({ name: 'Test Tag' }),
      } as any;

      (prisma.tag.create as jest.Mock).mockResolvedValue(mockTag);

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json).toEqual(mockTag);
    });

    it('should return 400 for invalid data', async () => {
        const request = {
            headers: new Headers({ Authorization: 'Bearer token' }),
            json: async () => ({ name: '' }),
        } as any;

        const response = await POST(request);
        expect(response.status).toBe(400);
    });
  });

  describe('GET', () => {
    it('should fetch tags', async () => {
        const request = {
            headers: new Headers({ Authorization: 'Bearer token' }),
        } as any;

        (prisma.tag.findMany as jest.Mock).mockResolvedValue([mockTag]);

        const response = await GET(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json).toEqual([mockTag]);
    });
  });
});

describe('/api/tags/[id]', () => {
    beforeEach(() => {
        (verifyAccessToken as jest.Mock).mockResolvedValue({ userId: mockUserId });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const params = { id: 'tag-123' };

    describe('PUT', () => {
        it('should update a tag', async () => {
            const request = {
                headers: new Headers({ Authorization: 'Bearer token' }),
                json: async () => ({ name: 'Updated Tag' }),
            } as any;

            (prisma.tag.findFirst as jest.Mock).mockResolvedValue(mockTag);
            (prisma.tag.update as jest.Mock).mockResolvedValue({ ...mockTag, name: 'Updated Tag' });

            const response = await PUT(request, { params });
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.name).toBe('Updated Tag');
        });
    });

    describe('DELETE', () => {
        it('should delete a tag', async () => {
            const request = {
                headers: new Headers({ Authorization: 'Bearer token' }),
            } as any;

            (prisma.tag.findFirst as jest.Mock).mockResolvedValue(mockTag);
            (prisma.tag.delete as jest.Mock).mockResolvedValue(mockTag);

            const response = await DELETE(request, { params });

            expect(response.status).toBe(204);
        });
    });
});
