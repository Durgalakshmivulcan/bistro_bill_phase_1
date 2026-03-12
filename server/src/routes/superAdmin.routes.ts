import { Router } from 'express';
import { listSubscriptionPlans, createSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan } from '../controllers/subscriptionPlan.controller';
import { listBusinessOwners, getBusinessOwnerDetail, updateBusinessOwnerStatus, updateBusinessOwnerSubscription, createBusinessOwner, updateBusinessOwner, deleteBusinessOwner } from '../controllers/businessOwner.controller';
import { listLeads, createLead, updateLead, updateLeadStage, deleteLead } from '../controllers/lead.controller';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { getMonthlyStats, getTopRestaurants } from '../controllers/superAdminDashboard.controller';
import { createAllergen, updateAllergen, deleteAllergen } from '../controllers/allergen.controller';
import { createMeasuringUnit, updateMeasuringUnit, deleteMeasuringUnit } from '../controllers/measuringUnit.controller';
import { updateSuperAdminProfile, deleteSuperAdminAvatar } from '../controllers/superAdminProfile.controller';
import { listSubscriptionOrders, deleteSubscriptionOrder } from '../controllers/superAdminOrders.controller';
import { listMenuVisibility, updateMenuVisibility } from '../controllers/menuVisibility.controller';
import { authenticate, requireUserType } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { imageUpload, uploadToS3Middleware } from '../middleware/upload.middleware';
import { connectionManager } from '../websocket/connectionManager';

const router = Router();

/**
 * All routes in this file require SuperAdmin authentication
 */

/**
 * @route GET /api/v1/super-admin/subscription-plans
 * @description List all subscription plans with optional status filter
 * @access Private (SuperAdmin only)
 * @query { status?: 'active' | 'inactive' }
 * @returns { plans: SubscriptionPlan[], total: number }
 */
router.get(
  '/subscription-plans',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'read'),
  listSubscriptionPlans
);

/**
 * @route POST /api/v1/super-admin/subscription-plans
 * @description Create a new subscription plan
 * @access Private (SuperAdmin only)
 * @body { name: string, price: number, duration: number, features: object, maxBranches: number, trialDays?: number, status?: string }
 * @returns { plan: SubscriptionPlan }
 */
router.post(
  '/subscription-plans',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'create'),
  createSubscriptionPlan
);

/**
 * @route PUT /api/v1/super-admin/subscription-plans/:id
 * @description Update an existing subscription plan
 * @access Private (SuperAdmin only)
 * @param { id: string }
 * @body { name?: string, price?: number, duration?: number, features?: object, maxBranches?: number, trialDays?: number, status?: string }
 * @returns { plan: SubscriptionPlan }
 */
router.put(
  '/subscription-plans/:id',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'update'),
  updateSubscriptionPlan
);

/**
 * @route DELETE /api/v1/super-admin/subscription-plans/:id
 * @description Delete a subscription plan
 * @access Private (SuperAdmin only)
 * @param { id: string }
 * @returns { message: string }
 * @error 400 if plan has active subscribers (returns count)
 * @error 404 if plan not found
 */
router.delete(
  '/subscription-plans/:id',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'delete'),
  deleteSubscriptionPlan
);

/**
 * ===========================================
 * Business Owner Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/super-admin/business-owners
 * @description List all business owners with pagination and filters
 * @access Private (SuperAdmin only)
 * @query { status?: 'active' | 'inactive' | 'suspended', planId?: string, search?: string, page?: number, limit?: number }
 * @returns { businessOwners: BusinessOwner[], pagination: PaginationMeta }
 */
router.get(
  '/business-owners',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'read'),
  listBusinessOwners
);

/**
 * @route GET /api/v1/super-admin/business-owners/:id
 * @description Get detailed information about a specific business owner
 * @access Private (SuperAdmin only)
 * @param { id: string }
 * @returns { businessOwner: BusinessOwnerDetail }
 * @error 404 if not found
 */
router.get(
  '/business-owners/:id',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'read'),
  getBusinessOwnerDetail
);

/**
 * @route PATCH /api/v1/super-admin/business-owners/:id/status
 * @description Update business owner status (active, inactive, suspended)
 * @access Private (SuperAdmin only)
 * @param { id: string }
 * @body { status: 'active' | 'inactive' | 'suspended' }
 * @returns { businessOwner: BusinessOwnerStatusUpdate }
 * @error 400 if invalid status
 * @error 404 if not found
 */
router.patch(
  '/business-owners/:id/status',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'update'),
  updateBusinessOwnerStatus
);

/**
 * @route PATCH /api/v1/super-admin/business-owners/:id/subscription
 * @description Update business owner subscription plan and dates
 * @access Private (SuperAdmin only)
 * @param { id: string }
 * @body { planId?: string, subscriptionStartDate?: string | null, subscriptionEndDate?: string | null }
 * @returns { businessOwner: BusinessOwnerSubscriptionUpdate }
 * @error 400 if no fields provided or invalid planId
 * @error 404 if business owner not found
 */
