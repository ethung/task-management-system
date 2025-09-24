/**
 * Authentication library exports
 */

export * from "./config";
export * from "./password";
export * from "./tokens";
export * from "./email";
export * from "./service";

// Re-export commonly used types and functions
export type { JWTPayload, TokenPair } from "./tokens";
export type { RegisterUserData, LoginUserData, AuthResult } from "./service";
export { AUTH_CONFIG, AUTH_ERRORS, type AuthError } from "./config";
export {
  validatePassword,
  hashPassword,
  verifyPassword,
  generateSecurePassword,
} from "./password";
export {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  generateSecureToken,
  getTokenExpiration,
} from "./tokens";
export {
  sendEmail,
  sendEmailVerification,
  sendPasswordReset,
  sendPasswordChanged,
  EMAIL_TEMPLATES,
} from "./email";
export {
  registerUser,
  loginUser,
  verifyEmail,
  initiatePasswordReset,
  resetPassword,
} from "./service";