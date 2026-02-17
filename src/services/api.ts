import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getAccessToken, getRefreshToken, clearTokens, storeTokens, isTokenExpired } from '../utils/tokenManager';
import { getSelectedBoId } from './saReportContext';

/**
 * API Service Foundation
 * Centralized HTTP client configuration for all API calls
 */

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Helper function to add subscribers waiting for token refresh
 */
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

/**
 * Helper function to notify all subscribers when token is refreshed
 */
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * Request interceptor
 * Adds authentication token to all requests
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get token from tokenManager
    const token = getAccessToken();

    // Check if token is expired and refresh if needed (except for refresh endpoint)
    if (token && isTokenExpired() && !config.url?.includes('/auth/refresh')) {
      // Token is expired, attempt refresh before making request
      const refreshToken = getRefreshToken();
      if (refreshToken && !isRefreshing) {
        isRefreshing = true;
        try {
          const refreshResponse = await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api/v1'}/auth/refresh`,
            { refreshToken }
          );

          if (refreshResponse.data.success) {
            const { accessToken, refreshToken: newRefreshToken, expiresIn } = refreshResponse.data.data;
            storeTokens(accessToken, newRefreshToken, expiresIn);
            onTokenRefreshed(accessToken);

            if (config.headers) {
              config.headers.Authorization = `Bearer ${accessToken}`;
            }
          }
        } catch (error) {
          // Refresh failed, clear tokens and redirect to login
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }
    } else if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * SA BO Override interceptor
 * When a SuperAdmin has selected a Business Owner, append boId to report/dashboard requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const boId = getSelectedBoId();
    if (boId && config.url && (config.url.includes('/reports/') || config.url.includes('/dashboard/'))) {
      config.params = { ...config.params, boId };
    }
    return config;
  }
);

/**
 * Response interceptor
 * Handles common response scenarios and errors with automatic token refresh on 401
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return the response data directly
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // Handle common error scenarios
    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 401:
          // Unauthorized - attempt token refresh if not already tried
          if (!originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
            originalRequest._retry = true;

            const refreshToken = getRefreshToken();

            if (refreshToken) {
              if (isRefreshing) {
                // Wait for token refresh to complete
                return new Promise((resolve) => {
                  subscribeTokenRefresh((token: string) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    resolve(apiClient(originalRequest));
                  });
                });
              }

              isRefreshing = true;

              try {
                const refreshResponse = await axios.post(
                  `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api/v1'}/auth/refresh`,
                  { refreshToken }
                );

                if (refreshResponse.data.success) {
                  const { accessToken, refreshToken: newRefreshToken, expiresIn } = refreshResponse.data.data;
                  storeTokens(accessToken, newRefreshToken, expiresIn);
                  onTokenRefreshed(accessToken);

                  // Retry original request with new token
                  originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                  return apiClient(originalRequest);
                }
              } catch (refreshError) {
                // Refresh failed - clear tokens and redirect to login
                clearTokens();
                window.location.href = '/login';
                return Promise.reject(refreshError);
              } finally {
                isRefreshing = false;
              }
            } else {
              // No refresh token available - redirect to login
              clearTokens();
              window.location.href = '/login';
            }
          } else {
            // Already retried or refresh failed - clear tokens and redirect
            clearTokens();
            window.location.href = '/login';
          }
          break;
        case 403:
          // Forbidden
          console.error('Access forbidden:', error.response.data);
          break;
        case 404:
          // Not found
          console.error('Resource not found:', error.response.data);
          break;
        case 500:
          // Server error
          console.error('Server error:', error.response.data);
          break;
        default:
          console.error('API error:', error.response.data);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error: No response received', error.request);
    } else {
      // Error in request setup
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Generic API error handler wrapper
 * Wraps API calls with consistent error handling
 */
export async function handleApiCall<T>(
  apiCall: () => Promise<AxiosResponse<T>>
): Promise<T> {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const responseData = axiosError.response?.data as any;
      const errorMessage =
        responseData?.message ||
        responseData?.error?.message ||
        (typeof responseData?.error === 'string' ? responseData.error : null) ||
        axiosError.message ||
        'An unexpected error occurred';

      throw new Error(errorMessage);
    }
    throw error;
  }
}

/**
 * API helper functions
 */
export const api = {
  /**
   * GET request
   */
  get: async <T>(url: string, config = {}): Promise<T> => {
    return handleApiCall(() => apiClient.get<T>(url, config));
  },

  /**
   * POST request
   */
  post: async <T>(url: string, data?: unknown, config = {}): Promise<T> => {
    return handleApiCall(() => apiClient.post<T>(url, data, config));
  },

  /**
   * PUT request
   */
  put: async <T>(url: string, data?: unknown, config = {}): Promise<T> => {
    return handleApiCall(() => apiClient.put<T>(url, data, config));
  },

  /**
   * PATCH request
   */
  patch: async <T>(url: string, data?: unknown, config = {}): Promise<T> => {
    return handleApiCall(() => apiClient.patch<T>(url, data, config));
  },

  /**
   * DELETE request
   */
  delete: async <T>(url: string, config = {}): Promise<T> => {
    return handleApiCall(() => apiClient.delete<T>(url, config));
  },
};

export default apiClient;
