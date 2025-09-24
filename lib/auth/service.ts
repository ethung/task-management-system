/**
 * Authentication service with core business logic
 */

import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "./password";
import { generateTokenPair, generateSecureToken, getTokenExpiration, TokenPair } from "./tokens";
import { sendEmailVerification, sendPasswordReset, sendPasswordChanged } from "./email";
import { AUTH_CONFIG, AUTH_ERRORS, type AuthError } from "./config";

export interface RegisterUserData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginUserData {
  email: string;
  password: string;
  rememberMe?: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
    emailVerified: boolean;
  };
  tokens?: TokenPair;
  sessionId?: string;
  error?: AuthError;
  message?: string;
}

/**
 * Registers a new user
 */
export async function registerUser(data: RegisterUserData): Promise<AuthResult> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      return {
        success: false,
        error: AUTH_ERRORS.EMAIL_ALREADY_EXISTS,
        message: "An account with this email already exists",
      };
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name || null,
        emailVerified: false,
      },
    });

    // Generate email verification token
    const verificationToken = generateSecureToken();
    await prisma.emailVerificationToken.create({
      data: {
        token: verificationToken,
        userId: user.id,
        expiresAt: getTokenExpiration(AUTH_CONFIG.EMAIL_VERIFICATION_EXPIRES),
      },
    });

    // Send verification email
    try {
      await sendEmailVerification(user.email, verificationToken, user.name || undefined);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail registration if email fails
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      message: "Registration successful. Please check your email to verify your account.",
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: AUTH_ERRORS.INVALID_EMAIL,
      message: "Registration failed",
    };
  }
}

/**
 * Authenticates a user and creates a session
 */
export async function loginUser(data: LoginUserData): Promise<AuthResult> {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      // Track failed attempt even without user
      if (data.ipAddress) {
        await trackFailedLoginAttempt(null, data.email, data.ipAddress, data.userAgent);
      }

      return {
        success: false,
        error: AUTH_ERRORS.INVALID_CREDENTIALS,
        message: "Invalid email or password",
      };
    }

    // Check if account is locked
    const isLocked = await isAccountLocked(user.id);
    if (isLocked) {
      return {
        success: false,
        error: AUTH_ERRORS.ACCOUNT_LOCKED,
        message: "Account temporarily locked due to too many failed login attempts",
      };
    }

    // Verify password
    const isPasswordValid = await verifyPassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      // Track failed attempt
      if (data.ipAddress) {
        await trackFailedLoginAttempt(user.id, data.email, data.ipAddress, data.userAgent);
      }

      return {
        success: false,
        error: AUTH_ERRORS.INVALID_CREDENTIALS,
        message: "Invalid email or password",
      };
    }

    // Check email verification
    if (!user.emailVerified) {
      return {
        success: false,
        error: AUTH_ERRORS.EMAIL_NOT_VERIFIED,
        message: "Please verify your email address before logging in",
      };
    }

    // Clear any failed login attempts
    await clearFailedLoginAttempts(user.id);

    // Create session
    const sessionId = generateSecureToken();
    const refreshToken = generateSecureToken();

    const session = await prisma.userSession.create({
      data: {
        sessionId,
        userId: user.id,
        refreshToken,
        expiresAt: getTokenExpiration(
          data.rememberMe ? AUTH_CONFIG.REMEMBER_ME_TIMEOUT : AUTH_CONFIG.SESSION_TIMEOUT
        ),
        ipAddress: data.ipAddress || "unknown",
        userAgent: data.userAgent || null,
        rememberMe: data.rememberMe || false,
      },
    });

    // Generate JWT tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      sessionId: session.sessionId,
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      tokens,
      sessionId: session.sessionId,
      message: "Login successful",
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: AUTH_ERRORS.INVALID_CREDENTIALS,
      message: "Login failed",
    };
  }
}

/**
 * Verifies an email address
 */
export async function verifyEmail(token: string): Promise<AuthResult> {
  try {
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      return {
        success: false,
        error: AUTH_ERRORS.TOKEN_NOT_FOUND,
        message: "Invalid verification token",
      };
    }

    if (verificationToken.expiresAt < new Date()) {
      return {
        success: false,
        error: AUTH_ERRORS.EXPIRED_TOKEN,
        message: "Verification token has expired",
      };
    }

    // Update user as verified
    const user = await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    // Delete the verification token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      message: "Email verified successfully",
    };
  } catch (error) {
    console.error("Email verification error:", error);
    return {
      success: false,
      error: AUTH_ERRORS.INVALID_TOKEN,
      message: "Email verification failed",
    };
  }
}

