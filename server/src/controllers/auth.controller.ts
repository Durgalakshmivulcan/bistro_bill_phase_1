import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';
import { comparePassword, hashPassword, generateResetToken, getResetTokenExpiry, hashResetToken } from '../utils/password';
import { generateToken, verifyRefreshToken, TokenPayload } from '../utils/jwt';
import { AuditUserType } from '@prisma/client';

/**
 * Super Admin Login Response
 */
interface SuperAdminLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    userType: 'SuperAdmin';
    createdAt: Date;
  };
}
interface ChangePasswordResponse {
  message: string;
}
/**
 * POST /api/v1/auth/change-password
 * Change password for authenticated user
 */
export async function changePassword(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
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

    const { oldPassword, newPassword } = req.body;
    const { id, userType, businessOwnerId } = req.user;
console.log("Incoming oldPassword:", oldPassword);
console.log("Incoming newPassword:", newPassword);
console.log("User ID:", id);
console.log("UserType:", userType);
    // ✅ Validate input
    if (!oldPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Old password and new password are required',
        },
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 6 characters long',
        },
      });
      return;
    }

    let currentUser: any = null;
    let auditUserType: AuditUserType;

    // ================= FIND USER =================
    if (userType === 'SuperAdmin') {
      currentUser = await prisma.superAdmin.findUnique({ where: { id } });
      auditUserType = AuditUserType.SuperAdmin;
    } else if (userType === 'BusinessOwner') {
      currentUser = await prisma.businessOwner.findUnique({ where: { id } });
      auditUserType = AuditUserType.BusinessOwner;
    } else {
      currentUser = await prisma.staff.findUnique({ where: { id } });
      auditUserType = AuditUserType.Staff;
    }

    if (!currentUser) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    // ================= VERIFY OLD PASSWORD =================
   // 🔍 DEBUG — stored hash
console.log("Stored Hash:", currentUser.password);

// ================= VERIFY OLD PASSWORD =================
const isValid = await comparePassword(oldPassword, currentUser.password);
console.log("Compare Result:", isValid);

    if (!isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OLD_PASSWORD',
          message: 'Old password is incorrect',
        },
      });
      return;
    }

    // 🚫 prevent same password (nice UX)
    const isSamePassword = await comparePassword(newPassword, currentUser.password);
    if (isSamePassword) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SAME_PASSWORD',
          message: 'New password must be different from old password',
        },
      });
      return;
    }

    // ================= HASH NEW PASSWORD =================
    const hashedPassword = await hashPassword(newPassword);

    // ================= UPDATE =================
    if (userType === 'SuperAdmin') {
      await prisma.superAdmin.update({
        where: { id },
        data: { password: hashedPassword },
      });
    } else if (userType === 'BusinessOwner') {
      await prisma.businessOwner.update({
        where: { id },
        data: { password: hashedPassword },
      });
    } else {
      await prisma.staff.update({
        where: { id },
        data: { password: hashedPassword },
      });
    }

    // ================= AUDIT LOG =================
    await prisma.auditLog.create({
      data: {
        businessOwnerId: businessOwnerId || null,
        userId: id,
        userType: auditUserType,
        action: 'password_changed',
        entityType: userType,
        entityId: id,
        newValue: { changedAt: new Date().toISOString() },
        ipAddress: req.ip || req.socket?.remoteAddress || null,
      },
    });

    // ✅ SUCCESS
    const response: ApiResponse<ChangePasswordResponse> = {
      success: true,
      data: {
        message: 'Password changed successfully',
      },
      message: 'Password updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Change password error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to change password',
      },
    });
  }
}

/**
 * POST /api/v1/auth/super-admin/login
 * Authenticate super admin and return tokens
 */
export async function superAdminLogin(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Find super admin by email
  const superAdmin = await prisma.superAdmin.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!superAdmin) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    };
    res.status(401).json(response);
    return;
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, superAdmin.password);

  if (!isPasswordValid) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    };
    res.status(401).json(response);
    return;
  }

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: superAdmin.id,
    userType: 'SuperAdmin',
    email: superAdmin.email,
    // businessOwnerId is undefined for SuperAdmin (no tenant context)
  };

  const tokens = generateToken(tokenPayload);

  // Return success response
  const response: ApiResponse<SuperAdminLoginResponse> = {
    success: true,
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
        userType: 'SuperAdmin',
        createdAt: superAdmin.createdAt,
      },
    },
    message: 'Login successful',
  };

  res.status(200).json(response);
}

