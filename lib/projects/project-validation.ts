import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long'),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long').optional(),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  status: z.string().optional(),
});