router.patch(
  '/business-owners/:id/subscription',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'update'),
  updateBusinessOwnerSubscription
);

/**
 * @route POST /api/v1/super-admin/business-owners
 * @description Create a new business owner
 * @access Private (SuperAdmin only)
 * @body { email, password, ownerName, restaurantName, phone, businessType?, tinGstNumber?, country?, state?, city?, zipCode?, address?, planId? }
 * @returns { businessOwner }
 */
router.post(
  '/business-owners',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'create'),
  imageUpload.single('avatar'),
  createBusinessOwner
);

/**
 * @route PUT /api/v1/super-admin/business-owners/:id
 * @description Update a business owner's profile
 * @access Private (SuperAdmin only)
 * @param { id: string }
 * @body { ownerName?, restaurantName?, phone?, email?, businessType?, tinGstNumber?, country?, state?, city?, zipCode?, address?, planId? }
 * @returns { businessOwner }
 */
router.put(
  '/business-owners/:id',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'update'),
  imageUpload.single('avatar'),
  updateBusinessOwner
);

/**
 * @route DELETE /api/v1/super-admin/business-owners/:id
 * @description Delete a business owner
 * @access Private (SuperAdmin only)
 * @param { id: string }
 * @returns { message: string }
 */
router.delete(
  '/business-owners/:id',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'delete'),
  deleteBusinessOwner
);

/**
 * ===========================================
 * Lead Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/super-admin/leads
 * @description List all leads with pagination, filtering, and sorting
 * @access Private (SuperAdmin only)
 * @query { stage?: LeadStage, search?: string, sortBy?: 'createdAt' | 'stage', sortOrder?: 'asc' | 'desc', page?: number, limit?: number }
 * @returns { leads: Lead[], pagination: PaginationMeta }
 */
router.get(
  '/leads',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'read'),
  listLeads
);

/**
 * @route POST /api/v1/super-admin/leads
 * @description Create a new lead from an inquiry
 * @access Private (SuperAdmin only)
 * @body { restaurantName: string, ownerName: string, email: string, phone: string, businessType?: string, inquiryType?: string, country?: string, state?: string, city?: string, zipCode?: string, address?: string, description?: string }
 * @returns { lead: Lead }
 * @error 400 if missing required fields or invalid email format
 */
router.post(
  '/leads',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'create'),
  createLead
);

/**
 * @route PUT /api/v1/super-admin/leads/:id
 * @description Update an existing lead's details and stage
 * @access Private (SuperAdmin only)
 * @param { id: string }
 * @body { restaurantName?: string, ownerName?: string, email?: string, phone?: string, businessType?: string, inquiryType?: string, country?: string, state?: string, city?: string, zipCode?: string, address?: string, description?: string, stage?: LeadStage }
 * @returns { lead: Lead }
 * @error 400 if invalid email format or invalid stage
 * @error 404 if lead not found
 */
router.put(
  '/leads/:id',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'update'),
  updateLead
);

/**
 * @route PATCH /api/v1/super-admin/leads/:id/stage
 * @description Update lead stage only (for Kanban board)
 * @access Private (SuperAdmin only)
 * @param { id: string }
 * @body { stage: LeadStage }
 * @returns { lead: Lead }
 * @error 400 if stage missing or invalid
 * @error 404 if lead not found
 */
router.patch(
  '/leads/:id/stage',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'update'),
  updateLeadStage
);

/**
 * @route DELETE /api/v1/super-admin/leads/:id
 * @description Delete a lead
 * @access Private (SuperAdmin only)
 * @param { id: string }
 * @returns { message: string }
 * @error 404 if lead not found
 */
router.delete(
  '/leads/:id',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'delete'),
  deleteLead
);

/**
 * ===========================================
 * Dashboard Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/super-admin/dashboard/stats
 * @description Get platform-wide statistics for the super admin dashboard
 * @access Private (SuperAdmin only)
 * @returns { totalBusinessOwners, activeBusinessOwners, totalRevenue, leadsByStage, recentSignups, planDistribution }
 */
router.get(
  '/dashboard/stats',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'read'),
  getDashboardStats
);

/**
 * @route GET /api/v1/super-admin/dashboard/monthly-stats
 * @description Get monthly earnings and new user registrations for the year
 * @access Private (SuperAdmin only)
 * @query { year?: number } defaults to current year
 * @returns { labels: string[], earnings: number[], users: number[] }
 */
router.get(
  '/dashboard/monthly-stats',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'read'),
  getMonthlyStats
);

/**
 * @route GET /api/v1/super-admin/dashboard/top-restaurants
 * @description Get top 10 restaurants by total revenue
 * @access Private (SuperAdmin only)
 * @returns { restaurants: TopRestaurant[] }
 */
