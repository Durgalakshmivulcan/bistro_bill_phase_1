import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { verifyToken } from '../utils/jwt';

/**
 * Authentication middleware that verifies JWT tokens from Authorization header
 * and attaches decoded user information to the request object.
 *
 * Expected header format: Authorization: Bearer <token>
 *
 * On success: Attaches user to req.user with userId, userType, businessOwnerId, branchId, email
 * On failure: Returns 401 Unauthorized with appropriate error message
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Get the Authorization header
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists
  if (!authHeader) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Authorization header is required',
      },
    };
    res.status(401).json(response);
    return;
  }

  // Check if it's a Bearer token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INVALID_TOKEN_FORMAT',
        message: 'Authorization header must be in format: Bearer <token>',
      },
    };
    res.status(401).json(response);
    return;
  }

  const token = parts[1];

  // Verify the token
  const result = verifyToken(token);

  if (!result.valid) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: result.error,
        message: result.message,
      },
    };
    res.status(401).json(response);
    return;
  }

  // Attach user to request
  req.user = {
    id: result.payload.userId,
    email: result.payload.email,
    userType: result.payload.userType,
    businessOwnerId: result.payload.businessOwnerId,
    branchId: result.payload.branchId,
  };

  next();
}

/**
 * Optional authentication middleware that does not fail if no token is provided,
 * but still validates the token if present.
 * Useful for endpoints that behave differently for authenticated vs anonymous users.
 */
export function optionalAuthenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  // If no Authorization header, continue without user
  if (!authHeader) {
    next();
    return;
  }

  // Check if it's a Bearer token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    // Invalid format but optional, so continue without user
    next();
    return;
  }

  const token = parts[1];

  // Verify the token
  const result = verifyToken(token);

  if (result.valid) {
    // Attach user to request if token is valid
    req.user = {
      id: result.payload.userId,
      email: result.payload.email,
      userType: result.payload.userType,
      businessOwnerId: result.payload.businessOwnerId,
      branchId: result.payload.branchId,
    };
  }

  next();
}

/**
 * Middleware that requires specific user types.
 * Use after authenticate middleware.
 *
 * @param allowedUserTypes - Array of user types allowed to access the route
 */
export function requireUserType(...allowedUserTypes: Array<'SuperAdmin' | 'BusinessOwner' | 'Staff'>) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    // Check if user is authenticated
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required',
        },
      };
      res.status(401).json(response);
      return;
    }

    // Check if user type is allowed
    if (!allowedUserTypes.includes(req.user.userType)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
        },
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
}
