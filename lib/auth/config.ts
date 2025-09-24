/**
 * Authentication configuration and constants
 */

export const AUTH_CONFIG = {
  // JWT Configuration
  JWT_SECRET: process.env["JWT_SECRET"] || "dev-jwt-secret",
  JWT_REFRESH_SECRET: process.env["JWT_REFRESH_SECRET"] || "dev-jwt-refresh-secret",
  JWT_ALGORITHM: "HS256" as const,

  // Session timeouts
  SESSION_TIMEOUT: process.env["SESSION_TIMEOUT"] || "24h",
  REMEMBER_ME_TIMEOUT: process.env["REMEMBER_ME_TIMEOUT"] || "30d",

  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIREMENTS: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },

  // Security settings
  BCRYPT_ROUNDS: parseInt(process.env["BCRYPT_ROUNDS"] || "12"),
  MAX_FAILED_ATTEMPTS: parseInt(process.env["MAX_FAILED_ATTEMPTS"] || "5"),
  LOCKOUT_DURATION: process.env["LOCKOUT_DURATION"] || "15m",

  // Token expiration
  EMAIL_VERIFICATION_EXPIRES: "24h",
  PASSWORD_RESET_EXPIRES: "1h",

  // Email configuration
  SMTP: {
    host: process.env["SMTP_HOST"] || "smtp.ethereal.email",
    port: parseInt(process.env["SMTP_PORT"] || "587"),
    secure: false,
    auth: {
      user: process.env["SMTP_USER"],
      pass: process.env["SMTP_PASS"],
    },
  },

  EMAIL_FROM: process.env["SMTP_FROM"] || "noreply@plannerproject.local",

  // URLs
  BASE_URL: process.env["NEXTAUTH_URL"] || "http://localhost:3000",
} as const;

/**
 * Authentication error codes
 */
export const AUTH_ERRORS = {
  // Registration errors
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  INVALID_EMAIL: "INVALID_EMAIL",
  WEAK_PASSWORD: "WEAK_PASSWORD",

  // Login errors
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",

  // Token errors
  INVALID_TOKEN: "INVALID_TOKEN",
  EXPIRED_TOKEN: "EXPIRED_TOKEN",
  TOKEN_NOT_FOUND: "TOKEN_NOT_FOUND",

  // Session errors
  INVALID_SESSION: "INVALID_SESSION",
  SESSION_EXPIRED: "SESSION_EXPIRED",

  // General errors
  USER_NOT_FOUND: "USER_NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

export type AuthError = typeof AUTH_ERRORS[keyof typeof AUTH_ERRORS];