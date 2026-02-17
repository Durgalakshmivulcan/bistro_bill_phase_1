import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

// Token expiration times
const ACCESS_TOKEN_EXPIRES_IN = '24h'; // 24 hours
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7 days

// Get JWT secret from environment
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

function getRefreshTokenSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET or JWT_SECRET environment variable is not set');
  }
  return secret;
}

/**
 * Token payload structure
 */
export interface TokenPayload {
  userId: string;
  userType: 'SuperAdmin' | 'BusinessOwner' | 'Staff';
  businessOwnerId?: string; // Tenant context, undefined for SuperAdmin
  branchId?: string; // Branch context for Staff
  email: string;
}

/**
 * Decoded token structure (includes JWT standard claims)
 */
export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

/**
 * Token generation result
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Access token expiration in seconds
}

/**
 * Generate an access token
 * @param payload - Token payload containing user info
 * @returns JWT access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

/**
 * Generate a refresh token
 * @param payload - Token payload containing user info
 * @returns JWT refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, getRefreshTokenSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

/**
 * Generate both access and refresh tokens
 * @param payload - Token payload containing user info
 * @returns Token pair with access token, refresh token, and expiration
 */
export function generateToken(payload: TokenPayload): TokenPair {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    expiresIn: 24 * 60 * 60, // 24 hours in seconds
  };
}

/**
 * Verify result type
 */
export type VerifyResult =
  | { valid: true; payload: DecodedToken }
  | { valid: false; error: 'INVALID_TOKEN' | 'TOKEN_EXPIRED' | 'UNKNOWN_ERROR'; message: string };

/**
 * Verify an access token
 * @param token - JWT token to verify
 * @returns Verification result with payload or error
 */
export function verifyToken(token: string): VerifyResult {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as DecodedToken;
    return { valid: true, payload: decoded };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return { valid: false, error: 'TOKEN_EXPIRED', message: 'Token has expired' };
    }
    if (error instanceof JsonWebTokenError) {
      return { valid: false, error: 'INVALID_TOKEN', message: 'Invalid token' };
    }
    return { valid: false, error: 'UNKNOWN_ERROR', message: 'Token verification failed' };
  }
}

/**
 * Verify a refresh token
 * @param token - JWT refresh token to verify
 * @returns Verification result with payload or error
 */
export function verifyRefreshToken(token: string): VerifyResult {
  try {
    const decoded = jwt.verify(token, getRefreshTokenSecret()) as DecodedToken;
    return { valid: true, payload: decoded };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return { valid: false, error: 'TOKEN_EXPIRED', message: 'Refresh token has expired' };
    }
    if (error instanceof JsonWebTokenError) {
      return { valid: false, error: 'INVALID_TOKEN', message: 'Invalid refresh token' };
    }
    return { valid: false, error: 'UNKNOWN_ERROR', message: 'Refresh token verification failed' };
  }
}
