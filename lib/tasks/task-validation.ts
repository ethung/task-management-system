import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().optional(),
  priority: z.number().int().min(1).max(5).optional().default(3),
  dueDate: z.date().optional(),
  projectId: z.string().uuid().optional(),
  tags: z.array(z.string().uuid()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').optional(),
  description: z.string().optional(),
  priority: z.number().int().min(1).max(5).optional(),
  dueDate: z.date().optional(),
  projectId: z.string().uuid().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']).optional(),
  tags: z.array(z.string().uuid()).optional(),
});
