import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcryptjs
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password to compare against
 * @returns True if passwords match, false otherwise
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a secure random reset token
 * @returns Object with plain token (to send to user) and hashed token (to store in DB)
 */
export async function generateResetToken(): Promise<{
  plainToken: string;
  hashedToken: string;
}> {
  // Generate a 32-byte random token
  const plainToken = crypto.randomBytes(32).toString('hex');
  // Hash the token before storing in database
  const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
  return { plainToken, hashedToken };
}

/**
 * Hash a reset token for comparison
 * @param plainToken - Plain text token received from user
 * @returns Hashed token
 */
export function hashResetToken(plainToken: string): string {
  return crypto.createHash('sha256').update(plainToken).digest('hex');
}

/**
 * Generate reset token expiry time (1 hour from now)
 * @returns Date object representing expiry time
 */
export function getResetTokenExpiry(): Date {
  return new Date(Date.now() + 60 * 60 * 1000); // 1 hour
}
