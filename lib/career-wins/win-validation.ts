import { z } from "zod";

export const createWinSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z.string().optional(),
  date: z.string().transform((str) => new Date(str)),
  tags: z.array(z.string()).optional().default([]),
  category: z.string().min(1).max(100).optional(),
  framework: z.string().min(1).max(100).optional(),
  visibility: z.enum(["PRIVATE", "PUBLIC"]).optional().default("PRIVATE"),
});

export const updateWinSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  description: z.string().optional(),
  date: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().min(1).max(100).optional(),
  framework: z.string().min(1).max(100).optional(),
  visibility: z.enum(["PRIVATE", "PUBLIC"]).optional(),
});

export type CreateWinInput = z.infer<typeof createWinSchema>;
export type UpdateWinInput = z.infer<typeof updateWinSchema>;
