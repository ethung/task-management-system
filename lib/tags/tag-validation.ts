import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  color: z.string().optional(),
});

export const updateTagSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
    color: z.string().optional(),
});