/**
 * Business Owner Registration Response
 */
interface BusinessOwnerRegisterResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    ownerName: string;
    restaurantName: string;
    phone: string;
    businessType: string;
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
    } | null;
  };
}

/**
 * POST /api/v1/auth/business-owner/register
 * Register a new business owner account
 */
export async function businessOwnerRegister(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { email, password, ownerName, restaurantName, phone, businessType } = req.body;

  // Validate required fields
  const requiredFields = ['email', 'password', 'ownerName', 'restaurantName', 'phone', 'businessType'];
  const missingFields = requiredFields.filter(field => !req.body[field]);

  if (missingFields.length > 0) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Missing required fields: ${missingFields.join(', ')}`,
      },
    };
    res.status(400).json(response);
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Validate password length
  if (password.length < 6) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Password must be at least 6 characters long',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Check if email already exists
  const existingOwner = await prisma.businessOwner.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingOwner) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'EMAIL_EXISTS',
        message: 'A business with this email already exists',
      },
    };
    res.status(409).json(response);
    return;
  }

  // Find the default Free plan
  const freePlan = await prisma.subscriptionPlan.findFirst({
    where: {
      OR: [
        { name: 'Free' },
        { name: 'free' },
        { price: 0 }, // Fallback: find plan with zero price
      ],
      status: 'active',
    },
  });

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create business owner with default branch using transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the business owner
    const businessOwner = await tx.businessOwner.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        ownerName,
        restaurantName,
        phone,
        businessType,
        planId: freePlan?.id || null,
        subscriptionStartDate: freePlan ? new Date() : null,
        subscriptionEndDate: freePlan
          ? new Date(Date.now() + freePlan.duration * 24 * 60 * 60 * 1000)
          : null,
        status: 'active',
      },
    });

    // Create the default main branch
    const branch = await tx.branch.create({
      data: {
        businessOwnerId: businessOwner.id,
        name: 'Main Branch',
        code: 'MB-001',
        isMainBranch: true,
        status: 'active',
      },
    });

    return { businessOwner, branch };
  });

  const { businessOwner, branch } = result;

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: businessOwner.id,
    userType: 'BusinessOwner',
    email: businessOwner.email,
    businessOwnerId: businessOwner.id,
  };

  const tokens = generateToken(tokenPayload);

  // Return success response
  const response: ApiResponse<BusinessOwnerRegisterResponse> = {
    success: true,
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: businessOwner.id,
        email: businessOwner.email,
        ownerName: businessOwner.ownerName,
        restaurantName: businessOwner.restaurantName,
        phone: businessOwner.phone || '',
        businessType: businessOwner.businessType || '',
        userType: 'BusinessOwner',
        status: businessOwner.status,
        createdAt: businessOwner.createdAt,
        branches: [
          {
            id: branch.id,
            name: branch.name,
            code: branch.code,
            isMainBranch: branch.isMainBranch,
            status: branch.status,
          },
        ],
        plan: freePlan
          ? {
              id: freePlan.id,
              name: freePlan.name,
              price: freePlan.price,
              maxBranches: freePlan.maxBranches,
            }
          : null,
      },
    },
    message: 'Registration successful',
  };

  res.status(201).json(response);
}

/**
 * Business Owner Login Response
 */
interface BusinessOwnerLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
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
  };
}

/**
 * POST /api/v1/auth/business-owner/login
 * Authenticate business owner and return tokens
 */
export async function businessOwnerLogin(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Find business owner by email with branches and subscription plan
  const businessOwner = await prisma.businessOwner.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      branches: {
        select: {
          id: true,
          name: true,
          code: true,
          isMainBranch: true,
          status: true,
        },
        orderBy: { isMainBranch: 'desc' }, // Main branch first
      },
      plan: true,
    },
  });

  if (!businessOwner) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    };
    res.status(401).json(response);
    return;
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, businessOwner.password);

  if (!isPasswordValid) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    };
    res.status(401).json(response);
    return;
  }

  // Check if account is active
  if (businessOwner.status !== 'active') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'ACCOUNT_INACTIVE',
        message: 'Your account is not active. Please contact support.',
      },
    };
    res.status(403).json(response);
    return;
  }

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: businessOwner.id,
    userType: 'BusinessOwner',
    email: businessOwner.email,
    businessOwnerId: businessOwner.id,
  };

  const tokens = generateToken(tokenPayload);

  // Return success response
  const response: ApiResponse<BusinessOwnerLoginResponse> = {
    success: true,
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: businessOwner.id,
        email: businessOwner.email,
        ownerName: businessOwner.ownerName,
        restaurantName: businessOwner.restaurantName,
        phone: businessOwner.phone || '',
        businessType: businessOwner.businessType || '',
        avatar: businessOwner.avatar,
        userType: 'BusinessOwner',
        status: businessOwner.status,
        createdAt: businessOwner.createdAt,
        branches: businessOwner.branches.map((branch) => ({
          id: branch.id,
          name: branch.name,
          code: branch.code,
          isMainBranch: branch.isMainBranch,
          status: branch.status,
        })),
        plan: businessOwner.plan
          ? {
              id: businessOwner.plan.id,
              name: businessOwner.plan.name,
              price: businessOwner.plan.price,
              maxBranches: businessOwner.plan.maxBranches,
              features: businessOwner.plan.features,
              subscriptionStartDate: businessOwner.subscriptionStartDate,
              subscriptionEndDate: businessOwner.subscriptionEndDate,
            }
          : null,
      },
    },
    message: 'Login successful',
  };

  res.status(200).json(response);
}

/**
 * Staff Login Response
 */
interface StaffLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
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
  };
}

/**
 * POST /api/v1/auth/staff/login
 * Authenticate staff member and return tokens with role permissions
 */
export async function staffLogin(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { email, password, branchId } = req.body;

  // Validate required fields
  if (!email || !password || !branchId) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email, password, and branchId are required',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Find staff by email and branchId with role and branch
  const staff = await prisma.staff.findFirst({
    where: {
      email: email.toLowerCase(),
      branchId: branchId,
    },
    include: {
      branch: {
        select: {
          id: true,
          name: true,
          code: true,
          isMainBranch: true,
          status: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
          permissions: true,
          status: true,
        },
      },
      businessOwner: {
        select: {
          id: true,
          restaurantName: true,
        },
      },
    },
  });

  if (!staff) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    };
    res.status(401).json(response);
    return;
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, staff.password);

  if (!isPasswordValid) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    };
    res.status(401).json(response);
    return;
  }

  // Check if staff account is active
  if (staff.status !== 'active') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'ACCOUNT_INACTIVE',
        message: 'Your account is not active. Please contact your manager.',
      },
    };
    res.status(403).json(response);
    return;
  }

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: staff.id,
    userType: 'Staff',
    email: staff.email,
    businessOwnerId: staff.businessOwnerId,
    branchId: staff.branchId,
  };

  const tokens = generateToken(tokenPayload);

  // Return success response
  const response: ApiResponse<StaffLoginResponse> = {
    success: true,
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: staff.id,
        email: staff.email,
        firstName: staff.firstName,
        lastName: staff.lastName,
        phone: staff.phone,
        avatar: staff.avatar,
        userType: 'Staff',
        status: staff.status,
        createdAt: staff.createdAt,
        branch: {
          id: staff.branch.id,
          name: staff.branch.name,
          code: staff.branch.code,
          isMainBranch: staff.branch.isMainBranch,
          status: staff.branch.status,
        },
        role: {
          id: staff.role.id,
          name: staff.role.name,
          permissions: staff.role.permissions,
          status: staff.role.status,
        },
        businessOwner: {
          id: staff.businessOwner.id,
          restaurantName: staff.businessOwner.restaurantName,
        },
      },
    },
    message: 'Login successful',
  };

  res.status(200).json(response);
}

/**
 * Refresh Token Response
 */
interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using a valid refresh token
 */
export async function refreshAccessToken(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { refreshToken } = req.body;

  // Validate required field
  if (!refreshToken) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Refresh token is required',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Verify refresh token
  const verifyResult = verifyRefreshToken(refreshToken);

  if (!verifyResult.valid) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: verifyResult.error,
        message: verifyResult.message,
      },
    };
    res.status(401).json(response);
    return;
  }

  const { payload } = verifyResult;

  // Verify user still exists and is active based on userType
  let userExists = false;
  let userActive = true;

  if (payload.userType === 'SuperAdmin') {
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: payload.userId },
    });
    userExists = !!superAdmin;
  } else if (payload.userType === 'BusinessOwner') {
    const businessOwner = await prisma.businessOwner.findUnique({
      where: { id: payload.userId },
    });
    userExists = !!businessOwner;
    userActive = businessOwner?.status === 'active';
  } else if (payload.userType === 'Staff') {
    const staff = await prisma.staff.findUnique({
      where: { id: payload.userId },
    });
    userExists = !!staff;
    userActive = staff?.status === 'active';
  }

  if (!userExists) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'User no longer exists',
      },
    };
    res.status(401).json(response);
    return;
  }

  if (!userActive) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'ACCOUNT_INACTIVE',
        message: 'Your account is not active',
      },
    };
    res.status(401).json(response);
    return;
  }

  // Generate new token pair
  const tokenPayload: TokenPayload = {
    userId: payload.userId,
    userType: payload.userType,
    email: payload.email,
    businessOwnerId: payload.businessOwnerId,
    branchId: payload.branchId,
  };

  const tokens = generateToken(tokenPayload);

  // Return success response
  const response: ApiResponse<RefreshTokenResponse> = {
    success: true,
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    },
    message: 'Token refreshed successfully',
  };

  res.status(200).json(response);
}

/**
 * User type for password reset
 */
type PasswordResetUserType = 'SuperAdmin' | 'BusinessOwner' | 'Staff';

/**
 * POST /api/v1/auth/forgot-password
 * Request a password reset token
 */
export async function forgotPassword(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { email, userType } = req.body;

  // Validate required fields
  if (!email || !userType) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email and userType are required',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Validate userType
  const validUserTypes: PasswordResetUserType[] = ['SuperAdmin', 'BusinessOwner', 'Staff'];
  if (!validUserTypes.includes(userType)) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid userType. Must be SuperAdmin, BusinessOwner, or Staff',
      },
    };
    res.status(400).json(response);
    return;
  }

  const normalizedEmail = email.toLowerCase();

  // Generate reset token
  const { plainToken, hashedToken } = await generateResetToken();
  const resetTokenExpiry = getResetTokenExpiry();

  // Find user and update reset token based on userType
  // Don't reveal if email exists or not for security
  let userId: string | null = null;
  let auditUserType: AuditUserType;
  let businessOwnerId: string | null = null;

  try {
    if (userType === 'SuperAdmin') {
      const superAdmin = await prisma.superAdmin.findUnique({
        where: { email: normalizedEmail },
      });

      if (superAdmin) {
        await prisma.superAdmin.update({
          where: { id: superAdmin.id },
          data: {
            resetToken: hashedToken,
            resetTokenExpiry: resetTokenExpiry,
          },
        });
        userId = superAdmin.id;
      }
      auditUserType = AuditUserType.SuperAdmin;
    } else if (userType === 'BusinessOwner') {
      const businessOwner = await prisma.businessOwner.findUnique({
        where: { email: normalizedEmail },
      });

      if (businessOwner) {
        await prisma.businessOwner.update({
          where: { id: businessOwner.id },
          data: {
            resetToken: hashedToken,
            resetTokenExpiry: resetTokenExpiry,
          },
        });
        userId = businessOwner.id;
        businessOwnerId = businessOwner.id;
      }
      auditUserType = AuditUserType.BusinessOwner;
    } else {
      // Staff - note: Staff lookup is tricky since email is unique per businessOwner
      // For forgot password, we'll find the first matching staff email
      const staff = await prisma.staff.findFirst({
        where: { email: normalizedEmail },
      });

      if (staff) {
        await prisma.staff.update({
          where: { id: staff.id },
          data: {
            resetToken: hashedToken,
            resetTokenExpiry: resetTokenExpiry,
          },
        });
        userId = staff.id;
        businessOwnerId = staff.businessOwnerId;
      }
      auditUserType = AuditUserType.Staff;
    }

    // Log the reset request to AuditLog (regardless of whether user exists)
    if (userId) {
      await prisma.auditLog.create({
        data: {
          businessOwnerId: businessOwnerId,
          userId: userId,
          userType: auditUserType,
          action: 'password_reset_request',
          entityType: userType,
          entityId: userId,
          newValue: { email: normalizedEmail, requestedAt: new Date().toISOString() },
          ipAddress: req.ip || req.socket?.remoteAddress || null,
        },
      });

      // Log the reset token to console (in production, this would be sent via email)
      console.log(`[PASSWORD RESET] Token for ${normalizedEmail}: ${plainToken}`);
      console.log(`[PASSWORD RESET] Token expires at: ${resetTokenExpiry.toISOString()}`);
    }
  } catch (error) {
    // Log error but don't reveal it to user
    console.error('Error processing password reset request:', error);
  }

  // Always return success message (don't reveal if email exists)
  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: {
      message: 'If an account with that email exists, a password reset link has been sent.',
    },
    message: 'Password reset request processed',
  };

  res.status(200).json(response);
}

/**
 * POST /api/v1/auth/reset-password
 * Reset password using a valid reset token
 */
export async function resetPassword(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { token, newPassword } = req.body;

  // Validate required fields
  if (!token || !newPassword) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Token and newPassword are required',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Validate password length
  if (newPassword.length < 6) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Password must be at least 6 characters long',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Hash the provided token to compare with stored hash
  const hashedToken = hashResetToken(token);
  const now = new Date();

  // Search for user with matching reset token across all user types
  // Check SuperAdmin first
  const superAdmin = await prisma.superAdmin.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: { gt: now },
    },
  });

  if (superAdmin) {
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await prisma.superAdmin.update({
      where: { id: superAdmin.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Log to AuditLog
    await prisma.auditLog.create({
      data: {
        businessOwnerId: null,
        userId: superAdmin.id,
        userType: AuditUserType.SuperAdmin,
        action: 'password_reset_complete',
        entityType: 'SuperAdmin',
        entityId: superAdmin.id,
        newValue: { completedAt: new Date().toISOString() },
        ipAddress: req.ip || req.socket?.remoteAddress || null,
      },
    });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: {
        message: 'Password has been reset successfully. You can now log in with your new password.',
      },
      message: 'Password reset successful',
    };
    res.status(200).json(response);
    return;
  }

  // Check BusinessOwner
  const businessOwner = await prisma.businessOwner.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: { gt: now },
    },
  });

  if (businessOwner) {
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await prisma.businessOwner.update({
      where: { id: businessOwner.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Log to AuditLog
    await prisma.auditLog.create({
      data: {
        businessOwnerId: businessOwner.id,
        userId: businessOwner.id,
        userType: AuditUserType.BusinessOwner,
        action: 'password_reset_complete',
        entityType: 'BusinessOwner',
        entityId: businessOwner.id,
        newValue: { completedAt: new Date().toISOString() },
        ipAddress: req.ip || req.socket?.remoteAddress || null,
      },
    });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: {
        message: 'Password has been reset successfully. You can now log in with your new password.',
      },
      message: 'Password reset successful',
    };
    res.status(200).json(response);
    return;
  }

  // Check Staff
  const staff = await prisma.staff.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: { gt: now },
    },
  });

  if (staff) {
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Log to AuditLog
    await prisma.auditLog.create({
      data: {
        businessOwnerId: staff.businessOwnerId,
        userId: staff.id,
        userType: AuditUserType.Staff,
        action: 'password_reset_complete',
        entityType: 'Staff',
        entityId: staff.id,
        newValue: { completedAt: new Date().toISOString() },
        ipAddress: req.ip || req.socket?.remoteAddress || null,
      },
    });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: {
        message: 'Password has been reset successfully. You can now log in with your new password.',
      },
      message: 'Password reset successful',
    };
    res.status(200).json(response);
    return;
  }

  // Token not found or expired
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired reset token',
    },
  };
  res.status(400).json(response);
}

/**
 * Super Admin Profile Response
 */
interface SuperAdminProfileResponse {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  userType: 'SuperAdmin';
  createdAt: Date;
}

/**
 * Business Owner Profile Response (for /me endpoint)
 */
interface BusinessOwnerProfileResponse {
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

/**
 * Staff Profile Response (for /me endpoint)
 */
interface StaffProfileResponse {
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

/**
 * Union type for all user profiles
 */
type UserProfileResponse = SuperAdminProfileResponse | BusinessOwnerProfileResponse | StaffProfileResponse;

/**
 * GET /api/v1/auth/me
 * Get current authenticated user's profile
 */
export async function getCurrentUser(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  // User must be authenticated (middleware should have set req.user)
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

  const { id, userType } = req.user;

  try {
    if (userType === 'SuperAdmin') {
      // Fetch SuperAdmin profile
      const superAdmin = await prisma.superAdmin.findUnique({
        where: { id },
      });

      if (!superAdmin) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      const profileResponse: SuperAdminProfileResponse = {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
        phone: superAdmin.phone,
        avatar: superAdmin.avatar,
        userType: 'SuperAdmin',
        createdAt: superAdmin.createdAt,
      };

      const response: ApiResponse<UserProfileResponse> = {
        success: true,
        data: profileResponse,
        message: 'Profile retrieved successfully',
      };
      res.status(200).json(response);
      return;
    }

    if (userType === 'BusinessOwner') {
      // Fetch BusinessOwner profile with branches and plan
      const businessOwner = await prisma.businessOwner.findUnique({
        where: { id },
        include: {
          branches: {
            select: {
              id: true,
              name: true,
              code: true,
              isMainBranch: true,
              status: true,
            },
            orderBy: { isMainBranch: 'desc' }, // Main branch first
          },
          plan: true,
        },
      });

      if (!businessOwner) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      const profileResponse: BusinessOwnerProfileResponse = {
        id: businessOwner.id,
        email: businessOwner.email,
        ownerName: businessOwner.ownerName,
        restaurantName: businessOwner.restaurantName,
        phone: businessOwner.phone || '',
        businessType: businessOwner.businessType || '',
        avatar: businessOwner.avatar,
        userType: 'BusinessOwner',
        status: businessOwner.status,
        createdAt: businessOwner.createdAt,
        branches: businessOwner.branches.map((branch) => ({
          id: branch.id,
          name: branch.name,
          code: branch.code,
          isMainBranch: branch.isMainBranch,
          status: branch.status,
        })),
        plan: businessOwner.plan
          ? {
              id: businessOwner.plan.id,
              name: businessOwner.plan.name,
              price: businessOwner.plan.price,
              maxBranches: businessOwner.plan.maxBranches,
              features: businessOwner.plan.features,
              subscriptionStartDate: businessOwner.subscriptionStartDate,
              subscriptionEndDate: businessOwner.subscriptionEndDate,
            }
          : null,
      };

      const response: ApiResponse<UserProfileResponse> = {
        success: true,
        data: profileResponse,
        message: 'Profile retrieved successfully',
      };
      res.status(200).json(response);
      return;
    }

    if (userType === 'Staff') {
      // Fetch Staff profile with branch, role, and business owner
      const staff = await prisma.staff.findUnique({
        where: { id },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
              isMainBranch: true,
              status: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
              permissions: true,
              status: true,
            },
          },
          businessOwner: {
            select: {
              id: true,
              restaurantName: true,
            },
          },
        },
      });

      if (!staff) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      const profileResponse: StaffProfileResponse = {
        id: staff.id,
        email: staff.email,
        firstName: staff.firstName,
        lastName: staff.lastName,
        phone: staff.phone,
        avatar: staff.avatar,
        userType: 'Staff',
        status: staff.status,
        createdAt: staff.createdAt,
        branch: {
          id: staff.branch.id,
          name: staff.branch.name,
          code: staff.branch.code,
          isMainBranch: staff.branch.isMainBranch,
          status: staff.branch.status,
        },
        role: {
          id: staff.role.id,
          name: staff.role.name,
          permissions: staff.role.permissions,
          status: staff.role.status,
        },
        businessOwner: {
          id: staff.businessOwner.id,
          restaurantName: staff.businessOwner.restaurantName,
        },
      };

      const response: ApiResponse<UserProfileResponse> = {
        success: true,
        data: profileResponse,
        message: 'Profile retrieved successfully',
      };
      res.status(200).json(response);
      return;
    }

    // Unknown user type
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INVALID_USER_TYPE',
        message: 'Unknown user type',
      },
    };
    res.status(400).json(response);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching user profile',
      },
    };
    res.status(500).json(response);
  }
}
