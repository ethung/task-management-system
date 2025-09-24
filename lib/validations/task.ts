import { z } from "zod";

import { TASK_PRIORITIES } from "@/lib/constants";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Task title must be less than 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  priority: z
    .enum([TASK_PRIORITIES.LOW, TASK_PRIORITIES.MEDIUM, TASK_PRIORITIES.HIGH])
    .default(TASK_PRIORITIES.MEDIUM),
  dueDate: z.coerce.date().optional(),
  projectId: z.string().uuid().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  completed: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