/**
 * Initiates password reset process
 */
export async function initiatePasswordReset(email: string): Promise<AuthResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        success: true,
        message: "If an account with this email exists, a password reset link has been sent",
      };
    }

    // Invalidate any existing reset tokens
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: { used: true },
    });

    // Create new reset token
    const resetToken = generateSecureToken();
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: getTokenExpiration(AUTH_CONFIG.PASSWORD_RESET_EXPIRES),
      },
    });

    // Send password reset email
    try {
      await sendPasswordReset(user.email, resetToken, user.name || undefined);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
    }

    return {
      success: true,
      message: "If an account with this email exists, a password reset link has been sent",
    };
  } catch (error) {
    console.error("Password reset initiation error:", error);
    return {
      success: true,
      message: "If an account with this email exists, a password reset link has been sent",
    };
  }
}

/**
 * Completes password reset
 */
export async function resetPassword(token: string, newPassword: string): Promise<AuthResult> {
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.used) {
      return {
        success: false,
        error: AUTH_ERRORS.TOKEN_NOT_FOUND,
        message: "Invalid or expired reset token",
      };
    }

    if (resetToken.expiresAt < new Date()) {
      return {
        success: false,
        error: AUTH_ERRORS.EXPIRED_TOKEN,
        message: "Reset token has expired",
      };
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    const user = await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Invalidate all user sessions
    await prisma.userSession.deleteMany({
      where: { userId: user.id },
    });

    // Send confirmation email
    try {
      await sendPasswordChanged(user.email, user.name || undefined);
    } catch (emailError) {
      console.error("Failed to send password changed email:", emailError);
    }

    return {
      success: true,
      message: "Password reset successfully",
    };
  } catch (error) {
    console.error("Password reset error:", error);
    return {
      success: false,
      error: AUTH_ERRORS.INVALID_TOKEN,
      message: "Password reset failed",
    };
  }
}

/**
 * Tracks a failed login attempt
 */
async function trackFailedLoginAttempt(
  userId: string | null,
  email: string,
  ipAddress: string,
  userAgent?: string
): Promise<void> {
  await prisma.failedLoginAttempt.create({
    data: {
      userId,
      email: email.toLowerCase(),
      ipAddress,
      userAgent: userAgent || null,
    },
  });
}

/**
 * Checks if an account is locked due to too many failed attempts
 */
async function isAccountLocked(userId: string): Promise<boolean> {
  const lockoutThreshold = new Date(Date.now() - parseDuration(AUTH_CONFIG.LOCKOUT_DURATION));

  const recentFailedAttempts = await prisma.failedLoginAttempt.count({
    where: {
      userId,
      createdAt: { gte: lockoutThreshold },
    },
  });

  return recentFailedAttempts >= AUTH_CONFIG.MAX_FAILED_ATTEMPTS;
}

/**
 * Clears failed login attempts for a user
 */
async function clearFailedLoginAttempts(userId: string): Promise<void> {
  await prisma.failedLoginAttempt.deleteMany({
    where: { userId },
  });
}

/**
 * Changes user password
 */
export async function changePassword(data: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<AuthResult> {
  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      return {
        success: false,
        error: AUTH_ERRORS.USER_NOT_FOUND,
        message: "User not found",
      };
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(data.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return {
        success: false,
        error: AUTH_ERRORS.INVALID_CREDENTIALS,
        message: "Current password is incorrect",
      };
    }

    // Hash new password
    const newPasswordHash = await hashPassword(data.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: data.userId },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all user sessions except current one
    await prisma.userSession.deleteMany({
      where: { userId: data.userId },
    });

    // Send password changed notification
    try {
      await sendPasswordChanged(user.email, user.name || undefined);
    } catch (emailError) {
      console.error("Failed to send password changed email:", emailError);
    }

    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error) {
    console.error("Password change error:", error);
    return {
      success: false,
      error: AUTH_ERRORS.INVALID_CREDENTIALS,
      message: "Password change failed",
    };
  }
}

/**
 * Parses duration string to milliseconds
 */
function parseDuration(duration: string): number {
  const value = parseInt(duration.slice(0, -1));
  const unit = duration.slice(-1);

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return value * 60 * 1000; // Default to minutes
  }
}