import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().url(),
  DATABASE_URL_NON_POOLING: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  FEATURE_ANALYTICS_ENABLED: z.coerce.boolean().default(false),
  FEATURE_EMAIL_NOTIFICATIONS: z.coerce.boolean().default(false),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  // Skip validation during build time (Next.js static generation)
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    // During build, return safe defaults
    return {
      NODE_ENV: "production" as const,
      DATABASE_URL: "postgresql://placeholder",
      DATABASE_URL_NON_POOLING: undefined,
      REDIS_URL: undefined,
      JWT_SECRET: "placeholder",
      NEXTAUTH_SECRET: "placeholder",
      NEXTAUTH_URL: "https://placeholder.com",
      PORT: 3000,
      FEATURE_ANALYTICS_ENABLED: false,
      FEATURE_EMAIL_NOTIFICATIONS: false,
    };
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    throw new Error("Invalid environment variables");
  }

  return result.data;
}

export const env = validateEnv();
