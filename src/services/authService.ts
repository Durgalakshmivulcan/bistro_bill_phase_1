import { api } from './api';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

// ============================================
// Type Definitions
// ============================================

export interface ChangePasswordResponse {
  message: string;
}

export const changePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<ApiResponse<ChangePasswordResponse>> => {
  try {
    const response = await api.post<ApiResponse<ChangePasswordResponse>>(
      "/auth/change-password",
      {
        oldPassword,
        newPassword,
      }
    );

    return response;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || "CHANGE_PASSWORD_FAILED",
        message: error.message || "Failed to change password.",
      },
    };
  }
};
export type UserType = 'SuperAdmin' | 'BusinessOwner' | 'Staff';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface StaffLoginCredentials extends LoginCredentials {
  branchId: string;
}

export interface SuperAdminUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  userType: 'SuperAdmin';
  createdAt: Date;
}

export interface BusinessOwnerUser {
  id: string;
  email: string;
  ownerName: string;
  restaurantName: string;
  phone: string;
  businessType: string;
  avatar: string | null;
  userType: 'BusinessOwner';
  status: string;
  createdAt: Date;
  branches: {
    id: string;
    name: string;
    code: string | null;
    isMainBranch: boolean;
    status: string;
  }[];
  plan: {
    id: string;
    name: string;
    price: unknown;
    maxBranches: number;
    features: unknown;
    subscriptionStartDate: Date | null;
    subscriptionEndDate: Date | null;
  } | null;
}

export interface StaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  userType: 'Staff';
  status: string;
  createdAt: Date;
  branch: {
    id: string;
    name: string;
    code: string | null;
    isMainBranch: boolean;
    status: string;
  };
  role: {
    id: string;
    name: string;
    permissions: unknown;
    status: string;
  };
  businessOwner: {
    id: string;
    restaurantName: string;
  };
}

export type User = SuperAdminUser | BusinessOwnerUser | StaffUser;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse<T extends User = User> {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: T;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

export interface ForgotPasswordRequest {
  email: string;
  userType: UserType;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ============================================
// Authentication Functions
// ============================================

/**
 * Super Admin Login
 * POST /api/v1/auth/super-admin/login
 */
export async function superAdminLogin(
  credentials: LoginCredentials
): Promise<ApiResponse<LoginResponse<SuperAdminUser>>> {
  try {
    const response = await api.post<ApiResponse<LoginResponse<SuperAdminUser>>>(
      '/auth/super-admin/login',
      credentials
    );
    return response;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'LOGIN_FAILED',
        message: error.message || 'Failed to login. Please try again.',
      },
    };
  }
}

/**
 * Business Owner Login
 * POST /api/v1/auth/business-owner/login
 */
export async function businessOwnerLogin(
  credentials: LoginCredentials
): Promise<ApiResponse<LoginResponse<BusinessOwnerUser>>> {
  try {
    const response = await api.post<ApiResponse<LoginResponse<BusinessOwnerUser>>>(
      '/auth/business-owner/login',
      credentials
    );
    return response;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'LOGIN_FAILED',
        message: error.message || 'Failed to login. Please try again.',
      },
    };
  }
}

/**
 * Staff Login
 * POST /api/v1/auth/staff/login
 */
export async function staffLogin(
  credentials: StaffLoginCredentials
): Promise<ApiResponse<LoginResponse<StaffUser>>> {
  try {
    const response = await api.post<ApiResponse<LoginResponse<StaffUser>>>(
      '/auth/staff/login',
      credentials
    );
    return response;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'LOGIN_FAILED',
        message: error.message || 'Failed to login. Please try again.',
      },
    };
  }
}

/**
 * Generic login function that routes to appropriate endpoint based on user type
 */
export async function login(
  userType: UserType,
  credentials: LoginCredentials | StaffLoginCredentials
): Promise<ApiResponse<LoginResponse>> {
  switch (userType) {
    case 'SuperAdmin':
      return superAdminLogin(credentials as LoginCredentials);
    case 'BusinessOwner':
      return businessOwnerLogin(credentials as LoginCredentials);
    case 'Staff':
      return staffLogin(credentials as StaffLoginCredentials);
    default:
      return {
        success: false,
        error: {
          code: 'INVALID_USER_TYPE',
          message: 'Invalid user type specified',
        },
      };
  }
}

/**
 * Get Current User Profile
 * GET /api/v1/auth/me
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  try {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'FETCH_USER_FAILED',
        message: error.message || 'Failed to fetch user profile.',
      },
    };
  }
}

/**
 * Refresh Access Token
 * POST /api/v1/auth/refresh
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<ApiResponse<AuthTokens>> {
  try {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/refresh', {
      refreshToken,
    });
    return response;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'REFRESH_FAILED',
        message: error.message || 'Failed to refresh token.',
      },
    };
  }
}

/**
 * Logout (client-side only - clears tokens)
 */
export function logout(): void {
  // Token clearing is handled by tokenManager
  // This function exists for consistency and future server-side logout if needed
}

/**
 * Forgot Password
 * POST /api/v1/auth/forgot-password
 */
export async function forgotPassword(
  data: ForgotPasswordRequest
): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await api.post<ApiResponse<{ message: string }>>(
      '/auth/forgot-password',
      data
    );
    return response;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'FORGOT_PASSWORD_FAILED',
        message: error.message || 'Failed to process password reset request.',
      },
    };
  }
}

/**
 * Reset Password
 * POST /api/v1/auth/reset-password
 */
export async function resetPassword(
  data: ResetPasswordRequest
): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await api.post<ApiResponse<{ message: string }>>(
      '/auth/reset-password',
      data
    );
    return response;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'RESET_PASSWORD_FAILED',
        message: error.message || 'Failed to reset password.',
      },
    };
  }
}
