import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse, AxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, clearTokens, storeTokens, isTokenExpired } from '../utils/tokenManager';
import { getSelectedBoId } from './saReportContext';

// Fallback: read persisted tenant selection (used by some screens)
function getPersistedTenantId(): string | null {
  return (
    getSelectedBoId() ||
    localStorage.getItem('selectedBoId') ||
    localStorage.getItem('selectedTenantId') ||
    sessionStorage.getItem('selectedBoId') ||
    sessionStorage.getItem('selectedTenantId') ||
    null
  );
}


/**
 * API Service Foundation
 * Centralized HTTP client configuration for all API calls
 */

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const rawBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api/v1';
const normalizedBaseUrl = rawBaseUrl.endsWith('/api/v1')
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/$/, '')}/api/v1`;

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: normalizedBaseUrl,
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
          const refreshResponse = await axios.post(`${normalizedBaseUrl}/auth/refresh`, { refreshToken });

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
    const boId = getPersistedTenantId();
    if (!boId || !config.url) {
      return config;
    }

    // Apply tenant hints broadly for SuperAdmin impersonation so create/update works (taxes, tax-groups, etc.)
    config.params = { ...config.params, boId, tenantId: boId };
    config.headers = config.headers ?? {};
    config.headers['x-tenant-id'] = boId;
    config.headers['x-business-owner-id'] = boId;
    config.headers['x-bo-id'] = boId;

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
                const refreshResponse = await axios.post(`${normalizedBaseUrl}/auth/refresh`, { refreshToken });

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
          console.error('Server error:', {
            method: originalRequest?.method,
            url: originalRequest?.url,
            status: error.response.status,
            data: error.response.data,
          });
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
  get: async <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  },

  post: async <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  },

  put: async <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  },

  patch: async <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  },

  delete: async <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  },
};

export default apiClient;
