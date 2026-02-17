import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  UserType,
  LoginCredentials,
  StaffLoginCredentials,
  login as authServiceLogin,
  getCurrentUser as authServiceGetCurrentUser,
} from '../services/authService';
import { storeTokens, clearTokens, hasValidToken } from '../utils/tokenManager';

/**
 * Auth Context Type Definition
 */
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (userType: UserType, credentials: LoginCredentials | StaffLoginCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

/**
 * Create Auth Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Provider Component
 * Manages global authentication state
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = user !== null;

  /**
   * Fetch current user from API
   */
  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authServiceGetCurrentUser();

      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // Failed to get user - clear auth state
        setUser(null);
        clearTokens();
      }
    } catch (err: any) {
      console.error('Failed to fetch user:', err);
      setUser(null);
      clearTokens();
      setError(err.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initialize auth state on mount
   * Check if user has valid token and fetch user profile
   */
  useEffect(() => {
    const initAuth = async () => {
      if (hasValidToken()) {
        await refreshUser();
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, [refreshUser]);

  /**
   * Login function
   * Calls appropriate login endpoint based on user type
   */
  const login = async (
    userType: UserType,
    credentials: LoginCredentials | StaffLoginCredentials
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authServiceLogin(userType, credentials);

      if (response.success && response.data) {
        // Store tokens
        const { accessToken, refreshToken, expiresIn, user: userData } = response.data;
        storeTokens(accessToken, refreshToken, expiresIn);

        // Set user in state
        setUser(userData);
      } else {
        // Login failed
        const errorMessage = response.error?.message || 'Login failed. Please try again.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout function
   * Clears tokens and user state
   */
  const logout = () => {
    clearTokens();
    setUser(null);
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use Auth Context
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * Export context for advanced use cases
 */
export { AuthContext };