router.get(
  '/dashboard/top-restaurants',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'read'),
  getTopRestaurants
);

/**
 * ===========================================
 * Subscription Orders Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/super-admin/orders
 * @description List subscription orders with filters and pagination
 * @access Private (SuperAdmin only)
 * @query { businessType?, plan?, status?, search?, page?, limit? }
 * @returns { orders: SubscriptionOrder[], pagination: PaginationMeta }
 */
router.get(
  '/orders',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'read'),
  listSubscriptionOrders
);

/**
 * @route DELETE /api/v1/super-admin/orders/:id
 * @description Delete a subscription order
 * @access Private (SuperAdmin only)
 * @param { id: string }
 * @returns { message: string }
 */
router.delete(
  '/orders/:id',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'delete'),
  deleteSubscriptionOrder
);

/**
 * ===========================================
 * Allergen Routes
 * ===========================================
 */

/**
 * @route POST /api/v1/super-admin/allergens
 * @description Create a new allergen (global definition)
 * @access Private (SuperAdmin only)
 * @body { name: string, icon?: string }
 * @returns { allergen: Allergen }
 * @error 400 if name is missing or empty
 * @error 409 if allergen with same name already exists
 */
router.post(
  '/allergens',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'create'),
  createAllergen
);

/**
 * @route PUT /api/v1/super-admin/allergens/:id
 * @description Update an existing allergen
 * @access Private (SuperAdmin only)
 * @param { id: string }
 * @body { name?: string, icon?: string }
 * @returns { allergen: Allergen }
 * @error 400 if name is provided but empty
 * @error 404 if allergen not found
 * @error 409 if another allergen with same name exists
 */
router.put(
  '/allergens/:id',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'update'),
  updateAllergen
);

/**
 * @route DELETE /api/v1/super-admin/allergens/:id
 * @description Delete an allergen
 * @access Private (SuperAdmin only)
 * @param { id: string }
 * @returns { message: string }
 * @error 404 if allergen not found
 * @note Deleting an allergen removes it from all products (cascade delete on ProductAllergen)
 */
router.delete(
  '/allergens/:id',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'delete'),
  deleteAllergen
);

/**
 * ===========================================
 * Measuring Unit Routes
 * ===========================================
 */

router.post(
  '/measuring-units',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'create'),
  createMeasuringUnit
);

router.put(
  '/measuring-units/:id',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'update'),
  updateMeasuringUnit
);

router.delete(
  '/measuring-units/:id',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'delete'),
  deleteMeasuringUnit
);

/**
 * ===========================================
 * WebSocket Stats Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/super-admin/websocket/stats
 * @description Get WebSocket connection and messaging statistics
 * @access Private (SuperAdmin only)
 * @returns { activeConnections, connectionsPerBranch, totalMessagesSentToday, totalMessagesReceivedToday, messagesSentLastMinute, messagesReceivedLastMinute, errorCount }
 */
router.get(
  '/websocket/stats',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'read'),
  (_req, res) => {
    const metrics = connectionManager.getMetrics();
    res.json({ success: true, data: metrics });
  }
);

/**
 * ===========================================
 * Profile Routes
 * ===========================================
 */

/**
 * @route PUT /api/v1/super-admin/profile
 * @description Update super admin profile (name, phone, avatar)
 * @access Private (SuperAdmin only)
 * @body { name?: string, phone?: string } + optional file upload
 * @returns { profile }
 */
router.put(
  '/profile',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'update'),
  imageUpload.single('avatar'),
  uploadToS3Middleware('super-admin'),
  updateSuperAdminProfile
);

/**
 * @route DELETE /api/v1/super-admin/profile/avatar
 * @description Remove super admin avatar
 * @access Private (SuperAdmin only)
 * @returns { message: string }
 */
router.delete(
  '/profile/avatar',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'delete'),
  deleteSuperAdminAvatar
);

/**
 * ===========================================
 * Menu Visibility Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/super-admin/menu-visibility
 * @description List all menu visibility config (optionally filtered by userType)
 * @access Private (SuperAdmin only)
 * @query { userType?: 'SuperAdmin' | 'BusinessOwner' | 'Staff' }
 * @returns { items: MenuVisibility[], total: number }
 */
router.get(
  '/menu-visibility',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'read'),
  listMenuVisibility
);

/**
 * @route PUT /api/v1/super-admin/menu-visibility
 * @description Bulk upsert menu visibility config
 * @access Private (SuperAdmin only)
 * @body { items: [{ userType: string, menuKey: string, isVisible: boolean }] }
 * @returns { items: MenuVisibility[], total: number }
 */
router.put(
  '/menu-visibility',
  authenticate,
  requireUserType('SuperAdmin'),
  requirePermission('super_admin', 'update'),
  updateMenuVisibility
);

export default router;
