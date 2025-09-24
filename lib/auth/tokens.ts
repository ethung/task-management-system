/**
 * JWT token generation and validation utilities
 */

import jwt from "jsonwebtoken";
import { AUTH_CONFIG, AUTH_ERRORS } from "./config";

export interface JWTPayload {
  userId: string;
  email: string;
  sessionId?: string;
  type: "access" | "refresh";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generates an access token
 */
export function generateAccessToken(payload: Omit<JWTPayload, "type">): string {
  const tokenPayload = { ...payload, type: "access" as const };

  return jwt.sign(
    tokenPayload,
    AUTH_CONFIG.JWT_SECRET,
    {
      expiresIn: AUTH_CONFIG.SESSION_TIMEOUT,
      algorithm: "HS256",
      issuer: "plannerproject",
      audience: "plannerproject-users",
    }
  );
}

/**
 * Generates a refresh token
 */
export function generateRefreshToken(payload: Omit<JWTPayload, "type">): string {
  const tokenPayload = { ...payload, type: "refresh" as const };

  return jwt.sign(
    tokenPayload,
    AUTH_CONFIG.JWT_REFRESH_SECRET,
    {
      expiresIn: AUTH_CONFIG.REMEMBER_ME_TIMEOUT,
      algorithm: "HS256",
      issuer: "plannerproject",
      audience: "plannerproject-users",
    }
  );
}

/**
 * Generates both access and refresh tokens
 */
export function generateTokenPair(payload: Omit<JWTPayload, "type">): TokenPair {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Calculate expiration time for access token
  const decoded = jwt.decode(accessToken) as any;
  const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Verifies and decodes an access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const payload = jwt.verify(token, AUTH_CONFIG.JWT_SECRET, {
      algorithms: [AUTH_CONFIG.JWT_ALGORITHM as jwt.Algorithm],
      issuer: "plannerproject",
      audience: "plannerproject-users",
    }) as JWTPayload;

    if (payload.type !== "access") {
      throw new Error("Invalid token type");
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error(AUTH_ERRORS.EXPIRED_TOKEN);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error(AUTH_ERRORS.INVALID_TOKEN);
    }
    throw error;
  }
}

/**
 * Verifies and decodes a refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const payload = jwt.verify(token, AUTH_CONFIG.JWT_REFRESH_SECRET, {
      algorithms: [AUTH_CONFIG.JWT_ALGORITHM as jwt.Algorithm],
      issuer: "plannerproject",
      audience: "plannerproject-users",
    }) as JWTPayload;

    if (payload.type !== "refresh") {
      throw new Error("Invalid token type");
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error(AUTH_ERRORS.EXPIRED_TOKEN);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error(AUTH_ERRORS.INVALID_TOKEN);
    }
    throw error;
  }
}

/**
 * Generates a secure random token for email verification or password reset
 */
export function generateSecureToken(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 64; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Calculates expiration date for tokens
 */
export function getTokenExpiration(duration: string): Date {
  const now = new Date();

  if (duration.endsWith("h")) {
    const hours = parseInt(duration.slice(0, -1));
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  if (duration.endsWith("d")) {
    const days = parseInt(duration.slice(0, -1));
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  if (duration.endsWith("m")) {
    const minutes = parseInt(duration.slice(0, -1));
    return new Date(now.getTime() + minutes * 60 * 1000);
  }

  // Default to 24 hours
  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}