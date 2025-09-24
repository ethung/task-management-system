import { POST, GET } from '@/app/api/projects/route';
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/projects/[id]/route';
import { prisma } from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

jest.mock('@/lib/db', () => ({
  prisma: {
    project: {
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
const mockProject = {
  id: 'project-123',
  name: 'Test Project',
  description: 'Test Description',
  userId: mockUserId,
  parentId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('/api/projects', () => {
  beforeEach(() => {
    (verifyAccessToken as jest.Mock).mockResolvedValue({ userId: mockUserId });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should create a project', async () => {
      const request = {
        headers: new Headers({ Authorization: 'Bearer token' }),
        json: async () => ({ name: 'Test Project' }),
      } as any;

      (prisma.project.create as jest.Mock).mockResolvedValue(mockProject);

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json).toEqual(mockProject);
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
    it('should fetch projects', async () => {
        const request = {
            headers: new Headers({ Authorization: 'Bearer token' }),
        } as any;

        (prisma.project.findMany as jest.Mock).mockResolvedValue([mockProject]);

        const response = await GET(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json).toEqual([mockProject]);
    });
  });
});

describe('/api/projects/[id]', () => {
    beforeEach(() => {
        (verifyAccessToken as jest.Mock).mockResolvedValue({ userId: mockUserId });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const params = { id: 'project-123' };

    describe('GET', () => {
        it('should fetch a single project', async () => {
            const request = {
                headers: new Headers({ Authorization: 'Bearer token' }),
            } as any;

            (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);

            const response = await GET_BY_ID(request, { params });
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json).toEqual(mockProject);
        });
    });

    describe('PUT', () => {
        it('should update a project', async () => {
            const request = {
                headers: new Headers({ Authorization: 'Bearer token' }),
                json: async () => ({ name: 'Updated Project' }),
            } as any;

            (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);
            (prisma.project.update as jest.Mock).mockResolvedValue({ ...mockProject, name: 'Updated Project' });

            const response = await PUT(request, { params });
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.name).toBe('Updated Project');
        });
    });

    describe('DELETE', () => {
        it('should delete a project', async () => {
            const request = {
                headers: new Headers({ Authorization: 'Bearer token' }),
            } as any;

            (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);
            (prisma.project.delete as jest.Mock).mockResolvedValue(mockProject);

            const response = await DELETE(request, { params });

            expect(response.status).toBe(204);
        });
    });
});
