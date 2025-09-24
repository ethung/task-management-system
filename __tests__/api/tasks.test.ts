import { POST, GET } from '@/app/api/tasks/route';
import { GET as GET_BY_ID, PUT, DELETE, PATCH } from '@/app/api/tasks/[id]/route';
import { prisma } from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

jest.mock('@/lib/db', () => ({
  prisma: {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
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
const mockTask = {
  id: 'task-123',
  title: 'Test Task',
  description: 'Test Description',
  priority: 3,
  status: 'NOT_STARTED',
  userId: mockUserId,
  projectId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('/api/tasks', () => {
  beforeEach(() => {
    (verifyAccessToken as jest.Mock).mockResolvedValue({ userId: mockUserId });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should create a task', async () => {
      const request = {
        headers: new Headers({ Authorization: 'Bearer token' }),
        json: async () => ({ title: 'Test Task' }),
      } as any;

      (prisma.task.create as jest.Mock).mockResolvedValue(mockTask);

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json).toEqual(mockTask);
    });

    it('should return 400 for invalid data', async () => {
        const request = {
            headers: new Headers({ Authorization: 'Bearer token' }),
            json: async () => ({ title: '' }),
        } as any;

        const response = await POST(request);
        expect(response.status).toBe(400);
    });
  });

  describe('GET', () => {
    it('should fetch tasks', async () => {
        const request = {
            headers: new Headers({ Authorization: 'Bearer token' }),
            url: 'http://localhost/api/tasks',
        } as any;

        (prisma.task.findMany as jest.Mock).mockResolvedValue([mockTask]);
        (prisma.task.count as jest.Mock).mockResolvedValue(1);

        const response = await GET(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.tasks).toEqual([mockTask]);
    });
  });
});

describe('/api/tasks/[id]', () => {
    beforeEach(() => {
        (verifyAccessToken as jest.Mock).mockResolvedValue({ userId: mockUserId });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const params = { id: 'task-123' };

    describe('GET', () => {
        it('should fetch a single task', async () => {
            const request = {
                headers: new Headers({ Authorization: 'Bearer token' }),
            } as any;

            (prisma.task.findFirst as jest.Mock).mockResolvedValue(mockTask);

            const response = await GET_BY_ID(request, { params });
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json).toEqual(mockTask);
        });
    });

    describe('PUT', () => {
        it('should update a task', async () => {
            const request = {
                headers: new Headers({ Authorization: 'Bearer token' }),
                json: async () => ({ title: 'Updated Task' }),
            } as any;

            (prisma.task.findFirst as jest.Mock).mockResolvedValue(mockTask);
            (prisma.task.update as jest.Mock).mockResolvedValue({ ...mockTask, title: 'Updated Task' });

            const response = await PUT(request, { params });
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.title).toBe('Updated Task');
        });
    });

    describe('DELETE', () => {
        it('should delete a task', async () => {
            const request = {
                headers: new Headers({ Authorization: 'Bearer token' }),
            } as any;

            (prisma.task.findFirst as jest.Mock).mockResolvedValue(mockTask);
            (prisma.task.delete as jest.Mock).mockResolvedValue(mockTask);

            const response = await DELETE(request, { params });

            expect(response.status).toBe(204);
        });
    });

    describe('PATCH', () => {
        it('should update a task status', async () => {
            const request = {
                headers: new Headers({ Authorization: 'Bearer token' }),
                json: async () => ({ status: 'COMPLETED' }),
            } as any;

            (prisma.task.findFirst as jest.Mock).mockResolvedValue(mockTask);
            (prisma.task.update as jest.Mock).mockResolvedValue({ ...mockTask, status: 'COMPLETED' });

            const response = await PATCH(request, { params });
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.status).toBe('COMPLETED');
        });
    });
});
