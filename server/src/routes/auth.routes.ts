import { Router } from 'express';
import { superAdminLogin, businessOwnerRegister, businessOwnerLogin, staffLogin, refreshAccessToken, forgotPassword, resetPassword, getCurrentUser } from '../controllers/auth.controller';
import { getMyMenuVisibility } from '../controllers/menuVisibility.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route POST /api/v1/auth/super-admin/login
 * @description Authenticate super admin
 * @access Public
 * @body { email: string, password: string }
 * @returns { accessToken, refreshToken, expiresIn, user }
 */
router.post('/super-admin/login', superAdminLogin);

/**
 * @route POST /api/v1/auth/business-owner/register
 * @description Register a new business owner account
 * @access Public
 * @body { email: string, password: string, ownerName: string, restaurantName: string, phone: string, businessType: string }
 * @returns { accessToken, refreshToken, expiresIn, user }
 */
router.post('/business-owner/register', businessOwnerRegister);

/**
 * @route POST /api/v1/auth/business-owner/login
 * @description Authenticate a business owner
 * @access Public
 * @body { email: string, password: string }
 * @returns { accessToken, refreshToken, expiresIn, user }
 */
router.post('/business-owner/login', businessOwnerLogin);

/**
 * @route POST /api/v1/auth/staff/login
 * @description Authenticate a staff member
 * @access Public
 * @body { email: string, password: string, branchId: string }
 * @returns { accessToken, refreshToken, expiresIn, user with role permissions }
 */
router.post('/staff/login', staffLogin);

/**
 * @route POST /api/v1/auth/refresh
 * @description Refresh access token using a valid refresh token
 * @access Public
 * @body { refreshToken: string }
 * @returns { accessToken, refreshToken, expiresIn }
 */
router.post('/refresh', refreshAccessToken);

/**
 * @route POST /api/v1/auth/forgot-password
 * @description Request a password reset token
 * @access Public
 * @body { email: string, userType: 'SuperAdmin' | 'BusinessOwner' | 'Staff' }
 * @returns { message: string } - Always returns success (doesn't reveal if email exists)
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route POST /api/v1/auth/reset-password
 * @description Reset password using a valid reset token
 * @access Public
 * @body { token: string, newPassword: string }
 * @returns { message: string } - Success message or 400 error for invalid/expired token
 */
router.post('/reset-password', resetPassword);

/**
 * @route GET /api/v1/auth/me
 * @description Get current authenticated user's profile
 * @access Private (requires authentication)
 * @returns User profile based on userType (SuperAdmin, BusinessOwner, or Staff)
 *          - SuperAdmin: { id, email, name, userType, createdAt }
 *          - BusinessOwner: { id, email, ownerName, restaurantName, ..., branches, plan }
 *          - Staff: { id, email, firstName, lastName, ..., branch, role, permissions }
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route GET /api/v1/auth/menu-visibility
 * @description Get visible menu keys for the current user's type
 * @access Private (requires authentication)
 * @returns { visibleMenuKeys: string[] }
 */
router.get('/menu-visibility', authenticate, getMyMenuVisibility);

export default router;
