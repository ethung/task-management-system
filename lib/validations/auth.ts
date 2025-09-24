import { z } from "zod";

import { VALIDATION_MESSAGES } from "@/lib/constants";

// Enhanced password validation with security requirements
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must be less than 128 characters")
  .refine((password) => /[A-Z]/.test(password), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((password) => /[a-z]/.test(password), {
    message: "Password must contain at least one lowercase letter",
  })
  .refine((password) => /\d/.test(password), {
    message: "Password must contain at least one number",
  })
  .refine((password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), {
    message: "Password must contain at least one special character",
  });

export const loginSchema = z.object({
  email: z.string().email(VALIDATION_MESSAGES.EMAIL_INVALID),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, VALIDATION_MESSAGES.NAME_MIN_LENGTH)
      .max(50, VALIDATION_MESSAGES.NAME_MAX_LENGTH)
      .optional(),
    email: z.string().email(VALIDATION_MESSAGES.EMAIL_INVALID),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email(VALIDATION_MESSAGES.EMAIL_INVALID),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, VALIDATION_MESSAGES.NAME_MIN_LENGTH)
    .max(50, VALIDATION_MESSAGES.NAME_MAX_LENGTH)
    .optional(),
  email: z.string().email(VALIDATION_MESSAGES.EMAIL_INVALID).optional(),
  timezone: z.string().optional(),
  preferences: z.record(z.string(), z.any()).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
