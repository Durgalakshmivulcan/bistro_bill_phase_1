/**
 * Token Manager
 * Handles storage and retrieval of authentication tokens
 */

const ACCESS_TOKEN_KEY = 'authToken'; // Keep existing key for compatibility
const REFRESH_TOKEN_KEY = 'refreshToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

/**
 * Store access token in localStorage
 */
export function setAccessToken(token: string): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to store access token:', error);
  }
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to retrieve access token:', error);
    return null;
  }
}

/**
 * Store refresh token in localStorage
 */
export function setRefreshToken(token: string): void {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to store refresh token:', error);
  }
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to retrieve refresh token:', error);
    return null;
  }
}

/**
 * Store token expiry time in localStorage
 * @param expiresIn - Expiry time in seconds
 */
export function setTokenExpiry(expiresIn: number): void {
  try {
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  } catch (error) {
    console.error('Failed to store token expiry:', error);
  }
}

/**
 * Get token expiry time from localStorage
 * @returns Expiry timestamp in milliseconds, or null if not set
 */
export function getTokenExpiry(): number | null {
  try {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
  } catch (error) {
    console.error('Failed to retrieve token expiry:', error);
    return null;
  }
}

/**
 * Check if the access token is expired
 * @returns true if token is expired or missing, false otherwise
 */
export function isTokenExpired(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) {
    return true;
  }
  // Add 30 second buffer to refresh before actual expiry
  return Date.now() >= expiry - 30000;
}

/**
 * Store all authentication tokens
 */
export function storeTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): void {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
  setTokenExpiry(expiresIn);
}

/**
 * Clear all authentication tokens from localStorage
 */
export function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch (error) {
    console.error('Failed to clear tokens:', error);
  }
}

/**
 * Check if user has valid tokens
 * @returns true if access token exists (doesn't check expiry)
 */
export function hasValidToken(): boolean {
  const token = getAccessToken();
  return token !== null && token !== '';
}
