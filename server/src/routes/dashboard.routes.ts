import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { saBusinessOwnerOverride } from '../middleware/saBusinessOwnerOverride.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import {
  getRevenueSummary,
  getRevenueByType,
  getTopProducts,
  getTopBrands,
  getBranchPerformance,
  getRevenueByPayment,
  getAverageValues,
} from '../controllers/dashboard.controller';

const router = Router();

// All dashboard routes require authentication and tenant context
router.use(authenticate);
router.use(tenantMiddleware);
router.use(saBusinessOwnerOverride);

/**
 * @route GET /api/v1/dashboard/revenue-summary
 * @description Get revenue summary metrics (total revenue, discounts, charges, non-chargeable, cancelled)
 * @access Private (BusinessOwner/Staff with permissions)
 * @query { startDate: string, endDate: string, branchId?: string }
 * @returns { totalRevenue, discountAmount, chargesCollected, nonChargeableRevenue, cancelledRevenue }
 */
router.get('/revenue-summary', requirePermission('dashboard', 'read'), getRevenueSummary);

/**
 * @route GET /api/v1/dashboard/revenue-by-type
 * @description Get revenue breakdown by order type (TakeAway, DineIn, Subscription, Catering, Delivery)
 * @access Private (BusinessOwner/Staff with permissions)
 * @query { startDate: string, endDate: string, branchId?: string }
 * @returns { takeAwayRevenue, dineInRevenue, subscriptionRevenue, cateringRevenue, deliveryRevenue }
 */
router.get('/revenue-by-type', requirePermission('dashboard', 'read'), getRevenueByType);

/**
 * @route GET /api/v1/dashboard/top-products
 * @description Get top-selling products by revenue
 * @access Private (BusinessOwner/Staff with permissions)
 * @query { startDate: string, endDate: string, branchId?: string, limit?: number }
 * @returns Array of { productId, productName, salesCount, revenue }
 */
router.get('/top-products', requirePermission('dashboard', 'read'), getTopProducts);

/**
 * @route GET /api/v1/dashboard/top-brands
 * @description Get top brands by revenue
 * @access Private (BusinessOwner/Staff with permissions)
 * @query { startDate: string, endDate: string, branchId?: string, limit?: number }
 * @returns Array of { brandId, brandName, productCount, revenue }
 */
router.get('/top-brands', requirePermission('dashboard', 'read'), getTopBrands);

/**
 * @route GET /api/v1/dashboard/branch-performance
 * @description Get branch performance rankings by revenue (shows all branches)
 * @access Private (BusinessOwner/Staff with permissions)
 * @query { startDate: string, endDate: string, limit?: number }
 * @returns Array of { branchId, branchName, orderCount, revenue }
 */
router.get('/branch-performance', requirePermission('dashboard', 'read'), getBranchPerformance);

/**
 * @route GET /api/v1/dashboard/revenue-by-payment
 * @description Get revenue breakdown by payment method
 * @access Private (BusinessOwner/Staff with permissions)
 * @query { startDate: string, endDate: string, branchId?: string }
 * @returns Array of { paymentMethod, revenue, percentage }
 */
router.get('/revenue-by-payment', requirePermission('dashboard', 'read'), getRevenueByPayment);

/**
 * @route GET /api/v1/dashboard/average-values
 * @description Get average order values by type and category
 * @access Private (BusinessOwner/Staff with permissions)
 * @query { startDate: string, endDate: string, branchId?: string }
 * @returns { avgOnline, avgOffline, avgDelivery, avgDiscount, avgTax }
 */
router.get('/average-values', requirePermission('dashboard', 'read'), getAverageValues);

export default router;
